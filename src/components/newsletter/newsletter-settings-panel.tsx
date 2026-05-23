"use client";

import { CtaAlignmentControl } from "@/components/newsletter/cta-alignment-control";
import { NewsletterImageUploadField } from "@/components/newsletter/newsletter-image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CtaAlign } from "@/lib/newsletter/align";
import type { NewsletterStatus } from "@/lib/newsletter/types";
import { slugifyTitle } from "@/lib/newsletter/slug";

export type NewsletterSettingsFormSlice = {
  title: string;
  subtitle: string;
  slug: string;
  issueDate: string;
  publishedAt: string;
  status: NewsletterStatus;
  headerImageUrl: string;
  useDefaultBrandedHeader: boolean;
  featuredImageUrl: string;
  excerpt: string;
  ctaLabel: string;
  ctaUrl: string;
  ctaAlign: CtaAlign;
  footerImageUrl: string;
  footerAltText: string;
  useDefaultFooterImage: boolean;
  seoTitle: string;
  seoDescription: string;
};

export function NewsletterSettingsPanel({
  form,
  onPatch,
  onTitleChange,
  onSlugTouched,
  toDatetimeLocal,
  newsletterId,
}: {
  form: NewsletterSettingsFormSlice;
  onPatch: (patch: Partial<NewsletterSettingsFormSlice>) => void;
  onTitleChange: (title: string) => void;
  onSlugTouched: () => void;
  toDatetimeLocal: (iso: string) => string;
  newsletterId?: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 p-4" data-testid="newsletter-settings-panel">
      <div className="space-y-1.5 sm:col-span-2">
        <Label className="text-zinc-400 text-xs">Title</Label>
        <Input
          value={form.title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="bg-zinc-900 border-zinc-700"
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label className="text-zinc-400 text-xs">Subtitle</Label>
        <Input
          value={form.subtitle}
          onChange={(e) => onPatch({ subtitle: e.target.value })}
          className="bg-zinc-900 border-zinc-700"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs">Issue date</Label>
        <Input
          type="date"
          value={form.issueDate}
          onChange={(e) => onPatch({ issueDate: e.target.value })}
          className="bg-zinc-900 border-zinc-700"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs">Publish date</Label>
        <Input
          type="datetime-local"
          value={
            form.publishedAt ||
            (form.status === "PUBLISHED" ? toDatetimeLocal(new Date().toISOString()) : "")
          }
          onChange={(e) => onPatch({ publishedAt: e.target.value })}
          className="bg-zinc-900 border-zinc-700 text-sm"
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label className="text-zinc-400 text-xs">URL slug</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 shrink-0">/newsletters/</span>
          <Input
            value={form.slug}
            onChange={(e) => {
              onSlugTouched();
              onPatch({ slug: slugifyTitle(e.target.value) });
            }}
            className="bg-zinc-900 border-zinc-700 font-mono text-sm"
          />
        </div>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <div className="flex items-center gap-2">
          <input
            id="use-default-branded-header-drawer"
            type="checkbox"
            checked={form.useDefaultBrandedHeader}
            onChange={(e) =>
              onPatch({
                useDefaultBrandedHeader: e.target.checked,
                ...(e.target.checked ? { headerImageUrl: "" } : {}),
              })
            }
            className="rounded border-zinc-600"
          />
          <Label
            htmlFor="use-default-branded-header-drawer"
            className="text-zinc-400 text-xs cursor-pointer"
          >
            Use default branded header
          </Label>
        </div>
        {(!form.useDefaultBrandedHeader || form.headerImageUrl) && (
          <NewsletterImageUploadField
            label="Header image (issue override)"
            purpose="header"
            newsletterId={newsletterId}
            helpText="Uses saved branding header by default. Upload or paste a URL to override this issue only."
            imageUrl={form.headerImageUrl}
            onImageUrlChange={(headerImageUrl) =>
              onPatch({
                headerImageUrl,
                useDefaultBrandedHeader: headerImageUrl ? false : form.useDefaultBrandedHeader,
              })
            }
            disabled={form.useDefaultBrandedHeader && !form.headerImageUrl}
          />
        )}
      </div>
      <div className="sm:col-span-2">
        <NewsletterImageUploadField
          label="Featured image (in content)"
          purpose="featured"
          newsletterId={newsletterId}
          imageUrl={form.featuredImageUrl}
          onImageUrlChange={(featuredImageUrl) => onPatch({ featuredImageUrl })}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label className="text-zinc-400 text-xs">Excerpt (Mission Hub + SEO)</Label>
        <Textarea
          value={form.excerpt}
          onChange={(e) => onPatch({ excerpt: e.target.value })}
          rows={2}
          className="bg-zinc-900 border-zinc-700 resize-none text-sm"
        />
      </div>

      <div className="sm:col-span-2 pt-2 border-t border-zinc-800">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-3">
          Footer CTA
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">CTA label</Label>
            <Input
              value={form.ctaLabel}
              onChange={(e) => onPatch({ ctaLabel: e.target.value })}
              className="bg-zinc-900 border-zinc-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">CTA URL</Label>
            <Input
              value={form.ctaUrl}
              onChange={(e) => onPatch({ ctaUrl: e.target.value })}
              className="bg-zinc-900 border-zinc-700"
            />
          </div>
          <div className="sm:col-span-2">
            <CtaAlignmentControl
              label="CTA alignment"
              value={form.ctaAlign}
              onChange={(ctaAlign) => onPatch({ ctaAlign })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 sm:col-span-2 pt-2 border-t border-zinc-800">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">
          Footer image
        </p>
        <div className="flex items-center gap-2 mb-2">
          <input
            id="use-default-footer-image-drawer"
            type="checkbox"
            checked={form.useDefaultFooterImage}
            onChange={(e) =>
              onPatch({
                useDefaultFooterImage: e.target.checked,
                ...(e.target.checked ? { footerImageUrl: "" } : {}),
              })
            }
            className="rounded border-zinc-600"
          />
          <Label
            htmlFor="use-default-footer-image-drawer"
            className="text-zinc-400 text-xs cursor-pointer"
          >
            Use default branded footer image
          </Label>
        </div>
        {(!form.useDefaultFooterImage || form.footerImageUrl) && (
          <NewsletterImageUploadField
            label="Footer image (issue override)"
            purpose="footer"
            newsletterId={newsletterId}
            helpText="Uses saved branding footer by default. Upload or paste a URL to override this issue only."
            imageUrl={form.footerImageUrl}
            onImageUrlChange={(footerImageUrl) =>
              onPatch({
                footerImageUrl,
                useDefaultFooterImage: footerImageUrl ? false : form.useDefaultFooterImage,
              })
            }
            altText={form.footerAltText}
            onAltTextChange={(footerAltText) => onPatch({ footerAltText })}
            disabled={form.useDefaultFooterImage && !form.footerImageUrl}
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs">SEO title</Label>
        <Input
          value={form.seoTitle}
          onChange={(e) => onPatch({ seoTitle: e.target.value })}
          className="bg-zinc-900 border-zinc-700"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs">SEO description</Label>
        <Input
          value={form.seoDescription}
          onChange={(e) => onPatch({ seoDescription: e.target.value })}
          className="bg-zinc-900 border-zinc-700"
        />
      </div>
    </div>
  );
}
