/**
 * Server-side admin auth helpers.
 * Use in server actions and API routes.
 */

import { auth } from "@/auth";
import { isAdminRole } from "@/lib/admin-users";

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
