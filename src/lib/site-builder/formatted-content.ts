/** Shared typography wrapper for ministry / site-builder long-form content. */
export const MINISTRY_PROSE_CLASS =
  "prose prose-slate max-w-none text-brand-ink/90 space-y-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-brand-ink [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:tracking-tight [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-brand-ink [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:leading-relaxed [&_p+p]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_a]:text-brand-primary [&_a]:font-medium [&_a]:no-underline hover:[&_a]:underline [&_strong]:font-semibold [&_em]:italic";

export const FORMATTED_CONTENT_CLASS =
  "site-builder-formatted-content space-y-4 [&_p]:leading-relaxed [&_p+p]:mt-4 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-brand-primary [&_h2]:tracking-wide [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:text-brand-primary [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_a]:text-brand-primary [&_a]:font-medium hover:[&_a]:underline [&_strong]:font-semibold [&_em]:italic [&_u]:underline";

const BLOCKED_TAG_PATTERN =
  /<\/?(?:script|style|iframe|object|embed|form|input|textarea|select|button|link|meta|base|svg|math)[^>]*>/gi;

const EVENT_HANDLER_PATTERN = /\s(on\w+|style)=(".*?"|'.*?'|[^\s>]+)/gi;
const JAVASCRIPT_URL_PATTERN = /href\s*=\s*("|\')?\s*javascript:[^"'>\s]*/gi;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function looksLikeHtml(text: string): boolean {
  return /<\/?[a-z][\s\S]*?>/i.test(text.trim());
}

export function plainTextToHtml(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return "";

  return normalized
    .split(/\n\s*\n+/)
    .map((paragraph) => {
      const lines = paragraph
        .split("\n")
        .map((line) => escapeHtml(line))
        .join("<br />");
      return `<p>${lines}</p>`;
    })
    .join("");
}

function tryParseRichTextJson(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const html = (parsed as { html?: unknown }).html;
      if (typeof html === "string" && html.trim()) return html;
    }
  } catch {
    return null;
  }

  return null;
}

export function sanitizeSiteBuilderHtml(html: string): string {
  let out = html;
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  out = out.replace(BLOCKED_TAG_PATTERN, "");
  out = out.replace(EVENT_HANDLER_PATTERN, "");
  out = out.replace(JAVASCRIPT_URL_PATTERN, 'href="#"');
  return out.trim();
}

export function buildFormattedContentHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const jsonHtml = tryParseRichTextJson(trimmed);
  if (jsonHtml) return sanitizeSiteBuilderHtml(jsonHtml);

  if (looksLikeHtml(trimmed)) return sanitizeSiteBuilderHtml(trimmed);

  return plainTextToHtml(trimmed);
}
