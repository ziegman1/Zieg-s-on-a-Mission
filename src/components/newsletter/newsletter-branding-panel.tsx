"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { saveNewsletterBrandSettingsAction } from "@/app/admin/site-builder/newsletter-brand-actions";
import type { NewsletterBrandSettings } from "@/lib/newsletter/brand-types";
import { NewsletterBrandedHeader } from "@/components/newsletter/newsletter-branded-header";
import { NewsletterBrandedShell } from "@/components/newsletter/newsletter-branded-shell";
import { NewsletterImageUploadField } from "@/components/newsletter/newsletter-image-upload-field";
import { resolveNewsletterFooter } from "@/lib/newsletter/resolve-footer";
import { resolveNewsletterHeader } from "@/lib/newsletter/resolve-header";
import { NewsletterBrandedFooter } from "@/components/newsletter/newsletter-branded-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function NewsletterBrandingPanel({
  initialSettings,
  onSaved,
}: {
  initialSettings: NewsletterBrandSettings;
  onSaved?: (settings: NewsletterBrandSettings) => void;
}) {
  const [form, setForm] = useState(initialSettings);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function patch(patch: Partial<NewsletterBrandSettings>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  const previewHeader = resolveNewsletterHeader(
    { headerImageUrl: null, useDefaultBrandedHeader: true },
    form,
  );
  const previewFooter = resolveNewsletterFooter(
    { footerImageUrl: null, footerAltText: "", useDefaultFooterImage: true },
    form,
  );

  function save() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await saveNewsletterBrandSettingsAction(form);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setForm(res.settings);
      setSuccess("Newsletter branding saved.");
      onSaved?.(res.settings);
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto p-4 space-y-6 max-w-3xl">
      <div>
        <h2 className="text-sm font-semibold text-zinc-100">Newsletter branding</h2>
        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
          Upload your ministry header once. New newsletters can use it automatically; each issue can
          override the header if needed.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <NewsletterImageUploadField
            label="Default header image"
            purpose="header"
            imageUrl={form.defaultHeaderImageUrl ?? ""}
            onImageUrlChange={(url) =>
              patch({ defaultHeaderImageUrl: url.trim() || null })
            }
            altText={form.headerAltText}
            onAltTextChange={(headerAltText) => patch({ headerAltText })}
            previewClassName="max-w-lg"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-400 text-xs">Background color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={form.brandBackgroundColor}
              onChange={(e) => patch({ brandBackgroundColor: e.target.value })}
              className="w-12 h-9 p-1 bg-zinc-900 border-zinc-700"
            />
            <Input
              value={form.brandBackgroundColor}
              onChange={(e) => patch({ brandBackgroundColor: e.target.value })}
              className="bg-zinc-900 border-zinc-700 font-mono text-xs"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-400 text-xs">Accent color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={form.accentColor}
              onChange={(e) => patch({ accentColor: e.target.value })}
              className="w-12 h-9 p-1 bg-zinc-900 border-zinc-700"
            />
            <Input
              value={form.accentColor}
              onChange={(e) => patch({ accentColor: e.target.value })}
              className="bg-zinc-900 border-zinc-700 font-mono text-xs"
            />
          </div>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label className="text-zinc-400 text-xs">Line / divider color</Label>
          <div className="flex gap-2 max-w-xs">
            <Input
              type="color"
              value={form.lineAccentColor}
              onChange={(e) => patch({ lineAccentColor: e.target.value })}
              className="w-12 h-9 p-1 bg-zinc-900 border-zinc-700"
            />
            <Input
              value={form.lineAccentColor}
              onChange={(e) => patch({ lineAccentColor: e.target.value })}
              className="bg-zinc-900 border-zinc-700 font-mono text-xs"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <NewsletterImageUploadField
            label="Default footer image"
            purpose="footer"
            imageUrl={form.defaultFooterImageUrl ?? ""}
            onImageUrlChange={(url) =>
              patch({ defaultFooterImageUrl: url.trim() || null })
            }
            altText={form.footerAltText}
            onAltTextChange={(footerAltText) => patch({ footerAltText })}
            previewClassName="max-w-lg"
            helpText="Shown at the bottom of newsletters when no issue override is set. Falls back to footer text when empty."
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label className="text-zinc-400 text-xs">Default footer text</Label>
          <Textarea
            value={form.defaultFooterText}
            onChange={(e) => patch({ defaultFooterText: e.target.value })}
            rows={2}
            className="bg-zinc-900 border-zinc-700 resize-none text-sm"
            placeholder="Used when no footer image is configured"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-400 text-xs">Default CTA label</Label>
          <Input
            value={form.defaultCtaLabel}
            onChange={(e) => patch({ defaultCtaLabel: e.target.value })}
            className="bg-zinc-900 border-zinc-700"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-400 text-xs">Default CTA URL</Label>
          <Input
            value={form.defaultCtaUrl}
            onChange={(e) => patch({ defaultCtaUrl: e.target.value })}
            className="bg-zinc-900 border-zinc-700"
          />
        </div>

        <div className="sm:col-span-2 flex items-start gap-2">
          <input
            id="use-default-header-new"
            type="checkbox"
            checked={form.useDefaultHeaderForNew}
            onChange={(e) => patch({ useDefaultHeaderForNew: e.target.checked })}
            className="mt-1 rounded border-zinc-600"
          />
          <Label htmlFor="use-default-header-new" className="text-zinc-300 text-sm leading-snug cursor-pointer">
            Use default branded header automatically for new newsletters
          </Label>
        </div>

        <div className="sm:col-span-2 flex items-start gap-2">
          <input
            id="use-default-footer-new"
            type="checkbox"
            checked={form.useDefaultFooterImageOnNewNewsletters}
            onChange={(e) =>
              patch({ useDefaultFooterImageOnNewNewsletters: e.target.checked })
            }
            className="mt-1 rounded border-zinc-600"
          />
          <Label htmlFor="use-default-footer-new" className="text-zinc-300 text-sm leading-snug cursor-pointer">
            Use default footer image automatically for new newsletters
          </Label>
        </div>
      </div>

      {form.defaultHeaderImageUrl || form.defaultFooterImageUrl ? (
        <div className="space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Branding preview
          </p>
          <NewsletterBrandedShell brand={form} className="rounded-xl overflow-hidden ring-1 ring-zinc-700">
            {form.defaultHeaderImageUrl ? (
              <NewsletterBrandedHeader header={previewHeader} />
            ) : null}
            <p className="px-4 py-6 text-xs text-brand-ink/60 text-center min-h-[4rem] flex items-center justify-center">
              Newsletter content appears between header and footer on public pages.
            </p>
            <NewsletterBrandedFooter footer={previewFooter} />
          </NewsletterBrandedShell>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-400" role="status">
          {success}
        </p>
      ) : null}

      <Button
        type="button"
        size="sm"
        disabled={isPending}
        onClick={save}
        className="rounded-full bg-brand-primary w-fit"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
        Save branding
      </Button>
    </div>
  );
}
