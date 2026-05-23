import { Prisma } from "@prisma/client";

const SETUP_HINT =
  "Run `npx prisma generate`, apply migrations (`npm run db:migrate:deploy`), then restart the dev server.";

/** Preserve explicit newsletter errors instead of replacing them with a generic message. */
function isPassthroughNewsletterMessage(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    msg.startsWith("DATABASE_URL is not configured") ||
    msg.startsWith("Newsletter Prisma client is not ready") ||
    msg.startsWith("Newsletters table is missing") ||
    msg.startsWith("Newsletter branding") ||
    msg.startsWith("Newsletter database column") ||
    msg.startsWith("Newsletter database schema is out of date") ||
    msg.startsWith("Newsletter write did not persist") ||
    msg.startsWith("Database connection failed") ||
    msg.startsWith("Database error (") ||
    msg.startsWith("Prisma ") ||
    lower.includes("restart the dev server") ||
    lower.includes("apply migrations")
  );
}

function formatSchemaDriftMessage(error: Prisma.PrismaClientKnownRequestError): string {
  if (error.code === "P2021") {
    const table = (error.meta?.table as string | undefined) ?? "newsletters";
    return `Newsletter table "${table}" is missing on the connected database. ${SETUP_HINT}`;
  }
  if (error.code === "P2022") {
    const column = error.meta?.column as string | undefined;
    return column
      ? `Newsletter database column "${column}" is missing on the connected database. ${SETUP_HINT}`
      : `Newsletter database schema is out of date on the connected database. ${SETUP_HINT}`;
  }
  return `Newsletter database schema error (${error.code}). ${SETUP_HINT}`;
}

export function formatNewsletterError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") {
      return formatSchemaDriftMessage(error);
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

  if (error instanceof Prisma.PrismaClientValidationError) {
    return `Newsletter query validation failed (stale Prisma client?). ${SETUP_HINT} Detail: ${error.message.slice(0, 240)}`;
  }

  if (error instanceof Error) {
    const msg = error.message;
    if (isPassthroughNewsletterMessage(msg)) return msg;
    if (/invalid `prisma\.newsletter\./i.test(msg)) {
      return `Newsletter database query failed. ${SETUP_HINT} Detail: ${msg.slice(0, 280)}`;
    }
    return msg;
  }

  return "Could not complete the newsletter operation.";
}

const BRAND_ADMIN_MESSAGE = "Unable to save branding settings.";

export function formatNewsletterBrandSettingsError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") {
      const column = error.meta?.column as string | undefined;
      if (column) {
        return `${BRAND_ADMIN_MESSAGE} Missing column "${column}". ${SETUP_HINT}`;
      }
      return `${BRAND_ADMIN_MESSAGE} Branding table or column is missing. ${SETUP_HINT}`;
    }
    return `${BRAND_ADMIN_MESSAGE} (${error.code}: ${error.message})`;
  }
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.startsWith("Newsletter branding")) return msg;
    if (
      msg.includes("branding Prisma client is not ready") ||
      msg.includes("branding table is missing")
    ) {
      return msg;
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
  if (error) {
    console.error(`[newsletter] ${action} failed`, details, error);
    if (error instanceof Error && error.stack) {
      console.error(`[newsletter] ${action} stack`, error.stack);
    }
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    console.info(`[newsletter] ${action}`, details);
  }
}
