import Link from "next/link";
import { Dancing_Script } from "next/font/google";
import { getStaticHomeHero } from "@/data/home-static";
import { GUIDED_HOME_CLOSING, GUIDED_HOME_SECTIONS } from "@/data/home-guided-sections";
import { DEFAULT_SITE_COPY } from "@/data/site-copy-defaults";
import { Button } from "@/components/ui/button";

const heroTitle = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const dynamic = "force-static";

export default function HomePage() {
  const hero = getStaticHomeHero();

  return (
    <div>
      <section className="relative min-h-[min(90vh,52rem)] flex items-stretch border-b border-brand-primary/20">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero-zieg-mission.png"
            alt=""
            className="w-full h-full object-cover object-[center_22%] sm:object-center"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(234_229_225/0.48)_0%,rgb(234_229_225/0.09)_28%,transparent_52%)] sm:bg-[linear-gradient(to_right,rgb(234_229_225/0.4)_0%,rgb(234_229_225/0.05)_26%,transparent_48%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-surface/22 via-transparent to-transparent sm:from-brand-surface/12 pointer-events-none" />
          <div
            className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_100%_72%_at_22%_48%,rgb(234_229_225/0.24)_0%,rgb(234_229_225/0.08)_42%,transparent_62%)] sm:bg-[radial-gradient(ellipse_90%_62%_at_20%_46%,rgb(234_229_225/0.2)_0%,rgb(234_229_225/0.06)_40%,transparent_58%)]"
            aria-hidden
          />
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-16 sm:py-24 flex flex-col justify-center min-h-[min(90vh,52rem)]">
          <div className="max-w-[min(100%,calc(36rem-75px))] text-left -translate-y-[50px]">
            <h1
              className={`${heroTitle.className} text-[2.25rem] sm:text-4xl md:text-5xl lg:text-[3.25rem] text-brand-ink font-bold tracking-normal leading-[1.15] [text-shadow:0_1px_0_rgba(255,255,255,0.65),0_2px_12px_rgba(255,255,255,0.45),0_0.5px_0_rgba(30,54,68,0.55)]`}
            >
              {hero.headline}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-brand-ink leading-relaxed max-w-prose [text-shadow:0_1px_2px_rgba(255,255,255,0.85),0_0_1px_rgba(255,255,255,0.5)]">
              {hero.body}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                className="rounded-full px-7 h-12 bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold shadow-md"
              >
                <Link href={hero.primaryCta.href}>{hero.primaryCta.label}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full px-7 h-12 border-brand-primary/50 text-brand-ink bg-white/80 hover:bg-white"
              >
                <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="rounded-full px-5 h-12 text-brand-ink/90 bg-white/50 hover:bg-white/70"
              >
                <Link href="/mission">Learn more</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-brand-surface text-brand-ink">
        {GUIDED_HOME_SECTIONS.map((section, i) => (
          <section
            key={section.id}
            className={
              i % 2 === 0
                ? "border-t border-brand-primary/15 bg-white/45"
                : "border-t border-brand-primary/15 bg-brand-surface"
            }
          >
            <div className="mx-auto max-w-2xl px-4 py-12 sm:py-14 text-center sm:text-left">
              <h2 className="font-serif text-2xl text-brand-primary tracking-wide">{section.title}</h2>
              <p className="mt-4 text-brand-ink/85 leading-relaxed">{section.body}</p>
              <Link
                href={section.href}
                className="mt-5 inline-block text-brand-primary font-medium hover:underline"
              >
                {section.ctaLabel}
              </Link>
            </div>
          </section>
        ))}

        <section className="border-t border-brand-primary/20 bg-brand-primary/10 px-4 py-14 sm:py-16">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-brand-ink/88 leading-relaxed">{GUIDED_HOME_CLOSING.body}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                variant="outline"
                className="rounded-full px-7 h-11 border-brand-primary/45 bg-white/90 text-brand-ink"
              >
                <Link href="/mission">Learn more</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full px-7 h-11 border-brand-primary/45 bg-white/90 text-brand-ink"
              >
                <Link href="/give">Give</Link>
              </Button>
              <Button
                asChild
                className="rounded-full px-7 h-11 bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold"
              >
                <Link href="/partner">Partner</Link>
              </Button>
            </div>
            <p className="mt-10 text-sm text-brand-ink/55">{DEFAULT_SITE_COPY.site.tagline}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
