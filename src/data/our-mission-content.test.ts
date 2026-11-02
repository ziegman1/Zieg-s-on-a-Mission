import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  OUR_MISSION_AVENUES,
  OUR_MISSION_BEYOND,
  OUR_MISSION_CTAS,
  OUR_MISSION_FUNCTIONS,
  OUR_MISSION_HERO,
  OUR_MISSION_MEASUREMENT,
} from "./our-mission-content";

function avenue(id: string) {
  const found = OUR_MISSION_AVENUES.find((item) => item.id === id);
  if (!found) throw new Error(id);
  return found;
}

function sentText(id: string, trackTitle?: string) {
  const track = avenue(id).tracks.find((item) => item.title === (trackTitle ?? null));
  return track?.qualifications.find((item) => item.label === "Sent")?.text ?? "";
}

describe("our mission framework", () => {
  it("states the vision and keeps commissioning from becoming a fourth milestone", () => {
    expect(OUR_MISSION_HERO.title).toBe("MOBILIZE. TRAIN. SEND.");
    expect(OUR_MISSION_HERO.paragraphs[0]).toContain("300 more workers by August 31, 2031");
    expect(OUR_MISSION_FUNCTIONS.map((item) => item.title)).toEqual([
      "Mobilize",
      "Train & Equip",
      "Send",
    ]);
    expect(OUR_MISSION_BEYOND.paragraphs.join(" ")).toContain(
      "not a requirement for reaching the Sent milestone",
    );
    expect(OUR_MISSION_BEYOND.paragraphs.join(" ")).not.toMatch(/fourth milestone/i);
  });

  it("keeps avenue qualifications distinct", () => {
    expect(sentText("jonathan-training")).toBe("Participates in the concluding commissioning.");
    expect(sentText("team-expansion")).toContain("100% of the required financial support goal");
    expect(sentText("team-expansion")).toContain("100% of the prayer partner goal");
    expect(sentText("team-expansion")).toContain("Support Raising Journey");
    expect(sentText("national-partners", "Jonathan / Four Fields Training")).toBe(
      "Participates in the concluding commissioning.",
    );
    const medical = avenue("national-partners").tracks.find((item) => item.title === "Medical Training");
    expect(medical?.qualifications.map((item) => item.text).join(" ")).not.toContain(
      "three-month",
    );
    expect(sentText("national-partners", "Medical Training")).toContain(
      "graduation, which serves as commissioning and sending",
    );
  });

  it("explains cumulative public counting without naming people or places", () => {
    expect(OUR_MISSION_MEASUREMENT.points.join(" ")).toContain("counted once");
    expect(OUR_MISSION_MEASUREMENT.points.join(" ")).toContain("not named");
    expect(OUR_MISSION_MEASUREMENT.points.join(" ")).toContain("does not necessarily mean");
    expect(JSON.stringify(OUR_MISSION_AVENUES)).not.toMatch(/\b(email|database|ministry_people)\b/i);
  });

  it("uses existing destinations and the canonical tracker", () => {
    expect(OUR_MISSION_CTAS.map((cta) => cta.href)).toEqual(["/partner", "/contact"]);
    const page = readFileSync(
      resolve(process.cwd(), "src/app/(storefront)/our-mission/page.tsx"),
      "utf8",
    );
    const view = readFileSync(
      resolve(process.cwd(), "src/components/mission/our-mission-editable-sections.tsx"),
      "utf8",
    );
    expect(page).toContain("loadPublicMinistryProgressCounts");
    expect(page).toContain("getPublishedPageSections");
    expect(page).toContain('export const dynamic = "force-dynamic"');
    expect(page).not.toContain("getRecruitCounts");
    expect(page).not.toContain("mobilized: 0");
    expect(view).toContain("trainedLabel={trainedLabel}");
    expect(view).toContain("Progress totals are temporarily unavailable.");
    expect(view).toContain("intentionally not EditableElements");
    expect(view).not.toContain("/our-impact");
    expect(view).not.toContain("Protected");
    expect(view).not.toContain("read-only");
  });
});
