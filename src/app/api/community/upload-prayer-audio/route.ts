import { NextResponse } from "next/server";
import {
  extensionForPrayerAudioMime,
  isCommunityPrayerAudioMimeType,
  validateCommunityPrayerAudioFile,
} from "@/lib/community/media-upload";
import { assertCanUploadPrayerAudio } from "@/lib/community/prayer-audio-auth";
import { uploadCommunityPrayerAudio } from "@/lib/supabase/community-media";
import { logSupabaseServiceRoleKeyDebug } from "@/lib/supabase/config";

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

  const validationError = validateCommunityPrayerAudioFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const mimeType = file.type || "audio/webm";
  if (!isCommunityPrayerAudioMimeType(mimeType)) {
    return NextResponse.json({ error: "Unsupported audio type" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, path } = await uploadCommunityPrayerAudio(buffer, mimeType);
    const ext = extensionForPrayerAudioMime(mimeType);
    const filename = file.name?.trim() || `voice-prayer.${ext}`;
    return NextResponse.json({
      url,
      path,
      mimeType,
      filename,
    });
  } catch (e) {
    console.error("[community/upload-prayer-audio]", e);
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
