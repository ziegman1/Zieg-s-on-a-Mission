import Link from "next/link";
import { Dancing_Script } from "next/font/google";
import { CATEGORY_SLUGS, CATEGORY_LABELS } from "@/data/product-tags";
import { HOME_STATIC, getStaticHomeHero } from "@/data/home-static";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const heroTitle = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  apparel: "T-shirts, hoodies, polos, and more",
  drinkware: "Tumblers, mugs, and drinkware",
};

/** Public homepage is fully static — no DB / Prisma / catalog. */
export const dynamic = "force-static";

export default function HomePage() {
  const hero = getStaticHomeHero();
  const copy = HOME_STATIC.home;

  return (
    <div>
      {/* Hero — image: subjects right; text left; soft fade matches brand surface */}
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
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-brand-primary/25 bg-white/90 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <h2 className="font-serif text-xl text-brand-primary tracking-wide mb-3">
                {copy.whoTitle}
              </h2>
              <p className="text-brand-ink/85 leading-relaxed">{copy.whoBody}</p>
              <Link
                href="/about"
                className="inline-block mt-4 text-brand-primary font-medium hover:underline"
              >
                {copy.whoCta}
              </Link>
            </CardContent>
          </Card>
          <Card className="border-brand-primary/25 bg-white/90 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <h2 className="font-serif text-xl text-brand-primary tracking-wide mb-3">
                {copy.whyTitle}
              </h2>
              <p className="text-brand-ink/85 leading-relaxed">{copy.whyBody}</p>
              <Link
                href="/mission"
                className="inline-block mt-4 text-brand-primary font-medium hover:underline"
              >
                {copy.whyCta}
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-14 px-4 max-w-7xl mx-auto border-t border-brand-primary/15">
        <h2 className="font-serif text-2xl text-brand-primary tracking-wide mb-2">
          {copy.merchTitle}
        </h2>
        <p className="text-brand-ink/75 mb-8 max-w-2xl">{copy.merchBlurb}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {CATEGORY_SLUGS.map((slug) => (
            <Link key={slug} href={`/merch?category=${slug}`}>
              <Card className="border-brand-primary/25 bg-white/90 shadow-sm overflow-hidden hover:border-brand-primary/55 transition-colors h-full">
                <CardContent className="p-6">
                  <h3 className="font-medium text-brand-ink">{CATEGORY_LABELS[slug]}</h3>
                  {CATEGORY_DESCRIPTIONS[slug] && (
                    <p className="text-sm text-brand-ink/70 mt-1">{CATEGORY_DESCRIPTIONS[slug]}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-14 px-4 max-w-7xl mx-auto">
        <h2 className="font-serif text-2xl text-brand-primary tracking-wide mb-8">
          {copy.featuredTitle}
        </h2>
        <p className="text-brand-ink/60">{copy.featuredEmpty}</p>
        <p className="mt-10 text-center">
          <Link
            href="/merch"
            className="inline-flex items-center justify-center rounded-full px-8 py-3 bg-brand-primary text-white font-semibold hover:bg-brand-primary/90 transition-colors"
          >
            {copy.viewAllMerchLabel}
          </Link>
        </p>
      </section>
    </div>
  );
}
