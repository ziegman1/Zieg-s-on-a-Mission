import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

/** Cached dev client can predate `BlogPost` in schema — delegate is then undefined until restart. */
function blogPostDelegateMissing(client: PrismaClient): boolean {
  const delegate = (client as PrismaClient & { blogPost?: { findMany?: unknown } }).blogPost;
  return !delegate || typeof delegate.findMany !== "function";
}

function getPrismaClient(): PrismaClient {
  let client = globalForPrisma.prisma;

  if (client && blogPostDelegateMissing(client)) {
    console.warn(
      "[prisma] Cached PrismaClient is missing prisma.blogPost — recreating client. Run `npx prisma generate` and restart the dev server if blog queries still fail.",
    );
    void client.$disconnect().catch(() => {});
    globalForPrisma.prisma = undefined;
    client = undefined;
  }

  if (!client) {
    client = createPrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = client;
    }
  }

  return client;
}

export const prisma = getPrismaClient();
