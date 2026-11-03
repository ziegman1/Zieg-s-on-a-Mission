"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PageSection } from "@/lib/site-builder/types";
import type { PublicProgressCounts } from "@/lib/ministry/ministry-milestones";
import {
  contentStr,
  fieldVisible,
  getFieldStyle,
  sortedListItems,
  visibleListItems,
} from "@/lib/site-builder/content-utils";
import { isElementVisible } from "@/lib/site-builder/element-style-utils";
import { storefrontButtonClasses } from "@/lib/storefront/storefront-button-styles";
import { MinistryProgressTracker } from "@/components/mission/ministry-progress-tracker";
import { EditableElement } from "@/components/site-builder/editable-element";
import { ContentElementsBlock } from "@/components/site-builder/content-elements-block";
import { SiteBuilderFormattedContent } from "@/components/site-builder/site-builder-formatted-content";
import { useBuilderPreview } from "@/components/site-builder/builder-preview-context";
import { cn } from "@/lib/utils";

function GoldRule() {
  return <span className="mx-auto mt-5 block h-0.5 w-14 bg-brand-accent" aria-hidden />;
}

function showField(editMode: boolean | undefined, key: string, text: string, content: Record<string, unknown>) {
  return Boolean(editMode) || (text.trim().length > 0 && fieldVisible(content, key));
}

export function OurMissionHeroEditable({ section }: { section: PageSection }) {
  const ctx = useBuilderPreview();
  const c = section.content;
  const headline = contentStr(c, "headline");
  const sub = contentStr(c, "subheadline");
  const body = contentStr(c, "body");

  return (
    <section className="border-b border-brand-primary/15 bg-gradient-to-b from-white/70 to-brand-surface px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        {showField(ctx?.editMode, "headline", headline, c) ? (
          <EditableElement sectionId={section.id} elementId="headline" style={getFieldStyle(c, "headline")}>
            <SiteBuilderFormattedContent
              text={headline}
              className="font-serif text-4xl sm:text-5xl md:text-6xl text-brand-ink tracking-wide leading-none [&_p]:m-0"
              emptyPlaceholder={ctx?.editMode ? "Headline (empty)" : undefined}
            />
          </EditableElement>
        ) : null}
        {showField(ctx?.editMode, "subheadline", sub, c) ? (
          <EditableElement
            sectionId={section.id}
            elementId="subheadline"
            style={getFieldStyle(c, "subheadline")}
            className="mt-5"
          >
            <SiteBuilderFormattedContent
              text={sub}
              className="font-serif text-xl sm:text-2xl text-brand-primary tracking-wide [&_p]:m-0"
              emptyPlaceholder={ctx?.editMode ? "Supporting line (empty)" : undefined}
            />
          </EditableElement>
        ) : null}
        <GoldRule />
        {showField(ctx?.editMode, "body", body, c) ? (
          <EditableElement
            sectionId={section.id}
            elementId="body"
            style={getFieldStyle(c, "body")}
            className="mx-auto mt-8 max-w-2xl text-left sm:text-center"
          >
            <SiteBuilderFormattedContent
              text={body}
              className="text-base sm:text-lg text-brand-ink/85 leading-relaxed"
              emptyPlaceholder={ctx?.editMode ? "Body (empty)" : undefined}
            />
          </EditableElement>
        ) : null}
        <ContentElementsBlock section={section} />
      </div>
    </section>
  );
}

