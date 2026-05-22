import Link from "next/link";
import { contentStr, visibleListItems } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { MinistryPageShell } from "@/components/ministry-page-shell";
import { cn } from "@/lib/utils";

export function TextSectionBlock({
  section,
  asPageShell = false,
}: {
  section: PageSection;
  asPageShell?: boolean;
}) {
  const c = section.content;
  const headline = contentStr(c, "headline");
  const sub = contentStr(c, "subheadline");
  const eyebrow = contentStr(c, "eyebrow");
  const body = contentStr(c, "body");
  const bullets = visibleListItems(c.bullets);

  if (!headline.trim() && !body.trim() && !sub.trim() && bullets.length === 0) return null;

  const inner = (
    <>
      {eyebrow.trim() ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">{eyebrow}</p>
      ) : null}
      {headline.trim() ? <h2 className="font-serif text-2xl text-brand-primary tracking-wide">{headline}</h2> : null}
      {sub.trim() ? <p className="mt-2 text-lg text-brand-ink/80">{sub}</p> : null}
      {body.trim() ? (
        <div className="mt-4 space-y-4 text-brand-ink/88 leading-relaxed whitespace-pre-wrap">{body}</div>
      ) : null}
      {bullets.length > 0 ? (
        <ul className="mt-4 list-disc pl-5 space-y-1">
          {bullets.map((b) => (
            <li key={b.id}>{b.text}</li>
          ))}
        </ul>
      ) : null}
    </>
  );

  if (asPageShell && section.sectionKey === "header") {
    return (
      <MinistryPageShell title={headline} lede={sub || body}>
        {null}
      </MinistryPageShell>
    );
  }

  if (section.pageKey === "home" && section.sectionKey === "scroll-break") {
    return (
      <section className="py-16 sm:py-20 bg-blue-50">
        <div className="max-w-3xl mx-auto px-6 text-center text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
          {body}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("mx-auto max-w-3xl px-4 py-12 sm:py-16", section.pageKey === "partner" && "py-16 sm:py-20")}>
      {inner}
    </section>
  );
}

export function TextSectionNavLinks() {
  return (
    <nav className="!mt-12 pt-8 border-t border-brand-primary/25 flex flex-wrap gap-4 not-prose">
      <Link href="/partner" className="text-brand-primary font-medium hover:underline">
        Become a partner →
      </Link>
      <Link href="/give" className="text-brand-primary font-medium hover:underline">
        Give
      </Link>
    </nav>
  );
}
