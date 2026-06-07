"use server";

import type { Prisma } from "@prisma/client";
import { requireCommunityOwner } from "@/lib/community/owner";
import {
  buildFacebookShareCaption,
  buildFacebookSharerUrl,
  mergePublicShareMetadata,
  parsePublicShareMetadata,
  type PublicSharePreview,
} from "@/lib/community/post-public-share";
import {
  buildPreviewFromShareRecord,
  evaluateShareRecordEligibility,
  loadPostShareRecord,
} from "@/lib/community/post-public-share-server";
import { absoluteMissionHubUrl } from "@/lib/mission-hub/site-url";
import { prisma } from "@/lib/db";

export type EnableCommunityPostFacebookShareResult =
  | {
      ok: true;
      shareUrl: string;
      facebookShareUrl: string;
      suggestedCaption: string;
      preview: PublicSharePreview;
      missionHubJoinUrl: string;
    }
  | { ok: false; error: string };

function buildShareResponse(
  preview: PublicSharePreview,
  joinUrl: string,
): {
  shareUrl: string;
  facebookShareUrl: string;
  suggestedCaption: string;
  preview: PublicSharePreview;
  missionHubJoinUrl: string;
} {
  const shareUrl = absoluteMissionHubUrl(preview.preferredSharePath);
  const postSummary =
    preview.title && preview.excerpt
      ? `${preview.title}\n\n${preview.excerpt}`
      : preview.excerpt || preview.title;

  return {
    shareUrl,
    facebookShareUrl: buildFacebookSharerUrl(shareUrl),
    suggestedCaption: buildFacebookShareCaption({
      shareUrl,
      postSummary,
      joinUrl,
    }),
    preview,
    missionHubJoinUrl: joinUrl,
  };
}

export async function enableCommunityPostFacebookShareAction(
  postId: string,
  opts?: { shareTitle?: string; shareExcerpt?: string },
): Promise<EnableCommunityPostFacebookShareResult> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  const trimmedId = postId?.trim();
  if (!trimmedId) return { ok: false, error: "Invalid post" };

  const record = await loadPostShareRecord(trimmedId);
  if (!record) return { ok: false, error: "Post not found" };

  const eligibility = evaluateShareRecordEligibility(record);
  if (!eligibility.eligible) {
    return { ok: false, error: eligibility.reason };
  }

  const existing = parsePublicShareMetadata(record.metadata);
  const joinUrl = absoluteMissionHubUrl("/community/join");

  const shareMeta = {
    enabled: true as const,
    enabledAt: existing?.enabledAt ?? new Date().toISOString(),
    enabledByUserId: existing?.enabledByUserId ?? owner.id,
    ...(opts?.shareTitle?.trim() ? { shareTitle: opts.shareTitle.trim() } : {}),
    ...(opts?.shareExcerpt?.trim() ? { shareExcerpt: opts.shareExcerpt.trim() } : {}),
    ...(existing?.shareTitle && !opts?.shareTitle?.trim()
      ? { shareTitle: existing.shareTitle }
      : {}),
    ...(existing?.shareExcerpt && !opts?.shareExcerpt?.trim()
      ? { shareExcerpt: existing.shareExcerpt }
      : {}),
  };

  if (!existing?.enabled) {
    shareMeta.enabledAt = new Date().toISOString();
    shareMeta.enabledByUserId = owner.id;
  }

  await prisma.communityPostRecord.update({
    where: { id: trimmedId },
    data: {
      metadata: mergePublicShareMetadata(record.metadata, shareMeta) as Prisma.InputJsonValue,
    },
  });

  const preview = buildPreviewFromShareRecord(record, shareMeta);
  const response = buildShareResponse(preview, joinUrl);
  return { ok: true, ...response };
}

export async function disableCommunityPostFacebookShareAction(
  postId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  const trimmedId = postId?.trim();
  if (!trimmedId) return { ok: false, error: "Invalid post" };

  const record = await loadPostShareRecord(trimmedId);
  if (!record) return { ok: false, error: "Post not found" };

  const existing = parsePublicShareMetadata(record.metadata);
  if (!existing?.enabled) return { ok: true };

  const base =
    record.metadata && typeof record.metadata === "object" && !Array.isArray(record.metadata)
      ? { ...(record.metadata as Record<string, unknown>) }
      : {};
  delete base.publicShare;

  await prisma.communityPostRecord.update({
    where: { id: trimmedId },
    data: { metadata: base as Prisma.InputJsonValue },
  });

  return { ok: true };
}

export async function previewCommunityPostFacebookShareAction(
  postId: string,
): Promise<
  | { ok: true; eligible: true; preview: PublicSharePreview }
  | { ok: true; eligible: false; reason: string }
  | { ok: false; error: string }
> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  const record = await loadPostShareRecord(postId?.trim());
  if (!record) return { ok: false, error: "Post not found" };

  const eligibility = evaluateShareRecordEligibility(record);
  if (!eligibility.eligible) {
    return { ok: true, eligible: false, reason: eligibility.reason };
  }

  const shareMeta = parsePublicShareMetadata(record.metadata);
  return {
    ok: true,
    eligible: true,
    preview: buildPreviewFromShareRecord(record, shareMeta ?? undefined),
  };
}
