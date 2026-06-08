"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { enableCommunityPostFacebookShareAction } from "@/app/admin/community/post-share-actions";
import type { PostShareAssets, PublicSharePreview } from "@/lib/community/post-public-share";

export type CommunityPostSharePayload = {
  shareUrl: string;
  facebookShareUrl: string;
  assets: PostShareAssets;
  preview: PublicSharePreview;
};

export async function copyShareText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function useCommunityPostShare(postId: string, open: boolean) {
  const [payload, setPayload] = useState<CommunityPostSharePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const loadShare = useCallback(() => {
    setError(null);
    setPayload(null);
    startTransition(async () => {
      const result = await enableCommunityPostFacebookShareAction(postId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPayload({
        shareUrl: result.shareUrl,
        facebookShareUrl: result.facebookShareUrl,
        assets: result.assets,
        preview: result.preview,
      });
    });
  }, [postId]);

  useEffect(() => {
    if (open) {
      loadShare();
    } else {
      setPayload(null);
      setError(null);
    }
  }, [open, loadShare]);

  return { payload, error, pending, reload: loadShare };
}
