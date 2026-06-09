import { describe, expect, it } from "vitest";
import { buttonClassesFromStyle } from "@/lib/site-builder/element-style-utils";
import {
  STOREFRONT_BUTTON_GHOST,
  STOREFRONT_BUTTON_PRIMARY,
  STOREFRONT_BUTTON_SECONDARY,
  storefrontButtonClasses,
} from "./storefront-button-styles";

describe("storefrontButtonClasses", () => {
  it("keeps primary button text visible in default and hover classes", () => {
    expect(STOREFRONT_BUTTON_PRIMARY).toContain("text-brand-ink");
    expect(STOREFRONT_BUTTON_PRIMARY).toContain("hover:text-brand-ink");
    expect(STOREFRONT_BUTTON_PRIMARY).not.toContain("text-transparent");
  });

  it("keeps secondary button text visible in all states", () => {
    expect(STOREFRONT_BUTTON_SECONDARY).toContain("text-brand-ink");
    expect(STOREFRONT_BUTTON_SECONDARY).toContain("hover:text-brand-ink");
    expect(STOREFRONT_BUTTON_SECONDARY).toContain("bg-white");
    expect(STOREFRONT_BUTTON_SECONDARY).toContain("hover:bg-brand-primary/10");
  });

  it("keeps ghost button text visible before hover", () => {
    expect(STOREFRONT_BUTTON_GHOST).toContain("text-brand-primary");
    expect(STOREFRONT_BUTTON_GHOST).toContain("hover:text-brand-primary");
  });
});

describe("buttonClassesFromStyle", () => {
  it("defaults to gold primary CTA styling", () => {
    const classes = buttonClassesFromStyle(undefined);
    expect(classes).toContain("bg-brand-accent");
    expect(classes).toContain("text-brand-ink");
  });

  it("maps outline to secondary styling", () => {
    const classes = buttonClassesFromStyle({ buttonVariant: "outline" });
    expect(classes).toContain("border-brand-primary/50");
    expect(classes).toContain("text-brand-ink");
  });

  it("maps default variant to brand blue fill with white text", () => {
    const classes = buttonClassesFromStyle({ buttonVariant: "default" });
    expect(classes).toContain("bg-brand-primary");
    expect(classes).toContain("text-white");
  });

  it("respects button size", () => {
    expect(storefrontButtonClasses("primary", "sm")).toContain("h-9");
  });
});
