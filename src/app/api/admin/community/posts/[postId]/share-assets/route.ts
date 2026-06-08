import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/admin-users";
import { buildShareAssetsFromRecord, evaluateShareRecordEligibility, loadPostShareRecord, buildPreviewFromShareRecord } from "@/lib/community/post-public-share-server";
import { parsePublicShareMetadata } from "@/lib/community/post-public-share";
import { absoluteMissionHubUrl } from "@/lib/mission-hub/site-url";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ postId: string }> };

/** Admin-only share assets for social workflows (Facebook, X, LinkedIn, email, etc.). */
export async function GET(_req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.role || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await context.params;
  const trimmedId = postId?.trim();
  if (!trimmedId) {
    return NextResponse.json({ error: "Invalid post" }, { status: 400 });
  }

  const record = await loadPostShareRecord(trimmedId);
  if (!record) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const eligibility = evaluateShareRecordEligibility(record);
  if (!eligibility.eligible) {
    return NextResponse.json({ error: eligibility.reason }, { status: 403 });
  }

  const shareMeta = parsePublicShareMetadata(record.metadata);
  const preview = buildPreviewFromShareRecord(record, shareMeta ?? undefined);
  const shareUrl = absoluteMissionHubUrl(preview.preferredSharePath);
  const assets = buildShareAssetsFromRecord(record, shareUrl, shareMeta ?? undefined);

  return NextResponse.json(assets);
}
