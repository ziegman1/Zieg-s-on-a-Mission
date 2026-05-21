import { NextResponse } from "next/server";
import { getCurrentCommunityOwner } from "@/lib/community/owner";
import {
  isCommunityCoverMimeType,
  validateCommunityCoverFile,
} from "@/lib/community/media-upload";
import {
  uploadCommunityPostCover,
  uploadCommunitySpaceCover,
} from "@/lib/supabase/community-media";
import {
  getSupabaseProjectUrl,
  getSupabaseServiceRoleKeyIssue,
  isSupabaseStorageConfigured,
  logSupabaseServiceRoleKeyDebug,
  supabaseServiceRoleKeyErrorMessage,
} from "@/lib/supabase/config";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const owner = await getCurrentCommunityOwner();
  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logSupabaseServiceRoleKeyDebug("upload-cover");

  if (!getSupabaseProjectUrl()) {
    return NextResponse.json(
      {
        error:
          "NEXT_PUBLIC_SUPABASE_URL is missing. Set your Supabase project URL in .env.local (see docs/supabase-community-media.md).",
      },
      { status: 503 },
    );
  }

  const keyIssue = getSupabaseServiceRoleKeyIssue();
  if (keyIssue) {
    return NextResponse.json(
      { error: supabaseServiceRoleKeyErrorMessage(keyIssue) },
      { status: 503 },
    );
  }

  if (!isSupabaseStorageConfigured()) {
    return NextResponse.json(
      {
        error:
          "Supabase Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const validationError = validateCommunityCoverFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  if (!isCommunityCoverMimeType(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, or WebP image." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const kind = new URL(req.url).searchParams.get("kind");
    const { url, path } =
      kind === "space"
        ? await uploadCommunitySpaceCover(buffer, file.type)
        : await uploadCommunityPostCover(buffer, file.type);
    return NextResponse.json({ url, path });
  } catch (e) {
    console.error("[community/upload-cover]", e);
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
