import { describe, expect, it } from "vitest";
import {
  ABOUT_MISSION_NAV,
  HEADER_NAV_AFTER_GET_INVOLVED,
  HEADER_NAV_BEFORE_GET_INVOLVED,
  STOREFRONT_FOOTER_NAV,
  STOREFRONT_HEADER_NAV,
  defaultSiteCopyNavLinks,
} from "./storefront-navigation";

describe("storefront navigation", () => {
  it("uses a single About & Mission link in the header", () => {
    const hrefs = STOREFRONT_HEADER_NAV.map((l) => l.href);
    expect(hrefs).toEqual(["/", "/about", "/community", "/blog", "/contact"]);
    expect(hrefs).not.toContain("/mission");
    expect(STOREFRONT_HEADER_NAV.find((l) => l.href === "/about")?.label).toBe(
      ABOUT_MISSION_NAV.label,
    );
  });

  it("places Get Involved between About & Mission and Community", () => {
    const before = STOREFRONT_HEADER_NAV.filter((l) =>
      (HEADER_NAV_BEFORE_GET_INVOLVED as readonly string[]).includes(l.href),
    );
    const after = STOREFRONT_HEADER_NAV.filter((l) =>
      (HEADER_NAV_AFTER_GET_INVOLVED as readonly string[]).includes(l.href),
    );
    expect(before.map((l) => l.href)).toEqual(["/", "/about"]);
    expect(after.map((l) => l.href)).toEqual(["/community", "/blog", "/contact"]);
  });

  it("uses About & Mission in footer and site-copy defaults without a separate Mission link", () => {
    expect(STOREFRONT_FOOTER_NAV.some((l) => l.href === "/mission")).toBe(false);
    expect(STOREFRONT_FOOTER_NAV.find((l) => l.href === "/about")?.label).toBe(
      ABOUT_MISSION_NAV.label,
    );
    expect(defaultSiteCopyNavLinks().some((l) => l.href === "/mission")).toBe(false);
    expect(defaultSiteCopyNavLinks().find((l) => l.href === "/about")?.label).toBe(
      ABOUT_MISSION_NAV.label,
    );
  });
});
