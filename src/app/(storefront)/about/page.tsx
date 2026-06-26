export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { CtaSection } from "@/components/site-builder/sections/cta-section";
import { HeroSection } from "@/components/site-builder/sections/hero-section";
import { MinistryPageShell } from "@/components/ministry-page-shell";
import { SiteBuilderFormattedContent } from "@/components/site-builder/site-builder-formatted-content";
import {
  aboutClosingCtaSectionFromCopy,
  aboutHeroIsVisible,
  aboutHeroSectionFromCopy,
} from "@/lib/site-builder/about-hero";
import { getSiteCopy } from "@/lib/site-copy";
import { renderStorefrontPage } from "@/lib/site-builder/render-page";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getSiteCopy();
  return {
    title: "About",
    description: `Learn about ${copy.site.name} — who we are, our mission, and how monthly partnership sustains the work.`,
  };
}

async function LegacyAboutPage() {
  const copy = await getSiteCopy();
  const { title, lede, sections } = copy.about;
  const showHero = aboutHeroIsVisible(copy.about);

  return (
    <>
      {showHero ? <HeroSection section={aboutHeroSectionFromCopy(copy)} /> : null}
      <MinistryPageShell title={showHero ? "" : title} lede={showHero ? undefined : lede}>
        {sections
          .filter((s) => s.heading.trim() || s.body.trim())
          .map((s, index) => (
            <section
              key={s.heading}
              id={index === 0 ? "story" : undefined}
              className={index > 0 ? "mt-10" : undefined}
            >
              {s.heading.trim() ? <h2>{s.heading}</h2> : null}
              {s.body.trim() ? <SiteBuilderFormattedContent text={s.body} /> : null}
            </section>
          ))}
      </MinistryPageShell>
      <CtaSection section={aboutClosingCtaSectionFromCopy(copy)} />
    </>
  );
}

export default async function AboutPage() {
  return renderStorefrontPage("about", LegacyAboutPage);
}
