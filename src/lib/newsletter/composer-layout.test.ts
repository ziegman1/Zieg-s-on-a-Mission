import { describe, expect, it } from "vitest";
import {
  NEWSLETTER_COMPOSER_PREVIEW_MAX_WIDTH_PX,
  NEWSLETTER_COMPOSER_PREVIEW_MIN_WIDTH_PX,
  previewPaneWidthClass,
  shouldShowComposerEditor,
  shouldShowComposerPreview,
  type NewsletterComposerLayoutMode,
} from "./composer-layout";

describe("NewsletterComposerLayoutMode", () => {
  const modes: NewsletterComposerLayoutMode[] = ["edit", "split", "preview"];

  it("edit mode shows editor only", () => {
    expect(shouldShowComposerEditor("edit")).toBe(true);
    expect(shouldShowComposerPreview("edit")).toBe(false);
  });

  it("preview mode shows preview only", () => {
    expect(shouldShowComposerEditor("preview")).toBe(false);
    expect(shouldShowComposerPreview("preview")).toBe(true);
  });

  it("split mode shows both panes", () => {
    expect(shouldShowComposerEditor("split")).toBe(true);
    expect(shouldShowComposerPreview("split")).toBe(true);
  });

  it("covers all layout modes", () => {
    for (const mode of modes) {
      expect(shouldShowComposerEditor(mode) || shouldShowComposerPreview(mode)).toBe(true);
    }
  });
});

describe("preview width", () => {
  it("uses a realistic desktop newsletter width between 720 and 900px", () => {
    expect(NEWSLETTER_COMPOSER_PREVIEW_MIN_WIDTH_PX).toBeGreaterThanOrEqual(720);
    expect(NEWSLETTER_COMPOSER_PREVIEW_MAX_WIDTH_PX).toBeLessThanOrEqual(900);
    expect(NEWSLETTER_COMPOSER_PREVIEW_MAX_WIDTH_PX).toBeGreaterThanOrEqual(
      NEWSLETTER_COMPOSER_PREVIEW_MIN_WIDTH_PX,
    );
  });

  it("previewPaneWidthClass targets full usable width", () => {
    expect(previewPaneWidthClass()).toContain("max-w-[820px]");
    expect(previewPaneWidthClass()).toContain("mx-auto");
  });
});
