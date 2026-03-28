/**
 * Homepage guided sections — data lives in SiteCopy.homeGuided (admin-editable).
 * Helpers for typing only; pages should use getSiteCopy().
 */

import type { SiteCopy } from "./site-copy-defaults";

export type { HomeGuided, HomeGuidedSectionRow } from "./home-guided-default-sections";

export function guidedSectionsFromCopy(copy: SiteCopy): SiteCopy["homeGuided"]["sections"] {
  return copy.homeGuided.sections;
}
