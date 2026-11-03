import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("ministry CTA wiring", () => {
  it("marks Partner With Us with partner_with_us_click", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/components/ministry-funding/ministry-funding-editable-sections.tsx"),
      "utf8",
    );
    expect(src).toContain('analyticsEvent="partner_with_us_click"');
  });

  it("tracks external giving clicks from GivingLink", () => {
    const src = readFileSync(resolve(process.cwd(), "src/components/giving-link.tsx"), "utf8");
    expect(src).toContain("external_giving_link_click");
    expect(src).toContain("mission_hub_entry_click");
    expect(src).toContain("mission_hub_join_click");
  });

  it("documents deferred server-confirmed conversions", () => {
    const ingest = readFileSync(resolve(process.cwd(), "src/lib/analytics/ingest.ts"), "utf8");
    expect(ingest).toContain("newsletter_signup_complete");
    expect(ingest).toContain("contact_submission_complete");
    expect(ingest).toMatch(/newsletter_signup_complete[\s\S]*continue/);
  });
});
