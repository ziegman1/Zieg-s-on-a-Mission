import type { Metadata } from "next";
import Link from "next/link";
import { CommunityAppShell } from "@/components/community/community-app-shell";
import { CommunitySpaceIcon } from "@/components/community/community-space-icon";
import { listPublishedCommunitySpaces } from "@/lib/community/spaces";
import { getSiteCopy } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getSiteCopy();
  return {
    title: `Spaces | Mission Hub`,
    description: `Browse community spaces — ${copy.site.name}`,
  };
}

export default async function CommunitySpacesPage() {
  let publishedSpaces: Awaited<ReturnType<typeof listPublishedCommunitySpaces>> = [];
  try {
    publishedSpaces = await listPublishedCommunitySpaces();
  } catch (e) {
    console.error("[community/spaces]", e);
  }

  return (
    <CommunityAppShell publishedSpaces={publishedSpaces} activeSlug={null}>
      <ul className="divide-y divide-black/[0.05] rounded-lg bg-white/60 overflow-hidden">
        {publishedSpaces.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-brand-ink/50">
            No published spaces yet.
          </li>
        ) : (
          publishedSpaces.map((space) => (
            <li key={space.id}>
              <Link
                href={`/community/${space.slug}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.02] transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                  <CommunitySpaceIcon icon={space.icon} className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-brand-ink">{space.title}</span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </CommunityAppShell>
  );
}
