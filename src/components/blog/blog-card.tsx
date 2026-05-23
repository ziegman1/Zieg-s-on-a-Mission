import Link from "next/link";
import type { BlogPostRecord } from "@/lib/blog/types";
import { cn } from "@/lib/utils";

function formatPostDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function BlogCard({ post, className }: { post: BlogPostRecord; className?: string }) {
  const dateLabel = formatPostDate(post.publishedAt);

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl bg-white/90",
        "ring-1 ring-brand-primary/12 shadow-[0_8px_32px_rgba(30,54,68,0.06)]",
        "transition-shadow hover:shadow-[0_12px_40px_rgba(30,54,68,0.1)]",
        className,
      )}
    >
      <Link href={`/blog/${post.slug}`} className="flex flex-col flex-1">
        <div className="relative aspect-[16/10] bg-brand-surface/80 overflow-hidden">
          {post.featuredImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.featuredImageUrl}
              alt={post.featuredImageAlt || post.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/15 via-brand-surface to-white" />
          )}
        </div>
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          {dateLabel ? (
            <time
              dateTime={post.publishedAt ?? undefined}
              className="text-[11px] font-semibold uppercase tracking-wider text-brand-primary/70"
            >
              {dateLabel}
            </time>
          ) : null}
          <h2 className="mt-2 font-serif text-xl text-brand-ink tracking-wide group-hover:text-brand-primary transition-colors">
            {post.title}
          </h2>
          {post.excerpt.trim() ? (
            <p className="mt-2 text-sm text-brand-ink/75 leading-relaxed line-clamp-3">{post.excerpt}</p>
          ) : null}
          <span className="mt-4 text-sm font-semibold text-brand-primary">Read more →</span>
        </div>
      </Link>
    </article>
  );
}
