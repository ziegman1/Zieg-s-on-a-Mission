#!/usr/bin/env node
/**
 * Production build entry (used by `npm run build` and Vercel).
 *
 * Steps (in order):
 *   1. npx prisma generate — client from schema (no DB connection)
 *   2. next build — Next.js production compile
 *
 * Migrations are NOT run here. Apply with `npm run db:migrate:deploy` when ready.
 */
import { spawnSync } from "child_process";

const BUILD_STEPS: { name: string; command: string; args: string[] }[] = [
  { name: "prisma-generate", command: "npx", args: ["prisma", "generate"] },
  { name: "next-build", command: "npx", args: ["next", "build"] },
];

/** Env vars required at runtime on Vercel (warn only — build does not need DB). */
const RUNTIME_ENV_HINTS: { key: string; note: string }[] = [
  { key: "DATABASE_URL", note: "runtime + Prisma (pooler :6543?pgbouncer=true)" },
  { key: "DIRECT_URL", note: "migrations only (session pooler :5432)" },
  { key: "AUTH_SECRET", note: "NextAuth session signing (alias: NEXTAUTH_SECRET)" },
  { key: "NEXTAUTH_URL", note: "must match public site URL" },
  { key: "NEXT_PUBLIC_SUPABASE_URL", note: "Mission Hub media uploads" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", note: "server-only Supabase Storage" },
];

function logHeader(): void {
  console.log("[build] ========================================");
  console.log("[build] Zieg's on a Mission — production build");
  console.log("[build] ========================================");
  console.log(`[build] Node ${process.version} (${process.platform})`);
  console.log(`[build] cwd: ${process.cwd()}`);
  console.log(`[build] NODE_ENV: ${process.env.NODE_ENV ?? "(unset)"}`);
}

function warnMissingRuntimeEnv(): void {
  const missing = RUNTIME_ENV_HINTS.filter(({ key }) => {
    if (key === "AUTH_SECRET") {
      return !process.env.AUTH_SECRET?.trim() && !process.env.NEXTAUTH_SECRET?.trim();
    }
    return !process.env[key]?.trim();
  });
  if (missing.length === 0) return;
  console.warn("[build] Warning: these runtime env vars are unset (build may still succeed):");
  for (const { key, note } of missing) {
    console.warn(`[build]   - ${key} (${note})`);
  }
}

function runStep(name: string, command: string, args: string[]): void {
  const label = `${name}`;
  const cmdLine = [command, ...args].join(" ");
  console.log(`\n[build] ----- ${label} -----`);
  console.log(`[build] $ ${cmdLine}`);
  const started = Date.now();

  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    shell: false,
    stdio: ["inherit", "pipe", "pipe"],
    encoding: "utf-8",
  });

  const elapsed = Date.now() - started;

  if (result.status !== 0) {
    if (result.stdout?.trim()) {
      console.error("[build] stdout (tail):");
      console.error(tailLines(result.stdout, 120));
    }
    if (result.stderr?.trim()) {
      console.error("[build] stderr (tail):");
      console.error(tailLines(result.stderr, 200));
    }
    console.error(`\n[build] FAILED step: ${label}`);
    console.error(`[build]   exit code: ${result.status ?? "unknown"}`);
    if (result.error) {
      console.error(`[build]   spawn error: ${result.error.message}`);
    }
    console.error(`[build]   elapsed: ${elapsed}ms`);
    console.error("[build] Fix the errors above, then re-run: npm run build");
    process.exit(result.status === null ? 1 : result.status);
  }

  console.log(`[build] OK ${label} (${elapsed}ms)`);
}

function tailLines(text: string, maxLines: number): string {
  const lines = text.split("\n");
  if (lines.length <= maxLines) return text;
  return lines.slice(-maxLines).join("\n");
}

function main(): void {
  logHeader();
  warnMissingRuntimeEnv();

  for (const step of BUILD_STEPS) {
    runStep(step.name, step.command, step.args);
  }

  console.log("\n[build] ========================================");
  console.log("[build] Build finished successfully");
  console.log("[build] ========================================\n");
}

main();
