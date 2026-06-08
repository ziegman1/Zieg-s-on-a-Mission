/** Shared typography wrapper for ministry / site-builder long-form content. */
export const MINISTRY_PROSE_CLASS =
  "prose prose-slate max-w-none text-brand-ink/90 space-y-6 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:text-brand-ink [&_h1]:tracking-tight [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-brand-ink [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:tracking-tight [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-brand-ink [&_h3]:mt-8 [&_h3]:mb-3 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-brand-ink [&_h4]:mt-6 [&_h4]:mb-2 [&_p]:leading-relaxed [&_p+p]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_blockquote]:border-l-4 [&_blockquote]:border-brand-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-brand-ink/85 [&_a]:text-brand-primary [&_a]:font-medium [&_a]:no-underline hover:[&_a]:underline [&_strong]:font-semibold [&_em]:italic [&_u]:underline";

export const FORMATTED_CONTENT_CLASS =
  "site-builder-formatted-content space-y-4 [&_p]:leading-relaxed [&_p+p]:mt-4 [&_h1]:font-serif [&_h1]:text-3xl [&_h1]:text-brand-primary [&_h1]:tracking-wide [&_h1]:mt-8 [&_h1]:mb-3 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-brand-primary [&_h2]:tracking-wide [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:text-brand-primary [&_h3]:mt-6 [&_h3]:mb-2 [&_h4]:font-serif [&_h4]:text-lg [&_h4]:text-brand-primary [&_h4]:mt-4 [&_h4]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_blockquote]:border-l-4 [&_blockquote]:border-brand-primary/25 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-brand-ink/85 [&_a]:text-brand-primary [&_a]:font-medium hover:[&_a]:underline [&_strong]:font-semibold [&_em]:italic [&_u]:underline";

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

export function looksLikeMarkdown(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || looksLikeHtml(trimmed)) return false;

  return (
    /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s+\S|\d+\.\s+\S|>\s)/m.test(trimmed) ||
    /\*\*[^*\n]+\*\*/.test(trimmed) ||
    /(^|[^\\])\*[^*\n]+\*/.test(trimmed) ||
    /\[[^\]]+\]\([^)]+\)/.test(trimmed)
  );
}

function applyInlineMarkdown(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/_([^_]+)_/g, "<em>$1</em>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, url: string) => {
    const safeUrl = url.trim().replace(/^javascript:/i, "");
    return `<a href="${escapeHtml(safeUrl)}">${label}</a>`;
  });
  return out;
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]!;
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = Math.min(heading[1]!.length, 6);
      blocks.push(`<h${level}>${applyInlineMarkdown(heading[2]!)}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index]!.trim())) {
        quoteLines.push(lines[index]!.trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(
        `<blockquote><p>${quoteLines.map(applyInlineMarkdown).join("<br />")}</p></blockquote>`,
      );
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*+]\s+/.test(lines[index]!.trim())) {
        items.push(
          `<li>${applyInlineMarkdown(lines[index]!.trim().replace(/^[-*+]\s+/, ""))}</li>`,
        );
        index += 1;
      }
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index]!.trim())) {
        items.push(
          `<li>${applyInlineMarkdown(lines[index]!.trim().replace(/^\d+\.\s+/, ""))}</li>`,
        );
        index += 1;
      }
      blocks.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      lines[index]!.trim() &&
      !/^(#{1,6}\s|[-*+]\s|\d+\.\s|>\s?)/.test(lines[index]!.trim())
    ) {
      paragraphLines.push(lines[index]!.trim());
      index += 1;
    }
    blocks.push(`<p>${paragraphLines.map(applyInlineMarkdown).join("<br />")}</p>`);
  }

  return blocks.join("");
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

  if (looksLikeMarkdown(trimmed)) return sanitizeSiteBuilderHtml(markdownToHtml(trimmed));

  return plainTextToHtml(trimmed);
}
