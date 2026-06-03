"use server";

import { buildCompactSpaceCreatePayload } from "@/lib/community/compact-space-create-payload";
import {
  createCommunitySpaceCore,
  type CreateCommunitySpaceResult,
} from "@/lib/community/create-community-space-core";
import type { CommunitySpaceFormInput } from "@/lib/community/space-form";

/** Mission Hub storefront entry — use this from mobile/desktop in-app create flows. */
export async function createCommunitySpaceAction(
  input: CommunitySpaceFormInput,
): Promise<CreateCommunitySpaceResult> {
  return createCommunitySpaceCore(input, { source: "community/space-actions" });
}

/** Admin fallback — idempotent create/publish Blog Articles space. */
export async function ensureBlogArticlesSpaceAction(): Promise<CreateCommunitySpaceResult> {
  return createCommunitySpaceCore(
    buildCompactSpaceCreatePayload({ title: "Blog Articles", icon: "blog" }),
    { source: "ensure-blog-articles" },
  );
}
