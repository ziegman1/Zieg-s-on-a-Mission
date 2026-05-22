import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/db";

const globalForCred = globalThis as unknown as { __prismaCredentials?: PrismaClient };

function cleanDbUrl(s: string | undefined): string {
  return (s ?? "").trim().replace(/^["']|["']$/g, "").trim();
}

/**
 * Credentials login reads `User` via Prisma. On Supabase, `DATABASE_URL` is the transaction pooler
 * (:6543, `?pgbouncer=true`). `DIRECT_URL` is `db.<ref>.supabase.co:5432` for migrations only.
 *
 * On Vercel/serverless the direct host is usually unreachable (P1001), which broke admin login.
 * Use the pooled `DATABASE_URL` in production; optional `DIRECT_URL` client is for local dev when
 * you need to bypass pooler RLS quirks (`MISSION_HUB_AUTH_USE_DIRECT=1`).
 */
export function prismaForCredentialsAuth(): PrismaClient {
  const direct = cleanDbUrl(process.env.DIRECT_URL);
  const pooled = cleanDbUrl(process.env.DATABASE_URL);
  const preferPooler =
    process.env.VERCEL === "1" ||
    process.env.MISSION_HUB_AUTH_USE_POOLER === "1" ||
    process.env.NODE_ENV === "production";

  if (preferPooler || !direct || direct === pooled) {
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
