"use server";

import { revalidatePath } from "next/cache";
import { logAdminMemberAudit } from "@/lib/community/admin-member-audit-log";
import {
  getMemberDetailForAdmin,
  listMembersForAdminPortal,
  type AdminMemberDetail,
  type AdminMemberPortalRow,
} from "@/lib/community/admin-members-portal";
import { setMemberStatusForAdmin } from "@/lib/community/members";
import { requireCommunityOwner } from "@/lib/community/owner";
import { prisma } from "@/lib/db";

export async function loadAdminMembersPortalAction(): Promise<
  | { ok: true; members: AdminMemberPortalRow[] }
  | { ok: false; error: string }
> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  try {
    const members = await listMembersForAdminPortal();
    return { ok: true, members };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not load members" };
  }
}

export async function getAdminMemberDetailAction(
  memberId: string,
): Promise<
  | { ok: true; member: AdminMemberDetail }
  | { ok: false; error: string }
> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };
  if (!memberId?.trim()) return { ok: false, error: "Invalid member" };

  try {
    const member = await getMemberDetailForAdmin(memberId.trim());
    if (!member) return { ok: false, error: "Member not found" };

    logAdminMemberAudit({
      action: "member_view_detail",
      actorUserId: owner.id,
      actorEmail: owner.email,
      memberId: member.id,
      targetUserId: member.userId,
    });

    return { ok: true, member };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not load member details" };
  }
}

export async function setCommunityMemberStatusAction(
  memberId: string,
  status: "active" | "blocked",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  const existing = await prisma.communityMemberRecord.findUnique({
    where: { id: memberId },
    select: { status: true, userId: true },
  });
  if (!existing) return { ok: false, error: "Member not found" };

  const ok = await setMemberStatusForAdmin(memberId, status);
  if (!ok) return { ok: false, error: "Member not found" };

  logAdminMemberAudit({
    action: "member_status_change",
    actorUserId: owner.id,
    actorEmail: owner.email,
    memberId,
    targetUserId: existing.userId,
    previousValue: existing.status,
    newValue: status,
    note: status === "blocked" ? "deactivated_from_mission_hub" : "reactivated",
  });

  revalidatePath("/admin/community/members");
  revalidatePath("/community");
  return { ok: true };
}

/** Link account role — CUSTOMER (Mission Hub member) or STAFF only; never promotes to ADMIN here. */
export async function setMemberUserRoleAction(
  memberId: string,
  role: "CUSTOMER" | "STAFF",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  const member = await prisma.communityMemberRecord.findUnique({
    where: { id: memberId },
    select: { userId: true, user: { select: { role: true } } },
  });
  if (!member?.userId) {
    return { ok: false, error: "This profile has no linked login account." };
  }
  if (member.user?.role === "ADMIN") {
    return { ok: false, error: "Cannot change role for admin accounts here." };
  }

  const previous = member.user?.role ?? "CUSTOMER";
  await prisma.user.update({
    where: { id: member.userId },
    data: { role },
  });

  logAdminMemberAudit({
    action: "member_user_role_change",
    actorUserId: owner.id,
    actorEmail: owner.email,
    memberId,
    targetUserId: member.userId,
    previousValue: String(previous),
    newValue: role,
  });

  revalidatePath("/admin/community/members");
  return { ok: true };
}

/** @deprecated Use loadAdminMembersPortalAction */
export async function loadAdminMembersAction(): Promise<
  | { ok: true; members: AdminMemberPortalRow[] }
  | { ok: false; error: string }
> {
  return loadAdminMembersPortalAction();
}
