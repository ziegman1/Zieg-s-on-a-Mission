import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import {
  extensionForCoverMime,
  isCommunityCoverMimeType,
  validateCommunityCoverFile,
} from "@/lib/community/media-upload";
import { uploadBlogFeaturedImage } from "@/lib/supabase/community-media";
import { assertSupabaseStorageReady } from "@/lib/supabase/config";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const validationError = validateCommunityCoverFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const mimeType = file.type;
  if (!isCommunityCoverMimeType(mimeType)) {
    return NextResponse.json({ error: "Use a JPG, PNG, or WebP image." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    assertSupabaseStorageReady();
    const { url } = await uploadBlogFeaturedImage(buffer, mimeType);
    return NextResponse.json({ url, storage: "supabase" });
  } catch (e) {
    console.warn("[upload-blog-image] Supabase failed, trying Blob:", e);
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const ext = extensionForCoverMime(mimeType);
  const pathname = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      ...(token ? { token } : {}),
    });
    return NextResponse.json({ url: blob.url, storage: "blob" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? message
            : "Could not upload image. Check Supabase Storage or Vercel Blob configuration.",
      },
      { status: 500 },
    );
  }
}
