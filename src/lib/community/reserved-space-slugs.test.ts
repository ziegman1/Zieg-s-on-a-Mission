import { describe, expect, it } from "vitest";
import {
  isReservedCommunitySpaceSlug,
  RESERVED_COMMUNITY_SPACE_SLUGS,
} from "./reserved-space-slugs";

describe("reserved community space slugs", () => {
  it("blocks fixed Mission Hub routes", () => {
    for (const slug of RESERVED_COMMUNITY_SPACE_SLUGS) {
      expect(isReservedCommunitySpaceSlug(slug)).toBe(true);
    }
    expect(isReservedCommunitySpaceSlug("SPACES")).toBe(true);
    expect(isReservedCommunitySpaceSlug("my-test-space")).toBe(false);
  });
});
