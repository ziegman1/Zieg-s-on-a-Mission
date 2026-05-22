"use client";

import { useEffect, useState } from "react";
import { getCommentAuthorContextAction } from "@/app/(storefront)/community/member-actions";
import type { CommentAuthorContext } from "@/lib/community/members";

export function useCommunityCommentAuthor(): CommentAuthorContext | null {
  const [authorContext, setAuthorContext] = useState<CommentAuthorContext | null>(null);

  useEffect(() => {
    void getCommentAuthorContextAction().then(setAuthorContext);
  }, []);

  return authorContext;
}
