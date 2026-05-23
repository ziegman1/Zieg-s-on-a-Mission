"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NEWSLETTER_BUILDER_NAV } from "@/lib/site-builder/types";
import {
  clearNewsletterEditorDraftAll,
  loadNewsletterEditorDraft,
  newIssueDraftKey,
  saveNewsletterEditorDraft,
  shouldApplyNewsletterEditorDraft,
  type NewsletterEditorDraftForm,
} from "@/lib/newsletter/editor-draft";
import {
  BLOCKING_LOCAL_FILE_SAVE_MESSAGE,
  clearLocalFileReferencesFromForm,
  formatRecoveredDraftLocalFileWarning,
  hasBlockingLocalFileReferences,
  sanitizeRecoveredDraftForm,
} from "@/lib/newsletter/editor-draft-local-files";
import { useSiteBuilderNavigation } from "./use-site-builder-navigation";
import { ArrowLeft, ExternalLink, Loader2, Plus, X } from "lucide-react";
import { blocksToPlainBody } from "@/lib/newsletter/blocks/plain-text";
import { hasVisibleNewsletterContent } from "@/lib/newsletter/blocks/visible";
import type { NewsletterBlocks } from "@/lib/newsletter/blocks/types";
import { perfMark } from "@/lib/newsletter/composer-perf";
import { formatNewsletterIssueDateLabel } from "@/lib/newsletter/mission-hub-announcement";
import { useNewsletterComposerLayout } from "@/lib/newsletter/use-newsletter-composer-layout";
import type { NewsletterRecord, NewsletterStatus } from "@/lib/newsletter/types";
import { slugifyTitle } from "@/lib/newsletter/slug";
import {
  NewsletterEditorWorkspace,
  type NewsletterComposerMeta,
} from "@/components/newsletter/newsletter-editor-workspace";
import { NewsletterBrandingPanel } from "@/components/newsletter/newsletter-branding-panel";
import { NewsletterSettingsPanel } from "@/components/newsletter/newsletter-settings-panel";
import type { CtaAlign } from "@/lib/newsletter/align";
import type { NewsletterBrandSettings } from "@/lib/newsletter/brand-types";
import type { NewsletterComposerLayoutMode } from "@/lib/newsletter/composer-layout";
import { mergeAdminNewsletters } from "@/lib/newsletter/merge-newsletters";
import {
  archiveNewsletterAction,
  createNewsletterDraftAction,
  listAdminNewsletters,
  publishNewsletterAction,
  unpublishNewsletterAction,
  updateNewsletterDraftAction,
} from "./newsletter-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function emptyForm(brand?: NewsletterBrandSettings): NewsletterFormState {
  const useDefaultHeader = brand?.useDefaultHeaderForNew ?? true;
  const useDefaultFooter = brand?.useDefaultFooterImageOnNewNewsletters ?? true;
  return {
    title: "",
    subtitle: "",
    slug: "",
    issueDate: "",
    headerImageUrl: "",
    useDefaultBrandedHeader: useDefaultHeader,
    featuredImageUrl: "",
    excerpt: "",
    body: "",
    bodyBlocks: [],
    ctaLabel: brand?.defaultCtaLabel ?? "",
    ctaUrl: brand?.defaultCtaUrl ?? "",
    ctaAlign: "center",
    footerImageUrl: "",
    footerAltText: "",
    useDefaultFooterImage: useDefaultFooter,
    seoTitle: "",
    seoDescription: "",
    status: "DRAFT",
    publishedAt: "",
  };
}

