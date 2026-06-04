import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { authorizeCronRequest, getCronSecret } from "@/lib/mission-hub/cron-auth";

function requestWithAuth(value: string | null): Pick<Request, "headers"> {
  return {
    headers: {
      get: (name: string) => (name.toLowerCase() === "authorization" ? value : null),
    } as Headers,
  };
}

describe("cron auth", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });

  it("reads CRON_SECRET from env", () => {
    expect(getCronSecret()).toBe("test-cron-secret");
  });

  it("rejects missing authorization header", () => {
    const result = authorizeCronRequest(requestWithAuth(null));
    expect(result).toEqual({ authorized: false, reason: "invalid_secret" });
  });

  it("rejects invalid authorization header", () => {
    const result = authorizeCronRequest(requestWithAuth("Bearer wrong"));
    expect(result).toEqual({ authorized: false, reason: "invalid_secret" });
  });

  it("accepts bearer token matching CRON_SECRET", () => {
    const result = authorizeCronRequest(requestWithAuth("Bearer test-cron-secret"));
    expect(result).toEqual({ authorized: true });
  });

  it("rejects when CRON_SECRET is not configured", () => {
    delete process.env.CRON_SECRET;
    const result = authorizeCronRequest(requestWithAuth("Bearer test-cron-secret"));
    expect(result).toEqual({ authorized: false, reason: "missing_config" });
  });
});
