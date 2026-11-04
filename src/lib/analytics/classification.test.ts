import { describe, expect, it } from "vitest";
import {
  classifySession,
  classifyUserAgent,
  effectiveTrafficClass,
  engagementSignalFamilies,
} from "./classification";

describe("classifyUserAgent", () => {
  it("marks known crawlers as likely_bot", () => {
    const r = classifyUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)");
    expect(r.trafficClass).toBe("likely_bot");
    expect(r.uaCategory).toBe("bot");
    expect(r.signals.some((s) => s.includes("googlebot"))).toBe(true);
  });

  it("marks automation tools as likely_bot", () => {
    const r = classifyUserAgent("Playwright/1.40");
    expect(r.trafficClass).toBe("likely_bot");
    expect(r.uaCategory).toBe("automation");
  });

  it("treats missing UA as unverified, not bot", () => {
    expect(classifyUserAgent(null).trafficClass).toBe("unverified");
    expect(classifyUserAgent("").uaCategory).toBe("unknown");
  });

  it("never classifies browser-looking UA alone as human", () => {
    const r = classifyUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    expect(r.uaCategory).toBe("browser");
    expect(r.trafficClass).toBe("unverified");
  });
});

describe("classifySession", () => {
  const browserUa = classifyUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  );

  it("requires multiple engagement families for likely_human", () => {
    const weak = classifySession({
      ua: browserUa,
      engagement: {
        maxScrollDepth: 50,
        activeMs: 0,
        hasInternalNav: false,
        hasCtaClick: false,
        signalCodes: [],
      },
      sessionAgeMs: 60_000,
      engagementSpanMs: 30_000,
    });
    expect(weak.trafficClass).toBe("unverified");

    const strong = classifySession({
      ua: browserUa,
      engagement: {
        maxScrollDepth: 50,
        activeMs: 20_000,
        hasInternalNav: false,
        hasCtaClick: false,
        signalCodes: [],
      },
      sessionAgeMs: 60_000,
      engagementSpanMs: 30_000,
    });
    expect(strong.trafficClass).toBe("likely_human");
    expect(strong.classSource).toBe("combined");
  });

  it("does not elevate with zero engagement even when session is old", () => {
    const idle = classifySession({
      ua: browserUa,
      engagement: {
        maxScrollDepth: 0,
        activeMs: 0,
        hasInternalNav: false,
        hasCtaClick: false,
        signalCodes: [],
      },
      sessionAgeMs: 120_000,
      engagementSpanMs: 60_000,
    });
    expect(idle.trafficClass).toBe("unverified");
  });

  it("rejects single-request spoof bundles without timing evidence", () => {
    const spoofed = classifySession({
      ua: browserUa,
      engagement: {
        maxScrollDepth: 100,
        activeMs: 60_000,
        hasInternalNav: true,
        hasCtaClick: true,
        signalCodes: [],
      },
      sessionAgeMs: 50,
      engagementSpanMs: 0,
    });
    expect(spoofed.trafficClass).toBe("unverified");
    expect(spoofed.signals).toContain("eng:timing_insufficient");
  });

  it("keeps known bots as likely_bot even with engagement", () => {
    const bot = classifyUserAgent("Googlebot/2.1");
    const r = classifySession({
      ua: bot,
      engagement: {
        maxScrollDepth: 100,
        activeMs: 60_000,
        hasInternalNav: true,
        hasCtaClick: true,
        signalCodes: [],
      },
      sessionAgeMs: 60_000,
      engagementSpanMs: 30_000,
    });
    expect(r.trafficClass).toBe("likely_bot");
  });

  it("treats historical null classification as unverified", () => {
    expect(effectiveTrafficClass(null)).toBe("unverified");
    expect(effectiveTrafficClass(undefined)).toBe("unverified");
    expect(effectiveTrafficClass("likely_human")).toBe("likely_human");
  });
});

describe("engagementSignalFamilies", () => {
  it("treats scroll-only as a single family", () => {
    expect(
      engagementSignalFamilies({
        maxScrollDepth: 75,
        activeMs: 0,
        hasInternalNav: false,
        hasCtaClick: false,
        signalCodes: [],
      }),
    ).toEqual(["eng:scroll50"]);
  });
});
