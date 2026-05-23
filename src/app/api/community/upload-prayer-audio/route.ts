import { NextResponse } from "next/server";
import {
  extensionForPrayerMediaMime,
  inferPrayerMediaHasVideo,
  isCommunityPrayerMediaMimeType,
  normalizePrayerMediaMime,
  validateCommunityPrayerMediaFile,
} from "@/lib/community/media-upload";
import { assertCanUploadPrayerAudio } from "@/lib/community/prayer-audio-auth";
import { uploadCommunityPrayerAudio } from "@/lib/supabase/community-media";
import { logSupabaseServiceRoleKeyDebug } from "@/lib/supabase/config-server";

export async function POST(request: Request) {
  logSupabaseServiceRoleKeyDebug("upload-prayer-audio");

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const postId = formData.get("postId");
  const spaceSlug = formData.get("spaceSlug");
  const authResult = await assertCanUploadPrayerAudio(
    typeof postId === "string" ? postId : null,
    typeof spaceSlug === "string" ? spaceSlug : null,
  );
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
  }

  const validationError = validateCommunityPrayerMediaFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const mimeType = normalizePrayerMediaMime(file.type, file.name) || "audio/webm";
  if (!isCommunityPrayerMediaMimeType(mimeType)) {
    return NextResponse.json({ error: "Unsupported media type" }, { status: 400 });
  }

  const hasVideo = inferPrayerMediaHasVideo(file);
  const originalFileName = file.name?.trim() || undefined;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, path } = await uploadCommunityPrayerAudio(buffer, mimeType);
    const ext = extensionForPrayerMediaMime(mimeType);
    const filename = originalFileName || `prayer.${ext}`;
    return NextResponse.json({
      url,
      path,
      mimeType,
      filename,
      hasVideo,
      ...(originalFileName ? { originalFileName } : {}),
    });
  } catch (e) {
    console.error("[community/upload-prayer-audio]", e);
    const message = e instanceof Error ? e.message : "Upload failed";
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: isDev ? message : "Could not upload audio. Try again or use a different file format.",
        ...(isDev && e instanceof Error ? { detail: e.message } : {}),
      },
      { status: 500 },
    );
  }
}
