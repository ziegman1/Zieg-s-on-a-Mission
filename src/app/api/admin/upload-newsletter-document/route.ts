import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  NEWSLETTER_PDF_MAX_BYTES,
  validateNewsletterPdfFile,
} from "@/lib/newsletter/document-upload";
import { uploadNewsletterDocument } from "@/lib/supabase/newsletter-media";
import {
  getSupabaseStorageConfigProblems,
  logSupabaseServiceRoleKeyDebug,
  supabaseStorageNotConfiguredMessage,
} from "@/lib/supabase/config";

export const runtime = "nodejs";

function parseNewsletterId(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const id = value.trim();
  return id.length > 0 ? id : undefined;
}

function clientFacingUploadError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("20 mb") ||
    lower.includes("size limit") ||
    lower.includes("too large") ||
    lower.includes("payload too large")
  ) {
    return "PDF must be 20 MB or smaller.";
  }
  if (lower.includes("pdf") || lower.includes("mime") || lower.includes("not allowed")) {
    return "Use a PDF file.";
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

  logSupabaseServiceRoleKeyDebug("upload-newsletter-document");

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

  const newsletterId = parseNewsletterId(formData.get("newsletterId"));

  const validationError = validateNewsletterPdfFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  if (file.size > NEWSLETTER_PDF_MAX_BYTES) {
    return NextResponse.json({ error: "PDF must be 20 MB or smaller." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, path } = await uploadNewsletterDocument(buffer, { newsletterId });
    return NextResponse.json({ url, path, storage: "supabase" });
  } catch (e) {
    console.error("[upload-newsletter-document]", e);
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json(
      { error: clientFacingUploadError(message) },
      { status: 500 },
    );
  }
}