/** Tracker presentation is editable; totals always come from ministry aggregates. */
export function OurMissionTrackerEditable({
  section,
  counts,
}: {
  section: PageSection;
  counts: PublicProgressCounts | null;
}) {
  const ctx = useBuilderPreview();
  const c = section.content;
  const headline = contentStr(c, "headline") || "The Progress So Far";
  const body = contentStr(c, "body");
  const mobilizedLabel = contentStr(c, "mobilizedLabel") || "Mobilized";
  const trainedLabel = contentStr(c, "trainedLabel") || "Trained & Equipped";
  const sentLabel = contentStr(c, "sentLabel") || "Sent";
  const remainingDetail =
    contentStr(c, "remainingDetail") || "to reach the unreached by August 31, 2031.";

  return (
    <section aria-labelledby={`${section.id}-tracker`} className="px-4 py-14 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 id={`${section.id}-tracker`} className="sr-only">
          Ministry Impact Tracker
        </h2>
        {ctx?.editMode ? (
          <div className="mb-4 space-y-2 text-center">
            <EditableElement
              sectionId={section.id}
              elementId="headline"
              style={getFieldStyle(c, "headline")}
            >
              <SiteBuilderFormattedContent
                text={headline}
                className="font-serif text-2xl sm:text-3xl text-brand-ink tracking-wide [&_p]:m-0"
                emptyPlaceholder="Tracker title (empty)"
              />
            </EditableElement>
            {showField(true, "body", body, c) ? (
              <EditableElement
                sectionId={section.id}
                elementId="body"
                style={getFieldStyle(c, "body")}
              >
                <SiteBuilderFormattedContent
                  text={body}
                  className="text-sm text-brand-ink/80"
                  emptyPlaceholder="Description (empty)"
                />
              </EditableElement>
            ) : null}
            <div className="flex flex-wrap justify-center gap-2 text-[11px] text-brand-ink/70">
              <EditableElement sectionId={section.id} elementId="mobilizedLabel" layout="inline">
                <span>{mobilizedLabel}</span>
              </EditableElement>
              <span aria-hidden>·</span>
              <EditableElement sectionId={section.id} elementId="trainedLabel" layout="inline">
                <span>{trainedLabel}</span>
              </EditableElement>
              <span aria-hidden>·</span>
              <EditableElement sectionId={section.id} elementId="sentLabel" layout="inline">
                <span>{sentLabel}</span>
              </EditableElement>
            </div>
          </div>
        ) : body.trim() ? (
          <div className="mb-4 text-center">
            <SiteBuilderFormattedContent text={body} className="text-sm text-brand-ink/80" />
          </div>
        ) : null}
        {/* Numeric totals are intentionally not EditableElements */}
        {counts ? (
          <MinistryProgressTracker
            counts={counts}
            title={headline}
            mobilizedLabel={mobilizedLabel}
            trainedLabel={trainedLabel}
            sentLabel={sentLabel}
            remainingDetail={remainingDetail}
          />
        ) : (
          <p className="rounded-2xl border border-brand-primary/25 bg-white/75 px-5 py-6 text-sm text-brand-ink/70">
            Progress totals are temporarily unavailable.
          </p>
        )}
        {ctx?.editMode ? (
          <EditableElement
            sectionId={section.id}
            elementId="remainingDetail"
            style={getFieldStyle(c, "remainingDetail")}
            className="mt-3 text-center"
          >
            <SiteBuilderFormattedContent
              text={remainingDetail}
              className="text-xs text-brand-ink/60"
              emptyPlaceholder="Remaining detail (empty)"
            />
          </EditableElement>
        ) : null}
        <ContentElementsBlock section={section} />
      </div>
    </section>
  );
}

export function OurMissionFunctionsEditable({ section }: { section: PageSection }) {
  const ctx = useBuilderPreview();
  const c = section.content;
  const headline = contentStr(c, "headline");
  const cards = ctx?.editMode
    ? sortedListItems(c.cards, { includeHidden: true })
    : visibleListItems(c.cards);

  return (
    <section aria-labelledby={`${section.id}-functions`} className="px-4 pb-16 sm:pb-20">
      <div className="mx-auto max-w-5xl">
        {showField(ctx?.editMode, "headline", headline, c) ? (
          <EditableElement sectionId={section.id} elementId="headline" style={getFieldStyle(c, "headline")}>
            <SiteBuilderFormattedContent
              text={headline}
              className="font-serif text-2xl sm:text-3xl text-brand-ink tracking-wide [&_p]:m-0"
              emptyPlaceholder={ctx?.editMode ? "Functions heading (empty)" : undefined}
            />
          </EditableElement>
        ) : null}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {cards.map((card) => {
            if (!ctx?.editMode && (!card.visible || !isElementVisible(card.style, true))) return null;
            const subtitle = String(card.metadata?.amountLabel ?? card.metadata?.subtitle ?? "");
            const body = String(card.metadata?.body ?? "");
            return (
              <EditableElement
                key={card.id}
                sectionId={section.id}
                elementId={`card:${card.id}`}
                style={card.style}
                visible={card.visible}
                layout="fill"
                styleOnWrapper={false}
                className={cn(!card.visible && ctx?.editMode && "opacity-50")}
              >
                <article className="h-full rounded-2xl border border-brand-primary/20 bg-white/75 px-5 py-6 shadow-sm">
                  <SiteBuilderFormattedContent
                    text={card.text}
                    className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent [&_p]:m-0"
                    emptyPlaceholder={ctx?.editMode ? "Title (empty)" : undefined}
                  />
                  {subtitle.trim() || ctx?.editMode ? (
                    <SiteBuilderFormattedContent
                      text={subtitle}
                      className="mt-2 font-serif text-xl text-brand-ink tracking-wide [&_p]:m-0"
                      emptyPlaceholder={ctx?.editMode ? "Subtitle (empty)" : undefined}
                    />
                  ) : null}
                  {body.trim() || ctx?.editMode ? (
                    <SiteBuilderFormattedContent
                      text={body}
                      className="mt-4 text-sm text-brand-ink/85 leading-relaxed"
                      emptyPlaceholder={ctx?.editMode ? "Body (empty)" : undefined}
                    />
                  ) : null}
                </article>
              </EditableElement>
            );
          })}
        </div>
        <ContentElementsBlock section={section} />
      </div>
    </section>
  );
}

