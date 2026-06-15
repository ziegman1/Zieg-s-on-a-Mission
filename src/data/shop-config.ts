/**
 * Shop display config: featured overrides, filters, etc.
 * Slug substrings that match are treated as featured (for products not already featured in DB).
 */

/** Set false to hide cart UI while the merch storefront is paused. */
export const MERCH_STORE_ENABLED = false;

export const featuredProductSlugPatterns: string[] = [
  "ziegs-on-a-mission",
  "team-expansion",
  "polo",
];

export function isFeaturedByConfig(slug: string): boolean {
  const lower = slug.toLowerCase();
  return featuredProductSlugPatterns.some((p) => lower.includes(p));
}
