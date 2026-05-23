import { describe, expect, it, beforeEach, vi } from "vitest";
import { validateNewsletterBlocks } from "@/lib/newsletter/blocks/validate";
import {
  clearNewsletterEditorDraftAll,
  loadNewsletterEditorDraft,
  newIssueDraftKey,
  saveNewsletterEditorDraft,
  type NewsletterEditorDraft,
  type NewsletterEditorDraftForm,
  type StorageLike,
} from "./editor-draft";
import {
  findLocalFileReferencesInEditorForm,
  hasBlockingLocalFileReferences,
  isInvalidLocalFileReference,
  sanitizeRecoveredDraftForm,
} from "./editor-draft-local-files";

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

describe("isInvalidLocalFileReference", () => {
  it("detects file:// URLs", () => {
    expect(isInvalidLocalFileReference("file:///Users/me/report.pdf")).toBe(true);
  });

  it("detects bare PDF filenames", () => {
    expect(isInvalidLocalFileReference("quarterly-report.pdf")).toBe(true);
    expect(isInvalidLocalFileReference("026-03%20Report.pdf")).toBe(true);
  });

  it("allows hosted URLs", () => {
    expect(
      isInvalidLocalFileReference(
        "https://example.supabase.co/storage/v1/object/public/newsletter-assets/temp/documents/a.pdf",
      ),
    ).toBe(false);
  });
});

describe("sanitizeRecoveredDraftForm", () => {
  it("detects file:// in recovered document block", () => {
    const form: NewsletterEditorDraftForm = {
      ...emptyForm(),
      title: "Field update",
      bodyBlocks: [
        {
          id: "doc-1",
          type: "document",
          documentUrl: "file:///Users/me/Newsletter.pdf",
          title: "Prayer guide",
          description: "Please re-upload",
          buttonLabel: "Download PDF",
          align: "center",
        },
      ],
    };

    const issues = findLocalFileReferencesInEditorForm(form);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.label).toContain("Prayer guide");

    const { form: sanitized, hadInvalid, removed } = sanitizeRecoveredDraftForm(form);
    expect(hadInvalid).toBe(true);
    expect(removed[0]?.removedValue).toContain("file://");
    expect(sanitized.bodyBlocks[0]).toMatchObject({
      type: "document",
      documentUrl: "",
      title: "Prayer guide",
      description: "Please re-upload",
      buttonLabel: "Download PDF",
    });
    expect(hasBlockingLocalFileReferences(sanitized)).toBe(false);
  });

  it("preserves valid text blocks when sanitizing document URL", () => {
    const form: NewsletterEditorDraftForm = {
      ...emptyForm(),
      bodyBlocks: [
        {
          id: "txt-1",
          type: "text",
          content: "## Hello\n\nParagraph kept.",
        },
        {
          id: "doc-1",
          type: "document",
          documentUrl: "C:\\Users\\me\\guide.pdf",
          title: "",
          description: "",
          buttonLabel: "Open",
          align: "center",
        },
      ],
    };

    const { form: sanitized } = sanitizeRecoveredDraftForm(form);
    expect(sanitized.bodyBlocks[0]).toMatchObject({
      type: "text",
      content: "## Hello\n\nParagraph kept.",
    });
    expect(
      sanitized.bodyBlocks[1]?.type === "document" && sanitized.bodyBlocks[1].documentUrl,
    ).toBe("");
  });

  it("allows draft save validation after invalid local file is removed", () => {
    const { form: sanitized } = sanitizeRecoveredDraftForm({
      ...emptyForm(),
      title: "Test issue",
      bodyBlocks: [
        {
          id: "doc-1",
          type: "document",
          documentUrl: "file:///tmp/x.pdf",
          title: "Guide",
          description: "",
          buttonLabel: "Download",
          align: "center",
        },
      ],
    });

    expect(hasBlockingLocalFileReferences(sanitized)).toBe(false);
    expect(validateNewsletterBlocks(sanitized.bodyBlocks, "draft")).toHaveLength(0);
  });
});

describe("clearNewsletterEditorDraftAll", () => {
  let storage: StorageLike;
  let sessionMap: Map<string, string>;

  beforeEach(() => {
    storage = createMemoryStorage();
    sessionMap = new Map();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: (k: string) => sessionMap.get(k) ?? null,
        setItem: (k: string, v: string) => {
          sessionMap.set(k, v);
        },
        removeItem: (k: string) => {
          sessionMap.delete(k);
        },
      },
    });
  });

  it("clears local and session draft storage", () => {
    const key = newIssueDraftKey();
    const draft: NewsletterEditorDraft = {
      draftKey: key,
      savedAt: Date.now(),
      serverLoadedAt: null,
      serverUpdatedAt: null,
      slugTouched: false,
      composerLayoutMode: "split",
      form: { ...emptyForm(), title: "Stale" },
    };
    saveNewsletterEditorDraft(draft, storage);
    window.sessionStorage.setItem("newsletter-editor-draft:v1:new", JSON.stringify(draft));

    clearNewsletterEditorDraftAll(key, storage);
    expect(loadNewsletterEditorDraft(key, storage)).toBeNull();
    expect(sessionMap.has("newsletter-editor-draft:v1:new")).toBe(false);
  });
});
