import { NextResponse } from "next/server";
import { getCurrentCommunityMember } from "@/lib/community/members";
import {
  fetchLinkPreviewMetadata,
  isSafeLinkPreviewUrl,
} from "@/lib/community/link-preview";
import { getCurrentCommunityOwner } from "@/lib/community/owner";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const [member, owner] = await Promise.all([
    getCurrentCommunityMember(),
    getCurrentCommunityOwner(),
  ]);

  if (!member && !owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url).searchParams.get("url")?.trim();
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (!isSafeLinkPreviewUrl(url)) {
    return NextResponse.json({ error: "Invalid preview URL" }, { status: 400 });
  }

  const preview = await fetchLinkPreviewMetadata(url);
  if (!preview) {
    return NextResponse.json({ preview: null }, { status: 404 });
  }

  return NextResponse.json(
    { preview },
    {
      headers: {
        "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
      },
    },
  );
}
