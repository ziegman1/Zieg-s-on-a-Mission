import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-static";

export default function MerchPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20 text-brand-ink">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Support the mission</p>
      <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-brand-primary tracking-wide">
        Partner gifts &amp; mission merch
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-brand-ink/85">
        This space is for items that support the mission — including thank-you gifts for monthly partners and,
        over time, optional merch for friends who want to wear the story. Nothing here replaces partnership; it
        celebrates and fuels the work alongside you.
      </p>

      <section className="mt-10 rounded-xl border border-brand-primary/20 bg-white/70 p-6 sm:p-8 shadow-sm">
        <h2 className="font-serif text-xl text-brand-ink tracking-wide">Thank-you gifts</h2>
        <p className="mt-3 text-brand-ink/82 leading-relaxed">
          Partners may receive occasional gifts and milestone thank-yous — gratitude, not a store receipt. Read
          how we frame gifts on our{" "}
          <Link href="/partner" className="text-brand-primary font-medium hover:underline">
            partner page
          </Link>
          .
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-brand-ink tracking-wide">Broader collection</h2>
        <p className="mt-3 text-brand-ink/82 leading-relaxed">
          We&apos;re preparing a fuller selection of mission-aligned items. When it launches, you&apos;ll find it
          here — still secondary to monthly partnership and one-time giving.
        </p>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button
          asChild
          className="rounded-full px-7 h-12 bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold"
        >
          <Link href="/partner">Become a Monthly Partner</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full px-7 h-12 border-brand-primary/45">
          <Link href="/give">Give a One-Time Gift</Link>
        </Button>
        <Button asChild variant="ghost" className="rounded-full text-brand-primary">
          <Link href="/contact">Contact us</Link>
        </Button>
      </div>

      <p className="mt-12 text-sm text-brand-ink/60">
        <Link href="/" className="text-brand-primary hover:underline">
          ← Back to home
        </Link>
      </p>
    </main>
  );
}
