"use client";

import { memo } from "react";
import { NewsletterComposerPreview } from "@/components/newsletter/newsletter-composer-preview";
import type { NewsletterComposerMeta } from "@/components/newsletter/newsletter-editor-workspace";
import type { NewsletterBrandSettings } from "@/lib/newsletter/brand-types";
import type { NewsletterBlocks } from "@/lib/newsletter/blocks/types";

function NewsletterComposerPreviewPaneInner({
  blocks,
  meta,
  brand,
  mobilePreview,
}: {
  blocks: NewsletterBlocks;
  meta: NewsletterComposerMeta;
  brand: NewsletterBrandSettings;
  mobilePreview: boolean;
}) {
  return (
    <NewsletterComposerPreview
      blocks={blocks}
      meta={meta}
      brand={brand}
      mobilePreview={mobilePreview}
    />
  );
}

export const NewsletterComposerPreviewPane = memo(NewsletterComposerPreviewPaneInner);
