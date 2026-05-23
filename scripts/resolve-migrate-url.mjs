#!/usr/bin/env node
/**
 * Pick a DIRECT_URL for Prisma migrate when db.<ref>.supabase.co is unreachable locally.
 * Production/Vercel: prefer DIRECT_URL. Local fallback: session pooler :5432 on pooler host.
 */
import net from "net";
import {
  cleanDbUrl,
  parseDbTarget,
  sessionPoolerUrlFromDatabaseUrl,
} from "./supabase-db-env.mjs";

/**
 * @param {string} hostname
 * @param {string|number} port
 * @param {number} [timeoutMs]
 */
export function probeTcp(hostname, port, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: hostname, port: Number(port), timeout: timeoutMs }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.setTimeout(timeoutMs, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/** @param {string} url */
export async function probeDatabaseUrl(url) {
  const target = parseDbTarget(url);
  if (!target) return false;
  return probeTcp(target.hostname, target.port);
}

/**
 * @param {Record<string, string>} env
 * @returns {Promise<{ migrateDirectUrl: string, source: string }>}
 */
export async function resolveMigrateDirectUrl(env) {
  const databaseUrl = cleanDbUrl(env.DATABASE_URL);
  const directUrl = cleanDbUrl(env.DIRECT_URL);
  const migrateUrlOverride = cleanDbUrl(env.MIGRATE_URL);

  const candidates = [];

  if (migrateUrlOverride) {
    candidates.push({ url: migrateUrlOverride, source: "MIGRATE_URL" });
  }
  if (directUrl) {
    candidates.push({ url: directUrl, source: "DIRECT_URL (db.<ref>.supabase.co:5432)" });
  }
  const sessionPooler = sessionPoolerUrlFromDatabaseUrl(databaseUrl);
  if (sessionPooler) {
    candidates.push({
      url: sessionPooler,
      source: "Session pooler (aws-*-*.pooler.supabase.com:5432)",
    });
  }

  for (const { url, source } of candidates) {
    const ok = await probeDatabaseUrl(url);
    if (ok) {
      return { migrateDirectUrl: url, source };
    }
    console.warn(`[migrate] Unreachable: ${source} (${parseDbTarget(url)?.hostname ?? "?"})`);
  }

  throw new Error(
    "No reachable database URL for migrations. Check DATABASE_URL / DIRECT_URL, VPN, or set MIGRATE_URL in .env.local to a working Supabase session pooler URL (:5432).",
  );
}
