import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_COPY } from "@/data/site-copy-defaults";
import { GET_INVOLVED_NAV, defaultSiteCopyNavLinks } from "@/data/storefront-navigation";
import { siteCopyToBlocks } from "@/lib/site-copy-blocks/encode";
import { blocksToSiteCopy } from "@/lib/site-copy-blocks/resolve";

describe("blocksToSiteCopy navigation", () => {
  it("uses default Get Involved label when legacy blocks predate nav simplification", () => {
    const legacyCopy = structuredClone(DEFAULT_SITE_COPY);
    legacyCopy.navLinks = [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
      { href: "/mission", label: "Mission" },
      { href: "/partner", label: "Partner" },
      { href: "/advocacy-team", label: "Advocacy Team" },
      { href: "/give", label: "Give" },
      { href: "/merch", label: "Merch" },
      { href: "/blog", label: "Blog" },
      { href: "/community", label: "Community" },
      { href: "/contact", label: "Contact" },
    ];
    const legacyBlocks = siteCopyToBlocks(legacyCopy);

    const resolved = blocksToSiteCopy(legacyBlocks);
    const partnerNav = resolved.navLinks.find((l) => l.href === GET_INVOLVED_NAV.labelHref);

    expect(partnerNav?.label).toBe("Get Involved");
    expect(resolved.navLinks.map((l) => l.href)).toEqual(defaultSiteCopyNavLinks().map((l) => l.href));
    expect(resolved.navLinks.some((l) => l.href === "/give")).toBe(false);
    expect(resolved.navLinks.some((l) => l.href === "/advocacy-team")).toBe(false);
  });
});
