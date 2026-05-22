#!/usr/bin/env node
/**
 * Runs Prisma CLI with env from .env.local (and .env if present).
 * Validates Supabase pooler (DATABASE_URL) vs direct (DIRECT_URL). Never swaps them.
 */
import { spawnSync } from "child_process";
import { loadPrismaEnv, assertSupabasePrismaEnv } from "./load-prisma-env.mjs";

const env = loadPrismaEnv([".env", ".env.local"]);
assertSupabasePrismaEnv(env, { label: "prisma-with-env" });

const args = process.argv.slice(2);
const r = spawnSync("npx", ["prisma", ...args], { stdio: "inherit", env });
process.exit(r.status ?? 1);
