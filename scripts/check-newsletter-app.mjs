#!/usr/bin/env node
/** Exercise newsletter-db the same way the site builder does. */
import { loadPrismaEnv } from "./load-prisma-env.mjs";
import { formatDbTarget } from "./supabase-db-env.mjs";

const env = loadPrismaEnv([".env", ".env.local"]);
for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
  Object.assign(process.env, { [key]: env[key] });
}
console.log("[check-newsletter-app] DATABASE_URL:", formatDbTarget(process.env.DATABASE_URL));

const { listNewslettersForAdmin } = await import("../src/lib/newsletter/newsletter-db.ts");
const { formatNewsletterError } = await import("../src/lib/newsletter/errors.ts");
const { getNewsletterDelegate } = await import("../src/lib/newsletter/prisma-newsletter.ts");

console.log("[check-newsletter-app] delegate:", Boolean(getNewsletterDelegate()));

try {
  const rows = await listNewslettersForAdmin();
  console.log("[check-newsletter-app] listNewslettersForAdmin OK:", rows.length);
} catch (e) {
  console.error("[check-newsletter-app] RAW:", e);
  console.error("[check-newsletter-app] FORMATTED:", formatNewsletterError(e));
  process.exitCode = 1;
}
