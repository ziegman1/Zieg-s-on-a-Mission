import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSiteCopy } from "@/lib/site-copy";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getSiteCopy();
  const m = copy.merchPage;
  return {
    title: m.title,
    description: m.intro.slice(0, 160),
  };
}

export default async function MerchPage() {
  const copy = await getSiteCopy();
  const m = copy.merchPage;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20 text-brand-ink">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">{m.kicker}</p>
      <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-brand-primary tracking-wide">{m.title}</h1>
      <p className="mt-6 text-lg leading-relaxed text-brand-ink/85">{m.intro}</p>

      <section className="mt-10 rounded-xl border border-brand-primary/20 bg-white/70 p-6 sm:p-8 shadow-sm">
        <h2 className="font-serif text-xl text-brand-ink tracking-wide">{m.thankYouHeading}</h2>
        <p className="mt-3 text-brand-ink/82 leading-relaxed">
          {m.thankYouBeforePartnerLink}
          <Link href="/partner" className="text-brand-primary font-medium hover:underline">
            {m.thankYouPartnerLinkLabel}
          </Link>
          {m.thankYouAfterPartnerLink}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-brand-ink tracking-wide">{m.collectionHeading}</h2>
        <p className="mt-3 text-brand-ink/82 leading-relaxed">{m.collectionBody}</p>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button
          asChild
          className="rounded-full px-7 h-12 bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold"
        >
          <Link href="/partner">{m.ctaPartner}</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full px-7 h-12 border-brand-primary/45">
          <Link href="/give">{m.ctaGive}</Link>
        </Button>
        <Button asChild variant="ghost" className="rounded-full text-brand-primary">
          <Link href="/contact">{m.ctaContact}</Link>
        </Button>
      </div>

      <p className="mt-12 text-sm text-brand-ink/60">
        <Link href="/" className="text-brand-primary hover:underline">
          {m.backHome}
        </Link>
      </p>
    </main>
  );
}
