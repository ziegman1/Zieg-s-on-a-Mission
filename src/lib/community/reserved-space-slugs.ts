/** Slugs that collide with fixed Mission Hub routes — cannot be used as space slugs. */
export const RESERVED_COMMUNITY_SPACE_SLUGS = new Set([
  "login",
  "join",
  "profile",
  "spaces",
  "settings",
  "welcome",
]);

export function isReservedCommunitySpaceSlug(slug: string): boolean {
  return RESERVED_COMMUNITY_SPACE_SLUGS.has(slug.trim().toLowerCase());
}
