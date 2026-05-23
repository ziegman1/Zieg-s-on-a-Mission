import { Prisma, type PrismaClient } from "@prisma/client";
import { getPrismaClient, resetPrismaClient } from "@/lib/db";

export type NewsletterBrandSettingsDelegate = PrismaClient["newsletterBrandSettingsRecord"];

export const BRAND_SETTINGS_SETUP_HINT =
  "Run `npx prisma generate`, apply migrations (`npm run db:migrate:deploy`), then restart the dev server.";

let loggedDelegateUnavailable = false;

function resolveBrandSettingsDelegate(
  client: PrismaClient,
): NewsletterBrandSettingsDelegate | null {
  const delegate = (
    client as PrismaClient & {
      newsletterBrandSettingsRecord?: NewsletterBrandSettingsDelegate;
    }
  ).newsletterBrandSettingsRecord;

  if (!delegate || typeof delegate.findUnique !== "function") {
    return null;
  }
  return delegate;
}

/** Prisma delegate for singleton `newsletter_brand_settings` row. */
export function getNewsletterBrandSettingsDelegate(options?: {
  quiet?: boolean;
}): NewsletterBrandSettingsDelegate | null {
  let client = getPrismaClient();
  let delegate = resolveBrandSettingsDelegate(client);

  if (!delegate) {
    resetPrismaClient();
    client = getPrismaClient();
    delegate = resolveBrandSettingsDelegate(client);
  }

  if (!delegate && !options?.quiet && !loggedDelegateUnavailable) {
    loggedDelegateUnavailable = true;
    console.warn(
      `[newsletter-brand] prisma.newsletterBrandSettingsRecord is unavailable. ${BRAND_SETTINGS_SETUP_HINT}`,
    );
  }

  return delegate;
}

export function isNewsletterBrandSettingsTableMissing(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") return true;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('relation "newsletter_brand_settings" does not exist') ||
      (msg.includes("newsletter_brand_settings") && msg.includes("does not exist"))
    );
  }
  return false;
}

export async function runNewsletterBrandSettingsQuery<T>(
  run: (delegate: NewsletterBrandSettingsDelegate) => Promise<T>,
  options?: { quiet?: boolean },
): Promise<T> {
  const delegate = getNewsletterBrandSettingsDelegate(options);
  if (!delegate) {
    throw new Error(
      `Newsletter branding Prisma client is not ready. ${BRAND_SETTINGS_SETUP_HINT}`,
    );
  }
  try {
    return await run(delegate);
  } catch (error) {
    if (isNewsletterBrandSettingsTableMissing(error)) {
      throw new Error(
        `Newsletter branding table is missing. ${BRAND_SETTINGS_SETUP_HINT}`,
      );
    }
    throw error;
  }
}
