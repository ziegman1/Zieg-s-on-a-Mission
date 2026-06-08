import type { PostShareImageAsset } from "@/lib/community/post-public-share";

/** Download share images for manual Facebook/social posting. */
export async function downloadShareImages(images: PostShareImageAsset[]): Promise<void> {
  for (const image of images) {
    try {
      const response = await fetch(image.url);
      if (!response.ok) throw new Error("fetch failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = image.filename;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(image.url, "_blank", "noopener,noreferrer");
    }
  }
}
