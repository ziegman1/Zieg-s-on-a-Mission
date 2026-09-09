/**
 * Server-side admin auth helpers.
 * Use in server actions and API routes.
 */

import { auth } from "@/auth";
import { isAdminOnlyRole, isAdminRole } from "@/lib/admin-users";

export function requireAdmin(session: { user?: { role?: string } } | null): boolean {
  return isAdminRole(session?.user?.role);
}

export async function requireAdminSession(): Promise<{ id: string; role: string } | null> {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return null;
  }
  return { id: session.user.id, role: session.user.role };
}

/**
 * Strict ADMIN-only session guard for sensitive individual records.
 *
 * `requireAdminSession` admits ADMIN and STAFF. This one denies STAFF, and is used for
 * recruit records, which hold individual names and funding status.
 */
export async function requireAdminOnlySession(): Promise<{
  id: string;
  role: string;
} | null> {
  const session = await auth();
  if (!session?.user || !isAdminOnlyRole(session.user.role)) {
    return null;
  }
  return { id: session.user.id, role: session.user.role };
}
