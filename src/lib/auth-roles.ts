import type { UserRole } from "@prisma/client";
import { isAdminRole } from "@/lib/admin-users";

/** Mission Hub supporters with their own login (store customers / community members). */
export function isCommunityMemberRole(role: string | undefined | null): boolean {
  return role === "CUSTOMER";
}

/** Roles allowed to sign in via shared Credentials provider. */
export function canSignInWithCredentials(role: string | undefined | null): boolean {
  return isAdminRole(role) || isCommunityMemberRole(role);
}

export function roleLabel(role: UserRole | string): string {
  if (role === "ADMIN") return "Admin";
  if (role === "STAFF") return "Staff";
  if (role === "CUSTOMER") return "Member";
  return role;
}
