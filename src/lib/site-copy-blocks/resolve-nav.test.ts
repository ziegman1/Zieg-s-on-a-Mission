import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_COPY } from "@/data/site-copy-defaults";
import { siteCopyToBlocks } from "@/lib/site-copy-blocks/encode";
import { blocksToSiteCopy } from "@/lib/site-copy-blocks/resolve";

describe("blocksToSiteCopy navigation", () => {
  it("includes a new default nav link when saved blocks use old indices", () => {
    const legacyCopy = structuredClone(DEFAULT_SITE_COPY);
    legacyCopy.navLinks = legacyCopy.navLinks.filter((l) => l.href !== "/advocacy-team");
    const legacyBlocks = siteCopyToBlocks(legacyCopy);

    const resolved = blocksToSiteCopy(legacyBlocks);
    const hrefs = resolved.navLinks.map((l) => l.href);

    expect(hrefs).toContain("/advocacy-team");
    expect(resolved.navLinks.find((l) => l.href === "/advocacy-team")?.label).toBe("Advocacy Team");
    expect(hrefs.indexOf("/advocacy-team")).toBe(hrefs.indexOf("/partner") + 1);
    expect(resolved.navLinks.filter((l) => l.href === "/contact")).toHaveLength(1);
  });
});
