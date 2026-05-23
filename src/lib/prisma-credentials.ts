import { prisma as defaultPrisma } from "@/lib/db";

/**
 * Credentials login reads `User` via Prisma. Always use the shared pooled client
 * (`DATABASE_URL` transaction pooler). Never use `DIRECT_URL` at runtime — it
 * exhausts connections on serverless and is for migrations only.
 */
export function prismaForCredentialsAuth() {
  return defaultPrisma;
}
