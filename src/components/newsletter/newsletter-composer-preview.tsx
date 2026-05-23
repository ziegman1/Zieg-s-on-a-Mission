"use client";

import { memo } from "react";
import { NewsletterBlocksRenderer } from "@/components/newsletter/newsletter-blocks-renderer";
import { NewsletterBrandedFooter } from "@/components/newsletter/newsletter-branded-footer";
import { NewsletterBrandedHeader } from "@/components/newsletter/newsletter-branded-header";
import { NewsletterBrandedShell } from "@/components/newsletter/newsletter-branded-shell";
import type { NewsletterComposerMeta } from "@/components/newsletter/newsletter-editor-workspace";
import { flexJustifyClass } from "@/lib/newsletter/align";
import type { NewsletterBrandSettings } from "@/lib/newsletter/brand-types";
import { previewPaneWidthClass } from "@/lib/newsletter/composer-layout";
import { resolveNewsletterFooter } from "@/lib/newsletter/resolve-footer";
import {
  isBrandedNewsletterLayout,
  resolveNewsletterHeader,
  type ResolvedNewsletterHeader,
} from "@/lib/newsletter/resolve-header";
import type { NewsletterBlocks } from "@/lib/newsletter/blocks/types";
import { cn } from "@/lib/utils";

function NewsletterComposerPreviewInner({
  blocks,
  meta,
  brand,
  mobilePreview = false,
  className,
}: {
  blocks: NewsletterBlocks;
  meta: NewsletterComposerMeta;
  brand: NewsletterBrandSettings;
  mobilePreview?: boolean;
  className?: string;
}) {
  const resolvedHeader = resolveNewsletterHeader(
    {
      headerImageUrl: meta.headerImageUrl.trim() || null,
      useDefaultBrandedHeader: meta.useDefaultBrandedHeader,
    },
    brand,
  );
  const footer = resolveNewsletterFooter(
    {
      footerImageUrl: meta.footerImageUrl.trim() || null,
      footerAltText: meta.footerAltText,
      useDefaultFooterImage: meta.useDefaultFooterImage,
    },
    brand,
  );
  const branded = isBrandedNewsletterLayout(resolvedHeader);

  return (
    <div
      className={cn(
        "flex justify-center w-full min-h-0",
        mobilePreview ? "px-4 py-6" : "px-6 py-8",
        className,
      )}
      data-testid="composer-preview-pane"
    >
      <div
        className={cn(
          previewPaneWidthClass(),
          mobilePreview && "max-w-[390px]",
          "shadow-lg ring-1 ring-zinc-800/40 overflow-hidden rounded-lg",
          branded ? "" : "bg-brand-surface",
        )}
        data-testid="composer-preview-frame"
        style={
          mobilePreview
            ? undefined
            : { maxWidth: `${mobilePreview ? 390 : 820}px` }
        }
      >
        <PreviewBody
          blocks={blocks}
          meta={meta}
          brand={brand}
          header={resolvedHeader}
          footer={footer}
          branded={branded}
        />
      </div>
    </div>
  );
}

function PreviewBody({
  blocks,
  meta,
  brand,
  header,
  footer,
  branded,
}: {
  blocks: NewsletterBlocks;
  meta: NewsletterComposerMeta;
  brand: NewsletterBrandSettings;
  header: ResolvedNewsletterHeader;
  footer: ReturnType<typeof resolveNewsletterFooter>;
  branded: boolean;
}) {
  if (branded) {
    return (
      <NewsletterBrandedShell brand={brand} className="rounded-lg overflow-hidden">
        <NewsletterBrandedHeader header={header} />
        <article className="px-6 py-8 text-brand-ink">
          <div className="rounded-xl bg-white/90 ring-1 px-6 py-7 shadow-sm border-[color-mix(in_srgb,var(--newsletter-line)_35%,transparent)]">
            <PreviewMeta blocks={blocks} meta={meta} brand={brand} variant="branded" />
          </div>
          <NewsletterBrandedFooter footer={footer} className="mt-6" />
        </article>
      </NewsletterBrandedShell>
    );
  }

  return (
    <article className="px-6 py-8 text-brand-ink">
      <PreviewMeta blocks={blocks} meta={meta} brand={brand} variant="legacy" />
      <NewsletterBrandedFooter footer={footer} className="mt-8" />
    </article>
  );
}

function PreviewMeta({
  blocks,
  meta,
  brand,
  variant,
}: {
  blocks: NewsletterBlocks;
  meta: NewsletterComposerMeta;
  brand: NewsletterBrandSettings;
  variant: "branded" | "legacy";
}) {
  const primaryClass =
    variant === "branded" ? "" : "text-brand-primary";
  const primaryStyle =
    variant === "branded"
      ? { color: "var(--newsletter-primary, #5a8fb8)" }
      : undefined;

  const ctaLabel = meta.ctaLabel.trim() || brand.defaultCtaLabel.trim();
  const ctaUrl = meta.ctaUrl.trim() || brand.defaultCtaUrl.trim();
  const showCta = Boolean(ctaLabel && ctaUrl);

  return (
    <>
      {meta.issueDateLabel ? (
        <time
          className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            variant === "legacy" && "text-brand-primary/70",
          )}
          style={primaryStyle}
        >
          {meta.issueDateLabel}
        </time>
      ) : null}
      <h1
        className={cn("mt-3 font-serif text-3xl tracking-wide leading-tight", primaryClass)}
        style={primaryStyle}
      >
        {meta.title.trim() || "Newsletter title"}
      </h1>
      {meta.subtitle.trim() ? (
        <p className="mt-3 text-lg text-brand-ink/75 leading-relaxed">{meta.subtitle}</p>
      ) : null}
      {meta.excerpt.trim() ? (
        <p
          className={cn(
            "mt-6 text-lg text-brand-ink/85 leading-relaxed pl-4 border-l-4",
            variant === "legacy" && "border-brand-primary/25",
          )}
          style={
            variant === "branded"
              ? { borderColor: "var(--newsletter-line)" }
              : undefined
          }
        >
          {meta.excerpt}
        </p>
      ) : null}
      {meta.featuredImageUrl.trim() ? (
        <figure
          className={cn(
            "mt-8 overflow-hidden rounded-xl ring-1",
            variant === "legacy" && "ring-brand-primary/12",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meta.featuredImageUrl}
            alt=""
            className="w-full aspect-[16/10] object-cover"
          />
        </figure>
      ) : null}
      <div className="mt-8">
        <NewsletterBlocksRenderer
          blocks={blocks}
          variant={variant === "branded" ? "branded" : "preview-admin"}
        />
      </div>
      {showCta ? (
        <div className={cn("mt-8 flex", flexJustifyClass(meta.ctaAlign))} data-testid="composer-preview-cta">
          {variant === "branded" ? (
            <span
              className="inline-block rounded-full px-5 py-2.5 text-sm text-white font-semibold"
              style={{ backgroundColor: "var(--newsletter-primary, #5a8fb8)" }}
            >
              {ctaLabel}
            </span>
          ) : (
            <span className="inline-block rounded-full bg-brand-primary px-5 py-2.5 text-sm text-white font-medium">
              {ctaLabel}
            </span>
          )}
        </div>
      ) : null}
    </>
  );
}

export const NewsletterComposerPreview = memo(NewsletterComposerPreviewInner);
