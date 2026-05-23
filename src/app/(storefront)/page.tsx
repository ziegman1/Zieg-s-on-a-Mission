export const dynamic = "force-dynamic";

import Link from "next/link";
import { Fragment } from "react";
import { Dancing_Script } from "next/font/google";
import { DEFAULT_HOME_HERO_IMAGE_PATH } from "@/data/home-guided-default-sections";
import { getSiteCopy, homeHeroWithHrefs } from "@/lib/site-copy";
import { renderStorefrontPage } from "@/lib/site-builder/render-page";
import { Button } from "@/components/ui/button";
import {
  HOME_HERO_BODY,
  HOME_HERO_CONTENT,
  HOME_HERO_HEADLINE,
  HOME_HERO_IMAGE,
  HOME_HERO_OVERLAY,
  homeHeroButtonClasses,
} from "@/components/site-builder/sections/home-hero-visual";

const heroTitle = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

function LegacyHomePage() {
  return (
    <LegacyHomeContent />
  );
}

async function LegacyHomeContent() {
  const copy = await getSiteCopy();
  const hero = homeHeroWithHrefs(copy);
  const guided = copy.homeGuided;
  const heroSrc = guided.heroImageUrl?.trim() || DEFAULT_HOME_HERO_IMAGE_PATH;

  return (
    <div>
      <section className="relative min-h-[min(90vh,52rem)] flex items-stretch border-b border-brand-primary/20">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroSrc} alt="" className={HOME_HERO_IMAGE} fetchPriority="high" />
          <div className={HOME_HERO_OVERLAY} aria-hidden />
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-12 sm:py-16 flex flex-col justify-center min-h-[min(90vh,52rem)]">
          <div className={HOME_HERO_CONTENT}>
            <h1
              className={`${heroTitle.className} text-[2.25rem] sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-normal leading-[1.15] ${HOME_HERO_HEADLINE}`}
            >
              {hero.headline}
            </h1>
            <p className={HOME_HERO_BODY}>{hero.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={hero.primaryCta.href} className={homeHeroButtonClasses("primary")}>
                {hero.primaryCta.label}
              </Link>
              <Link href={hero.secondaryCta.href} className={homeHeroButtonClasses("secondary")}>
                {hero.secondaryCta.label}
              </Link>
              <Link href={hero.tertiaryCta.href} className={homeHeroButtonClasses("tertiary")}>
                {hero.tertiaryCta.label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-brand-surface text-brand-ink">
        {guided.sections
          .filter((section) => section.title.trim() || section.body.trim())
          .map((section, i) => {
            const isTextLeft = i % 2 === 0;
            const sectionBg = i % 2 === 0 ? "bg-white" : "bg-neutral-50";
            const imgUrl = section.imageUrl?.trim();

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

            const visualColumn = imgUrl ? (
              <div className="col-span-2 md:col-span-1 flex items-center justify-center md:justify-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgUrl}
                  alt=""
                  className="max-h-64 w-full max-w-md rounded-lg object-cover shadow-sm border border-gray-200/80"
                />
              </div>
            ) : (
              <div className="hidden md:block md:col-span-1 min-h-[5rem]" aria-hidden />
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
                          {visualColumn}
                        </>
                      ) : (
                        <>
                          {visualColumn}
                          {textColumn}
                        </>
                      )}
                    </div>
                  </div>
                </section>

                {section.id === "mission" && guided.scrollBreakBody.trim() ? (
                  <section className="py-16 sm:py-20 bg-blue-50">
                    <div className="max-w-3xl mx-auto px-6 text-center text-lg text-gray-700 leading-relaxed">
                      {guided.scrollBreakBody}
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
              {guided.closingBody.trim() ? (
                <p className="text-brand-ink/88 leading-relaxed">{guided.closingBody}</p>
              ) : null}
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
              <p className="mt-10 text-sm text-brand-ink/55">{copy.site.tagline}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default async function HomePage() {
  return renderStorefrontPage("home", LegacyHomePage);
}
