import { CommunitySpaceLoadingSkeleton } from "@/components/community/community-loading-skeleton";
import { CommunityFeedShell } from "@/components/community/community-feed-shell";

export default function CommunitySlugLoading() {
  return (
    <CommunityFeedShell>
      <CommunitySpaceLoadingSkeleton />
    </CommunityFeedShell>
  );
}
