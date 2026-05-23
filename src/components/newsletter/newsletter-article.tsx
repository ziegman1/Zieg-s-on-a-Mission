import Link from "next/link";
import { NewsletterBlocksRenderer } from "@/components/newsletter/newsletter-blocks-renderer";
import { NewsletterBrandedFooter } from "@/components/newsletter/newsletter-branded-footer";
import { NewsletterBrandedHeader } from "@/components/newsletter/newsletter-branded-header";
import { NewsletterBrandedShell } from "@/components/newsletter/newsletter-branded-shell";
import { Button } from "@/components/ui/button";
import { flexJustifyClass } from "@/lib/newsletter/align";
import type { NewsletterBrandSettings } from "@/lib/newsletter/brand-types";
import { DEFAULT_NEWSLETTER_BRAND_SETTINGS } from "@/lib/newsletter/brand-defaults";
import { resolveNewsletterFooter } from "@/lib/newsletter/resolve-footer";
import {
  isBrandedNewsletterLayout,
  resolveNewsletterHeader,
  type ResolvedNewsletterHeader,
} from "@/lib/newsletter/resolve-header";
import type { NewsletterRecord } from "@/lib/newsletter/types";
import { cn } from "@/lib/utils";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function resolveFooterCta(
  newsletter: NewsletterRecord,
  brand: NewsletterBrandSettings,
): { label: string; url: string } | null {
  const label = newsletter.ctaLabel.trim() || brand.defaultCtaLabel.trim();
  const url = newsletter.ctaUrl.trim() || brand.defaultCtaUrl.trim();
  if (label && url) return { label, url };
  return null;
}

function NewsletterCtaRow({
  cta,
  align,
  branded,
}: {
  cta: { label: string; url: string };
  align: NewsletterRecord["ctaAlign"];
  branded: boolean;
}) {
  return (
    <div className={cn("mt-10 flex", flexJustifyClass(align))} data-testid="newsletter-footer-cta">
      {branded ? (
        <a
          href={cta.url}
          className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--newsletter-primary, #5a8fb8)" }}
        >
          {cta.label}
        </a>
      ) : (
        <Button asChild className="rounded-full bg-brand-primary">
          <a href={cta.url}>{cta.label}</a>
        </Button>
      )}
    </div>
  );
}

function LegacyNewsletterArticle({
  newsletter,
  adminPreviewBanner,
  dateLabel,
  cta,
  footer,
}: {
  newsletter: NewsletterRecord;
  adminPreviewBanner?: React.ReactNode;
  dateLabel: string;
  cta: { label: string; url: string } | null;
  footer: ReturnType<typeof resolveNewsletterFooter>;
}) {
  return (
    <article className="bg-brand-surface text-brand-ink min-h-[50vh]">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        {adminPreviewBanner}

        <Link
          href="/newsletters"
          className="text-sm font-medium text-brand-primary hover:underline inline-flex items-center gap-1"
        >
          ← All newsletters
        </Link>

        {dateLabel ? (
          <time
            dateTime={newsletter.issueDate ?? newsletter.publishedAt ?? undefined}
            className="mt-6 block text-xs font-semibold uppercase tracking-wider text-brand-primary/70"
          >
            {dateLabel}
          </time>
        ) : null}

        <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-brand-primary tracking-wide leading-tight">
          {newsletter.title}
        </h1>

        {newsletter.subtitle ? (
          <p className="mt-3 text-lg text-brand-ink/80 leading-relaxed">{newsletter.subtitle}</p>
        ) : null}

        {newsletter.featuredImageUrl ? (
          <figure className="mt-8 overflow-hidden rounded-2xl ring-1 ring-brand-primary/12 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={newsletter.featuredImageUrl}
              alt={newsletter.title}
              className="w-full aspect-[16/10] object-cover"
            />
          </figure>
        ) : null}

        {newsletter.excerpt ? (
          <p className="mt-8 text-lg text-brand-ink/85 leading-relaxed border-l-4 border-brand-primary/30 pl-4">
            {newsletter.excerpt}
          </p>
        ) : null}

        <div className="mt-8 sm:mt-10">
          <NewsletterBlocksRenderer
            blocks={newsletter.bodyBlocks}
            fallbackBody={newsletter.body}
          />
        </div>

        {cta ? (
          <NewsletterCtaRow cta={cta} align={newsletter.ctaAlign} branded={false} />
        ) : null}

        <NewsletterBrandedFooter footer={footer} className="mt-10" />

        <nav className="mt-14 pt-8 border-t border-brand-primary/20">
          <Link href="/newsletters" className="text-brand-primary font-semibold hover:underline">
            ← All newsletters
          </Link>
        </nav>
      </div>
    </article>
  );
}

