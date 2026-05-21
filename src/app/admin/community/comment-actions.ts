"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  listAllCommentsForAdmin,
  setCommentStatusForAdmin,
  type AdminCommunityCommentRow,
} from "@/lib/community/comments";
import type { CommunityCommentStatus } from "@/lib/community/types";
import { requireCommunityOwner } from "@/lib/community/owner";

const statusSchema = z.enum(["published", "hidden", "archived"]);

export async function loadAdminCommentsAction(): Promise<
  | { ok: true; comments: AdminCommunityCommentRow[] }
  | { ok: false; error: string }
> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  try {
    const comments = await listAllCommentsForAdmin();
    return { ok: true, comments };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not load comments" };
  }
}

export async function moderateCommentAction(
  commentId: string,
  status: CommunityCommentStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success || !commentId?.trim()) {
    return { ok: false, error: "Invalid request" };
  }

  const updated = await setCommentStatusForAdmin(commentId, parsed.data);
  if (!updated) return { ok: false, error: "Comment not found" };

  revalidatePath("/community");
  revalidatePath("/admin/community/comments");
  revalidatePath("/admin/community/posts");
  return { ok: true };
}
