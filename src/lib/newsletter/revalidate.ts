import { revalidatePath } from "next/cache";

export function revalidateNewsletterPaths(slug?: string) {
  revalidatePath("/newsletters", "page");
  if (slug?.trim()) {
    revalidatePath(`/newsletters/${slug.trim()}`, "page");
  }
}