type NewsletterFormState = {
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

function postToForm(n: NewsletterRecord): NewsletterFormState {
  return {
    title: n.title,
    subtitle: n.subtitle,
    slug: n.slug,
    issueDate: n.issueDate ? n.issueDate.slice(0, 10) : "",
    headerImageUrl: n.headerImageUrl ?? "",
    useDefaultBrandedHeader: n.useDefaultBrandedHeader,
    featuredImageUrl: n.featuredImageUrl ?? "",
    excerpt: n.excerpt,
    body: n.body,
    bodyBlocks: n.bodyBlocks ?? [],
    ctaLabel: n.ctaLabel,
    ctaUrl: n.ctaUrl,
    ctaAlign: n.ctaAlign,
    footerImageUrl: n.footerImageUrl ?? "",
    footerAltText: n.footerAltText,
    useDefaultFooterImage: n.useDefaultFooterImage,
    seoTitle: n.seoTitle,
    seoDescription: n.seoDescription,
    status: n.status,
    publishedAt: n.publishedAt ? n.publishedAt.slice(0, 16) : "",
  };
}

function toDatetimeLocal(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function parsePublishedAtForSave(
  value: string,
  intent: "draft" | "publish",
): string | null {
  if (value.trim()) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return intent === "publish" ? new Date().toISOString() : null;
}

function formatListDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function statusLabel(status: NewsletterStatus): string {
  if (status === "PUBLISHED") return "Published";
  if (status === "ARCHIVED") return "Archived";
  return "Draft";
}

function formToDraftForm(form: NewsletterFormState): NewsletterEditorDraftForm {
  return { ...form, bodyBlocks: form.bodyBlocks };
}

function recordToPayload(n: NewsletterRecord) {
  return {
    id: n.id,
    title: n.title,
    subtitle: n.subtitle,
    slug: n.slug,
    issueDate: n.issueDate,
    headerImageUrl: n.headerImageUrl,
    useDefaultBrandedHeader: n.useDefaultBrandedHeader,
    featuredImageUrl: n.featuredImageUrl,
    excerpt: n.excerpt,
    body: n.body,
    bodyBlocks: n.bodyBlocks,
    ctaLabel: n.ctaLabel,
    ctaUrl: n.ctaUrl,
    ctaAlign: n.ctaAlign,
    footerImageUrl: n.footerImageUrl,
    footerAltText: n.footerAltText,
    useDefaultFooterImage: n.useDefaultFooterImage,
    seoTitle: n.seoTitle,
    seoDescription: n.seoDescription,
    status: n.status,
    publishedAt: n.publishedAt,
  };
}

export function NewslettersManager({
  initialNewsletters,
  initialBrandSettings,
  loadError,
  onNewslettersChange,
  onSuccess,
  onError,
}: {
  initialNewsletters: NewsletterRecord[];
  initialBrandSettings: NewsletterBrandSettings;
  loadError?: string | null;
  onNewslettersChange?: (items: NewsletterRecord[]) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string | null) => void;
}) {
  const router = useRouter();
  const { state: urlState, navigate } = useSiteBuilderNavigation();
  const [items, setItems] = useState(initialNewsletters);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [brandSettings, setBrandSettings] = useState(initialBrandSettings);
  const [form, setForm] = useState<NewsletterFormState>(() => emptyForm(initialBrandSettings));
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(loadError ?? null);
  const [success, setSuccess] = useState<string | null>(null);
  const [listBusy, setListBusy] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recoveredDraft, setRecoveredDraft] = useState(false);
  const [recoveredLocalFileWarning, setRecoveredLocalFileWarning] = useState<string | null>(
    null,
  );

  const managerTab =
    urlState.page === NEWSLETTER_BUILDER_NAV.id ? urlState.newsletterTab : "issues";
  const issueFromUrl =
    urlState.page === NEWSLETTER_BUILDER_NAV.id && managerTab === "issues"
      ? urlState.issue
      : null;
  const layoutResetKey = `${urlState.page}:${managerTab}:${issueFromUrl ?? ""}`;
  const syncLayoutToUrl = useCallback(
    (mode: NewsletterComposerLayoutMode) => {
      navigate({
        page: NEWSLETTER_BUILDER_NAV.id,
        newsletterTab: "issues",
        issue: issueFromUrl ?? editingId ?? "new",
        mode,
      });
    },
    [navigate, issueFromUrl, editingId],
  );
  const [composerLayoutMode, setComposerLayoutMode] = useNewsletterComposerLayout(
    urlState.mode,
    syncLayoutToUrl,
    layoutResetKey,
  );

  const serverMetaRef = useRef<{
    serverLoadedAt: number | null;
    serverUpdatedAt: string | null;
  }>({ serverLoadedAt: null, serverUpdatedAt: null });
  const lastHydratedKeyRef = useRef<string | null>(null);
  const skipDraftPersistRef = useRef(true);

  const isComposing = Boolean(issueFromUrl);

  const resetEditor = useCallback(() => {
    navigate({
      page: NEWSLETTER_BUILDER_NAV.id,
      newsletterTab: "issues",
      issue: null,
      mode: "split",
    });
    lastHydratedKeyRef.current = null;
    setEditingId(null);
    setForm(emptyForm(brandSettings));
    setSlugTouched(false);
    setRecoveredDraft(false);
    setRecoveredLocalFileWarning(null);
    setError(null);
    setSuccess(null);
  }, [brandSettings, navigate]);

  const applyRecoveredDraftForm = useCallback(
    (draft: {
      form: NewsletterEditorDraftForm;
      slugTouched: boolean;
      composerLayoutMode: NewsletterComposerLayoutMode;
    }) => {
      const { form: sanitized, hadInvalid, removed } = sanitizeRecoveredDraftForm(draft.form);
      setForm(sanitized as NewsletterFormState);
      setSlugTouched(draft.slugTouched);
      setRecoveredDraft(true);
      setRecoveredLocalFileWarning(
        hadInvalid ? formatRecoveredDraftLocalFileWarning(removed) : null,
      );
      skipDraftPersistRef.current = false;
    },
    [],
  );

  const reloadFromDb = useCallback(async (): Promise<boolean> => {
    setListBusy(true);
    try {
      const res = await listAdminNewsletters();
      if (!res.ok) {
        setError(res.error);
        return false;
      }
      setItems(res.newsletters);
      onNewslettersChange?.(res.newsletters);
      setError(null);
      return true;
    } finally {
      setListBusy(false);
    }
  }, [onNewslettersChange]);

  useEffect(() => {
    setItems(initialNewsletters);
  }, [initialNewsletters]);

  useEffect(() => {
    if (loadError) setError(loadError);
  }, [loadError]);

  const hydrateFromUrl = useCallback(() => {
    if (urlState.page !== NEWSLETTER_BUILDER_NAV.id) return;

    if (managerTab === "branding") {
      lastHydratedKeyRef.current = `branding`;
      setEditingId(null);
      setRecoveredDraft(false);
      setRecoveredLocalFileWarning(null);
      return;
    }

    if (!issueFromUrl) {
      lastHydratedKeyRef.current = "issues:list";
      setEditingId(null);
      setRecoveredDraft(false);
      setRecoveredLocalFileWarning(null);
      return;
    }

    const hydrateKey = `issues:${issueFromUrl}`;
    if (lastHydratedKeyRef.current === hydrateKey) return;

    if (issueFromUrl === "new") {
      lastHydratedKeyRef.current = hydrateKey;
      setEditingId("new");
      const draft = loadNewsletterEditorDraft(newIssueDraftKey());
      if (
        draft &&
        shouldApplyNewsletterEditorDraft(draft, {
          draftKey: newIssueDraftKey(),
          serverLoadedAt: null,
        })
      ) {
        applyRecoveredDraftForm(draft);
        serverMetaRef.current = { serverLoadedAt: null, serverUpdatedAt: null };
      } else {
        setForm(emptyForm(brandSettings));
        setSlugTouched(false);
        setRecoveredDraft(false);
        setRecoveredLocalFileWarning(null);
        skipDraftPersistRef.current = false;
        serverMetaRef.current = { serverLoadedAt: null, serverUpdatedAt: null };
      }
      return;
    }

    const record =
      items.find((n) => n.id === issueFromUrl) ??
      initialNewsletters.find((n) => n.id === issueFromUrl);
    if (!record) {
      if (listBusy) return;
      lastHydratedKeyRef.current = hydrateKey;
      setError(`Newsletter not found (id ${issueFromUrl}).`);
      navigate({ issue: null });
      return;
    }

    lastHydratedKeyRef.current = hydrateKey;
    setEditingId(record.id);
    const serverLoadedAt = Date.now();
    const draft = loadNewsletterEditorDraft(record.id);
    if (
      draft &&
      shouldApplyNewsletterEditorDraft(draft, {
        draftKey: record.id,
        serverLoadedAt,
        serverUpdatedAt: record.updatedAt,
      })
    ) {
      applyRecoveredDraftForm(draft);
    } else {
      setForm(postToForm(record));
      setSlugTouched(true);
      setRecoveredDraft(false);
      setRecoveredLocalFileWarning(null);
      skipDraftPersistRef.current = true;
    }
    serverMetaRef.current = {
      serverLoadedAt,
      serverUpdatedAt: record.updatedAt,
    };
  }, [
    urlState.page,
    managerTab,
    issueFromUrl,
    items,
    initialNewsletters,
    brandSettings,
    listBusy,
    navigate,
    applyRecoveredDraftForm,
  ]);

  useEffect(() => {
    hydrateFromUrl();
  }, [hydrateFromUrl]);

  const draftStorageKey =
    editingId === "new" ? newIssueDraftKey() : editingId && editingId !== "new" ? editingId : null;

  useEffect(() => {
    if (!draftStorageKey || !isComposing || managerTab === "branding" || skipDraftPersistRef.current) {
      return;
    }
    const timer = window.setTimeout(() => {
      const { form: draftForm } = sanitizeRecoveredDraftForm(formToDraftForm(form));
      saveNewsletterEditorDraft({
        draftKey: draftStorageKey,
        savedAt: Date.now(),
        serverLoadedAt: serverMetaRef.current.serverLoadedAt,
        serverUpdatedAt: serverMetaRef.current.serverUpdatedAt,
        slugTouched,
        composerLayoutMode,
        form: draftForm,
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [form, composerLayoutMode, slugTouched, draftStorageKey, isComposing, managerTab]);

  const patchForm = useCallback((patch: Partial<NewsletterFormState>) => {
    skipDraftPersistRef.current = false;
    setForm((f) => ({ ...f, ...patch }));
  }, []);

  const handleBlocksChange = useCallback(
    (bodyBlocks: NewsletterBlocks) => {
      patchForm({ bodyBlocks });
    },
    [patchForm],
  );

  const composerMeta = useMemo(
    (): NewsletterComposerMeta => ({
      title: form.title,
      subtitle: form.subtitle,
      excerpt: form.excerpt,
      featuredImageUrl: form.featuredImageUrl,
      headerImageUrl: form.headerImageUrl,
      useDefaultBrandedHeader: form.useDefaultBrandedHeader,
      issueDateLabel: form.issueDate
        ? (formatNewsletterIssueDateLabel(new Date(form.issueDate).toISOString()) ?? undefined)
        : undefined,
      ctaLabel: form.ctaLabel,
      ctaUrl: form.ctaUrl,
      ctaAlign: form.ctaAlign,
      footerImageUrl: form.footerImageUrl,
      footerAltText: form.footerAltText,
      useDefaultFooterImage: form.useDefaultFooterImage,
    }),
    [
      form.title,
      form.subtitle,
      form.excerpt,
      form.featuredImageUrl,
      form.headerImageUrl,
      form.useDefaultBrandedHeader,
      form.issueDate,
      form.ctaLabel,
      form.ctaUrl,
      form.ctaAlign,
      form.footerImageUrl,
      form.footerAltText,
      form.useDefaultFooterImage,
    ],
  );

  const localFileBlocked = useMemo(
    () => hasBlockingLocalFileReferences(formToDraftForm(form)),
    [form],
  );

  const publishReady = useMemo(
    () => hasVisibleNewsletterContent(form.body, form.bodyBlocks),
    [form.body, form.bodyBlocks],
  );

  function discardRecoveredDraft() {
    const key = editingId === "new" ? newIssueDraftKey() : editingId;
    if (!key) return;
    clearNewsletterEditorDraftAll(key);
    lastHydratedKeyRef.current = null;
    if (editingId === "new") {
      setForm(emptyForm(brandSettings));
      setSlugTouched(false);
    } else {
      const record = items.find((n) => n.id === editingId);
      if (record) {
        setForm(postToForm(record));
        setSlugTouched(true);
        serverMetaRef.current = {
          serverLoadedAt: Date.now(),
          serverUpdatedAt: record.updatedAt,
        };
      }
    }
    setRecoveredDraft(false);
    setRecoveredLocalFileWarning(null);
    hydrateFromUrl();
  }

  function clearLocalFileLinksInForm() {
    const sanitized = clearLocalFileReferencesFromForm(formToDraftForm(form));
    patchForm(sanitized as Partial<NewsletterFormState>);
    setRecoveredLocalFileWarning(null);
    setError(null);
  }

  function startNew() {
    lastHydratedKeyRef.current = null;
    setSettingsOpen(false);
    navigate({
      page: NEWSLETTER_BUILDER_NAV.id,
      newsletterTab: "issues",
      issue: "new",
      mode: "split",
    });
  }

  function startEdit(n: NewsletterRecord) {
    lastHydratedKeyRef.current = null;
    setError(null);
    setSettingsOpen(false);
    navigate({
      page: NEWSLETTER_BUILDER_NAV.id,
      newsletterTab: "issues",
      issue: n.id,
      mode: "split",
    });
  }

  function previewUrl(n: NewsletterRecord): string {
    return `/newsletters/${n.slug}`;
  }

  function handleTitleChange(title: string) {
    patchForm({ title });
    if (!slugTouched) {
      patchForm({ slug: slugifyTitle(title) });
    }
  }

  function buildPayload(intent: "draft" | "publish") {
    const title = form.title.trim();
    return {
      id: editingId === "new" ? undefined : editingId ?? undefined,
      title,
      subtitle: form.subtitle,
      slug: form.slug,
      issueDate: form.issueDate.trim() ? new Date(form.issueDate).toISOString() : null,
      headerImageUrl: form.headerImageUrl.trim() || null,
      useDefaultBrandedHeader: form.useDefaultBrandedHeader,
      featuredImageUrl: form.featuredImageUrl.trim() || null,
      excerpt: form.excerpt,
      body: blocksToPlainBody(form.bodyBlocks) || form.body,
      bodyBlocks: form.bodyBlocks,
      ctaLabel: form.ctaLabel,
      ctaUrl: form.ctaUrl,
      ctaAlign: form.ctaAlign,
      footerImageUrl: form.footerImageUrl.trim() || null,
      footerAltText: form.footerAltText,
      useDefaultFooterImage: form.useDefaultFooterImage,
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      status: intent === "publish" ? ("PUBLISHED" as const) : ("DRAFT" as const),
      publishedAt: parsePublishedAtForSave(form.publishedAt, intent),
    };
  }

  function applySaveResult(
    res:
      | {
          ok: true;
          newsletter: NewsletterRecord;
          message: string;
          hub?: {
            ministryUpdatesPostId: string;
            ministryUpdatesSpaceSlug: string;
            newsletterSpacePostId: string | null;
            newsletterSpaceSlug: string | null;
            announcementPostId: string;
            announcementSpaceSlug: string;
          };
        }
      | { ok: false; error: string },
  ) {
    if (!res.ok) {
      setSuccess(null);
      setError(res.error);
      onError?.(res.error);
      return;
    }
    const wasNew = editingId === "new" || !editingId;
    clearNewsletterEditorDraftAll(newIssueDraftKey());
    clearNewsletterEditorDraftAll(res.newsletter.id);
    lastHydratedKeyRef.current = null;
    setRecoveredDraft(false);
    setRecoveredLocalFileWarning(null);
    skipDraftPersistRef.current = true;
    serverMetaRef.current = {
      serverLoadedAt: Date.now(),
      serverUpdatedAt: res.newsletter.updatedAt,
    };
    setEditingId(res.newsletter.id);
    setForm(postToForm(res.newsletter));
    setSlugTouched(true);
    navigate({
      page: NEWSLETTER_BUILDER_NAV.id,
      newsletterTab: "issues",
      issue: res.newsletter.id,
      mode: composerLayoutMode,
    });
    if (wasNew) {
      // ensure hydration runs with new id
      lastHydratedKeyRef.current = null;
    }
        const detail = res.hub
          ? [
              res.message,
              `Ministry Updates: /community/${res.hub.ministryUpdatesSpaceSlug}#post-${res.hub.ministryUpdatesPostId}`,
              res.hub.newsletterSpacePostId && res.hub.newsletterSpaceSlug
                ? `Newsletter space: /community/${res.hub.newsletterSpaceSlug}#post-${res.hub.newsletterSpacePostId}`
                : "Newsletter space: skipped (space not configured).",
            ].join("\n")
          : res.message;
        setSuccess(detail);
        onSuccess?.(detail);
    void (async () => {
      const listRes = await listAdminNewsletters();
      if (listRes.ok) {
        const merged = mergeAdminNewsletters(listRes.newsletters, res.newsletter);
        setItems(merged);
        onNewslettersChange?.(merged);
        setError(null);
        onError?.(null);
      } else {
        setItems((prev) => {
          const merged = mergeAdminNewsletters(prev, res.newsletter);
          onNewslettersChange?.(merged);
          return merged;
        });
        const listErr = `Saved (id ${res.newsletter.id}) but list reload failed: ${listRes.error}`;
        setError(listErr);
        onError?.(listErr);
      }
      router.refresh();
    })();
  }

  function save(intent: "draft" | "publish") {
    perfMark("save", intent);
    setError(null);
    setSuccess(null);
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (localFileBlocked) {
      setError(BLOCKING_LOCAL_FILE_SAVE_MESSAGE);
      return;
    }
    if (intent === "publish" && !hasVisibleNewsletterContent(form.body, form.bodyBlocks)) {
      setError("Add at least one content block before publishing.");
      return;
    }

    const payload = buildPayload(intent);
    const isNew = !editingId || editingId === "new";

    startTransition(async () => {
      try {
        let res;
        if (intent === "publish") {
          res = await publishNewsletterAction(payload);
        } else if (isNew) {
          const { id: _id, ...createInput } = payload;
          res = await createNewsletterDraftAction(createInput);
        } else {
          res = await updateNewsletterDraftAction(editingId!, payload);
        }
        applySaveResult(res);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not save newsletter";
        setError(msg);
        onError?.(msg);
      }
    });
  }

  function quickPublish(n: NewsletterRecord) {
    startTransition(async () => {
      const res = await publishNewsletterAction(recordToPayload(n));
      if (!res.ok) {
        setError(res.error);
        return;
      }
      applySaveResult(res);
    });
  }

  function quickUnpublish(id: string) {
    startTransition(async () => {
      const res = await unpublishNewsletterAction(id);
      applySaveResult(res);
    });
  }

  function quickArchive(id: string) {
    startTransition(async () => {
      const res = await archiveNewsletterAction(id);
      applySaveResult(res);
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-zinc-950 text-zinc-100">
      <div className="shrink-0 border-b border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Newsletters</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Published issues appear at /newsletters. Mission Hub announcement on publish.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-zinc-700 p-0.5 text-xs">
            <button
              type="button"
              className={cn(
                "px-3 py-1 rounded-full transition-colors",
                managerTab === "issues" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300",
              )}
              onClick={() => {
                perfMark("tab-issues");
                lastHydratedKeyRef.current = null;
                navigate({
                  page: NEWSLETTER_BUILDER_NAV.id,
                  newsletterTab: "issues",
                  issue: issueFromUrl,
                });
              }}
            >
              Issues
            </button>
            <button
              type="button"
              className={cn(
                "px-3 py-1 rounded-full transition-colors",
                managerTab === "branding" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300",
              )}
              onClick={() => {
                perfMark("tab-branding");
                lastHydratedKeyRef.current = null;
                navigate({
                  page: NEWSLETTER_BUILDER_NAV.id,
                  newsletterTab: "branding",
                  issue: null,
                });
              }}
            >
              Branding
            </button>
          </div>
          {managerTab === "issues" ? (
            <Button type="button" size="sm" onClick={startNew} className="rounded-full shrink-0">
              <Plus className="h-4 w-4 mr-1" aria-hidden />
              New newsletter
            </Button>
          ) : null}
        </div>
      </div>

      {managerTab === "branding" ? (
        <NewsletterBrandingPanel
          initialSettings={brandSettings}
          onSaved={(settings) => {
            setBrandSettings(settings);
            onSuccess?.("Newsletter branding saved.");
          }}
        />
      ) : isComposing ? (
        <div className="flex flex-1 min-h-0 flex-col">
          <div className="shrink-0 sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur px-3 py-2 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-zinc-400 shrink-0"
              onClick={resetEditor}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              All issues
            </Button>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-100 truncate">
                {form.title.trim() || "Untitled newsletter"}
              </p>
              {form.slug ? (
                <p className="text-[10px] text-zinc-500 truncate">/newsletters/{form.slug}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending || !form.title.trim() || localFileBlocked}
                onClick={() => save("draft")}
                className="rounded-full h-8"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save draft
              </Button>
              {editingId && editingId !== "new" && form.slug ? (
                <Button type="button" variant="outline" size="sm" asChild className="rounded-full h-8">
                  <a
                    href={previewUrl({ slug: form.slug } as NewsletterRecord)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Live
                  </a>
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                disabled={
                  isPending ||
                  localFileBlocked ||
                  !form.title.trim() ||
                  !publishReady
                }
                onClick={() => save("publish")}
                className="rounded-full h-8 bg-brand-primary"
              >
                Publish
              </Button>
            </div>
          </div>

          {(recoveredDraft || recoveredLocalFileWarning || localFileBlocked || error || success) && (
            <div className="shrink-0 px-4 py-2 border-b border-zinc-800/80 bg-zinc-950 space-y-1">
              {recoveredDraft ? (
                <div className="flex flex-wrap items-center gap-2 text-sm text-amber-400/90">
                  <span role="status">Recovered unsaved draft changes.</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-zinc-400 hover:text-zinc-200"
                    onClick={discardRecoveredDraft}
                  >
                    Discard recovered changes
                  </Button>
                </div>
              ) : null}
              {recoveredLocalFileWarning ? (
                <p className="text-sm text-amber-400/90 whitespace-pre-wrap" role="status">
                  {recoveredLocalFileWarning}
                </p>
              ) : null}
              {localFileBlocked ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-amber-500/90" role="status">
                    {BLOCKING_LOCAL_FILE_SAVE_MESSAGE}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-zinc-400 hover:text-zinc-200"
                    onClick={clearLocalFileLinksInForm}
                  >
                    Clear local file links
                  </Button>
                </div>
              ) : null}
              {error ? (
                <p className="text-sm text-red-400 whitespace-pre-wrap" role="alert">
                  {error}
                </p>
              ) : null}
              {success ? (
                <p className="text-sm text-emerald-400 whitespace-pre-wrap" role="status">
                  {success}
                </p>
              ) : null}
            </div>
          )}

          <NewsletterEditorWorkspace
            blocks={form.bodyBlocks}
            onBlocksChange={handleBlocksChange}
            brand={brandSettings}
            layoutMode={composerLayoutMode}
            onLayoutModeChange={setComposerLayoutMode}
            onOpenSettings={() => setSettingsOpen(true)}
            newsletterId={
              editingId && editingId !== "new" ? editingId : undefined
            }
            meta={composerMeta}
          />

          {settingsOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 bg-black/60"
                aria-label="Close settings"
                onClick={() => setSettingsOpen(false)}
              />
              <aside
                className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col"
                data-testid="newsletter-settings-drawer"
              >
                <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-100">Newsletter settings</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSettingsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <NewsletterSettingsPanel
                    form={form}
                    onPatch={patchForm}
                    onTitleChange={handleTitleChange}
                    onSlugTouched={() => setSlugTouched(true)}
                    toDatetimeLocal={toDatetimeLocal}
                    newsletterId={
                      editingId && editingId !== "new" ? editingId : undefined
                    }
                  />
                </div>
                <div className="shrink-0 px-4 py-3 border-t border-zinc-800">
                  <Button
                    type="button"
                    size="sm"
                    className="w-full rounded-full"
                    onClick={() => setSettingsOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </aside>
            </>
          ) : null}
        </div>
      ) : (
      <div className="flex flex-1 min-h-0 flex-col overflow-auto">
        <div className="flex-1 min-h-0 overflow-auto">
          {listBusy && items.length === 0 ? (
            <p className="px-4 py-6 text-xs text-zinc-500 inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading…
            </p>
          ) : null}
          {!listBusy && items.length === 0 ? (
            <p className="px-4 py-6 text-xs text-zinc-500">No newsletters yet.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-zinc-950 text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium hidden sm:table-cell">Published</th>
                  <th className="px-2 py-2 font-medium hidden md:table-cell">Updated</th>
                  <th className="px-2 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((n) => (
                  <tr
                    key={n.id}
                    className={cn(
                      "border-b border-zinc-800/80 hover:bg-zinc-900/60",
                      editingId === n.id && "bg-zinc-900",
                    )}
                  >
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="text-left font-medium text-zinc-200 hover:text-brand-primary truncate max-w-[10rem] block"
                        onClick={() => startEdit(n)}
                      >
                        {n.title}
                      </button>
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-wide font-semibold",
                          n.status === "PUBLISHED" && "text-emerald-400",
                          n.status === "ARCHIVED" && "text-amber-500/90",
                          n.status === "DRAFT" && "text-zinc-500",
                        )}
                      >
                        {statusLabel(n.status)}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-zinc-500 hidden sm:table-cell whitespace-nowrap">
                      {formatListDate(n.publishedAt)}
                    </td>
                    <td className="px-2 py-2 text-zinc-500 hidden md:table-cell whitespace-nowrap">
                      {formatListDate(n.updatedAt)}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[10px]"
                          onClick={() => startEdit(n)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[10px]"
                          asChild
                        >
                          <a href={previewUrl(n)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-0.5" />
                            Preview
                          </a>
                        </Button>
                        {n.status !== "PUBLISHED" ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px] text-emerald-400"
                            disabled={isPending}
                            onClick={() => quickPublish(n)}
                          >
                            Publish
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px]"
                            disabled={isPending}
                            onClick={() => quickUnpublish(n.id)}
                          >
                            Unpublish
                          </Button>
                        )}
                        {n.status !== "ARCHIVED" ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px] text-amber-500"
                            disabled={isPending}
                            onClick={() => quickArchive(n.id)}
                          >
                            Archive
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
