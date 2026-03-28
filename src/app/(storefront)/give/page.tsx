import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMonthlyGivingHref, getOneTimeGivingHref } from "@/data/partnership-content";
import { getSiteCopy } from "@/lib/site-copy";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getSiteCopy();
  const g = copy.givePage;
  return {
    title: g.metaTitle,
    description: g.metaDescription,
  };
}

export default async function GivePage() {
  const copy = await getSiteCopy();
  const g = copy.givePage;
  const tiers = copy.partnerPage.tiers;
  const monthlyHref = getMonthlyGivingHref();
  const oneTimeHref = getOneTimeGivingHref();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16 text-brand-ink">
      <header className="mb-10 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">{g.kicker}</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-brand-primary tracking-wide">{g.title}</h1>
        <p className="mt-4 text-lg text-brand-ink/85 leading-relaxed max-w-2xl">{g.intro}</p>
      </header>

      <section className="space-y-6 mb-14">
        <h2 className="font-serif text-xl text-brand-ink tracking-wide">{g.monthlySectionHeading}</h2>
        <p className="text-brand-ink/85 leading-relaxed">{g.monthlySectionBody}</p>
        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            className="rounded-full px-8 h-12 bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold shadow-md"
          >
            <Link href={monthlyHref}>{g.startMonthlyCta}</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6 border-brand-primary/45">
            <Link href="/partner">{g.learnPartnerCta}</Link>
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-primary/25 bg-white/70 p-6 sm:p-8 mb-14 shadow-sm">
        <h2 className="font-serif text-xl text-brand-primary tracking-wide text-center sm:text-left">
          {g.suggestedLevelsHeading}
        </h2>
        <p className="mt-2 text-sm text-brand-ink/75 text-center sm:text-left">{g.suggestedLevelsIntro}</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {tiers.map((t) => (
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
            <Link href={monthlyHref}>{g.becomeMonthlyCta}</Link>
          </Button>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="font-serif text-xl text-brand-ink tracking-wide">{g.oneTimeHeading}</h2>
        <p className="mt-3 text-brand-ink/85 leading-relaxed">{g.oneTimeBody}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {g.oneTimeSuggestions.map((label, i) => (
            <span
              key={`${i}-${label}`}
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
          <Link href={oneTimeHref}>{g.oneTimeCta}</Link>
        </Button>
      </section>

      <section className="mb-12">
        <h2 className="font-serif text-xl text-brand-primary tracking-wide">{g.thankYouHeading}</h2>
        <p className="mt-3 text-brand-ink/85 leading-relaxed">
          {g.thankYouBeforePartnerLink}
          <Link href="/partner" className="text-brand-primary font-medium hover:underline">
            {g.thankYouPartnerLinkLabel}
          </Link>
          {g.thankYouAfterPartnerLink}
        </p>
      </section>

      <section className="rounded-lg border border-brand-primary/20 bg-white/55 px-5 py-4 text-sm text-brand-ink/75 leading-relaxed mb-10">
        <p className="font-medium text-brand-ink/90">{g.complianceHeading}</p>
        <p className="mt-2">{g.complianceBody}</p>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-brand-primary/20 pt-10">
        <Button asChild variant="ghost" className="text-brand-primary">
          <Link href="/contact">{g.footerContactCta}</Link>
        </Button>
        <Button asChild variant="ghost" className="text-brand-primary">
          <Link href="/partner">{g.footerPartnerCta}</Link>
        </Button>
      </div>
    </article>
  );
}
