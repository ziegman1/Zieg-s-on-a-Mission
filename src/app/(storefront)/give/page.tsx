import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  COMPLIANCE_PLACEHOLDER,
  getMonthlyGivingHref,
  getOneTimeGivingHref,
  PARTNERSHIP_TIERS,
} from "@/data/partnership-content";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Give",
  description:
    "Support Zieg's on a Mission through monthly partnership or a one-time gift — training, mobilization, and gospel advance.",
};

const ONE_TIME_SUGGESTIONS = ["$50", "$100", "$250", "$500", "Other amount"] as const;

export default function GivePage() {
  const monthlyHref = getMonthlyGivingHref();
  const oneTimeHref = getOneTimeGivingHref();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16 text-brand-ink">
      <header className="mb-10 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Give</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-brand-primary tracking-wide">
          Support the mission
        </h1>
        <p className="mt-4 text-lg text-brand-ink/85 leading-relaxed max-w-2xl">
          You can walk with us through <strong className="font-semibold text-brand-ink">monthly partnership</strong>{" "}
          (our primary need for stability) or a <strong className="font-semibold text-brand-ink">one-time gift</strong>{" "}
          for special opportunities. Either way, thank you for fueling gospel advance.
        </p>
      </header>

      <section className="space-y-6 mb-14">
        <h2 className="font-serif text-xl text-brand-ink tracking-wide">Monthly partnership — primary path</h2>
        <p className="text-brand-ink/85 leading-relaxed">
          Recurring support helps us plan training, mobilization, and care in the field. When you’re ready, use the
          button below — or contact us if you’d like to talk through options first.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            className="rounded-full px-8 h-12 bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold shadow-md"
          >
            <Link href={monthlyHref}>Start monthly partnership</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6 border-brand-primary/45">
            <Link href="/partner">Learn about partnership</Link>
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-primary/25 bg-white/70 p-6 sm:p-8 mb-14 shadow-sm">
        <h2 className="font-serif text-xl text-brand-primary tracking-wide text-center sm:text-left">
          Suggested monthly levels
        </h2>
        <p className="mt-2 text-sm text-brand-ink/75 text-center sm:text-left">
          Same partnership tiers as our partner page — choose what fits your family.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {PARTNERSHIP_TIERS.map((t) => (
            <li
              key={t.name}
              className="rounded-lg border border-brand-primary/15 bg-brand-surface/80 px-4 py-3 text-sm"
            >
              <span className="font-semibold text-brand-ink">{t.amountLabel}</span>
              <span className="text-brand-ink/70"> — {t.name}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex justify-center sm:justify-start">
          <Button asChild className="rounded-full bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold">
            <Link href={monthlyHref}>Become a monthly partner</Link>
          </Button>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="font-serif text-xl text-brand-ink tracking-wide">One-time gift</h2>
        <p className="mt-3 text-brand-ink/85 leading-relaxed">
          One-time gifts help with special projects, travel, or urgent needs. If a monthly rhythm isn’t the right
          fit yet, we’re still grateful.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {ONE_TIME_SUGGESTIONS.map((label) => (
            <span
              key={label}
              className="inline-flex items-center rounded-full border border-brand-primary/25 bg-white/60 px-4 py-2 text-sm text-brand-ink/85"
            >
              {label}
            </span>
          ))}
        </div>
        <Button
          asChild
          variant="outline"
          className="mt-8 rounded-full px-8 h-11 border-brand-primary/50 text-brand-ink"
        >
          <Link href={oneTimeHref}>Give a one-time gift</Link>
        </Button>
      </section>

      <section className="mb-12">
        <h2 className="font-serif text-xl text-brand-primary tracking-wide">Thank-you gifts</h2>
        <p className="mt-3 text-brand-ink/85 leading-relaxed">
          Some support levels may include occasional thank-you gifts or milestone gifts — always as gratitude, never
          as something you “earn” like a purchase. See our{" "}
          <Link href="/partner" className="text-brand-primary font-medium hover:underline">
            partner page
          </Link>{" "}
          for how we frame gifts alongside partnership.
        </p>
      </section>

      <section className="rounded-lg border border-brand-primary/20 bg-white/55 px-5 py-4 text-sm text-brand-ink/75 leading-relaxed mb-10">
        <p className="font-medium text-brand-ink/90">Giving &amp; tax language (editable later)</p>
        <p className="mt-2">{COMPLIANCE_PLACEHOLDER}</p>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-brand-primary/20 pt-10">
        <Button asChild variant="ghost" className="text-brand-primary">
          <Link href="/contact">Questions? Contact us</Link>
        </Button>
        <Button asChild variant="ghost" className="text-brand-primary">
          <Link href="/partner">Partnership details</Link>
        </Button>
      </div>
    </article>
  );
}
