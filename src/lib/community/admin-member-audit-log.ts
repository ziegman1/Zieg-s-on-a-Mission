import "server-only";

/** Structured admin audit log (console today; extend to DB table if needed). */
export function logAdminMemberAudit(entry: {
  action:
    | "member_status_change"
    | "member_user_role_change"
    | "member_view_detail";
  actorUserId: string;
  actorEmail: string | null;
  memberId: string;
  targetUserId?: string | null;
  previousValue?: string;
  newValue?: string;
  note?: string;
}): void {
  const payload = {
    scope: "mission_hub_admin_members",
    at: new Date().toISOString(),
    ...entry,
  };
  console.info("[admin-member-audit]", payload);
}
