import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { clearClientSession, touchClientSession } from "./session-id";
import { SESSION_STORAGE_KEY } from "./constants";

describe("sessionStorage consent restrictions", () => {
  it("touchClientSession skips writes when device storage is disallowed", () => {
    const store = new Map<string, string>();
    const sessionStorageMock = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    };
    // Minimal window for session-id helpers
    (globalThis as unknown as { window: unknown }).window = globalThis;
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: sessionStorageMock,
    });

    expect(touchClientSession(Date.now(), { allowDeviceStorage: false })).toBeNull();
    expect(store.has(SESSION_STORAGE_KEY)).toBe(false);

    const created = touchClientSession(Date.now(), { allowDeviceStorage: true });
    expect(created?.id).toBeTruthy();
    expect(store.has(SESSION_STORAGE_KEY)).toBe(true);

    clearClientSession();
    expect(store.has(SESSION_STORAGE_KEY)).toBe(false);
  });

  it("client and tracker gate collection before sessionStorage and events", () => {
    const client = readFileSync(resolve(process.cwd(), "src/lib/analytics/client.ts"), "utf8");
    const tracker = readFileSync(
      resolve(process.cwd(), "src/components/page-view-tracker.tsx"),
      "utf8",
    );
    const ingest = readFileSync(resolve(process.cwd(), "src/lib/analytics/ingest.ts"), "utf8");
    expect(client).toContain("isAnalyticsCollectionAllowed");
    expect(client).toContain("isAnalyticsPrivacyStatusLoaded");
    expect(tracker).toContain("allowDeviceStorage: false");
    expect(tracker).toContain("collectionAllowed");
    expect(ingest).toContain("decideAnalyticsPrivacy");
    expect(ingest).toContain("collectionAllowed");
  });
});
