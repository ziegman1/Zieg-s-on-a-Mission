import type { CommunityPostFormInput } from "@/lib/community/post-form";
import {
  autoExcerptFromBody,
  DEFAULT_COMMUNITY_POST_TYPE,
  nowDatetimeLocalValue,
} from "@/lib/community/post-constants";
import type { CommunityPostDbStatus, CommunityPostType } from "@/lib/community/types";
import { COMMUNITY_POST_STATUSES, COMMUNITY_POST_TYPES } from "@/lib/community/post-constants";

export type PostComposerFormState = {
  spaceId: string;
  title: string;
  body: string;
  excerpt: string;
  postType: CommunityPostType;
  status: CommunityPostDbStatus;
  coverImageUrl: string;
  publishedAt: string;
};

export function toDatetimeLocalValue(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function parsePostTypeValue(value: string): CommunityPostType {
  return COMMUNITY_POST_TYPES.some((t) => t.value === value)
    ? (value as CommunityPostType)
    : DEFAULT_COMMUNITY_POST_TYPE;
}

export function parsePostStatusValue(value: string): CommunityPostDbStatus {
  return COMMUNITY_POST_STATUSES.includes(value as CommunityPostDbStatus)
    ? (value as CommunityPostDbStatus)
    : "draft";
}

export function postRecordToComposerForm(row: {
  spaceId: string;
  title: string | null;
  body: string;
  excerpt: string | null;
  postType: string;
  status: string;
  coverImageUrl: string | null;
  publishedAt: Date | null;
}): PostComposerFormState {
  return {
    spaceId: row.spaceId,
    title: row.title ?? "",
    body: row.body,
    excerpt: row.excerpt ?? "",
    postType: parsePostTypeValue(row.postType),
    status: parsePostStatusValue(row.status),
    coverImageUrl: row.coverImageUrl ?? "",
    publishedAt: toDatetimeLocalValue(row.publishedAt) || nowDatetimeLocalValue(),
  };
}

export function buildPostComposerPayload(form: PostComposerFormState): CommunityPostFormInput {
  const excerpt =
    form.excerpt.trim() || autoExcerptFromBody(form.body) || undefined;
  return {
    spaceId: form.spaceId,
    title: form.title.trim() || undefined,
    body: form.body.trim(),
    excerpt,
    postType: form.postType,
    status: form.status,
    coverImageUrl: form.coverImageUrl.trim() || undefined,
    publishedAt: form.status === "published" ? form.publishedAt : undefined,
  };
}
