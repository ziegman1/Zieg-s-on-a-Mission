import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  NEWSLETTER_PDF_MAX_BYTES,
  validateNewsletterPdfFile,
} from "@/lib/newsletter/document-upload";
import {
  formatNewsletterUploadErrorBody,
  storageConfigErrorBody,
  UNAUTHORIZED_UPLOAD_MESSAGE,
} from "@/lib/newsletter/newsletter-upload-errors";
import { uploadNewsletterDocument } from "@/lib/supabase/newsletter-media";
import { getSupabaseStorageConfigProblems } from "@/lib/supabase/config-env";
import { logSupabaseServiceRoleKeyDebug } from "@/lib/supabase/config-server";

export const runtime = "nodejs";

function parseNewsletterId(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const id = value.trim();
  return id.length > 0 ? id : undefined;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "STAFF"].includes(session.user.role)) {
    console.warn("[upload-newsletter-document] rejected: no admin session", {
      role: session?.user?.role ?? null,
    });
    return NextResponse.json({ error: UNAUTHORIZED_UPLOAD_MESSAGE }, { status: 401 });
  }

  logSupabaseServiceRoleKeyDebug("upload-newsletter-document");

  if (getSupabaseStorageConfigProblems().length > 0) {
    const body = storageConfigErrorBody();
    console.error("[upload-newsletter-document] storage not configured", body);
    return NextResponse.json(body, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (e) {
    console.error("[upload-newsletter-document] invalid form data", e);
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
    return NextResponse.json({ error: "PDF exceeds 20 MB." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, path } = await uploadNewsletterDocument(buffer, { newsletterId });
    console.info("[upload-newsletter-document] ok", {
      path,
      bytes: buffer.length,
      newsletterId: newsletterId ?? null,
      userId: session.user.id ?? session.user.email,
    });
    return NextResponse.json({ url, path, storage: "supabase" });
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    const body = formatNewsletterUploadErrorBody(raw, "pdf");
    console.error("[upload-newsletter-document] failed", {
      ...body,
      stack: e instanceof Error ? e.stack : undefined,
      fileName: file.name,
      fileSize: file.size,
      newsletterId: newsletterId ?? null,
    });
    return NextResponse.json(body, { status: 500 });
  }
}
