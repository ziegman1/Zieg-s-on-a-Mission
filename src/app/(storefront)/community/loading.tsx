import { CommunityFeedLoadingSkeleton } from "@/components/community/community-loading-skeleton";
import { CommunityFeedShell } from "@/components/community/community-feed-shell";

export default function CommunityLoading() {
  return (
    <CommunityFeedShell>
      <CommunityFeedLoadingSkeleton count={4} />
    </CommunityFeedShell>
  );
}
