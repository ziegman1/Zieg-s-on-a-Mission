import Link from "next/link";
import type { PageSection } from "@/lib/site-builder/types";
import type { PublicProgressCounts } from "@/lib/ministry/ministry-milestones";
import { PageSectionsRenderer } from "@/components/site-builder/page-sections-renderer";
import { MinistryProgressTracker } from "@/components/mission/ministry-progress-tracker";
import { storefrontButtonClasses } from "@/lib/storefront/storefront-button-styles";
import {
  OUR_MISSION_AVENUES,
  OUR_MISSION_AVENUES_TITLE,
  OUR_MISSION_BEYOND,
  OUR_MISSION_CTAS,
  OUR_MISSION_FUNCTIONS,
  OUR_MISSION_FUNCTIONS_TITLE,
  OUR_MISSION_HERO,
  OUR_MISSION_INVITATION,
  OUR_MISSION_MEASURE_LABEL,
  OUR_MISSION_MEASUREMENT,
  SUPPORT_RAISING_JOURNEY,
  type OurMissionQualification,
} from "@/data/our-mission-content";

function SectionHeading({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="font-serif text-2xl sm:text-3xl text-brand-ink tracking-wide">
      {children}
    </h2>
  );
}

function GoldRule() {
  return <span className="mx-auto mt-5 block h-0.5 w-14 bg-brand-accent" aria-hidden />;
}

function QualificationText({ text }: { text: string }) {
  const index = text.indexOf(SUPPORT_RAISING_JOURNEY);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <em>{SUPPORT_RAISING_JOURNEY}</em>
      {text.slice(index + SUPPORT_RAISING_JOURNEY.length)}
    </>
  );
}

function QualificationList({ items }: { items: readonly OurMissionQualification[] }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item) => (
        <li key={item.label} className="text-brand-ink/88 leading-relaxed">
          <span className="font-semibold text-brand-ink">{item.label}: </span>
          <QualificationText text={item.text} />
        </li>
      ))}
    </ul>
  );
}

export function OurMissionPage({
  counts,
  editorialSections,
  siteTagline,
}: {
  counts: PublicProgressCounts | null;
  editorialSections: PageSection[];
  siteTagline: string;
}) {
  return (
    <div className="bg-brand-surface text-brand-ink">
      <section className="border-b border-brand-primary/15 bg-gradient-to-b from-white/70 to-brand-surface px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-brand-ink tracking-wide leading-none">
            {OUR_MISSION_HERO.title}
          </h1>
          <p className="mt-5 font-serif text-xl sm:text-2xl text-brand-primary tracking-wide">
            {OUR_MISSION_HERO.supporting}
          </p>
          <GoldRule />
          <div className="mx-auto mt-8 max-w-2xl space-y-4 text-left sm:text-center text-base sm:text-lg text-brand-ink/85 leading-relaxed">
            {OUR_MISSION_HERO.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="ministry-impact" className="px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h2 id="ministry-impact" className="sr-only">
            Ministry Impact Tracker
          </h2>
          {counts ? (
            <MinistryProgressTracker counts={counts} trainedLabel="Trained & Equipped" />
          ) : (
            <p className="rounded-2xl border border-brand-primary/25 bg-white/75 px-5 py-6 text-sm text-brand-ink/70">
              Progress totals are temporarily unavailable.
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="ministry-functions" className="px-4 pb-16 sm:pb-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading id="ministry-functions">{OUR_MISSION_FUNCTIONS_TITLE}</SectionHeading>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {OUR_MISSION_FUNCTIONS.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-brand-primary/20 bg-white/75 px-5 py-6 shadow-sm"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent">
                  {item.title}
                </p>
                <h3 className="mt-2 font-serif text-xl text-brand-ink tracking-wide">{item.subtitle}</h3>
                <div className="mt-4 space-y-3 text-sm text-brand-ink/85 leading-relaxed">
                  {item.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="ministry-avenues"
        className="border-t border-brand-primary/15 px-4 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-3xl">
          <SectionHeading id="ministry-avenues">{OUR_MISSION_AVENUES_TITLE}</SectionHeading>
          <div className="mt-8 space-y-6">
            {OUR_MISSION_AVENUES.map((avenue, index) => (
              <article
                key={avenue.id}
                className="rounded-2xl border border-brand-primary/20 bg-white/75 px-5 py-6 sm:px-7 sm:py-8 shadow-sm"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                  Avenue {index + 1}
                </p>
                <h3 className="mt-2 font-serif text-2xl text-brand-ink tracking-wide">{avenue.title}</h3>
                <p className="mt-3 font-medium text-brand-ink/90">{avenue.summary}</p>
                <div className="mt-4 space-y-3 text-brand-ink/85 leading-relaxed">
                  {avenue.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                <details className="group mt-6 rounded-xl border border-brand-primary/20 bg-brand-surface/70">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-semibold text-brand-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/70 [&::-webkit-details-marker]:hidden">
                    {OUR_MISSION_MEASURE_LABEL}
                    <span
                      aria-hidden
                      className="text-lg leading-none text-brand-accent transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <div className="space-y-6 border-t border-brand-primary/15 px-4 py-4">
                    {avenue.tracks.map((track) => (
                      <div key={track.title ?? avenue.id}>
                        {track.title ? (
                          <h4 className="font-serif text-lg text-brand-ink tracking-wide">{track.title}</h4>
                        ) : null}
                        <QualificationList items={track.qualifications} />
                        {track.notes.length > 0 ? (
                          <div className="mt-4 space-y-2 text-sm text-brand-ink/80 leading-relaxed">
                            {track.notes.map((note) => (
                              <p key={note}>{note}</p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </details>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="beyond-commissioning" className="px-4 pb-16 sm:pb-20">
        <div className="mx-auto max-w-3xl">
          <SectionHeading id="beyond-commissioning">{OUR_MISSION_BEYOND.title}</SectionHeading>
          <div className="mt-6 space-y-4 text-brand-ink/85 leading-relaxed">
            {OUR_MISSION_BEYOND.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="how-we-measure"
        className="border-t border-brand-primary/15 px-4 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-3xl">
          <SectionHeading id="how-we-measure">{OUR_MISSION_MEASUREMENT.title}</SectionHeading>
          <p className="mt-6 text-brand-ink/85 leading-relaxed">{OUR_MISSION_MEASUREMENT.intro}</p>
          <ul className="mt-6 space-y-3">
            {OUR_MISSION_MEASUREMENT.points.map((point) => (
              <li key={point} className="flex gap-3 text-brand-ink/88 leading-relaxed">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {editorialSections.length > 0 ? (
        <div className="border-t border-brand-primary/15">
          <PageSectionsRenderer
            pageKey="our-mission"
            sections={editorialSections}
            siteTagline={siteTagline}
          />
        </div>
      ) : null}

      <section aria-labelledby="join-the-work" className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading id="join-the-work">{OUR_MISSION_INVITATION.title}</SectionHeading>
          <div className="mt-6 space-y-4 text-brand-ink/85 leading-relaxed">
            {OUR_MISSION_INVITATION.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            {OUR_MISSION_CTAS.map((cta, index) => (
              <Link
                key={cta.href}
                href={cta.href}
                className={storefrontButtonClasses(index === 0 ? "primary" : "secondary")}
              >
                {cta.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
