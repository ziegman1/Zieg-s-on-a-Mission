import { revalidatePath } from "next/cache";

export function revalidateBlogPaths(slug?: string) {
  revalidatePath("/blog", "page");
  if (slug?.trim()) {
    revalidatePath(`/blog/${slug.trim()}`, "page");
  }
}
