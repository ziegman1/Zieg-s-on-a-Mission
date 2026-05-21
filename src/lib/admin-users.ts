/**
 * Canonical Mission Hub / store admin owners (database-backed, role ADMIN).
 * Passwords are set only via env at seed time or setup-credentials — never stored here.
 */

export type AdminUserSeedConfig = {
  email: string;
  name: string;
  /** Env var name for plaintext password when running prisma seed / seed-admin */
  passwordEnvKey: string;
  /** Bcrypt hash used when password env is unset (local dev fallback — rotate in production). */
  defaultPasswordHash?: string;
};

/** Embedded dev fallback for Jeremy when ADMIN_PASSWORD is unset (matches prisma/seed.ts). */
export const DEFAULT_JEREMY_PASSWORD_HASH =
  "$2b$10$W9Rv49gJroSuk3jcgG0DTef41Tpl0ouqMINlRBpYwdHc6.HVMlDw.";

export const DEFAULT_ADMIN_USERS: readonly AdminUserSeedConfig[] = [
  {
    email: "jziegenhorn@teamexpansion.org",
    name: "Jeremy Ziegenhorn",
    passwordEnvKey: "ADMIN_PASSWORD",
    defaultPasswordHash: DEFAULT_JEREMY_PASSWORD_HASH,
  },
  {
    email: "lziegenhorn@teamexpansion.org",
    name: "Lindsay Ziegenhorn",
    passwordEnvKey: "ADMIN_PASSWORD_LINDSAY",
  },
] as const;

export function isAdminRole(role: string | undefined | null): boolean {
  return role === "ADMIN" || role === "STAFF";
}

/** Admin emails (lowercase) for logging and future owner-only tooling. */
export function getDefaultAdminEmails(): string[] {
  return DEFAULT_ADMIN_USERS.map((u) => u.email.toLowerCase());
}

export function resolveAdminUsersToSeed(): AdminUserSeedConfig[] {
  const legacyEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!legacyEmail) return [...DEFAULT_ADMIN_USERS];
  return DEFAULT_ADMIN_USERS.map((u, i) =>
    i === 0 && legacyEmail !== u.email.toLowerCase() ? { ...u, email: legacyEmail } : u,
  );
}