export function OurMissionTextEditable({
  section,
  variant = "default",
}: {
  section: PageSection;
  variant?: "default" | "heading-only" | "measurement" | "invitation";
}) {
  const ctx = useBuilderPreview();
  const c = section.content;
  const eyebrow = contentStr(c, "eyebrow");
  const headline = contentStr(c, "headline");
  const sub = contentStr(c, "subheadline");
  const body = contentStr(c, "body");
  const bullets = ctx?.editMode
    ? sortedListItems(c.bullets, { includeHidden: true })
    : visibleListItems(c.bullets);
  const primary = contentStr(c, "primaryCtaLabel");
  const primaryUrl = contentStr(c, "primaryCtaUrl") || "/ministry-funding";
  const secondary = contentStr(c, "secondaryCtaLabel");
  const secondaryUrl = contentStr(c, "secondaryCtaUrl");

  const isAvenue = Boolean(section.settings?.ourMissionAvenue);
  const isInvitation = variant === "invitation" || section.sectionType === "cta";
  const isHeadingOnly = variant === "heading-only";
  const isMeasurement = variant === "measurement";

  const sectionClass = cn(
    "px-4",
    isHeadingOnly
      ? "border-t border-brand-primary/15 pt-16 sm:pt-20 pb-2"
      : isAvenue
        ? "px-4 pb-6"
        : isInvitation || isMeasurement
          ? "border-t border-brand-primary/15 px-4 py-16 sm:py-20"
          : "px-4 pb-16 sm:pb-20",
  );

  const inner = (
    <>
      {showField(ctx?.editMode, "eyebrow", eyebrow, c) ? (
        <EditableElement sectionId={section.id} elementId="eyebrow" style={getFieldStyle(c, "eyebrow")}>
          <SiteBuilderFormattedContent
            text={eyebrow}
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary [&_p]:m-0"
            emptyPlaceholder={ctx?.editMode ? "Eyebrow (empty)" : undefined}
          />
        </EditableElement>
      ) : null}
      {showField(ctx?.editMode, "headline", headline, c) ? (
        <EditableElement
          sectionId={section.id}
          elementId="headline"
          style={getFieldStyle(c, "headline")}
          className={eyebrow ? "mt-2" : undefined}
        >
          <SiteBuilderFormattedContent
            text={headline}
            className={cn(
              "font-serif tracking-wide text-brand-ink [&_p]:m-0",
              isAvenue ? "text-2xl" : "text-2xl sm:text-3xl",
              isInvitation && "text-center",
            )}
            emptyPlaceholder={ctx?.editMode ? "Heading (empty)" : undefined}
          />
        </EditableElement>
      ) : null}
      {showField(ctx?.editMode, "subheadline", sub, c) ? (
        <EditableElement
          sectionId={section.id}
          elementId="subheadline"
          style={getFieldStyle(c, "subheadline")}
          className="mt-3"
        >
          <SiteBuilderFormattedContent
            text={sub}
            className="font-medium text-brand-ink/90 [&_p]:m-0"
            emptyPlaceholder={ctx?.editMode ? "Summary (empty)" : undefined}
          />
        </EditableElement>
      ) : null}
      {showField(ctx?.editMode, "body", body, c) ? (
        <EditableElement
          sectionId={section.id}
          elementId="body"
          style={getFieldStyle(c, "body")}
          className={cn("mt-4 sm:mt-6", isInvitation && "text-center")}
        >
          <SiteBuilderFormattedContent
            text={body}
            className="text-brand-ink/85 leading-relaxed"
            emptyPlaceholder={ctx?.editMode ? "Body (empty)" : undefined}
          />
        </EditableElement>
      ) : null}

      {!isAvenue && bullets.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {bullets.map((item) => {
            if (!ctx?.editMode && (!item.visible || !isElementVisible(item.style, true))) return null;
            return (
              <li
                key={item.id}
                className={cn(
                  "flex gap-3 text-brand-ink/88 leading-relaxed",
                  !item.visible && ctx?.editMode && "opacity-50",
                )}
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent" aria-hidden />
                <EditableElement
                  sectionId={section.id}
                  elementId={`bullet:${item.id}`}
                  style={item.style}
                  visible={item.visible}
                  layout="inline"
                >
                  <SiteBuilderFormattedContent
                    text={item.text}
                    emptyPlaceholder={ctx?.editMode ? "Point (empty)" : undefined}
                  />
                </EditableElement>
              </li>
            );
          })}
        </ul>
      ) : null}

      {isInvitation && (primary.trim() || secondary.trim() || ctx?.editMode) ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-3">
          {(primary.trim() || ctx?.editMode) && (
            <EditableElement
              sectionId={section.id}
              elementId="cta:primary"
              style={getFieldStyle(c, "cta:primary")}
              layout="inline"
              styleOnWrapper={false}
            >
              <Link
                href={primaryUrl}
                className={cn(
                  storefrontButtonClasses("primary"),
                  "gap-2 px-8 sm:px-10 max-w-full text-center whitespace-normal sm:whitespace-nowrap",
                )}
              >
                <span>{primary.trim() || (ctx?.editMode ? "Primary CTA" : "")}</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </EditableElement>
          )}
          {secondary.trim() ? (
            <EditableElement
              sectionId={section.id}
              elementId="cta:secondary"
              style={getFieldStyle(c, "cta:secondary")}
              layout="inline"
              styleOnWrapper={false}
            >
              <Link
                href={secondaryUrl || "/contact"}
                className={storefrontButtonClasses("secondary")}
              >
                {secondary.trim()}
              </Link>
            </EditableElement>
          ) : null}
        </div>
      ) : null}

      <ContentElementsBlock section={section} />
    </>
  );

  if (isAvenue) {
    return (
      <div className={sectionClass}>
        <div className="mx-auto max-w-3xl">
          <article className="rounded-2xl border border-brand-primary/20 bg-white/75 px-5 py-6 sm:px-7 sm:py-8 shadow-sm">
            {inner}
          </article>
        </div>
      </div>
    );
  }

  return (
    <section className={sectionClass}>
      <div className={cn("mx-auto max-w-3xl", isInvitation && "text-center")}>{inner}</div>
    </section>
  );
}

