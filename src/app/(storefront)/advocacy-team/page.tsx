import type { Metadata } from "next";
import Link from "next/link";
import {
  HandHeart,
  Heart,
  Megaphone,
  Users,
  Download,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ADVOCACY_TEAM_BENEFITS,
  ADVOCACY_TEAM_CONTACT_HREF,
  ADVOCACY_TEAM_FINAL_CTA,
  ADVOCACY_TEAM_HERO,
  ADVOCACY_TEAM_INTRO,
  ADVOCACY_TEAM_META,
  ADVOCACY_TEAM_MISSION,
  ADVOCACY_TEAM_OUR_COMMITMENT,
  ADVOCACY_TEAM_PARTNERSHIP_GOAL,
  ADVOCACY_TEAM_QUALIFICATIONS,
  ADVOCACY_TEAM_RESOURCES,
  ADVOCACY_TEAM_RESOURCES_SECTION_ID,
  ADVOCACY_TEAM_ROLES,
  ADVOCACY_TEAM_TIME,
  type AdvocacyTeamRole,
} from "@/data/advocacy-team-content";

export const metadata: Metadata = {
  title: ADVOCACY_TEAM_META.title,
  description: ADVOCACY_TEAM_META.description,
};

const ROLE_ICONS: Record<AdvocacyTeamRole["id"], LucideIcon> = {
  pray: Heart,
  advocate: Megaphone,
  connect: Users,
  mobilize: HandHeart,
};

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-3 text-brand-ink/88">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent"
            aria-hidden
          />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-2xl sm:text-[1.75rem] text-brand-primary tracking-wide">
      {children}
    </h2>
  );
}

