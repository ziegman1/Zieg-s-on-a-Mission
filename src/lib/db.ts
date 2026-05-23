import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

function isBrandSettingsDelegateReady(
  client: PrismaClient,
): client is PrismaClient & {
  newsletterBrandSettingsRecord: PrismaClient["newsletterBrandSettingsRecord"];
} {
  const delegate = (
    client as PrismaClient & {
      newsletterBrandSettingsRecord?: PrismaClient["newsletterBrandSettingsRecord"];
    }
  ).newsletterBrandSettingsRecord;
  return Boolean(delegate && typeof delegate.findUnique === "function");
}

/** Cached dev client can predate new models in schema — delegates are undefined until restart. */
function contentDelegateMissing(client: PrismaClient): boolean {
  const extended = client as PrismaClient & {
    blogPost?: { findMany?: unknown };
    newsletter?: { findMany?: unknown };
  };
  const blog = extended.blogPost;
  const newsletter = extended.newsletter;
  const blogMissing = !blog || typeof blog.findMany !== "function";
  const newsletterMissing = !newsletter || typeof newsletter.findMany !== "function";
  const brandSettingsMissing = !isBrandSettingsDelegateReady(client);
  return blogMissing || newsletterMissing || brandSettingsMissing;
}

/** Drop cached client (e.g. after `prisma generate` without restarting Next.js). */
export function resetPrismaClient(): void {
  const existing = globalForPrisma.prisma;
  if (existing) {
    void existing.$disconnect().catch(() => {});
  }
  globalForPrisma.prisma = undefined;
}

export function getPrismaClient(): PrismaClient {
  let client = globalForPrisma.prisma;

  if (client && contentDelegateMissing(client)) {
    console.warn(
      "[prisma] Cached PrismaClient is missing blog/newsletter/branding delegates — recreating client. Run `npx prisma generate` and restart the dev server if this persists.",
    );
    resetPrismaClient();
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

/**
 * Lazy proxy so every property access re-checks delegate health (fixes stale HMR clients
 * where `newsletterBrandSettingsRecord` was undefined after schema changes).
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
