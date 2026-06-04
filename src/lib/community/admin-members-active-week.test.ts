import { describe, expect, it } from "vitest";
import {
  ACTIVE_MEMBER_WINDOW_DAYS,
  activeMemberWindowStart,
  countActiveMembersFromActivity,
} from "./admin-members-active-week";

describe("admin members active this week", () => {
  it("uses a seven-day rolling window", () => {
    const now = Date.parse("2026-05-24T12:00:00.000Z");
    const start = activeMemberWindowStart(now);
    expect(start.toISOString()).toBe("2026-05-17T12:00:00.000Z");
    expect(ACTIVE_MEMBER_WINDOW_DAYS).toBe(7);
  });

  it("counts unique members across comments, posts, reactions, and profile updates", () => {
    const count = countActiveMembersFromActivity({
      profileUpdatedMemberIds: ["m-profile"],
      commentMemberIds: ["m-comment", "m-comment"],
      postAuthorUserIds: ["u-post"],
      reactionVisitorKeys: ["vk-react"],
      membersByUserId: [{ id: "m-post", userId: "u-post" }],
      membersByVisitorKey: [{ id: "m-react", visitorKey: "vk-react" }],
    });

    expect(count).toBe(4);
  });

  it("ignores post authors and reaction keys without a linked member", () => {
    const count = countActiveMembersFromActivity({
      profileUpdatedMemberIds: [],
      commentMemberIds: [],
      postAuthorUserIds: ["u-unknown"],
      reactionVisitorKeys: ["vk-anonymous"],
      membersByUserId: [],
      membersByVisitorKey: [],
    });

    expect(count).toBe(0);
  });
});
