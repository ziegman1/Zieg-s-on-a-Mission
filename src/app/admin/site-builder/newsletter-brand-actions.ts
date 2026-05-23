"use server";

import { requireAdminSession } from "@/lib/admin-auth";
import {
  getNewsletterBrandSettings,
  parseNewsletterBrandSettingsInput,
  upsertNewsletterBrandSettings,
} from "@/lib/newsletter/brand-settings";
import type { NewsletterBrandSettings, NewsletterBrandSettingsInput } from "@/lib/newsletter/brand-types";
import {
  brandSettingsDevHint,
  formatNewsletterBrandSettingsError,
  logNewsletterBrandSettingsAction,
} from "@/lib/newsletter/errors";
import { isValidOptionalUrl } from "@/lib/newsletter/blocks/validate";
import { revalidatePath } from "next/cache";

export async function loadNewsletterBrandSettingsAction(): Promise<
  | { ok: true; settings: NewsletterBrandSettings }
  | { ok: false; error: string }
> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  try {
    const settings = await getNewsletterBrandSettings();
    return { ok: true, settings };
  } catch (e) {
    logNewsletterBrandSettingsAction("load", {}, e);
    return { ok: false, error: "Unable to load branding settings." };
  }
}

export async function saveNewsletterBrandSettingsAction(
  input: NewsletterBrandSettingsInput,
): Promise<
  | { ok: true; settings: NewsletterBrandSettings }
  | { ok: false; error: string }
> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const url = input.defaultHeaderImageUrl?.trim();
  if (url && !isValidOptionalUrl(url)) {
    return { ok: false, error: "Header image URL must be http(s) or a site path starting with /." };
  }
  const ctaUrl = input.defaultCtaUrl.trim();
  if (ctaUrl && !isValidOptionalUrl(ctaUrl)) {
    return { ok: false, error: "Default CTA URL must be http(s) or a site path starting with /." };
  }
  if (!input.headerAltText.trim() && url) {
    return { ok: false, error: "Header alt text is required when a header image is set." };
  }

  try {
    const settings = await upsertNewsletterBrandSettings(input);
    logNewsletterBrandSettingsAction("save", {
      hasHeader: Boolean(settings.defaultHeaderImageUrl),
      useDefaultHeaderForNew: settings.useDefaultHeaderForNew,
    });
    revalidatePath("/newsletters");
    revalidatePath("/newsletters/[slug]", "page");
    revalidatePath("/admin/site-builder");
    return { ok: true, settings };
  } catch (e) {
    logNewsletterBrandSettingsAction("save", { input: parseNewsletterBrandSettingsInput(input) }, e);
    const hint = brandSettingsDevHint(e);
    const message = formatNewsletterBrandSettingsError(e);
    return { ok: false, error: hint ? `${message} ${hint}` : message };
  }
}

export async function getNewsletterBrandSettingsForAdmin(): Promise<NewsletterBrandSettings> {
  return getNewsletterBrandSettings();
}
