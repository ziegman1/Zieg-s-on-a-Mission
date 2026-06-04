import { describe, expect, it } from "vitest";
import {
  formatCommunityActorDisplayName,
  resolveCommunityActorFromSources,
} from "./community-actor-resolve";
import type { CommunityMemberProfile } from "./members";

function member(
  overrides: Partial<CommunityMemberProfile> & Pick<CommunityMemberProfile, "id">,
): CommunityMemberProfile {
  return {
    userId: "user-1",
    firstName: "Jane",
    lastName: "Doe",
    displayName: null,
    bio: null,
    email: null,
    profileImageUrl: null,
    status: "active",
    ...overrides,
  };
}

describe("formatCommunityActorDisplayName", () => {
  it("prefers CommunityMember.displayName", () => {
    expect(
      formatCommunityActorDisplayName(
        { displayName: "Mission Jane", firstName: "Jane", lastName: "Doe" },
        { name: "User Name" },
      ),
    ).toBe("Mission Jane");
  });

  it("falls back to first and last name", () => {
    expect(
      formatCommunityActorDisplayName(
        { firstName: "Jane", lastName: "Doe" },
        null,
      ),
    ).toBe("Jane Doe");
  });

  it("falls back to User.name", () => {
    expect(
      formatCommunityActorDisplayName(null, { name: "Store User", email: "u@example.com" }),
    ).toBe("Store User");
  });

  it("falls back to email local-part", () => {
    expect(
      formatCommunityActorDisplayName(
        { email: "jane.doe@example.com" },
        null,
      ),
    ).toBe("jane.doe");
  });

  it("returns Someone when no identity fields exist", () => {
    expect(formatCommunityActorDisplayName(null, null)).toBe("Someone");
  });
});

describe("resolveCommunityActorFromSources", () => {
  it("uses admin session name before visitor member", () => {
    const result = resolveCommunityActorFromSources({
      sessionUserId: "admin-1",
      sessionRole: "ADMIN",
      sessionName: "Pastor Zieg",
      sessionEmail: "admin@example.com",
      memberByUserId: null,
      memberByVisitorKey: member({ id: "m-visitor", firstName: "Visitor", lastName: "Only" }),
      userRecord: null,
    });

    expect(result).toEqual({
      actorUserId: "admin-1",
      actorMemberId: null,
      actorDisplayName: "Pastor Zieg",
      actorIsOwner: true,
    });
  });

  it("uses signed-in member by userId when visitorKey does not match", () => {
    const signedIn = member({
      id: "m-1",
      userId: "user-1",
      firstName: "Signed",
      lastName: "In",
    });

    const result = resolveCommunityActorFromSources({
      sessionUserId: "user-1",
      sessionRole: "CUSTOMER",
      sessionName: null,
      sessionEmail: "signed@example.com",
      memberByUserId: signedIn,
      memberByVisitorKey: null,
      userRecord: null,
    });

    expect(result.actorDisplayName).toBe("Signed In");
    expect(result.actorMemberId).toBe("m-1");
    expect(result.actorUserId).toBe("user-1");
    expect(result.actorIsOwner).toBe(false);
  });

  it("uses visitor member when there is no session", () => {
    const visitor = member({
      id: "m-2",
      userId: null,
      firstName: "Guest",
      lastName: "Member",
    });

    const result = resolveCommunityActorFromSources({
      sessionUserId: null,
      sessionRole: null,
      sessionName: null,
      sessionEmail: null,
      memberByUserId: null,
      memberByVisitorKey: visitor,
      userRecord: null,
    });

    expect(result.actorDisplayName).toBe("Guest Member");
    expect(result.actorMemberId).toBe("m-2");
    expect(result.actorUserId).toBeNull();
  });

  it("uses User record when session exists without a member profile", () => {
    const result = resolveCommunityActorFromSources({
      sessionUserId: "user-orphan",
      sessionRole: "CUSTOMER",
      sessionName: null,
      sessionEmail: null,
      memberByUserId: null,
      memberByVisitorKey: null,
      userRecord: { name: "Linked User", email: "linked@example.com" },
    });

    expect(result).toEqual({
      actorUserId: "user-orphan",
      actorMemberId: null,
      actorDisplayName: "Linked User",
      actorIsOwner: false,
    });
  });

  it("returns Someone only when truly anonymous", () => {
    const result = resolveCommunityActorFromSources({
      sessionUserId: null,
      sessionRole: null,
      sessionName: null,
      sessionEmail: null,
      memberByUserId: null,
      memberByVisitorKey: null,
      userRecord: null,
    });

    expect(result.actorDisplayName).toBe("Someone");
    expect(result.actorUserId).toBeNull();
    expect(result.actorMemberId).toBeNull();
  });
});
