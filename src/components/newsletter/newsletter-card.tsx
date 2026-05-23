import Link from "next/link";
import type { NewsletterRecord } from "@/lib/newsletter/types";

function formatDate(iso: string | null): string {
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

export function NewsletterCard({ newsletter }: { newsletter: NewsletterRecord }) {
  const dateLabel = formatDate(newsletter.issueDate ?? newsletter.publishedAt);

  return (
    <article className="group rounded-2xl border border-brand-primary/12 bg-white/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {newsletter.featuredImageUrl ? (
        <Link href={`/newsletters/${newsletter.slug}`} className="block aspect-[16/10] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={newsletter.featuredImageUrl}
            alt=""
            className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        </Link>
      ) : null}
      <div className="p-5 sm:p-6">
        {dateLabel ? (
          <time className="text-xs font-semibold uppercase tracking-wider text-brand-primary/70">
            {dateLabel}
          </time>
        ) : null}
        <h2 className="mt-2 font-serif text-xl text-brand-primary tracking-wide leading-snug">
          <Link href={`/newsletters/${newsletter.slug}`} className="hover:underline">
            {newsletter.title}
          </Link>
        </h2>
        {newsletter.subtitle ? (
          <p className="mt-1 text-sm text-brand-ink/75">{newsletter.subtitle}</p>
        ) : null}
        {newsletter.excerpt ? (
          <p className="mt-3 text-brand-ink/80 text-sm leading-relaxed line-clamp-3">
            {newsletter.excerpt}
          </p>
        ) : null}
        <p className="mt-4">
          <Link
            href={`/newsletters/${newsletter.slug}`}
            className="text-sm font-semibold text-brand-primary hover:underline"
          >
            Read newsletter →
          </Link>
        </p>
      </div>
    </article>
  );
}