export default function AdvocacyTeamPage() {
  const resourcesHref = `#${ADVOCACY_TEAM_RESOURCES_SECTION_ID}`;

  return (
    <div className="bg-brand-surface text-brand-ink">
      {/* Hero */}
      <section className="relative border-b border-brand-primary/20 bg-gradient-to-b from-white/60 to-brand-surface px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">
            {ADVOCACY_TEAM_HERO.eyebrow}
          </p>
          <h1 className="mt-4 font-serif text-3xl sm:text-4xl md:text-[2.75rem] text-brand-ink tracking-wide leading-tight">
            {ADVOCACY_TEAM_HERO.title}
          </h1>
          <p className="mt-6 text-lg text-brand-ink/85 leading-relaxed">
            {ADVOCACY_TEAM_HERO.subtitle}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="rounded-full px-8 h-12 bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold shadow-md"
            >
              <Link href={ADVOCACY_TEAM_CONTACT_HREF}>{ADVOCACY_TEAM_HERO.primaryCtaLabel}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full px-8 h-12 border-brand-primary/50 text-brand-ink bg-white/80 hover:bg-white"
            >
              <Link href={resourcesHref}>{ADVOCACY_TEAM_HERO.secondaryCtaLabel}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <SectionHeading>{ADVOCACY_TEAM_INTRO.heading}</SectionHeading>
        <div className="mt-6 space-y-4 text-brand-ink/88 leading-relaxed">
          {ADVOCACY_TEAM_INTRO.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="border-t border-brand-primary/15 bg-white/45 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading>{ADVOCACY_TEAM_MISSION.heading}</SectionHeading>
          <blockquote className="mt-8 text-lg sm:text-xl text-brand-ink/90 leading-relaxed font-medium italic">
            &ldquo;{ADVOCACY_TEAM_MISSION.statement}&rdquo;
          </blockquote>
        </div>
      </section>

      {/* Four roles */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <SectionHeading>Four primary roles</SectionHeading>
          <p className="mt-4 text-brand-ink/80 leading-relaxed">
            Advocacy Team Members serve in four complementary ways — each one rooted in relationship,
            prayer, and a shared love for the gospel.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {ADVOCACY_TEAM_ROLES.map((role) => {
            const Icon = ROLE_ICONS[role.id];
            return (
              <Card
                key={role.id}
                className="border-brand-primary/20 bg-white/80 shadow-sm overflow-hidden"
              >
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary"
                      aria-hidden
                    >
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-xl text-brand-ink tracking-wide">{role.title}</h3>
                      <p className="mt-2 text-sm text-brand-ink/85 leading-relaxed">{role.summary}</p>
                    </div>
                  </div>
                  <ul className="mt-6 space-y-2.5 text-sm text-brand-ink/85">
                    {role.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2.5">
                        <span
                          className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-accent"
                          aria-hidden
                        />
                        <span className="leading-relaxed">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Partnership goal */}
      <section className="border-t border-brand-primary/15 bg-gradient-to-b from-brand-primary/10 to-brand-surface px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <SectionHeading>{ADVOCACY_TEAM_PARTNERSHIP_GOAL.heading}</SectionHeading>
          <p className="mt-6 text-brand-ink/88 leading-relaxed">{ADVOCACY_TEAM_PARTNERSHIP_GOAL.intro}</p>
          <p className="mt-4 rounded-xl border border-brand-primary/25 bg-white/70 px-5 py-4 text-brand-ink/90 leading-relaxed font-medium">
            {ADVOCACY_TEAM_PARTNERSHIP_GOAL.emphasis}
          </p>
          <h3 className="mt-10 text-sm font-semibold uppercase tracking-wider text-brand-primary">
            {ADVOCACY_TEAM_PARTNERSHIP_GOAL.examplesHeading}
          </h3>
          <BulletList items={ADVOCACY_TEAM_PARTNERSHIP_GOAL.examples} />
        </div>
      </section>

      {/* Time commitment */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <SectionHeading>{ADVOCACY_TEAM_TIME.heading}</SectionHeading>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {([ADVOCACY_TEAM_TIME.duringCampaigns, ADVOCACY_TEAM_TIME.betweenCampaigns] as const).map(
            (column) => (
              <div
                key={column.title}
                className="rounded-xl border border-brand-primary/20 bg-white/70 p-6 sm:p-8 shadow-sm"
              >
                <h3 className="font-serif text-xl text-brand-ink tracking-wide">{column.title}</h3>
                <ul className="mt-6 space-y-3 text-brand-ink/85">
                  {column.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary/70"
                        aria-hidden
                      />
                      <span className="leading-relaxed text-sm sm:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      </section>

      {/* Qualifications & benefits */}
      <section className="border-t border-brand-primary/15 bg-white/45 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading>{ADVOCACY_TEAM_QUALIFICATIONS.heading}</SectionHeading>
            <BulletList items={ADVOCACY_TEAM_QUALIFICATIONS.items} />
          </div>
          <div>
            <SectionHeading>{ADVOCACY_TEAM_BENEFITS.heading}</SectionHeading>
            <BulletList items={ADVOCACY_TEAM_BENEFITS.items} />
          </div>
        </div>
      </section>

      {/* Our commitment */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <SectionHeading>{ADVOCACY_TEAM_OUR_COMMITMENT.heading}</SectionHeading>
        <p className="mt-6 text-brand-ink/88 leading-relaxed">{ADVOCACY_TEAM_OUR_COMMITMENT.intro}</p>
        <BulletList items={ADVOCACY_TEAM_OUR_COMMITMENT.items} />
      </section>

      {/* Resources */}
      <section
        id={ADVOCACY_TEAM_RESOURCES_SECTION_ID}
        className="border-t border-brand-primary/15 bg-gradient-to-b from-brand-surface to-white/40 px-4 py-16 sm:py-20 scroll-mt-20"
      >
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto">
            <SectionHeading>Advocacy Team Resources</SectionHeading>
            <p className="mt-4 text-brand-ink/80 leading-relaxed">
              Download materials to pray, share, and advocate well in your circles of influence.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ADVOCACY_TEAM_RESOURCES.map((resource) => (
              <Card
                key={resource.id}
                className="border-brand-primary/20 bg-white/90 shadow-sm flex flex-col"
              >
                <CardContent className="p-6 flex flex-col flex-1">
                  <h3 className="font-serif text-lg text-brand-ink tracking-wide">{resource.title}</h3>
                  <p className="mt-2 text-sm text-brand-ink/80 leading-relaxed flex-1">
                    {resource.description}
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="mt-6 w-full rounded-full border-brand-primary/40 text-brand-ink hover:bg-brand-primary/5"
                  >
                    <a href={resource.href} download>
                      <Download className="h-4 w-4" aria-hidden />
                      Download
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-brand-primary/25 bg-brand-primary/15 px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-2xl text-brand-ink tracking-wide">
            {ADVOCACY_TEAM_FINAL_CTA.heading}
          </h2>
          <p className="mt-3 text-brand-ink/80 leading-relaxed">{ADVOCACY_TEAM_FINAL_CTA.body}</p>
          <div className="mt-8">
            <Button
              asChild
              className="rounded-full px-8 h-12 bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold"
            >
              <Link href={ADVOCACY_TEAM_CONTACT_HREF}>{ADVOCACY_TEAM_FINAL_CTA.buttonLabel}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
