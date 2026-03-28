/**
 * Static homepage copy — no database, no Prisma.
 * Aligned with DEFAULT_SITE_COPY in site-copy-defaults; edit either when messaging changes.
 */

import { DEFAULT_SITE_COPY } from "./site-copy-defaults";

export const HOME_STATIC = {
  homeHero: DEFAULT_SITE_COPY.homeHero,
  home: DEFAULT_SITE_COPY.home,
} as const;

export function getStaticHomeHero() {
  const h = HOME_STATIC.homeHero;
  return {
    headline: h.headline,
    body: h.body,
    primaryCta: { href: "/partner" as const, label: h.primaryCtaLabel },
    secondaryCta: { href: "/give" as const, label: h.secondaryCtaLabel },
  };
}
