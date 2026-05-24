import type { AdminMemberPortalRow } from "./admin-members-portal-types";

function displayEmail(row: { email: string | null; userEmail: string | null }): string | null {
  return row.userEmail?.trim() || row.email?.trim() || null;
}

export type MemberPortalFilters = {
  query: string;
  status: "all" | "active" | "blocked" | "pending";
  role: "all" | "admin" | "staff" | "member" | "visitor";
  emailNotifications: "all" | "on" | "off";
  newsletterNotifications: "all" | "on" | "off";
  mutedSpaceSlug: string;
};

export const DEFAULT_MEMBER_PORTAL_FILTERS: MemberPortalFilters = {
  query: "",
  status: "all",
  role: "all",
  emailNotifications: "all",
  newsletterNotifications: "all",
  mutedSpaceSlug: "",
};

function matchesRole(row: AdminMemberPortalRow, role: MemberPortalFilters["role"]): boolean {
  if (role === "all") return true;
  if (role === "visitor") return !row.hasLinkedAccount;
  if (role === "admin") return row.userRole === "ADMIN";
  if (role === "staff") return row.userRole === "STAFF";
  if (role === "member") return row.userRole === "CUSTOMER";
  return true;
}

export function filterAdminMemberRows(
  rows: AdminMemberPortalRow[],
  filters: MemberPortalFilters,
): AdminMemberPortalRow[] {
  const q = filters.query.trim().toLowerCase();

  return rows.filter((row) => {
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (!matchesRole(row, filters.role)) return false;
    if (filters.emailNotifications === "on" && !row.emailEnabled) return false;
    if (filters.emailNotifications === "off" && row.emailEnabled) return false;
    if (filters.newsletterNotifications === "on" && !row.newslettersEnabled) return false;
    if (filters.newsletterNotifications === "off" && row.newslettersEnabled) return false;
    if (
      filters.mutedSpaceSlug &&
      !row.mutedSpaceSlugs.includes(filters.mutedSpaceSlug)
    ) {
      return false;
    }

    if (!q) return true;

    const name = `${row.firstName} ${row.lastName} ${row.displayName ?? ""}`.toLowerCase();
    const email = (displayEmail(row) ?? "").toLowerCase();
    return name.includes(q) || email.includes(q);
  });
}

export function collectMutedSpaceOptions(rows: AdminMemberPortalRow[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    for (const slug of row.mutedSpaceSlugs) set.add(slug);
  }
  return [...set].sort();
}
