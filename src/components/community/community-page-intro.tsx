import Link from "next/link";
import type { CommunityPageContent } from "@/lib/site-builder/community-page-content";
import { Button } from "@/components/ui/button";

export function CommunityPageIntro({
  content,
  siteName,
}: {
  content: CommunityPageContent;
  siteName: string;
}) {
  const { hero, featured } = content;
  const showHero = hero.headline.trim() || hero.body.trim() || hero.eyebrow.trim();
  const showFeatured = featured.headline.trim() || featured.body.trim();

  if (!showHero && !showFeatured) return null;

  return (
    <div className="max-w-[92rem] mx-auto px-2 sm:px-3 pt-2 pb-3 space-y-3">
      {showHero ? (
        <section className="rounded-2xl bg-gradient-to-br from-brand-primary via-brand-primary/96 to-brand-primary/85 text-white shadow-[0_8px_28px_rgba(28,42,68,0.18)] overflow-hidden ring-1 ring-white/10">
          <div className="px-5 py-6 sm:px-6 sm:py-7">
            {hero.eyebrow.trim() ? (
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
                {hero.eyebrow}
              </p>
            ) : null}
            {hero.headline.trim() ? (
              <h1 className="mt-2 font-serif text-2xl sm:text-[1.75rem] tracking-wide leading-tight">
                {hero.headline}
              </h1>
            ) : null}
            {siteName.trim() ? (
              <p className="mt-1.5 text-sm text-white/75">{siteName}</p>
            ) : null}
            {hero.body.trim() ? (
              <p className="mt-4 text-[15px] leading-[1.55] text-white/92">{hero.body}</p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              {hero.primaryCta.label.trim() ? (
                <Button
                  asChild
                  className="rounded-full bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold h-11 px-6"
                >
                  <Link href={hero.primaryCta.href}>{hero.primaryCta.label}</Link>
                </Button>
              ) : null}
              {hero.secondaryCta.label.trim() ? (
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/45 text-white bg-white/10 hover:bg-white/18 h-11 px-6"
                >
                  <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {showFeatured ? (
        <section className="rounded-xl border border-brand-primary/15 bg-white/90 px-5 py-5 shadow-sm">
          {featured.headline.trim() ? (
            <h2 className="font-serif text-lg text-brand-primary tracking-wide">{featured.headline}</h2>
          ) : null}
          {featured.body.trim() ? (
            <p className="mt-2 text-sm text-brand-ink/85 leading-relaxed">{featured.body}</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
