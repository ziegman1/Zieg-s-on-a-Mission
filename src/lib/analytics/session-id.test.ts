import { describe, expect, it } from "vitest";
import {
  SESSION_INACTIVITY_MS,
  SESSION_MAX_LIFETIME_MS,
} from "./constants";
import { isSessionExpired, isValidSessionId, touchClientSession } from "./session-id";

describe("session id", () => {
  it("validates UUID shape", () => {
    expect(isValidSessionId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isValidSessionId("not-a-uuid")).toBe(false);
    expect(isValidSessionId(null)).toBe(false);
  });

  it("returns null without writing when device storage is disallowed", () => {
    expect(touchClientSession(Date.now(), { allowDeviceStorage: false })).toBeNull();
  });

  it("expires on inactivity and max lifetime", () => {
    const createdAt = 1_000_000;
    expect(
      isSessionExpired(
        { id: "550e8400-e29b-41d4-a716-446655440000", createdAt, lastActivityAt: createdAt },
        createdAt + SESSION_INACTIVITY_MS + 1,
      ),
    ).toBe(true);
    expect(
      isSessionExpired(
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          createdAt,
          lastActivityAt: createdAt + SESSION_MAX_LIFETIME_MS - 1,
        },
        createdAt + SESSION_MAX_LIFETIME_MS + 1,
      ),
    ).toBe(true);
    expect(
      isSessionExpired(
        { id: "550e8400-e29b-41d4-a716-446655440000", createdAt, lastActivityAt: createdAt },
        createdAt + 60_000,
      ),
    ).toBe(false);
  });
});
