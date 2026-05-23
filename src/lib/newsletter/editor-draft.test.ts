import { describe, expect, it, beforeEach } from "vitest";
import {
  clearNewsletterEditorDraft,
  hasMeaningfulDraftContent,
  loadNewsletterEditorDraft,
  newIssueDraftKey,
  saveNewsletterEditorDraft,
  shouldApplyNewsletterEditorDraft,
  type NewsletterEditorDraft,
  type NewsletterEditorDraftForm,
  type StorageLike,
} from "./editor-draft";

function emptyForm(): NewsletterEditorDraftForm {
  return {
    title: "",
    subtitle: "",
    slug: "",
    issueDate: "",
    headerImageUrl: "",
    useDefaultBrandedHeader: true,
    featuredImageUrl: "",
    excerpt: "",
    body: "",
    bodyBlocks: [],
    ctaLabel: "",
    ctaUrl: "",
    ctaAlign: "center",
    footerImageUrl: "",
    footerAltText: "",
    useDefaultFooterImage: true,
    seoTitle: "",
    seoDescription: "",
    status: "DRAFT",
    publishedAt: "",
  };
}

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

describe("newsletter editor draft storage", () => {
  let storage: StorageLike;

  beforeEach(() => {
    storage = createMemoryStorage();
  });

  it("saves and loads a new issue draft", () => {
    const draft: NewsletterEditorDraft = {
      draftKey: newIssueDraftKey(),
      savedAt: Date.now(),
      serverLoadedAt: null,
      serverUpdatedAt: null,
      slugTouched: false,
      composerLayoutMode: "split",
      form: { ...emptyForm(), title: "Draft title" },
    };
    saveNewsletterEditorDraft(draft, storage);
    const loaded = loadNewsletterEditorDraft(newIssueDraftKey(), storage);
    expect(loaded?.form.title).toBe("Draft title");
  });

  it("clears draft after save", () => {
    const key = "nl_abc";
    saveNewsletterEditorDraft(
      {
        draftKey: key,
        savedAt: Date.now(),
        serverLoadedAt: 100,
        serverUpdatedAt: null,
        slugTouched: true,
        composerLayoutMode: "edit",
        form: { ...emptyForm(), title: "Saved" },
      },
      storage,
    );
    clearNewsletterEditorDraft(key, storage);
    expect(loadNewsletterEditorDraft(key, storage)).toBeNull();
  });

  it("applies new draft always", () => {
    const draft: NewsletterEditorDraft = {
      draftKey: newIssueDraftKey(),
      savedAt: 1,
      serverLoadedAt: null,
      serverUpdatedAt: null,
      slugTouched: false,
      composerLayoutMode: "split",
      form: emptyForm(),
    };
    expect(
      shouldApplyNewsletterEditorDraft(draft, {
        draftKey: newIssueDraftKey(),
        serverLoadedAt: null,
      }),
    ).toBe(true);
  });

  it("applies existing draft only when newer than server load", () => {
    const draft: NewsletterEditorDraft = {
      draftKey: "nl_1",
      savedAt: 5000,
      serverLoadedAt: 1000,
      serverUpdatedAt: "2026-01-01T00:00:00.000Z",
      slugTouched: true,
      composerLayoutMode: "preview",
      form: { ...emptyForm(), title: "Local" },
    };
    expect(
      shouldApplyNewsletterEditorDraft(draft, {
        draftKey: "nl_1",
        serverLoadedAt: 2000,
        serverUpdatedAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe(true);
    expect(
      shouldApplyNewsletterEditorDraft(draft, {
        draftKey: "nl_1",
        serverLoadedAt: 9000,
        serverUpdatedAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe(false);
  });

  it("rejects draft when server record was updated elsewhere", () => {
    const draft: NewsletterEditorDraft = {
      draftKey: "nl_1",
      savedAt: 9000,
      serverLoadedAt: 1000,
      serverUpdatedAt: "2026-01-01T00:00:00.000Z",
      slugTouched: true,
      composerLayoutMode: "split",
      form: emptyForm(),
    };
    expect(
      shouldApplyNewsletterEditorDraft(draft, {
        draftKey: "nl_1",
        serverLoadedAt: 2000,
        serverUpdatedAt: "2026-02-01T00:00:00.000Z",
      }),
    ).toBe(false);
  });

  it("detects meaningful draft content", () => {
    expect(hasMeaningfulDraftContent(emptyForm())).toBe(false);
    expect(hasMeaningfulDraftContent({ ...emptyForm(), title: "Hi" })).toBe(true);
  });
});
