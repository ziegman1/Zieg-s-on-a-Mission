import "server-only";

import fs from "node:fs";
import path from "node:path";
import {
  getSupabaseProjectUrl,
  getSupabaseServiceRoleKey,
  getSupabaseServiceRoleKeyIssue,
  type SupabaseEnvDebugInfo,
} from "@/lib/supabase/config-env";

/**
 * Server-only diagnostics for upload debugging. Logs first 20 chars of the key, never the full value.
 * Call from API routes; output appears in the terminal running `npm run dev`.
 */
export function logSupabaseServiceRoleKeyDebug(context: string): SupabaseEnvDebugInfo {
  const key = getSupabaseServiceRoleKey();
  const keyIssue = getSupabaseServiceRoleKeyIssue();
  const projectRoot = process.cwd();
  const envLocalPath = path.join(projectRoot, ".env.local");
  const envPath = path.join(projectRoot, ".env");

  let duplicateDefinitionsInEnvLocal = 0;
  const envFilesChecked: string[] = [];

  for (const filePath of [envPath, envLocalPath]) {
    if (!fs.existsSync(filePath)) continue;
    envFilesChecked.push(filePath);
    const content = fs.readFileSync(filePath, "utf8");
    const matches = content.match(/^\s*SUPABASE_SERVICE_ROLE_KEY\s*=/gm);
    if (filePath === envLocalPath && matches) {
      duplicateDefinitionsInEnvLocal = matches.length;
    }
  }

  const info: SupabaseEnvDebugInfo = {
    keyPrefix: key ? key.slice(0, 20) : "(undefined)",
    keyLength: key?.length ?? 0,
    keyIssue,
    runtimeKeyDefined: Boolean(key),
    envFilesChecked,
    duplicateDefinitionsInEnvLocal,
    devCommandHint:
      "Use npm run dev (loads .env.local via dotenv). After any .env.local edit, stop and restart the dev server — Next.js caches env at startup.",
  };

  console.warn(`[supabase/env-debug:${context}]`, {
    ...info,
    NEXT_PUBLIC_SUPABASE_URL_defined: Boolean(getSupabaseProjectUrl()),
    NODE_ENV: process.env.NODE_ENV,
  });

  return info;
}
