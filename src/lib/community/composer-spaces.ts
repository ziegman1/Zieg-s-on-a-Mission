import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import { notificationCategoryFromSpaceSettings } from "@/lib/community/space-notification-category";
import { listAllCommunitySpacesForAdmin } from "@/lib/community/spaces";

/** All spaces (any status) for owner in-app composers — call only when owner is verified on the page. */
export async function listComposerSpacesForOwner(): Promise<CommunityComposerSpace[]> {
  const rows = await listAllCommunitySpacesForAdmin();
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    status: r.status,
    notificationCategory: notificationCategoryFromSpaceSettings(r.settings),
  }));
}
