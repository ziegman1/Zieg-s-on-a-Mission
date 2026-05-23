export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterCard } from "@/components/newsletter/newsletter-card";
import { listPublishedNewsletters } from "@/lib/newsletter/newsletter-db";
import { getSiteCopy } from "@/lib/site-copy";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getSiteCopy();
  return {
    title: "Newsletters",
    description: `Updates and stories from ${copy.site.name}.`,
  };
}

export default async function NewslettersPage() {
  const copy = await getSiteCopy();
  const newsletters = await listPublishedNewsletters();

  return (
    <div className="bg-brand-surface text-brand-ink min-h-[50vh]">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <header className="mb-10 sm:mb-12 max-w-2xl">
          <h1 className="font-serif text-3xl sm:text-4xl text-brand-primary tracking-wide">
            Newsletters
          </h1>
          <p className="mt-4 text-lg text-brand-ink/85 leading-relaxed">
            Catch up on updates from {copy.site.name}. Published issues are shared here and with
            Mission Hub members when notifications are enabled.
          </p>
        </header>

        {newsletters.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2">
            {newsletters.map((item) => (
              <NewsletterCard key={item.id} newsletter={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-brand-primary/15 bg-white/70 px-6 py-10 text-center max-w-xl mx-auto">
            <p className="text-brand-ink/80 leading-relaxed">No newsletters published yet.</p>
          </div>
        )}

        <nav className="mt-14 pt-8 border-t border-brand-primary/20 flex flex-wrap gap-4 justify-center text-sm">
          <Link href="/" className="text-brand-primary font-medium hover:underline">
            ← Home
          </Link>
          <Link href="/blog" className="text-brand-primary font-medium hover:underline">
            Blog
          </Link>
          <Link href="/community" className="text-brand-primary font-medium hover:underline">
            Community
          </Link>
        </nav>
      </div>
    </div>
  );
}
