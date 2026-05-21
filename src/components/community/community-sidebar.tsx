import type { CommunitySpace } from "@/lib/community/types";
import { CommunitySpaceCard } from "./community-space-card";

export function CommunitySidebar({
  publishedSpaces,
  plannedSpaces,
}: {
  publishedSpaces: CommunitySpace[];
  plannedSpaces: CommunitySpace[];
}) {
  const showPlanned = plannedSpaces.length > 0;
  const sidebarSpaces = publishedSpaces.length > 0 ? publishedSpaces : plannedSpaces;

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
      <div className="rounded-xl border border-brand-primary/20 bg-white/60 px-4 py-4 shadow-sm">
        <h2 className="font-serif text-lg text-brand-primary tracking-wide">Spaces</h2>
        <p className="mt-1 text-sm text-brand-ink/70 leading-relaxed">
          {publishedSpaces.length > 0
            ? `${publishedSpaces.length} live space${publishedSpaces.length === 1 ? "" : "s"} in the Mission Hub.`
            : "Planned areas for prayer, updates, and connection — opening over time."}
        </p>
      </div>
      <nav aria-label="Community spaces" className="space-y-2">
        {sidebarSpaces.map((space) => (
          <CommunitySpaceCard key={space.id} space={space} compact />
        ))}
      </nav>
      {showPlanned && publishedSpaces.length > 0 ? (
        <p className="text-xs text-brand-ink/55 px-1 leading-relaxed">
          More spaces may be added over time from the admin Mission Hub.
        </p>
      ) : (
        <p className="text-xs text-brand-ink/55 px-1 leading-relaxed">
          Admins: Jeremy and Lindsay manage spaces at{" "}
          <span className="text-brand-primary/90">/admin/community</span>.
        </p>
      )}
    </aside>
  );
}
