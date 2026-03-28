/**
 * Shop display config: featured overrides, filters, etc.
 * Slug substrings that match are treated as featured (for products not already featured in DB).
 */
export const featuredProductSlugPatterns: string[] = [
  "ziegs-on-a-mission",
  "team-expansion",
  "polo",
];

export function isFeaturedByConfig(slug: string): boolean {
  const lower = slug.toLowerCase();
  return featuredProductSlugPatterns.some((p) => lower.includes(p));
}
