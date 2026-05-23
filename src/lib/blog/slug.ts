/** URL-safe slug from a blog title. */
export function slugifyTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[''']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
  return base || "post";
}

/** Ensure slug is unique by appending -2, -3, … */
export async function ensureUniqueBlogSlug(
  baseSlug: string,
  exists: (slug: string, excludeId?: string) => Promise<boolean>,
  excludeId?: string,
): Promise<string> {
  const root = baseSlug.trim() || "post";
  if (!(await exists(root, excludeId))) return root;
  for (let n = 2; n < 500; n++) {
    const candidate = `${root}-${n}`;
    if (!(await exists(candidate, excludeId))) return candidate;
  }
  return `${root}-${Date.now()}`;
}
