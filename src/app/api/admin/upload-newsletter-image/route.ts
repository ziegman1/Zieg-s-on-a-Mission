import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  isCommunityCoverMimeType,
  validateCommunityCoverFile,
} from "@/lib/community/media-upload";
import {
  NEWSLETTER_IMAGE_PURPOSES,
  type NewsletterImagePurpose,
} from "@/lib/newsletter/storage-paths";
import { uploadNewsletterAsset } from "@/lib/supabase/newsletter-media";
import {
  getSupabaseStorageConfigProblems,
  logSupabaseServiceRoleKeyDebug,
  supabaseStorageNotConfiguredMessage,
} from "@/lib/supabase/config";

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

function clientFacingUploadError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("5 mb") || lower.includes("size limit") || lower.includes("too large")) {
    return "Image exceeds size limit.";
  }
  if (lower.includes("jpg") || lower.includes("png") || lower.includes("webp") || lower.includes("mime")) {
    return "Unsupported file type.";
  }
  if (lower.includes("not configured") || lower.includes("missing next_public")) {
    return message;
  }
  if (lower.includes("bucket") && lower.includes("missing")) {
    return "Upload failed. Create the newsletter-assets bucket in Supabase.";
  }
  if (process.env.NODE_ENV === "development") {
    return message;
  }
  return "Upload failed.";
}

function storageConfigErrorResponse() {
  const problems = getSupabaseStorageConfigProblems();
  let error = supabaseStorageNotConfiguredMessage(problems);
  if (process.env.NODE_ENV === "development") {
    error += " Add values to .env.local and restart npm run dev.";
  }
  return NextResponse.json({ error }, { status: 503 });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logSupabaseServiceRoleKeyDebug("upload-newsletter-image");

  if (getSupabaseStorageConfigProblems().length > 0) {
    return storageConfigErrorResponse();
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
    console.error("[upload-newsletter-image]", e);
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json(
      { error: clientFacingUploadError(message) },
      { status: 500 },
    );
  }
}
