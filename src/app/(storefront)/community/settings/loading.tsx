import { CommunitySettingsLoadingSkeleton } from "@/components/community/community-loading-skeleton";

export default function CommunitySettingsLoading() {
  return (
    <div className="min-h-[calc(100dvh-3.5rem)] w-full px-2 sm:px-4 py-3 sm:py-5 max-w-4xl mx-auto">
      <CommunitySettingsLoadingSkeleton />
    </div>
  );
}
