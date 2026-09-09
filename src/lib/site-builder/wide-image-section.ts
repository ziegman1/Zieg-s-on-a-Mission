import type { PageSection } from "./types";

/**
 * Which image_text_split sections show their image whole instead of cropped to fill the column.
 *
 * The default treatment stretches the image to match the text column's height and crops with
 * object-cover, which suits a photograph but destroys a composed graphic. `guided-partner` carries
 * the wide Mobilize / Train / Send artwork, whose three stages span the full width — cropping it
 * cuts off Mobilize and Send entirely.
 *
 * Identification is by section key, which is unique per page (`@@unique([pageKey, sectionKey])`),
 * so it survives reordering and relabelling. Setting `settings.wideImage` on a section overrides
 * the list in either direction, so the treatment can be moved or switched off with no code change.
 */
export const WIDE_IMAGE_SECTION_KEYS = ["guided-partner"];

export const WIDE_IMAGE_SETTING = "wideImage";

export function usesWideImage(section: PageSection): boolean {
  const optIn = section.settings?.[WIDE_IMAGE_SETTING];
  if (typeof optIn === "boolean") return optIn;

  return WIDE_IMAGE_SECTION_KEYS.includes(section.sectionKey);
}
