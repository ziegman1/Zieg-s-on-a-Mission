import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/db";

const globalForCred = globalThis as unknown as { __prismaCredentials?: PrismaClient };

function cleanDbUrl(s: string | undefined): string {
  return (s ?? "").trim().replace(/^["']|["']$/g, "").trim();
}

/**
 * Credentials login reads `User` via Prisma. On Supabase, `DATABASE_URL` often points at the
 * transaction pooler (`postgres.<project>` on :6543) while `DIRECT_URL` uses the session/direct
 * connection (`postgres` on :5432). If RLS was enabled without policies, the pooled role can see
 * zero rows while the direct session (superuser / table owner) still sees data — or migrations
 * that disable RLS may not have been applied while the build continued. When `DIRECT_URL` differs
 * from `DATABASE_URL`, use a dedicated client on `DIRECT_URL` for this query only.
 */
export function prismaForCredentialsAuth(): PrismaClient {
  const direct = cleanDbUrl(process.env.DIRECT_URL);
  const pooled = cleanDbUrl(process.env.DATABASE_URL);
  if (!direct || direct === pooled) {
    return defaultPrisma;
  }
  if (!globalForCred.__prismaCredentials) {
    globalForCred.__prismaCredentials = new PrismaClient({
      datasources: { db: { url: direct } },
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return globalForCred.__prismaCredentials;
}
