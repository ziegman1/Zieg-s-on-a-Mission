/** Mission Hub feed link to a single post (hash anchor). */
export function communityPostAnchorPath(spaceSlug: string, postId: string): string {
  return `/community/${spaceSlug}#post-${postId}`;
}
