import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  COMPLIANCE_PLACEHOLDER,
  getMonthlyGivingHref,
  getOneTimeGivingHref,
  IMPACT_POINTS,
  MILESTONE_GIFTS,
  PARTNERSHIP_TIERS,
} from "@/data/partnership-content";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Become a Partner",
  description:
    "Join Zieg's on a Mission as a monthly partner — sustain training, mobilization, and gospel advance with Team Expansion.",
};

export default function PartnerPage() {
  const monthlyHref = getMonthlyGivingHref();
  const oneTimeHref = getOneTimeGivingHref();

  return (
    <div className="bg-brand-surface text-brand-ink">
      {/* Hero */}
      <section className="relative border-b border-brand-primary/20 bg-gradient-to-b from-white/60 to-brand-surface px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Join the mission</p>
          <h1 className="mt-4 font-serif text-3xl sm:text-4xl md:text-[2.75rem] text-brand-ink tracking-wide leading-tight">
            Become a Monthly Partner in the Mission
          </h1>
          <p className="mt-6 text-lg text-brand-ink/85 leading-relaxed">
            Monthly partners make ministry sustainable — so we can train, mobilize, and serve with consistency.
            You become part of the mission, not just a donor: shared prayer, shared impact, and faithful gospel
            advance among the unreached.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="rounded-full px-8 h-12 bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold shadow-md"
            >
              <Link href={monthlyHref}>Become a Monthly Partner</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full px-8 h-12 border-brand-primary/50 text-brand-ink bg-white/80 hover:bg-white"
            >
              <Link href={oneTimeHref}>Give a One-Time Gift</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why monthly */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h2 className="font-serif text-2xl text-brand-primary tracking-wide">Why monthly partnership matters</h2>
        <div className="mt-6 space-y-4 text-brand-ink/88 leading-relaxed">
          <p>
            Consistent support creates stability — for planning, for people, and for the long obedience of
            ministry. Monthly giving isn’t about a subscription; it’s about walking together month after month.
          </p>
          <p>
            Partnership is more than financial support — it’s shared mission. We pray for partners, share
            updates honestly, and want you to know your role in what God is doing.
          </p>
        </div>
      </section>

      {/* Tiers — ministry framing, not commerce */}
      <section className="border-t border-brand-primary/15 bg-white/45 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-serif text-2xl text-brand-primary tracking-wide">
            Ways to join the mission
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-brand-ink/80 leading-relaxed">
            These levels describe partnership — not products. Choose the monthly rhythm that fits; every tier
            fuels training, mobilization, and gospel advance.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {PARTNERSHIP_TIERS.map((tier) => (
              <Card
                key={tier.name}
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

      {/* Thank-you gifts */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h2 className="font-serif text-2xl text-brand-primary tracking-wide">Thank-you gifts</h2>
        <div className="mt-6 space-y-4 text-brand-ink/88 leading-relaxed">
          <p>
            As a thank-you for your partnership, we love sending occasional gifts that remind you you’re part of
            this mission — not because you “bought” something, but because we’re grateful.
          </p>
          <p>
            These gifts are expressions of gratitude, not purchases. The heart of our relationship is the gospel
            work we share; anything we send is a small celebration of that together.
          </p>
        </div>
      </section>

      {/* Milestones */}
      <section
        id="milestones"
        className="border-t border-brand-primary/15 bg-gradient-to-b from-brand-surface to-white/40 px-4 py-16 sm:py-20 scroll-mt-20"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-serif text-2xl text-brand-primary tracking-wide">
            Milestones on the journey
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-brand-ink/80 leading-relaxed">
            We celebrate faithful partnership over time — small markers of a shared mission, never a sales pitch.
          </p>
          <ol className="mt-12 grid gap-6 md:grid-cols-2">
            {MILESTONE_GIFTS.map((m, i) => (
              <li
                key={m.when}
                className="relative flex gap-4 rounded-xl border border-brand-primary/20 bg-white/70 p-6 shadow-sm"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-sm font-bold text-brand-ink"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">{m.when}</p>
                  <h3 className="mt-1 font-medium text-brand-ink">{m.title}</h3>
                  <p className="mt-2 text-sm text-brand-ink/80 leading-relaxed">{m.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Impact */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h2 className="font-serif text-2xl text-brand-primary tracking-wide">What your partnership fuels</h2>
        <p className="mt-4 text-brand-ink/85 leading-relaxed">
          Every monthly partner strengthens the same work — here are some of the outcomes we pursue together:
        </p>
        <ul className="mt-8 space-y-3 text-brand-ink/88">
          {IMPACT_POINTS.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent" aria-hidden />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Compliance note */}
      <section className="mx-auto max-w-3xl px-4 pb-8">
        <div className="rounded-lg border border-brand-primary/20 bg-white/60 px-5 py-4 text-sm text-brand-ink/75 leading-relaxed">
          <p className="font-medium text-brand-ink/90">Note for your records</p>
          <p className="mt-2">{COMPLIANCE_PLACEHOLDER}</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-brand-primary/25 bg-brand-primary/15 px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-2xl text-brand-ink tracking-wide">Take the next step</h2>
          <p className="mt-3 text-brand-ink/80">
            We’d be honored to have you on the team — monthly, one-time, or simply in conversation.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="rounded-full px-8 h-12 bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold"
            >
              <Link href={monthlyHref}>Become a Monthly Partner</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-8 h-12 border-brand-primary/50 bg-white/90">
              <Link href={oneTimeHref}>Give a One-Time Gift</Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-full px-6 text-brand-ink">
              <Link href="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
