import Link from "next/link";
import { contentStr } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { Button } from "@/components/ui/button";

export function CtaSection({
  section,
  siteTagline,
}: {
  section: PageSection;
  siteTagline?: string;
}) {
  const c = section.content;
  const headline = contentStr(c, "headline");
  const body = contentStr(c, "body");
  const primary = contentStr(c, "primaryCtaLabel");
  const primaryUrl = contentStr(c, "primaryCtaUrl") || "/partner";
  const secondary = contentStr(c, "secondaryCtaLabel");
  const secondaryUrl = contentStr(c, "secondaryCtaUrl") || "/give";

  if (!headline.trim() && !body.trim() && !primary.trim()) return null;

  if (section.pageKey === "home" && section.sectionKey === "closing") {
    return (
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
          <div className="border-t border-gray-200 w-full mb-8 sm:mb-10" />
          <div className="max-w-xl mx-auto text-center">
            {body.trim() ? <p className="text-brand-ink/88 leading-relaxed">{body}</p> : null}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {primary.trim() ? (
                <Button asChild className="rounded-full px-7 h-11 bg-brand-accent text-brand-ink font-semibold">
                  <Link href={primaryUrl}>{primary}</Link>
                </Button>
              ) : null}
              {secondary.trim() ? (
                <Link href={secondaryUrl} className="text-blue-600 hover:underline font-medium">
                  {secondary}
                </Link>
              ) : null}
            </div>
            {siteTagline?.trim() ? (
              <p className="mt-10 text-sm text-brand-ink/55">{siteTagline}</p>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 text-center">
      {headline.trim() ? <h2 className="font-serif text-2xl text-brand-primary">{headline}</h2> : null}
      {body.trim() ? <p className="mt-4 text-brand-ink/85 whitespace-pre-wrap">{body}</p> : null}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {primary.trim() ? (
          <Button asChild className="rounded-full px-6">
            <Link href={primaryUrl}>{primary}</Link>
          </Button>
        ) : null}
        {secondary.trim() ? (
          <Button asChild variant="outline" className="rounded-full px-6">
            <Link href={secondaryUrl}>{secondary}</Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
