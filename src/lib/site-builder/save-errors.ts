import { Prisma } from "@prisma/client";

export function formatSiteBuilderSaveError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021") {
      return "The site_page_sections table is missing. Run: npm run db:migrate:deploy (or db:migrate:deploy:production for live).";
    }
    if (error.code === "P2002") {
      return "Duplicate section key on this page. Rename or remove the duplicate section.";
    }
    if (error.code === "P1001" || error.code === "P1002") {
      return "Cannot reach the database. Check DATABASE_URL and that your database is online.";
    }
    const meta = error.meta ? ` (${JSON.stringify(error.meta)})` : "";
    return `Database error ${error.code}: ${error.message}${meta}`;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return "Database connection failed. Check DATABASE_URL in your environment.";
  }

  if (error instanceof Error) {
    if (error.message.includes("site_page_sections")) {
      return `${error.message} — If this mentions a missing relation, run npm run db:migrate:deploy.`;
    }
    return error.message;
  }

  return "Unknown error while saving page sections.";
}

export function logSiteBuilderSaveError(error: unknown, context: Record<string, unknown>) {
  console.error("[site-builder] save failed", context, error);
}
