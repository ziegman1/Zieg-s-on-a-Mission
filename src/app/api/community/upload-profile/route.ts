import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminRole } from "@/lib/admin-users";
import { isCommunityMemberRole } from "@/lib/auth-roles";
import {
  isCommunityCoverMimeType,
  validateCommunityCoverFile,
} from "@/lib/community/media-upload";
import { uploadCommunityMemberProfile } from "@/lib/supabase/community-media";
import {
  getSupabaseStorageConfigProblems,
  supabaseStorageNotConfiguredMessage,
} from "@/lib/supabase/config";
import { revalidateCommunityFeeds } from "@/lib/community/post-author";
import { getOrSetVisitorKey } from "@/lib/community/visitor-key";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** Profile photo: join flow (visitor), CUSTOMER members, or ADMIN/STAFF owners (User.image). */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const isAdmin = isAdminRole(session?.user?.role);
  const isMember = Boolean(userId && isCommunityMemberRole(session?.user?.role));

  if (!userId) {
    await getOrSetVisitorKey();
  }

  if (getSupabaseStorageConfigProblems().length > 0) {
    return NextResponse.json(
      { error: supabaseStorageNotConfiguredMessage() },
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
    const { url, path } = await uploadCommunityMemberProfile(buffer, file.type);

    if (userId && isAdmin) {
      await prisma.user.update({
        where: { id: userId },
        data: { image: url },
      });
      revalidateCommunityFeeds();
    }

    return NextResponse.json({ url, path, saved: Boolean(userId && isAdmin) });
  } catch (e) {
    console.error("[community/upload-profile]", e);
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
