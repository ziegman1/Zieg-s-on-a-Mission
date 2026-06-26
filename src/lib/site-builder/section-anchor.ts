import type { PageSection } from "./types";

/** Legacy auto-generated keys (section-0) are not stable hash targets. */
const LEGACY_AUTO_SECTION_KEY = /^section-\d+$/;

/**
 * Storefront header is sticky with min-h-[4.5rem]–min-h-20.
 * Extra margin keeps section titles readable below the nav on hash navigation.
 */
export const SECTION_ANCHOR_SCROLL_CLASS = "scroll-mt-28 md:scroll-mt-32";

/** HTML id for in-page hash links (#story, #where-you-come-in, etc.). */
export function sectionAnchorId(section: Pick<PageSection, "sectionKey">): string | undefined {
  const key = section.sectionKey?.trim();
  if (!key || LEGACY_AUTO_SECTION_KEY.test(key)) return undefined;
  return key;
}

export function sectionAnchorProps(section: Pick<PageSection, "sectionKey">): {
  id?: string;
  className?: string;
} {
  const id = sectionAnchorId(section);
  if (!id) return {};
  return { id, className: SECTION_ANCHOR_SCROLL_CLASS };
}
