/** Realistic desktop newsletter preview width (px). */
export const NEWSLETTER_COMPOSER_PREVIEW_MAX_WIDTH_PX = 820;

export const NEWSLETTER_COMPOSER_PREVIEW_MIN_WIDTH_PX = 720;

export type NewsletterComposerLayoutMode = "edit" | "split" | "preview";

export function shouldShowComposerEditor(mode: NewsletterComposerLayoutMode): boolean {
  return mode === "edit" || mode === "split";
}

export function shouldShowComposerPreview(mode: NewsletterComposerLayoutMode): boolean {
  return mode === "preview" || mode === "split";
}

export function previewPaneWidthClass(): string {
  return "w-full max-w-[820px] mx-auto";
}

export function composerModeButtonClass(active: boolean): string {
  return active
    ? "bg-zinc-800 text-zinc-100 shadow-sm"
    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/80";
}
