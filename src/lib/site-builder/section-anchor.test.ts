import { describe, expect, it } from "vitest";
import {
  SECTION_ANCHOR_SCROLL_CLASS,
  sectionAnchorId,
  sectionAnchorProps,
} from "./section-anchor";
import type { PageSection } from "./types";

function section(sectionKey: string): Pick<PageSection, "sectionKey"> {
  return { sectionKey };
}

describe("sectionAnchorId", () => {
  it("uses sectionKey as the hash target", () => {
    expect(sectionAnchorId(section("story"))).toBe("story");
    expect(sectionAnchorId(section("where-you-come-in"))).toBe("where-you-come-in");
  });

  it("skips legacy auto-generated section keys", () => {
    expect(sectionAnchorId(section("section-0"))).toBeUndefined();
    expect(sectionAnchorId(section("section-1"))).toBeUndefined();
  });
});

describe("sectionAnchorProps", () => {
  it("adds scroll margin for anchored sections", () => {
    expect(sectionAnchorProps(section("story"))).toEqual({
      id: "story",
      className: SECTION_ANCHOR_SCROLL_CLASS,
    });
  });

  it("returns empty props when no anchor id", () => {
    expect(sectionAnchorProps(section("section-0"))).toEqual({});
  });
});
