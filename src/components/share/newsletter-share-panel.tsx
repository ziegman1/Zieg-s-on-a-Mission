"use client";

import { useMemo } from "react";
import {
  buildAbsoluteNewsletterShareUrl,
  buildNewsletterShareMessage,
} from "@/lib/share/newsletter-share";
import { ShareContentPanel, type ShareContentPanelProps } from "./share-content-panel";

type NewsletterSharePanelProps = {
  title: string;
  slug: string;
  variant?: ShareContentPanelProps["variant"];
  className?: string;
  /** Optional origin override (defaults to NEXT_PUBLIC_SITE_URL or window origin). */
  origin?: string;
};

export function NewsletterSharePanel({
  title,
  slug,
  variant = "storefront",
  className,
  origin,
}: NewsletterSharePanelProps) {
  const resolvedOrigin = useMemo(() => {
    if (origin?.trim()) return origin;
    if (typeof window !== "undefined") return window.location.origin;
    return undefined;
  }, [origin]);

  const shareUrl = useMemo(
    () => buildAbsoluteNewsletterShareUrl(slug, resolvedOrigin),
    [slug, resolvedOrigin],
  );

  const shareMessage = useMemo(
    () => buildNewsletterShareMessage({ title, slug, origin: resolvedOrigin }),
    [title, slug, resolvedOrigin],
  );

  if (!slug.trim()) return null;

  return (
    <ShareContentPanel
      title={title}
      shareUrl={shareUrl}
      shareMessage={shareMessage}
      variant={variant}
      className={className}
    />
  );
}
