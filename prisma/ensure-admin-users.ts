import type { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import {
  resolveAdminUsersToSeed,
  type AdminUserSeedConfig,
} from "../src/lib/admin-users";

async function resolvePasswordHash(
  admin: AdminUserSeedConfig,
): Promise<string | null> {
  const plain = process.env[admin.passwordEnvKey]?.trim();
  if (plain) return hash(plain, 10);
  if (admin.defaultPasswordHash) return admin.defaultPasswordHash;
  return null;
}

/**
 * Upserts all configured admin users (role ADMIN). Skips password on create when env is unset.
 */
export async function ensureAdminUsers(prisma: PrismaClient): Promise<void> {
  const admins = resolveAdminUsersToSeed();

  for (const admin of admins) {
    const email = admin.email.toLowerCase();
    const passwordHash = await resolvePasswordHash(admin);

    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (!passwordHash) {
      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { name: admin.name, role: "ADMIN" },
        });
        console.warn(
          `[seed] ${email}: role/name updated; password unchanged (set ${admin.passwordEnvKey} to rotate).`,
        );
      } else {
        console.warn(
          `[seed] Skipped creating ${email}: set ${admin.passwordEnvKey} (or run setup-credentials).`,
        );
      }
      continue;
    }

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { email, name: admin.name, passwordHash, role: "ADMIN" },
      });
    } else {
      await prisma.user.create({
        data: { email, name: admin.name, passwordHash, role: "ADMIN" },
      });
    }
    console.log(`[seed] Admin ready: ${email} (role: ADMIN)`);
  }
}
