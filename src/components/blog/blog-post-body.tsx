import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Simple blog body: paragraphs, line breaks, basic ## headings and **bold**. */
export function BlogPostBody({ body, className }: { body: string; className?: string }) {
  const blocks = body.split(/\n\n+/).filter((b) => b.trim().length > 0);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4 text-brand-ink/88 leading-relaxed", className)}>
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} className="font-serif text-xl text-brand-primary tracking-wide mt-8">
              {formatInline(trimmed.slice(3))}
            </h2>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h3 key={i} className="font-serif text-lg text-brand-ink mt-6">
              {formatInline(trimmed.slice(2))}
            </h3>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {formatInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function formatInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-brand-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
