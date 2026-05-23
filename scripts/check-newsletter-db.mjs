#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";
import { loadPrismaEnv } from "./load-prisma-env.mjs";
import { formatDbTarget } from "./supabase-db-env.mjs";

const env = loadPrismaEnv([".env", ".env.local"]);
const url = env.DATABASE_URL;
console.log("[check-newsletter-db] DATABASE_URL:", formatDbTarget(url));

const prisma = new PrismaClient({ datasources: { db: { url } } });

const EXPECTED_NEWSLETTER_COLS = [
  "id",
  "title",
  "subtitle",
  "slug",
  "issue_date",
  "header_image_url",
  "use_default_branded_header",
  "featured_image_url",
  "excerpt",
  "body",
  "body_blocks",
  "cta_label",
  "cta_url",
  "cta_align",
  "footer_image_url",
  "footer_alt_text",
  "use_default_footer_image",
  "seo_title",
  "seo_description",
  "status",
  "published_at",
  "created_at",
  "updated_at",
];

try {
  const hasNewsletter = typeof prisma.newsletter?.findMany === "function";
  const hasBrand = typeof prisma.newsletterBrandSettingsRecord?.findUnique === "function";
  console.log("[check-newsletter-db] Delegates:", { newsletter: hasNewsletter, brand: hasBrand });

  const tables = await prisma.$queryRaw`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('newsletters', 'newsletter_brand_settings')
    ORDER BY table_name`;
  console.log("[check-newsletter-db] Tables:", tables.map((t) => t.table_name));

  const cols = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters'
    ORDER BY column_name`;
  const names = cols.map((c) => c.column_name);
  const missing = EXPECTED_NEWSLETTER_COLS.filter((c) => !names.includes(c));
  console.log("[check-newsletter-db] newsletters columns:", names.join(", "));
  if (missing.length) console.log("[check-newsletter-db] MISSING columns:", missing.join(", "));

  const rows = await prisma.newsletter.findMany({ take: 1 });
  console.log("[check-newsletter-db] findMany OK, sample rows:", rows.length);
} catch (e) {
  console.error("[check-newsletter-db] FAILED:", e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
