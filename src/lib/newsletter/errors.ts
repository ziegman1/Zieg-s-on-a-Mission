import { Prisma } from "@prisma/client";

const SETUP_HINT =
  "Run `npx prisma generate`, apply migrations (`npm run db:migrate:deploy`), then restart the dev server.";

export function formatNewsletterError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") {
      return `Newsletters table is missing. ${SETUP_HINT}`;
    }
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? (error.meta.target as string[]).join(", ")
        : "field";
      return `A newsletter with that ${target} already exists. Change the slug and try again.`;
    }
    return `Database error (${error.code}): ${error.message}`;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return `Database connection failed. Check DATABASE_URL and restart the dev server. (${error.message})`;
  }

  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("newsletters") || msg.includes("Newsletter") || msg.includes("prisma.newsletter")) {
      return `Newsletter database is not ready. ${SETUP_HINT}`;
    }
    return msg;
  }

  return "Could not complete the newsletter operation.";
}

const BRAND_ADMIN_MESSAGE = "Unable to save branding settings.";

export function formatNewsletterBrandSettingsError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") {
      return BRAND_ADMIN_MESSAGE;
    }
  }
  if (error instanceof Error) {
    const msg = error.message;
    if (
      msg.includes("branding Prisma client is not ready") ||
      msg.includes("branding table is missing") ||
      msg.includes("newsletterBrandSettingsRecord") ||
      msg.includes("newsletter_brand_settings") ||
      msg.includes("Can't reach database") ||
      msg.includes("connection")
    ) {
      return BRAND_ADMIN_MESSAGE;
    }
  }
  return BRAND_ADMIN_MESSAGE;
}

export function brandSettingsDevHint(error: unknown): string | null {
  if (process.env.NODE_ENV === "production") return null;
  if (error instanceof Error) {
    if (
      error.message.includes("branding Prisma client is not ready") ||
      error.message.includes("newsletterBrandSettingsRecord")
    ) {
      return "Restart the dev server after `npx prisma generate` and `npm run db:migrate:deploy`.";
    }
  }
  return null;
}

export function logNewsletterBrandSettingsAction(
  action: string,
  details: Record<string, unknown>,
  error?: unknown,
): void {
  if (error) {
    console.error(`[newsletter-brand] ${action} failed`, details, error);
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    console.info(`[newsletter-brand] ${action}`, details);
  }
}

export function logNewsletterAction(
  action: string,
  details: Record<string, unknown>,
  error?: unknown,
): void {
  if (process.env.NODE_ENV === "production" && !error) return;
  if (error) {
    console.error(`[newsletter] ${action} failed`, details, error);
    return;
  }
  console.info(`[newsletter] ${action}`, details);
}
