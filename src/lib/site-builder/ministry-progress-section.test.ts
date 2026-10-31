import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import {
  hasMinistryProgressOptIn,
  MINISTRY_PROGRESS_SECTION_KEY,
  MINISTRY_PROGRESS_SETTING,
  resolveMinistryProgressSectionKey,
} from "./ministry-progress-section";
import type { PageSection } from "./types";

function section(
  sectionKey: string,
  overrides: Partial<PageSection> = {},
): PageSection {
  return {
    id: `id-${sectionKey}`,
    pageKey: "home",
    sectionKey,
    sectionType: "image_text_split",
    label: sectionKey,
    visible: true,
    sortOrder: 0,
    content: {},
    settings: {},
    ...overrides,
  };
}

/** Mirrors the live homepage: the "BECOME PART OF THE 300" copy sits on guided-merch. */
const HOME_SECTIONS: PageSection[] = [
  section("hero", { sectionType: "hero" }),
  section("mission-counter", { sectionType: "mission_counter" }),
  section("guided-mission"),
  section("scroll-break", { sectionType: "text_section" }),
  section("guided-partner"),
  section("guided-give"),
  section("guided-merch"),
  section("guided-blog"),
];

describe("section identification", () => {
  it("targets the section carrying the BECOME PART OF THE 300 copy", () => {
    expect(MINISTRY_PROGRESS_SECTION_KEY).toBe("guided-merch");
    expect(resolveMinistryProgressSectionKey(HOME_SECTIONS)).toBe("guided-merch");
  });

  it("is unaffected by reordering, since it never uses position", () => {
    const reordered = [...HOME_SECTIONS].reverse();

    expect(resolveMinistryProgressSectionKey(reordered)).toBe("guided-merch");
  });

  it("is unaffected by other sections being added or removed", () => {
    const withExtras = [
      section("brand-new-section"),
      ...HOME_SECTIONS,
      section("another-one"),
    ];

    expect(resolveMinistryProgressSectionKey(withExtras)).toBe("guided-merch");
  });

  it("is unaffected by a relabelled section", () => {
    const relabelled = HOME_SECTIONS.map((s) =>
      s.sectionKey === "guided-merch" ? { ...s, label: "Become part of the 300" } : s,
    );

    expect(resolveMinistryProgressSectionKey(relabelled)).toBe("guided-merch");
  });

  it("returns null when the section is absent, so nothing renders by accident", () => {
    const without = HOME_SECTIONS.filter((s) => s.sectionKey !== "guided-merch");

    expect(resolveMinistryProgressSectionKey(without)).toBeNull();
  });

  it("returns null for an empty page", () => {
    expect(resolveMinistryProgressSectionKey([])).toBeNull();
  });
});

describe("explicit opt-in override", () => {
  it("honors a section that opts in via settings", () => {
    const moved = HOME_SECTIONS.map((s) =>
      s.sectionKey === "guided-partner"
        ? { ...s, settings: { [MINISTRY_PROGRESS_SETTING]: true } }
        : s,
    );

    expect(resolveMinistryProgressSectionKey(moved)).toBe("guided-partner");
  });

  it("lets the opt-in win over the fallback key, so the tracker never renders twice", () => {
    const moved = HOME_SECTIONS.map((s) =>
      s.sectionKey === "guided-give"
        ? { ...s, settings: { ministryProgressTracker: true } }
        : s,
    );

    const resolved = resolveMinistryProgressSectionKey(moved);
    expect(resolved).toBe("guided-give");
    expect(resolved).not.toBe(MINISTRY_PROGRESS_SECTION_KEY);
  });

  it("ignores a non-true settings value", () => {
    const notOptedIn = section("guided-blog", {
      settings: { ministryProgressTracker: "yes" },
    });

    expect(hasMinistryProgressOptIn(notOptedIn)).toBe(false);
  });

  it("treats a missing settings object as no opt-in", () => {
    expect(hasMinistryProgressOptIn(section("guided-blog"))).toBe(false);
  });
});

describe("homepage wiring", () => {
  const rendererPath = resolve(
    process.cwd(),
    "src/components/site-builder/page-sections-renderer.tsx",
  );
  const splitPath = resolve(
    process.cwd(),
    "src/components/site-builder/sections/image-text-split-section.tsx",
  );
  const renderer = readFileSync(rendererPath, "utf8");
  const split = readFileSync(splitPath, "utf8");

  it("selects the tracker section by stable key, not by index", () => {
    expect(renderer).toContain("resolveMinistryProgressSectionKey");
    expect(renderer).toContain("section.sectionKey === progressSectionKey");
  });

  it("keeps the existing empty-column placeholder when no counts are supplied", () => {
    expect(split).toContain('<div className="hidden md:block md:col-span-1 min-h-[5rem]" aria-hidden />');
  });

  it("leaves the image column behavior intact", () => {
    // An uploaded image still wins over the tracker.
    expect(split).toContain("const visualColumn = imgUrl ? (");
  });

  it("still renders every other homepage section type", () => {
    for (const type of ["hero", "mission_counter", "text_section", "card_grid", "cta"]) {
      expect(renderer).toContain(`case "${type}":`);
    }
  });
});

describe("public tracker accessibility and privacy", () => {
  const trackerPath = resolve(
    process.cwd(),
    "src/components/mission/ministry-progress-tracker.tsx",
  );
  const tracker = readFileSync(trackerPath, "utf8");

  it("uses progressbar semantics on the Sent meter", () => {
    expect(tracker).toContain('role="progressbar"');
    expect(tracker).toContain("aria-valuemin={0}");
    expect(tracker).toContain("aria-valuemax={RECRUIT_SENT_GOAL}");
    expect(tracker).toContain("aria-valuenow={sent}");
  });

  it("labels each milestone in text rather than by color alone", () => {
    expect(tracker).toContain('label="Mobilized"');
    expect(tracker).toContain('trainedLabel = "Trained"');
    expect(tracker).toContain("label={trainedLabel}");
    expect(tracker).toContain('label="Sent"');
  });

  it("receives aggregate counts only", () => {
    expect(tracker).toContain("counts: PublicProgressCounts");
    expect(tracker).not.toMatch(/\bname\b/);
  });

  it("keeps the milestone counts unlabeled and speaks of workers", () => {
    expect(tracker).not.toContain("Answered the call");
    expect(tracker).not.toContain("Training complete");
    expect(tracker).not.toContain("Fully funded");
    expect(tracker).toContain("more workers");
    expect(tracker).not.toContain("missionaries");
  });

  it("does not link to the impact page until that page exists", () => {
    const pageExists = existsSync(resolve(process.cwd(), "src/app/our-impact/page.tsx"));
    expect(pageExists).toBe(false);
    expect(tracker).not.toContain('href="/our-impact"');
    expect(tracker).not.toContain("How We Track Our Impact");
  });
});
