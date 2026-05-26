import { describe, expect, it } from "vitest";
import type { AdminMemberPortalRow } from "./admin-members-portal-types";
import {
  filterAdminMemberRows,
  DEFAULT_MEMBER_PORTAL_FILTERS,
} from "./admin-members-portal-filters";

function row(overrides: Partial<AdminMemberPortalRow>): AdminMemberPortalRow {
  return {
    id: "m1",
    userId: "u1",
    firstName: "Jane",
    lastName: "Doe",
    displayName: null,
    email: null,
    userEmail: "jane@example.com",
    profileImageUrl: null,
    visitorKey: null,
    status: "active",
    userRole: "CUSTOMER",
    userRoleLabel: "Member",
    hasLinkedAccount: true,
    joinedAt: "2026-01-01T00:00:00.000Z",
    lastActiveAt: null,
    commentCount: 0,
    postCount: 0,
    inAppEnabled: true,
    emailEnabled: true,
    newslettersEnabled: true,
    newPostsEnabled: true,
    mutedSpaceIds: [],
    mutedSpaceSlugs: [],
    unreadNotificationCount: 0,
    partnershipCompleted: false,
    ministryUpdates: false,
    newsletters: false,
    prayerTeam: false,
    urgentPrayerRequests: false,
    advocacyInterest: false,
    financialPartnership: false,
    ...overrides,
  };
}

describe("filterAdminMemberRows", () => {
  const members = [
    row({ id: "m1", userEmail: "jane@example.com", emailEnabled: true }),
    row({
      id: "m2",
      firstName: "Bob",
      userEmail: "bob@example.com",
      emailEnabled: false,
      newslettersEnabled: false,
      status: "blocked",
    }),
    row({
      id: "m3",
      firstName: "Visitor",
      userEmail: null,
      hasLinkedAccount: false,
      userRole: null,
      mutedSpaceSlugs: ["prayer"],
    }),
  ];

  it("filters by search query", () => {
    const result = filterAdminMemberRows(members, {
      ...DEFAULT_MEMBER_PORTAL_FILTERS,
      query: "bob",
    });
    expect(result.map((m) => m.id)).toEqual(["m2"]);
  });

  it("filters by active status", () => {
    const result = filterAdminMemberRows(members, {
      ...DEFAULT_MEMBER_PORTAL_FILTERS,
      status: "active",
    });
    expect(result.map((m) => m.id)).toEqual(["m1", "m3"]);
  });

  it("filters email notifications off", () => {
    const result = filterAdminMemberRows(members, {
      ...DEFAULT_MEMBER_PORTAL_FILTERS,
      emailNotifications: "off",
    });
    expect(result.map((m) => m.id)).toEqual(["m2"]);
  });

  it("filters newsletter notifications off", () => {
    const result = filterAdminMemberRows(members, {
      ...DEFAULT_MEMBER_PORTAL_FILTERS,
      newsletterNotifications: "off",
    });
    expect(result.map((m) => m.id)).toEqual(["m2"]);
  });

  it("filters by muted space slug", () => {
    const result = filterAdminMemberRows(members, {
      ...DEFAULT_MEMBER_PORTAL_FILTERS,
      mutedSpaceSlug: "prayer",
    });
    expect(result.map((m) => m.id)).toEqual(["m3"]);
  });

  it("filters visitor profiles", () => {
    const result = filterAdminMemberRows(members, {
      ...DEFAULT_MEMBER_PORTAL_FILTERS,
      role: "visitor",
    });
    expect(result.map((m) => m.id)).toEqual(["m3"]);
  });

  it("filters by prayer team segment", () => {
    const withPrayer = [
      ...members,
      row({ id: "m4", prayerTeam: true, partnershipCompleted: true }),
    ];
    const result = filterAdminMemberRows(withPrayer, {
      ...DEFAULT_MEMBER_PORTAL_FILTERS,
      partnershipSegment: "prayerTeam",
    });
    expect(result.map((m) => m.id)).toEqual(["m4"]);
  });
});