export function renderOurMissionSection(
  section: PageSection,
  progressCounts: PublicProgressCounts | null,
): ReactNode {
  if (section.settings?.liveMinistryTracker === true || section.sectionKey === "tracker") {
    return <OurMissionTrackerEditable section={section} counts={progressCounts} />;
  }
  if (section.sectionKey === "hero") {
    return <OurMissionHeroEditable section={section} />;
  }
  if (section.sectionKey === "functions" || section.sectionType === "card_grid") {
    return <OurMissionFunctionsEditable section={section} />;
  }
  if (section.sectionKey === "avenues-heading") {
    return <OurMissionTextEditable section={section} variant="heading-only" />;
  }
  if (section.settings?.ourMissionAvenue || section.sectionKey.startsWith("avenue-")) {
    return <OurMissionTextEditable section={section} />;
  }
  if (section.sectionKey === "measurement") {
    return <OurMissionTextEditable section={section} variant="measurement" />;
  }
  if (section.sectionKey === "invitation" || section.sectionType === "cta") {
    return <OurMissionTextEditable section={section} variant="invitation" />;
  }
  if (section.sectionKey === "beyond") {
    return <OurMissionTextEditable section={section} />;
  }
  // Supplemental / unknown — keep Our Mission surface styling via text-like block
  if (section.sectionType === "text_section" || section.sectionType === "quote") {
    return <OurMissionTextEditable section={section} />;
  }
  return null;
}
