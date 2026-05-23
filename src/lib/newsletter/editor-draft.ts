import type { NewsletterBlocks } from "@/lib/newsletter/blocks/types";
import type { NewsletterComposerLayoutMode } from "@/lib/newsletter/composer-layout";
import type { CtaAlign } from "@/lib/newsletter/align";
import type { NewsletterStatus } from "@/lib/newsletter/types";

const STORAGE_PREFIX = "newsletter-editor-draft:v1:";

/** Serializable newsletter composer form (localStorage). */
export type NewsletterEditorDraftForm = {
  title: string;
  subtitle: string;
  slug: string;
  issueDate: string;
  headerImageUrl: string;
  useDefaultBrandedHeader: boolean;
  featuredImageUrl: string;
  excerpt: string;
  body: string;
  bodyBlocks: NewsletterBlocks;
  ctaLabel: string;
  ctaUrl: string;
  ctaAlign: CtaAlign;
  footerImageUrl: string;
  footerAltText: string;
  useDefaultFooterImage: boolean;
  seoTitle: string;
  seoDescription: string;
  status: NewsletterStatus;
  publishedAt: string;
};

export type NewsletterEditorDraft = {
  draftKey: string;
  savedAt: number;
  serverLoadedAt: number | null;
  serverUpdatedAt: string | null;
  slugTouched: boolean;
  composerLayoutMode: NewsletterComposerLayoutMode;
  form: NewsletterEditorDraftForm;
};

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function storageKey(draftKey: string): string {
  return `${STORAGE_PREFIX}${draftKey}`;
}

export function getDefaultStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function saveNewsletterEditorDraft(
  draft: NewsletterEditorDraft,
  storage: StorageLike | null = getDefaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(storageKey(draft.draftKey), JSON.stringify(draft));
  } catch {
    // quota or private mode
  }
}

export function loadNewsletterEditorDraft(
  draftKey: string,
  storage: StorageLike | null = getDefaultStorage(),
): NewsletterEditorDraft | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(storageKey(draftKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NewsletterEditorDraft;
    if (!parsed || typeof parsed !== "object" || !parsed.form) return null;
    if (parsed.draftKey !== draftKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearNewsletterEditorDraft(
  draftKey: string,
  storage: StorageLike | null = getDefaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.removeItem(storageKey(draftKey));
  } catch {
    // ignore
  }
}

/** Remove draft from localStorage and sessionStorage (same key pattern). */
export function clearNewsletterEditorDraftAll(
  draftKey: string,
  storage: StorageLike | null = getDefaultStorage(),
): void {
  clearNewsletterEditorDraft(draftKey, storage);
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(storageKey(draftKey));
  } catch {
    // ignore
  }
}

/** New-issue drafts use a stable key until first server save. */
export function newIssueDraftKey(): string {
  return "new";
}

/**
 * Apply a stored draft only when it is newer than the last server load for this issue.
 * New issues always accept a matching `new` draft.
 */
export function shouldApplyNewsletterEditorDraft(
  draft: NewsletterEditorDraft,
  options: {
    draftKey: string;
    serverLoadedAt: number | null;
    serverUpdatedAt?: string | null;
  },
): boolean {
  if (draft.draftKey !== options.draftKey) return false;
  if (options.draftKey === newIssueDraftKey()) return true;
  if (options.serverLoadedAt == null) return true;
  if (draft.savedAt <= options.serverLoadedAt) return false;
  if (
    options.serverUpdatedAt &&
    draft.serverUpdatedAt &&
    draft.serverUpdatedAt !== options.serverUpdatedAt
  ) {
    return false;
  }
  return true;
}

export function hasMeaningfulDraftContent(form: NewsletterEditorDraftForm): boolean {
  if (form.title.trim()) return true;
  if (form.body.trim()) return true;
  if (form.bodyBlocks.length > 0) return true;
  if (form.subtitle.trim()) return true;
  if (form.excerpt.trim()) return true;
  return false;
}