function BrandedNewsletterArticle({
  newsletter,
  brand,
  header,
  adminPreviewBanner,
  dateLabel,
  cta,
  footer,
}: {
  newsletter: NewsletterRecord;
  brand: NewsletterBrandSettings;
  header: ResolvedNewsletterHeader;
  adminPreviewBanner?: React.ReactNode;
  dateLabel: string;
  cta: { label: string; url: string } | null;
  footer: ReturnType<typeof resolveNewsletterFooter>;
}) {
  return (
    <NewsletterBrandedShell brand={brand}>
      <NewsletterBrandedHeader header={header} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {adminPreviewBanner}

        <Link
          href="/newsletters"
          className="text-sm font-medium hover:underline inline-flex items-center gap-1"
          style={{ color: "var(--newsletter-primary, #5a8fb8)" }}
        >
          ← All newsletters
        </Link>

        <div
          className="mt-6 rounded-2xl bg-white/90 shadow-sm ring-1 px-5 sm:px-8 py-6 sm:py-8"
          style={{ borderColor: "color-mix(in srgb, var(--newsletter-line) 40%, transparent)" }}
        >
          {dateLabel ? (
            <time
              dateTime={newsletter.issueDate ?? newsletter.publishedAt ?? undefined}
              className="block text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--newsletter-primary, #5a8fb8)" }}
            >
              {dateLabel}
            </time>
          ) : null}

          <h1
            className="mt-3 font-serif text-3xl sm:text-4xl tracking-wide leading-tight"
            style={{ color: "var(--newsletter-primary, #5a8fb8)" }}
          >
            {newsletter.title}
          </h1>

          {newsletter.subtitle ? (
            <p className="mt-3 text-lg text-brand-ink/80 leading-relaxed">{newsletter.subtitle}</p>
          ) : null}

          {newsletter.excerpt ? (
            <p
              className="mt-6 text-lg text-brand-ink/85 leading-relaxed pl-4 border-l-4"
              style={{ borderColor: "var(--newsletter-line, #B8D4E8)" }}
            >
              {newsletter.excerpt}
            </p>
          ) : null}

          {newsletter.featuredImageUrl ? (
            <figure className="mt-8 overflow-hidden rounded-xl ring-1 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={newsletter.featuredImageUrl}
                alt={newsletter.title}
                className="w-full aspect-[16/10] object-cover"
              />
            </figure>
          ) : null}

          <div className="mt-8 sm:mt-10">
            <NewsletterBlocksRenderer
              blocks={newsletter.bodyBlocks}
              fallbackBody={newsletter.body}
              variant="branded"
            />
          </div>

          {cta ? (
            <NewsletterCtaRow cta={cta} align={newsletter.ctaAlign} branded />
          ) : null}
        </div>

        <NewsletterBrandedFooter footer={footer} className="mt-8" />

        <nav
          className="mt-10 pt-6 border-t text-center sm:text-left"
          style={{ borderColor: "var(--newsletter-line, #B8D4E8)" }}
        >
          <Link
            href="/newsletters"
            className="font-semibold hover:underline"
            style={{ color: "var(--newsletter-primary, #5a8fb8)" }}
          >
            ← All newsletters
          </Link>
        </nav>
      </article>
    </NewsletterBrandedShell>
  );
}

export function NewsletterArticle({
  newsletter,
  brand,
  adminPreviewBanner,
}: {
  newsletter: NewsletterRecord;
  brand?: NewsletterBrandSettings;
  adminPreviewBanner?: React.ReactNode;
}) {
  const dateLabel = formatDate(newsletter.issueDate ?? newsletter.publishedAt);
  const resolvedBrand = brand ?? DEFAULT_NEWSLETTER_BRAND_SETTINGS;
  const header = resolveNewsletterHeader(newsletter, resolvedBrand);
  const footer = resolveNewsletterFooter(newsletter, resolvedBrand);
  const branded = isBrandedNewsletterLayout(header);
  const cta = resolveFooterCta(newsletter, resolvedBrand);

  if (!branded) {
    return (
      <LegacyNewsletterArticle
        newsletter={newsletter}
        adminPreviewBanner={adminPreviewBanner}
        dateLabel={dateLabel}
        cta={cta}
        footer={footer}
      />
    );
  }

  return (
    <BrandedNewsletterArticle
      newsletter={newsletter}
      brand={resolvedBrand}
      header={header}
      adminPreviewBanner={adminPreviewBanner}
      dateLabel={dateLabel}
      cta={cta}
      footer={footer}
    />
  );
}
