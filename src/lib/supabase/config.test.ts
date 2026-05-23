import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const VALID_SERVICE_ROLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE5MDAwMDAwMDB9." +
  "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

async function loadConfig() {
  vi.resetModules();
  return import("./config-env");
}

describe("Supabase Storage config", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    process.env = env;
    vi.resetModules();
  });

  it("reports missing project URL and service role", async () => {
    const { getSupabaseStorageConfigProblems, supabaseStorageNotConfiguredMessage } =
      await loadConfig();
    expect(getSupabaseStorageConfigProblems()).toEqual([
      { variable: "NEXT_PUBLIC_SUPABASE_URL", kind: "missing" },
      { variable: "SUPABASE_SERVICE_ROLE_KEY", kind: "missing" },
    ]);
    expect(supabaseStorageNotConfiguredMessage()).toBe(
      "Supabase Storage is not configured. Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.",
    );
  });

  it("reports single missing URL when service role is set", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = VALID_SERVICE_ROLE;
    const { getSupabaseStorageConfigProblems, supabaseStorageNotConfiguredMessage } =
      await loadConfig();
    expect(getSupabaseStorageConfigProblems()).toEqual([
      { variable: "NEXT_PUBLIC_SUPABASE_URL", kind: "missing" },
    ]);
    expect(supabaseStorageNotConfiguredMessage()).toBe(
      "Supabase Storage is not configured. Missing NEXT_PUBLIC_SUPABASE_URL.",
    );
  });

  it("is configured when URL and valid service role JWT are set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://testref.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = VALID_SERVICE_ROLE;
    const { isSupabaseStorageConfigured, getSupabaseStorageConfigProblems } = await loadConfig();
    expect(getSupabaseStorageConfigProblems()).toEqual([]);
    expect(isSupabaseStorageConfigured()).toBe(true);
  });

  it("accepts SUPABASE_URL alias for project URL", async () => {
    process.env.SUPABASE_URL = "https://alias.supabase.co/";
    process.env.SUPABASE_SERVICE_ROLE_KEY = VALID_SERVICE_ROLE;
    const { getSupabaseStorageConfigProblems } = await loadConfig();
    expect(getSupabaseStorageConfigProblems()).toEqual([]);
  });
});
