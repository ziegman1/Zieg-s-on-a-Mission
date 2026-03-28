import Link from "next/link";
import { Fragment } from "react";
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
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-12 sm:py-16 flex flex-col justify-center min-h-[min(90vh,52rem)]">
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
        {GUIDED_HOME_SECTIONS.map((section, i) => {
          const isTextLeft = i % 2 === 0;
          const sectionBg = i % 2 === 0 ? "bg-white" : "bg-neutral-50";

          const textColumn = (
            <div className="col-span-2 md:col-span-1 border-l-2 border-blue-200/80 pl-4">
              <h2 className="font-serif text-2xl text-brand-primary tracking-wide">{section.title}</h2>
              <p className="mt-3 text-brand-ink/85 leading-relaxed">{section.body}</p>
              <Link
                href={section.href}
                className="text-blue-600 hover:underline mt-4 inline-block font-medium"
              >
                {section.ctaLabel}
              </Link>
            </div>
          );

          const spacerColumn = (
            <div
              className="hidden md:block md:col-span-1 min-h-[5rem]"
              aria-hidden
            />
          );

          return (
            <Fragment key={section.id}>
              <section className={sectionBg}>
                <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
                  <div className="border-t border-gray-200 w-full mb-8 sm:mb-10" />
                  <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
                    {isTextLeft ? (
                      <>
                        {textColumn}
                        {spacerColumn}
                      </>
                    ) : (
                      <>
                        {spacerColumn}
                        {textColumn}
                      </>
                    )}
                  </div>
                </div>
              </section>

              {section.id === "mission" ? (
                <section className="py-16 sm:py-20 bg-blue-50">
                  <div className="max-w-3xl mx-auto px-6 text-center text-lg text-gray-700 leading-relaxed">
                    You’re not just reading a story — you’re stepping into one.
                  </div>
                </section>
              ) : null}
            </Fragment>
          );
        })}

        <section className="bg-white">
          <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
            <div className="border-t border-gray-200 w-full mb-8 sm:mb-10" />
            <div className="max-w-xl mx-auto text-center">
              <p className="text-brand-ink/88 leading-relaxed">{GUIDED_HOME_CLOSING.body}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                <Link href="/mission" className="text-blue-600 hover:underline font-medium">
                  Learn more
                </Link>
                <Link href="/give" className="text-blue-600 hover:underline font-medium">
                  Give
                </Link>
                <Button
                  asChild
                  className="rounded-full px-7 h-11 bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold"
                >
                  <Link href="/partner">Partner</Link>
                </Button>
              </div>
              <p className="mt-10 text-sm text-brand-ink/55">{DEFAULT_SITE_COPY.site.tagline}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
