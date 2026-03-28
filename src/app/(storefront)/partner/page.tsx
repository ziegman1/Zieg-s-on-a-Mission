import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMonthlyGivingHref, getOneTimeGivingHref } from "@/data/partnership-content";
import { getSiteCopy } from "@/lib/site-copy";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getSiteCopy();
  const p = copy.partnerPage;
  return {
    title: p.metaTitle,
    description: p.metaDescription,
  };
}

export default async function PartnerPage() {
  const copy = await getSiteCopy();
  const p = copy.partnerPage;
  const monthlyHref = getMonthlyGivingHref();
  const oneTimeHref = getOneTimeGivingHref();

  return (
    <div className="bg-brand-surface text-brand-ink">
      <section className="relative border-b border-brand-primary/20 bg-gradient-to-b from-white/60 to-brand-surface px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">
            {p.heroEyebrow}
          </p>
          <h1 className="mt-4 font-serif text-3xl sm:text-4xl md:text-[2.75rem] text-brand-ink tracking-wide leading-tight">
            {p.heroTitle}
          </h1>
          <p className="mt-6 text-lg text-brand-ink/85 leading-relaxed">{p.heroBody}</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="rounded-full px-8 h-12 bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold shadow-md"
            >
              <Link href={monthlyHref}>{p.primaryCtaLabel}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full px-8 h-12 border-brand-primary/50 text-brand-ink bg-white/80 hover:bg-white"
            >
              <Link href={oneTimeHref}>{p.secondaryCtaLabel}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h2 className="font-serif text-2xl text-brand-primary tracking-wide">{p.whyHeading}</h2>
        <div className="mt-6 space-y-4 text-brand-ink/88 leading-relaxed">
          <p>{p.whyBodyParagraph1}</p>
          <p>{p.whyBodyParagraph2}</p>
        </div>
      </section>

      <section className="border-t border-brand-primary/15 bg-white/45 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-serif text-2xl text-brand-primary tracking-wide">
            {p.tiersHeading}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-brand-ink/80 leading-relaxed">
            {p.tiersIntro}
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {p.tiers.map((tier, i) => (
              <Card
                key={i}
                className="border-brand-primary/20 bg-brand-surface/90 shadow-sm overflow-hidden"
              >
                <CardContent className="p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary/90">
                    {tier.amountLabel}
                  </p>
                  <h3 className="mt-2 font-serif text-xl text-brand-ink tracking-wide">{tier.name}</h3>
                  <p className="mt-3 text-sm text-brand-ink/85 leading-relaxed">{tier.description}</p>
                  <p className="mt-4 text-xs text-brand-ink/65 italic leading-relaxed border-t border-brand-primary/15 pt-4">
                    {tier.giftNote}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h2 className="font-serif text-2xl text-brand-primary tracking-wide">{p.thankYouHeading}</h2>
        <div className="mt-6 space-y-4 text-brand-ink/88 leading-relaxed">
          <p>{p.thankYouParagraph1}</p>
          <p>{p.thankYouParagraph2}</p>
        </div>
      </section>

      <section
        id="milestones"
        className="border-t border-brand-primary/15 bg-gradient-to-b from-brand-surface to-white/40 px-4 py-16 sm:py-20 scroll-mt-20"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-serif text-2xl text-brand-primary tracking-wide">
            {p.milestonesHeading}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-brand-ink/80 leading-relaxed">
            {p.milestonesIntro}
          </p>
          <ol className="mt-12 grid gap-6 md:grid-cols-2">
            {p.milestones.map((m, i) => (
              <li
                key={`${m.when}-${i}`}
                className="relative flex gap-4 rounded-xl border border-brand-primary/20 bg-white/70 p-6 shadow-sm"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-sm font-bold text-brand-ink"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                    {m.when}
                  </p>
                  <h3 className="mt-1 font-medium text-brand-ink">{m.title}</h3>
                  <p className="mt-2 text-sm text-brand-ink/80 leading-relaxed">{m.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h2 className="font-serif text-2xl text-brand-primary tracking-wide">{p.impactHeading}</h2>
        <p className="mt-4 text-brand-ink/85 leading-relaxed">{p.impactIntro}</p>
        <ul className="mt-8 space-y-3 text-brand-ink/88">
          {p.impactBullets.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent" aria-hidden />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-8">
        <div className="rounded-lg border border-brand-primary/20 bg-white/60 px-5 py-4 text-sm text-brand-ink/75 leading-relaxed">
          <p className="font-medium text-brand-ink/90">{p.complianceBoxTitle}</p>
          <p className="mt-2">{p.complianceBoxBody}</p>
        </div>
      </section>

      <section className="border-t border-brand-primary/25 bg-brand-primary/15 px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-2xl text-brand-ink tracking-wide">{p.finalHeading}</h2>
          <p className="mt-3 text-brand-ink/80">{p.finalBody}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="rounded-full px-8 h-12 bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold"
            >
              <Link href={monthlyHref}>{p.finalPrimaryCtaLabel}</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-8 h-12 border-brand-primary/50 bg-white/90">
              <Link href={oneTimeHref}>{p.finalSecondaryCtaLabel}</Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-full px-6 text-brand-ink">
              <Link href="/contact">{p.finalContactCtaLabel}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
