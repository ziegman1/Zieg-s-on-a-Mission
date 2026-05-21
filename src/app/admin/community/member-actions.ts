"use server";

import { revalidatePath } from "next/cache";
import {
  listMembersForAdmin,
  setMemberStatusForAdmin,
  type AdminCommunityMemberRow,
} from "@/lib/community/members";
import { requireCommunityOwner } from "@/lib/community/owner";

export async function loadAdminMembersAction(): Promise<
  | { ok: true; members: AdminCommunityMemberRow[] }
  | { ok: false; error: string }
> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  try {
    const members = await listMembersForAdmin();
    return { ok: true, members };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not load members" };
  }
}

export async function setCommunityMemberStatusAction(
  memberId: string,
  status: "active" | "blocked",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  const ok = await setMemberStatusForAdmin(memberId, status);
  if (!ok) return { ok: false, error: "Member not found" };

  revalidatePath("/admin/community/members");
  revalidatePath("/community");
  return { ok: true };
}
