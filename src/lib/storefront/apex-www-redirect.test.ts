import { describe, expect, it } from "vitest";
import {
  buildWwwRedirectUrl,
  getApexHostname,
  getWwwHostname,
  isCronApiPath,
  shouldBypassApexToWwwRedirect,
  shouldRedirectApexToWww,
} from "./apex-www-redirect";

describe("apex-www-redirect", () => {
  it("uses configured apex and www hostnames", () => {
    expect(getApexHostname()).toBe("ziegsonamission.com");
    expect(getWwwHostname()).toBe("www.ziegsonamission.com");
  });

  it("identifies cron API paths", () => {
    expect(isCronApiPath("/api/cron/mission-hub-weekly-digest")).toBe(true);
    expect(isCronApiPath("/api/cron")).toBe(true);
    expect(isCronApiPath("/api/cron/")).toBe(true);
    expect(isCronApiPath("/api/checkout")).toBe(false);
    expect(isCronApiPath("/community")).toBe(false);
  });

  it("bypasses apex-to-www redirect for cron paths", () => {
    expect(shouldBypassApexToWwwRedirect("/api/cron/mission-hub-weekly-digest")).toBe(
      true,
    );
  });

  it("redirects apex public paths to www", () => {
    expect(shouldRedirectApexToWww("ziegsonamission.com", "/")).toBe(true);
    expect(shouldRedirectApexToWww("ziegsonamission.com", "/newsletters")).toBe(true);
    expect(shouldRedirectApexToWww("ziegsonamission.com:443", "/give")).toBe(true);
  });

  it("does not redirect cron paths on apex", () => {
    expect(
      shouldRedirectApexToWww(
        "ziegsonamission.com",
        "/api/cron/mission-hub-weekly-digest",
      ),
    ).toBe(false);
  });

  it("does not redirect www, localhost, or preview hosts", () => {
    expect(shouldRedirectApexToWww("www.ziegsonamission.com", "/")).toBe(false);
    expect(shouldRedirectApexToWww("localhost:3000", "/")).toBe(false);
    expect(
      shouldRedirectApexToWww("zieg-s-on-a-mission-lz9l.vercel.app", "/"),
    ).toBe(false);
  });

  it("builds www redirect URL preserving path and query", () => {
    const destination = buildWwwRedirectUrl(
      new URL("https://ziegsonamission.com/newsletters?ref=1"),
    );
    expect(destination.toString()).toBe("https://www.ziegsonamission.com/newsletters?ref=1");
  });
});
