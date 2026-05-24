"use server";

import { getAdminMembersHubPreview } from "@/lib/community/admin-members-preview";
import { listMembersForAdminPortal } from "@/lib/community/admin-members-portal";
import type { AdminMemberPortalRow } from "@/lib/community/admin-members-portal-types";
import type { AdminMembersHubPreview } from "@/lib/community/admin-members-preview-types";
import { requireCommunityOwner } from "@/lib/community/owner";

export async function loadHubMembersPreviewAction(): Promise<
  | { ok: true; preview: AdminMembersHubPreview }
  | { ok: false; error: string }
> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  try {
    const preview = await getAdminMembersHubPreview();
    return { ok: true, preview };
  } catch (e) {
    console.error("[hub-admin-members] preview failed", e);
    return { ok: false, error: "Could not load members preview" };
  }
}

export async function loadHubMembersPanelAction(): Promise<
  | { ok: true; members: AdminMemberPortalRow[]; preview: AdminMembersHubPreview }
  | { ok: false; error: string }
> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  try {
    const [members, preview] = await Promise.all([
      listMembersForAdminPortal(),
      getAdminMembersHubPreview(),
    ]);
    return { ok: true, members, preview };
  } catch (e) {
    console.error("[hub-admin-members] panel load failed", e);
    return { ok: false, error: "Could not load members" };
  }
}
