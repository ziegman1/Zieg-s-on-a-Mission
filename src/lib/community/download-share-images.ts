import type { PostShareImageAsset } from "@/lib/community/post-public-share";

async function fetchShareImageBlob(image: PostShareImageAsset): Promise<Blob | null> {
  try {
    const response = await fetch(image.url);
    if (!response.ok) throw new Error("fetch failed");
    return await response.blob();
  } catch {
    return null;
  }
}

/** Download a single share image for manual Facebook/social posting. */
export async function downloadShareImage(image: PostShareImageAsset): Promise<void> {
  const blob = await fetchShareImageBlob(image);
  if (!blob) {
    window.open(image.url, "_blank", "noopener,noreferrer");
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = image.filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

/** Download share images for manual Facebook/social posting. */
export async function downloadShareImages(images: PostShareImageAsset[]): Promise<void> {
  for (const image of images) {
    await downloadShareImage(image);
  }
}
