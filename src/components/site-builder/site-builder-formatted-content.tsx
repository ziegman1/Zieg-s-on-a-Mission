import {
  FORMATTED_CONTENT_CLASS,
  buildFormattedContentHtml,
} from "@/lib/site-builder/formatted-content";
import { cn } from "@/lib/utils";

export function SiteBuilderFormattedContent({
  text,
  className,
  emptyPlaceholder,
}: {
  text: string;
  className?: string;
  emptyPlaceholder?: string;
}) {
  const trimmed = text.trim();
  if (!trimmed) {
    return emptyPlaceholder ? <span className={className}>{emptyPlaceholder}</span> : null;
  }

  const html = buildFormattedContentHtml(trimmed);
  if (!html) return null;

  return (
    <div
      className={cn(FORMATTED_CONTENT_CLASS, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
