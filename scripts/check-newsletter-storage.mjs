#!/usr/bin/env node
/**
 * Probes newsletter-assets bucket: env vars, PDF upload, public URL.
 * Run: node scripts/check-newsletter-storage.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { loadPrismaEnv } from "./load-prisma-env.mjs";

const env = loadPrismaEnv([".env", ".env.local"]);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

function missing() {
  const out = [];
  if (!url?.trim()) out.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey?.trim()) out.push("SUPABASE_SERVICE_ROLE_KEY");
  return out;
}

const miss = missing();
if (miss.length) {
  console.error("[check-newsletter-storage] Missing:", miss.join(", "));
  process.exit(1);
}

console.log("[check-newsletter-storage] URL:", url.replace(/\/$/, ""));
console.log(
  "[check-newsletter-storage] Keys:",
  `anon=${anon ? "set" : "missing"}`,
  `service_role=${serviceKey ? "set" : "missing"}`,
);

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const path = `temp/documents/check-${Date.now()}.pdf`;
const bytes = Buffer.from("%PDF-1.4 newsletter storage check");

const { data, error } = await supabase.storage.from("newsletter-assets").upload(path, bytes, {
  contentType: "application/pdf",
  upsert: false,
});

if (error) {
  console.error("[check-newsletter-storage] PDF upload FAILED", {
    statusCode: error.statusCode,
    message: error.message,
  });
  if (String(error.message).includes("not supported") || String(error.message).includes("not allowed")) {
    console.error(
      "\nFix: run supabase/storage/newsletter-assets-policies.sql in Supabase SQL Editor\n" +
        "(updates allowed_mime_types to include application/pdf).\n" +
        "See docs/supabase-newsletter-assets.md",
    );
  }
  process.exit(1);
}

const publicUrl =
  url.replace(/\/$/, "") +
  "/storage/v1/object/public/newsletter-assets/" +
  path.split("/").map(encodeURIComponent).join("/");

console.log("[check-newsletter-storage] PDF upload OK", { path: data?.path ?? path });
console.log("[check-newsletter-storage] Public URL:", publicUrl);
