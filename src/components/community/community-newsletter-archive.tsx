import type { MissionHubNewsletterArchiveItem } from "@/lib/newsletter/mission-hub-newsletter-archive-types";
import type { CommunitySpaceDetail } from "@/lib/community/space-experience";
import { CommunityNewsletterArchiveView } from "./community-newsletter-archive-view";

export function CommunityNewsletterArchive({
  space,
  items,
}: {
  space: CommunitySpaceDetail;
  items: MissionHubNewsletterArchiveItem[];
}) {
  return <CommunityNewsletterArchiveView space={space} items={items} />;
}
