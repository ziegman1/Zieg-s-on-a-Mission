import { describe, expect, it, vi } from "vitest";
import { logAdminMemberAudit } from "./admin-member-audit-log";

describe("logAdminMemberAudit", () => {
  it("writes structured audit payload", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    logAdminMemberAudit({
      action: "member_status_change",
      actorUserId: "admin-1",
      actorEmail: "admin@example.com",
      memberId: "member-1",
      previousValue: "active",
      newValue: "blocked",
    });
    expect(spy).toHaveBeenCalledWith(
      "[admin-member-audit]",
      expect.objectContaining({
        scope: "mission_hub_admin_members",
        action: "member_status_change",
        memberId: "member-1",
      }),
    );
    spy.mockRestore();
  });
});
