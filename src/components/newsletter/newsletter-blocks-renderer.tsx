import Link from "next/link";
import { BlogPostBody } from "@/components/blog/blog-post-body";
import { Button } from "@/components/ui/button";
import { flexJustifyClass } from "@/lib/newsletter/align";
import { visibleNewsletterBlocks } from "@/lib/newsletter/blocks/visible";
import type { ButtonAlign, NewsletterBlocks } from "@/lib/newsletter/blocks/types";
import { cn } from "@/lib/utils";

function SpacerHeight({ size }: { size: "small" | "medium" | "large" }) {
  const h = size === "small" ? "h-4" : size === "large" ? "h-12" : "h-8";
  return <div className={h} aria-hidden />;
}

function alignClass(align: ButtonAlign): string {
  return flexJustifyClass(align);
}

export function NewsletterBlocksRenderer({
  blocks,
  fallbackBody = "",
  className,
  variant = "public",
}: {
  blocks: NewsletterBlocks;
  fallbackBody?: string;
  className?: string;
  variant?: "public" | "preview-admin" | "branded";
}) {
  const visible = visibleNewsletterBlocks(blocks);
  const isBranded = variant === "branded";
  const isAdminPreview = variant === "preview-admin";

  if (visible.length === 0 && fallbackBody.trim()) {
    return (
      <div className={cn("space-y-4", isBranded && "rounded-xl bg-white/60 px-4 py-3", className)}>
        <BlogPostBody body={fallbackBody} className="text-base sm:text-[17px]" />
      </div>
    );
  }

  if (visible.length === 0) {
    return null;
  }

  const primaryStyle = isBranded
    ? { color: "var(--newsletter-primary, #5a8fb8)" }
    : undefined;
  const dividerClass = isBranded
    ? "bg-[var(--newsletter-line,#B8D4E8)]"
    : isAdminPreview
      ? "bg-zinc-700"
      : "bg-brand-primary/15";

  return (
    <div className={cn("space-y-8", className)}>
      {visible.map((block) => {
        switch (block.type) {
          case "text":
            return (
              <div key={block.id}>
                <BlogPostBody body={block.content} className="text-base sm:text-[17px]" />
              </div>
            );
          case "heading":
            return block.level === "h3" ? (
              <h3
                key={block.id}
                className="font-serif text-xl text-brand-ink tracking-wide"
                style={primaryStyle}
              >
                {block.text}
              </h3>
            ) : (
              <h2
                key={block.id}
                className={cn(
                  "font-serif text-2xl sm:text-3xl tracking-wide",
                  !isBranded && "text-brand-primary",
                )}
                style={primaryStyle}
              >
                {block.text}
              </h2>
            );
          case "image":
            return (
              <figure
                key={block.id}
                className={cn(
                  "overflow-hidden rounded-2xl ring-1",
                  isBranded ? "ring-[color-mix(in_srgb,var(--newsletter-line)_50%,transparent)]" : "ring-brand-primary/12",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.imageUrl}
                  alt={block.alt}
                  className="w-full object-cover"
                />
                {block.caption.trim() ? (
                  <figcaption className="px-4 py-2 text-sm text-brand-ink/60 text-center bg-white/80">
                    {block.caption}
                  </figcaption>
                ) : null}
              </figure>
            );
          case "image_text": {
            const img = (
              <figure className="overflow-hidden rounded-xl ring-1 ring-brand-primary/10 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.imageUrl}
                  alt={block.alt}
                  className={cn(
                    "object-cover w-full",
                    block.imagePosition === "top" ? "aspect-[16/10]" : "h-full min-h-[12rem]",
                  )}
                />
              </figure>
            );
            const copy = (
              <div className="min-w-0 space-y-3 flex-1">
                {block.heading.trim() ? (
                  <h3
                    className={cn(
                      "font-serif text-xl tracking-wide",
                      !isBranded && "text-brand-primary",
                    )}
                    style={primaryStyle}
                  >
                    {block.heading}
                  </h3>
                ) : null}
                {block.body.trim() ? (
                  <p className="text-brand-ink/85 leading-relaxed whitespace-pre-wrap">
                    {block.body}
                  </p>
                ) : null}
                {block.buttonLabel.trim() && block.buttonUrl.trim() ? (
                  <div className={cn("flex", alignClass(block.buttonAlign))}>
                    {isBranded ? (
                      <Link
                        href={block.buttonUrl}
                        className="inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white"
                        style={{ backgroundColor: "var(--newsletter-primary, #5a8fb8)" }}
                      >
                        {block.buttonLabel}
                      </Link>
                    ) : (
                      <Button asChild size="sm" className="rounded-full bg-brand-primary">
                        <Link href={block.buttonUrl}>{block.buttonLabel}</Link>
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>
            );
            if (block.imagePosition === "top") {
              return (
                <div key={block.id} className="space-y-4">
                  {img}
                  {copy}
                </div>
              );
            }
            return (
              <div
                key={block.id}
                className={cn(
                  "flex flex-col gap-6 sm:gap-8",
                  block.imagePosition === "right" ? "sm:flex-row-reverse" : "sm:flex-row",
                )}
              >
                <div className="sm:w-[42%]">{img}</div>
                <div className="sm:flex-1 flex items-center">{copy}</div>
              </div>
            );
          }
          case "document":
            return (
              <div key={block.id} className="space-y-3">
                {block.title.trim() ? (
                  <h3
                    className={cn(
                      "font-serif text-xl tracking-wide",
                      !isBranded && "text-brand-primary",
                    )}
                    style={primaryStyle}
                  >
                    {block.title}
                  </h3>
                ) : null}
                {block.description.trim() ? (
                  <p className="text-brand-ink/85 leading-relaxed whitespace-pre-wrap">
                    {block.description}
                  </p>
                ) : null}
                <div className={cn("flex", alignClass(block.align))}>
                  {isBranded ? (
                    <Link
                      href={block.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-sm"
                      style={{ backgroundColor: "var(--newsletter-primary, #5a8fb8)" }}
                    >
                      {block.buttonLabel}
                    </Link>
                  ) : (
                    <Button asChild className="rounded-full bg-brand-primary">
                      <Link
                        href={block.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {block.buttonLabel}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          case "button":
            return (
              <div key={block.id} className={cn("flex", alignClass(block.align))}>
                {isBranded ? (
                  <Link
                    href={block.url}
                    className="inline-flex rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-sm"
                    style={{ backgroundColor: "var(--newsletter-primary, #5a8fb8)" }}
                  >
                    {block.label}
                  </Link>
                ) : (
                  <Button asChild className="rounded-full bg-brand-primary">
                    <Link href={block.url}>{block.label}</Link>
                  </Button>
                )}
              </div>
            );
          case "divider":
            return <hr key={block.id} className={cn("border-0 h-px", dividerClass)} />;
          case "quote":
            return (
              <blockquote
                key={block.id}
                className={cn(
                  "border-l-4 pl-5 py-1 space-y-2",
                  isBranded ? "border-[var(--newsletter-line,#B8D4E8)]" : "border-brand-primary/35",
                )}
              >
                <p className="font-serif text-lg text-brand-ink/90 leading-relaxed italic">
                  {block.text}
                </p>
                {block.attribution.trim() ? (
                  <cite className="text-sm text-brand-ink/55 not-italic">
                    — {block.attribution}
                  </cite>
                ) : null}
              </blockquote>
            );
          case "spacer":
            return <SpacerHeight key={block.id} size={block.size} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
