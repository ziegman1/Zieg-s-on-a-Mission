import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  isCommunityCoverMimeType,
  validateCommunityCoverFile,
} from "@/lib/community/media-upload";
import {
  formatNewsletterUploadErrorBody,
  storageConfigErrorBody,
  UNAUTHORIZED_UPLOAD_MESSAGE,
} from "@/lib/newsletter/newsletter-upload-errors";
import {
  NEWSLETTER_IMAGE_PURPOSES,
  type NewsletterImagePurpose,
} from "@/lib/newsletter/storage-paths";
import { uploadNewsletterAsset } from "@/lib/supabase/newsletter-media";
import { getSupabaseStorageConfigProblems } from "@/lib/supabase/config-env";
import { logSupabaseServiceRoleKeyDebug } from "@/lib/supabase/config-server";

export const runtime = "nodejs";

function parsePurpose(value: FormDataEntryValue | null): NewsletterImagePurpose {
  if (typeof value === "string" && (NEWSLETTER_IMAGE_PURPOSES as readonly string[]).includes(value)) {
    return value as NewsletterImagePurpose;
  }
  return "block";
}

function parseNewsletterId(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const id = value.trim();
  return id.length > 0 ? id : undefined;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: UNAUTHORIZED_UPLOAD_MESSAGE }, { status: 401 });
  }

  logSupabaseServiceRoleKeyDebug("upload-newsletter-image");

  if (getSupabaseStorageConfigProblems().length > 0) {
    return NextResponse.json(storageConfigErrorBody(), { status: 503 });
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

  const purpose = parsePurpose(formData.get("purpose"));
  const newsletterId = parseNewsletterId(formData.get("newsletterId"));

  const validationError = validateCommunityCoverFile(file);
  if (validationError) {
    const error =
      validationError.includes("5 MB") ? "Image exceeds size limit." : validationError;
    return NextResponse.json({ error }, { status: 400 });
  }

  const mimeType = file.type;
  if (!isCommunityCoverMimeType(mimeType)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, path } = await uploadNewsletterAsset(buffer, mimeType, purpose, {
      newsletterId,
    });
    return NextResponse.json({ url, path, storage: "supabase", purpose });
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    const body = formatNewsletterUploadErrorBody(raw, "image");
    console.error("[upload-newsletter-image] failed", {
      ...body,
      stack: e instanceof Error ? e.stack : undefined,
    });
    return NextResponse.json(body, { status: 500 });
  }
}
