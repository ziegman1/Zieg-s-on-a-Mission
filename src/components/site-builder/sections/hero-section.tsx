import Link from "next/link";
import { Dancing_Script } from "next/font/google";
import { DEFAULT_HOME_HERO_IMAGE_PATH } from "@/data/home-guided-default-sections";
import { contentStr } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const heroTitle = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export function HeroSection({
  section,
  className,
  useScriptTitle = false,
}: {
  section: PageSection;
  className?: string;
  useScriptTitle?: boolean;
}) {
  const c = section.content;
  const src = contentStr(c, "imageUrl").trim() || DEFAULT_HOME_HERO_IMAGE_PATH;
  const eyebrow = contentStr(c, "eyebrow");
  const headline = contentStr(c, "headline");
  const body = contentStr(c, "body");
  const primaryLabel = contentStr(c, "primaryCtaLabel");
  const primaryUrl = contentStr(c, "primaryCtaUrl") || "/partner";
  const secondaryLabel = contentStr(c, "secondaryCtaLabel");
  const secondaryUrl = contentStr(c, "secondaryCtaUrl") || "/give";
  const tertiaryLabel = contentStr(c, "tertiaryCtaLabel");
  const tertiaryUrl = contentStr(c, "tertiaryCtaUrl") || "/mission";

  if (!headline.trim() && !body.trim()) return null;

  const isHome = section.pageKey === "home";

  return (
    <section
      className={cn(
        "relative flex items-stretch border-b border-brand-primary/20",
        isHome ? "min-h-[min(90vh,52rem)]" : "px-4 py-16 sm:py-20 bg-gradient-to-b from-white/60 to-brand-surface",
        className,
      )}
    >
      {isHome ? (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={contentStr(c, "imageAlt")} className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(234_229_225/0.4)_0%,transparent_48%)]" />
        </div>
      ) : null}
      <div
        className={cn(
          "relative z-10 w-full mx-auto px-4 flex flex-col justify-center",
          isHome ? "max-w-7xl py-12 sm:py-16 min-h-[min(90vh,52rem)]" : "max-w-3xl text-center",
        )}
      >
        {eyebrow.trim() ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">{eyebrow}</p>
        ) : null}
        {headline.trim() ? (
          <h1
            className={cn(
              useScriptTitle || isHome
                ? `${heroTitle.className} text-[2.25rem] sm:text-4xl md:text-5xl font-bold text-brand-ink leading-[1.15]`
                : "mt-4 font-serif text-3xl sm:text-4xl text-brand-ink tracking-wide",
            )}
          >
            {headline}
          </h1>
        ) : null}
        {body.trim() ? (
          <p className={cn("mt-5 text-lg text-brand-ink/85 leading-relaxed", isHome && "max-w-prose")}>
            {body}
          </p>
        ) : null}
        {(primaryLabel || secondaryLabel || tertiaryLabel) && (
          <div className="mt-8 flex flex-wrap gap-3 justify-center sm:justify-start">
            {primaryLabel.trim() ? (
              <Button asChild className="rounded-full px-7 h-12 bg-brand-accent text-brand-ink font-semibold">
                <Link href={primaryUrl}>{primaryLabel}</Link>
              </Button>
            ) : null}
            {secondaryLabel.trim() ? (
              <Button asChild variant="outline" className="rounded-full px-7 h-12">
                <Link href={secondaryUrl}>{secondaryLabel}</Link>
              </Button>
            ) : null}
            {tertiaryLabel.trim() ? (
              <Button asChild variant="ghost" className="rounded-full px-5 h-12">
                <Link href={tertiaryUrl}>{tertiaryLabel}</Link>
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
