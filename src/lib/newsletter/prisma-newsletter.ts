import { Prisma, type PrismaClient } from "@prisma/client";
import { getPrismaClient, resetPrismaClient } from "@/lib/db";

export type NewsletterDelegate = PrismaClient["newsletter"];

const SETUP_HINT =
  "Run `npx prisma generate`, apply migrations (`npm run db:migrate:deploy`), then restart the dev server.";

let loggedDelegateUnavailable = false;

function resolveNewsletterDelegate(client: PrismaClient): NewsletterDelegate | null {
  const delegate = (client as PrismaClient & { newsletter?: NewsletterDelegate }).newsletter;
  if (!delegate || typeof delegate.findMany !== "function") return null;
  return delegate;
}

export function getNewsletterDelegate(options?: { quiet?: boolean }): NewsletterDelegate | null {
  let client = getPrismaClient();
  let delegate = resolveNewsletterDelegate(client);

  if (!delegate) {
    resetPrismaClient();
    client = getPrismaClient();
    delegate = resolveNewsletterDelegate(client);
  }

  if (!delegate && !options?.quiet && !loggedDelegateUnavailable) {
    loggedDelegateUnavailable = true;
    console.error(`[newsletter] prisma.newsletter is unavailable. ${SETUP_HINT}`);
  }

  return delegate;
}

export function isNewslettersTableMissing(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") return true;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('relation "newsletters" does not exist') ||
      (msg.includes("newsletters") && msg.includes("does not exist"))
    );
  }
  return false;
}

export async function runNewsletterQuery<T>(
  run: (newsletter: NewsletterDelegate) => Promise<T>,
): Promise<T> {
  const nl = getNewsletterDelegate();
  if (!nl) {
    throw new Error(`Newsletter Prisma client is not ready. ${SETUP_HINT}`);
  }
  try {
    return await run(nl);
  } catch (error) {
    if (isNewslettersTableMissing(error)) {
      throw new Error(`Newsletters table is missing. ${SETUP_HINT}`);
    }
    throw error;
  }
}

export async function withNewsletterDelegate<T>(
  fallback: T,
  run: (newsletter: NewsletterDelegate) => Promise<T>,
): Promise<T> {
  const nl = getNewsletterDelegate();
  if (!nl) return fallback;
  try {
    return await run(nl);
  } catch (error) {
    if (isNewslettersTableMissing(error)) {
      console.error(`[newsletter] newsletters table is missing. ${SETUP_HINT}`);
      return fallback;
    }
    console.error("[newsletter] public query failed:", error);
    return fallback;
  }
}
