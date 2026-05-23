import { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/db";
function formatDbTarget(url: string): string {
  try {
    const u = new URL(url.replace(/^postgresql:\/\//, "http://"));
    const db = u.pathname.replace(/^\//, "") || "postgres";
    return `${u.hostname}:${u.port || "5432"}/${db}`;
  } catch {
    return "(could not parse URL)";
  }
}
import { getNewsletterDelegate } from "./prisma-newsletter";
import { getNewsletterBrandSettingsDelegate } from "./prisma-brand-settings";

const EXPECTED_NEWSLETTER_COLUMNS = [
  "body_blocks",
  "cta_align",
  "footer_alt_text",
  "footer_image_url",
  "header_image_url",
  "use_default_branded_header",
  "use_default_footer_image",
] as const;

const EXPECTED_BRAND_COLUMNS = [
  "default_footer_image_url",
  "footer_alt_text",
  "use_default_footer_image_on_new",
] as const;

export type NewsletterDatabaseDiagnostics = {
  databaseUrl: string | null;
  migrateHint: string;
  delegates: {
    newsletter: boolean;
    brandSettings: boolean;
  };
  tables: {
    newsletters: boolean;
    newsletterBrandSettings: boolean;
  };
  missingColumns: {
    newsletters: string[];
    newsletterBrandSettings: string[];
  };
  queryProbe: "ok" | "failed";
  queryError: string | null;
};

export function getNewsletterMigrateEnvHint(): string {
  return "Migrations use DIRECT_URL from the same env files as this app (.env.local). Compare targets in the migrate-deploy log vs this diagnostic.";
}

export async function getNewsletterDatabaseDiagnostics(): Promise<NewsletterDatabaseDiagnostics> {
  const databaseUrl = process.env.DATABASE_URL?.trim() || null;
  const result: NewsletterDatabaseDiagnostics = {
    databaseUrl: databaseUrl ? formatDbTarget(databaseUrl) : null,
    migrateHint: getNewsletterMigrateEnvHint(),
    delegates: {
      newsletter: Boolean(getNewsletterDelegate()),
      brandSettings: Boolean(getNewsletterBrandSettingsDelegate({ quiet: true })),
    },
    tables: { newsletters: false, newsletterBrandSettings: false },
    missingColumns: { newsletters: [], newsletterBrandSettings: [] },
    queryProbe: "failed",
    queryError: null,
  };

  if (!databaseUrl) {
    result.queryError = "DATABASE_URL is not set for this Next.js process.";
    return result;
  }

  try {
    const prisma = getPrismaClient();
    const tableRows = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('newsletters', 'newsletter_brand_settings')
    `;
    const tableNames = new Set(tableRows.map((r) => r.table_name));
    result.tables.newsletters = tableNames.has("newsletters");
    result.tables.newsletterBrandSettings = tableNames.has("newsletter_brand_settings");

    if (result.tables.newsletters) {
      const cols = await prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'newsletters'
      `;
      const names = new Set(cols.map((c) => c.column_name));
      result.missingColumns.newsletters = EXPECTED_NEWSLETTER_COLUMNS.filter((c) => !names.has(c));
    } else {
      result.missingColumns.newsletters = [...EXPECTED_NEWSLETTER_COLUMNS];
    }

    if (result.tables.newsletterBrandSettings) {
      const cols = await prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'newsletter_brand_settings'
      `;
      const names = new Set(cols.map((c) => c.column_name));
      result.missingColumns.newsletterBrandSettings = EXPECTED_BRAND_COLUMNS.filter(
        (c) => !names.has(c),
      );
    } else {
      result.missingColumns.newsletterBrandSettings = [...EXPECTED_BRAND_COLUMNS];
    }

    const nl = getNewsletterDelegate();
    if (nl) {
      await nl.findMany({ take: 1 });
      result.queryProbe = "ok";
    } else {
      result.queryError = "prisma.newsletter delegate is unavailable (stale client — restart dev server).";
    }
  } catch (error) {
    result.queryError = describePrismaProbeError(error);
  }

  return result;
}

function describePrismaProbeError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021") {
      return `Table does not exist (${error.meta?.table ?? "unknown"}).`;
    }
    if (error.code === "P2022") {
      const column = error.meta?.column as string | undefined;
      return column
        ? `Column "${column}" is missing on the connected database.`
        : "A required column is missing on the connected database.";
    }
    return `Prisma ${error.code}: ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

export function formatNewsletterDiagnosticsSummary(d: NewsletterDatabaseDiagnostics): string {
  const parts: string[] = [];
  if (!d.databaseUrl) parts.push("DATABASE_URL is not set in this server process.");
  else parts.push(`Connected to ${d.databaseUrl}.`);
  if (!d.delegates.newsletter) parts.push("Prisma newsletter delegate missing — restart the dev server.");
  if (!d.delegates.brandSettings) parts.push("Prisma brand settings delegate missing — restart the dev server.");
  if (!d.tables.newsletters) parts.push("Table `newsletters` is missing.");
  if (!d.tables.newsletterBrandSettings) parts.push("Table `newsletter_brand_settings` is missing.");
  if (d.missingColumns.newsletters.length) {
    parts.push(`newsletters missing columns: ${d.missingColumns.newsletters.join(", ")}.`);
  }
  if (d.missingColumns.newsletterBrandSettings.length) {
    parts.push(
      `newsletter_brand_settings missing columns: ${d.missingColumns.newsletterBrandSettings.join(", ")}.`,
    );
  }
  if (d.queryError) parts.push(d.queryError);
  else if (d.queryProbe === "ok") parts.push("Newsletter query probe succeeded.");
  return parts.join(" ");
}
