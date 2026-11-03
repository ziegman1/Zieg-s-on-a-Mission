"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { PageSection } from "@/lib/site-builder/types";
import {
  contentStr,
  fieldVisible,
  getFieldStyle,
} from "@/lib/site-builder/content-utils";
import { storefrontButtonClasses } from "@/lib/storefront/storefront-button-styles";
import { EditableElement } from "@/components/site-builder/editable-element";
import { ContentElementsBlock } from "@/components/site-builder/content-elements-block";
import { SiteBuilderFormattedContent } from "@/components/site-builder/site-builder-formatted-content";
import { useBuilderPreview } from "@/components/site-builder/builder-preview-context";
import { OurMissionHeroEditable } from "@/components/mission/our-mission-editable-sections";
import { AllocationDoughnut } from "@/components/ministry-funding/allocation-doughnut";
import {
  isMinistryFundingAllocationSection,
  isMinistryFundingGoalsSection,
} from "@/lib/site-builder/ministry-funding-page-sections";
import {
  parseAllocationSection,
  parseFundingGoalsSection,
} from "@/lib/ministry-funding/from-sections";
import { formatUsd, type AllocationDerived } from "@/lib/ministry-funding/calculations";
import { DEFAULT_COLORS_FOR_IMPORT } from "@/lib/ministry-funding/chart-colors";
import { normalizeFunctionName } from "@/lib/ministry-funding/zoam-schema";
import { cn } from "@/lib/utils";

function GoldRule() {
  return <span className="mx-auto mt-5 block h-0.5 w-14 bg-brand-accent" aria-hidden />;
}

function showField(
  editMode: boolean | undefined,
  key: string,
  text: string,
  content: Record<string, unknown>,
) {
  return Boolean(editMode) || (text.trim().length > 0 && fieldVisible(content, key));
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-brand-primary/15 bg-white/70 px-4 py-4 text-center sm:text-left">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-primary">
        {label}
      </p>
      <p className="mt-2 font-serif text-xl sm:text-2xl text-brand-ink tracking-wide tabular-nums">
        {value}
      </p>
    </div>
  );
}

function formatFiguresUpdatedAt(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split("-").map(Number);
    const date = new Date(y!, m! - 1, d!);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }
  return trimmed;
}

export function FundingGoalsEditable({ section }: { section: PageSection }) {
  const ctx = useBuilderPreview();
  const view = parseFundingGoalsSection(section);
  if (!view) return null;
  const c = section.content;
  const headline = view.headline;
  const awaiting = view.awaitingCopy;
  const { derived } = view;
  const money = (n: number | null) => (n === null ? "—" : formatUsd(n));
  const editMode = Boolean(ctx?.editMode);
  // Public: awaiting state until both verified inputs exist.
  // Builder: always show the dashboard so property changes preview immediately.
  const showDashboard = derived.isComplete || editMode;
  const updatedLabel = formatFiguresUpdatedAt(view.figuresUpdatedAt);
  const barWidth = derived.progressBarPercent ?? 0;
  const percentLabel =
    derived.percentAchieved === null
      ? derived.isComplete
        ? "n/a"
        : "—"
      : `${derived.percentAchieved}%`;

  return (
    <section className="border-b border-brand-primary/15 px-4 py-14 sm:py-16">
      <div className="mx-auto max-w-3xl">
        {showField(editMode, "headline", headline, c) ? (
          <EditableElement sectionId={section.id} elementId="headline" style={getFieldStyle(c, "headline")}>
            <SiteBuilderFormattedContent
              text={headline}
              className="text-center font-serif text-2xl sm:text-3xl text-brand-ink tracking-wide [&_p]:m-0"
              emptyPlaceholder={editMode ? "Section heading (empty)" : undefined}
            />
          </EditableElement>
        ) : null}
        <GoldRule />

        {!showDashboard ? (
          <div className="mt-8 rounded-2xl border border-brand-primary/20 bg-white/70 px-5 py-6 sm:px-7">
            {showField(editMode, "body", awaiting, c) ? (
              <EditableElement sectionId={section.id} elementId="body" style={getFieldStyle(c, "body")}>
                <SiteBuilderFormattedContent
                  text={awaiting}
                  className="text-center text-brand-ink/85 leading-relaxed"
                  emptyPlaceholder={undefined}
                />
              </EditableElement>
            ) : (
              <p className="text-center text-brand-ink/75">
                Partnership figures will appear here once they are published.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {editMode && !derived.isComplete ? (
              <p className="text-center text-xs text-brand-ink/55">
                Preview: enter Monthly Funding Goal and Current Monthly Recurring Partnership in the
                properties panel. The public page keeps the awaiting message until both values are
                saved and published.
              </p>
            ) : null}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <StatCell label="Annual Funding Goal" value={money(derived.annualGoal)} />
              <StatCell label="Monthly Funding Goal" value={money(derived.monthlyGoal)} />
              <StatCell
                label="Current Monthly Recurring Partnership"
                value={money(derived.monthlyRecurring)}
              />
              <StatCell
                label="Annualized Recurring Partnership"
                value={money(derived.annualizedRecurring)}
              />
              <StatCell label="Remaining Monthly Need" value={money(derived.remainingMonthly)} />
              <StatCell
                label="Remaining Annualized Need"
                value={money(derived.remainingAnnual)}
              />
            </div>

            <div className="rounded-2xl border border-brand-primary/20 bg-[#eae5e1]/55 px-5 py-6 sm:px-7 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
                    Funding Progress
                  </p>
                  <p className="mt-2 font-serif text-3xl text-brand-ink tracking-wide tabular-nums">
                    {percentLabel}
                  </p>
                </div>
                <p className="text-sm text-brand-ink/70 tabular-nums">
                  {money(derived.monthlyRecurring)} of {money(derived.monthlyGoal)} / month
                </p>
              </div>
              <div
                className="mt-5 h-4 w-full overflow-hidden rounded-full bg-[#1c252e]/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={barWidth}
                aria-label="Percentage of recurring funding goal achieved"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#1c252e] to-[#edb73e] transition-all duration-500 ease-out"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>

            {updatedLabel || editMode ? (
              <p className="text-center text-sm text-brand-ink/60">
                Figures last updated{" "}
                <span className="text-brand-ink/80">
                  {updatedLabel || (editMode ? "(set Last Updated in properties)" : "")}
                </span>
              </p>
            ) : null}

            {editMode ? (
              <div className="rounded-xl border border-dashed border-brand-primary/25 bg-white/50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-primary">
                  Awaiting-update message
                </p>
                <EditableElement
                  sectionId={section.id}
                  elementId="body"
                  style={getFieldStyle(c, "body")}
                  className="mt-2"
                >
                  <SiteBuilderFormattedContent
                    text={awaiting}
                    className="text-sm text-brand-ink/75 leading-relaxed"
                    emptyPlaceholder="Shown on the public page until both amounts are published"
                  />
                </EditableElement>
              </div>
            ) : null}
          </div>
        )}

        <ContentElementsBlock section={section} />
      </div>
    </section>
  );
}

export function FunctionsHeadingEditable({ section }: { section: PageSection }) {
  const ctx = useBuilderPreview();
  const c = section.content;
  const headline = contentStr(c, "headline");
  const body = contentStr(c, "body");

  return (
    <section className="px-4 pt-14 sm:pt-16">
      <div className="mx-auto max-w-3xl text-center">
        {showField(ctx?.editMode, "headline", headline, c) ? (
          <EditableElement sectionId={section.id} elementId="headline" style={getFieldStyle(c, "headline")}>
            <SiteBuilderFormattedContent
              text={headline}
              className="font-serif text-2xl sm:text-3xl text-brand-ink tracking-wide [&_p]:m-0"
              emptyPlaceholder={ctx?.editMode ? "Heading (empty)" : undefined}
            />
          </EditableElement>
        ) : null}
        <GoldRule />
        {showField(ctx?.editMode, "body", body, c) ? (
          <EditableElement
            sectionId={section.id}
            elementId="body"
            style={getFieldStyle(c, "body")}
            className="mt-6"
          >
            <SiteBuilderFormattedContent
              text={body}
              className="text-brand-ink/85 leading-relaxed"
              emptyPlaceholder={ctx?.editMode ? "Intro (optional)" : undefined}
            />
          </EditableElement>
        ) : null}
      </div>
    </section>
  );
}

export function AllocationEditable({ section }: { section: PageSection }) {
  const ctx = useBuilderPreview();
  const view = parseAllocationSection(section, { includeHidden: Boolean(ctx?.editMode) });
  if (!view) return null;
  const c = section.content;
  const { derived } = view;
  const showChart = derived.canPublishChart;

  const coloredSlices = derived.slices.map((slice, i) => {
    const match =
      view.functions.find((f) => f.id === slice.id) ||
      view.functions.find(
        (f) => normalizeFunctionName(f.name) === normalizeFunctionName(slice.name),
      );
    return {
      ...slice,
      color:
        match?.color ||
        DEFAULT_COLORS_FOR_IMPORT[i % DEFAULT_COLORS_FOR_IMPORT.length] ||
        "#83b0da",
    };
  });

  return (
    <section className="border-b border-brand-primary/15 px-4 py-12 sm:py-14">
      <div className="mx-auto max-w-4xl">
        {showField(ctx?.editMode, "headline", view.headline, c) ? (
          <EditableElement sectionId={section.id} elementId="headline" style={getFieldStyle(c, "headline")}>
            <SiteBuilderFormattedContent
              text={view.headline}
              className="text-center font-serif text-2xl sm:text-3xl text-brand-ink tracking-wide [&_p]:m-0"
              emptyPlaceholder={ctx?.editMode ? "Chart title (empty)" : undefined}
            />
          </EditableElement>
        ) : null}

        {showField(ctx?.editMode, "intro", view.explanation, c) ? (
          <EditableElement
            sectionId={section.id}
            elementId="intro"
            style={getFieldStyle(c, "intro")}
            className="mx-auto mt-6 max-w-3xl"
          >
            <SiteBuilderFormattedContent
              text={view.explanation}
              className="text-center text-brand-ink/85 leading-relaxed"
              emptyPlaceholder={ctx?.editMode ? "Chart explanation (empty)" : undefined}
            />
          </EditableElement>
        ) : null}

        {view.reportingMonth.trim() || ctx?.editMode ? (
          <p className="mt-3 text-center text-sm text-brand-ink/60">
            Reporting period:{" "}
            <EditableElement
              sectionId={section.id}
              elementId="reportingMonth"
              style={getFieldStyle(c, "reportingMonth")}
              layout="inline"
            >
              <SiteBuilderFormattedContent
                text={view.reportingMonth}
                className="inline [&_p]:m-0 [&_p]:inline"
                emptyPlaceholder={ctx?.editMode ? "e.g. March 2026" : undefined}
              />
            </EditableElement>
          </p>
        ) : null}

        <div className="mt-10">
          {showChart ? (
            <AllocationDoughnut slices={coloredSlices} title={view.headline} />
          ) : (
            <div className="rounded-2xl border border-dashed border-brand-primary/25 bg-white/50 px-5 py-6 text-center">
              {showField(ctx?.editMode, "awaitingCopy", view.awaitingCopy, c) ? (
                <EditableElement
                  sectionId={section.id}
                  elementId="awaitingCopy"
                  style={getFieldStyle(c, "awaitingCopy")}
                >
                  <SiteBuilderFormattedContent
                    text={view.awaitingCopy}
                    className="text-brand-ink/80 leading-relaxed"
                    emptyPlaceholder={
                      ctx?.editMode
                        ? "Message when chart is not published (empty amounts or unreconciled)"
                        : undefined
                    }
                  />
                </EditableElement>
              ) : (
                <p className="text-brand-ink/75">
                  A numerical investment chart will appear once a reconciled allocation is published.
                </p>
              )}
            </div>
          )}
        </div>

        {showField(ctx?.editMode, "body", view.distinction, c) ? (
          <EditableElement
            sectionId={section.id}
            elementId="body"
            style={getFieldStyle(c, "body")}
            className="mx-auto mt-6 max-w-3xl"
          >
            <SiteBuilderFormattedContent
              text={view.distinction}
              className="text-center text-sm text-brand-ink/70 leading-relaxed"
              emptyPlaceholder={ctx?.editMode ? "Distinction note (empty)" : undefined}
            />
          </EditableElement>
        ) : null}

        {ctx?.editMode ? (
          <>
            <AdminReconciliationNote derived={derived} />
            {view.chartPresentation && !view.chartPresentation.ok ? (
              <div className="mx-auto mt-4 max-w-3xl rounded-lg border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {view.chartPresentation.error}
              </div>
            ) : null}
            {view.chartPresentation?.ok &&
            view.chartPresentation.missionShareFoldedIntoOperations ? (
              <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-brand-ink/60">
                Chart includes Mission Share (
                {formatUsd(view.chartPresentation.missionShareCents / 100)}) in{" "}
                {view.chartPresentation.operationsFunctionName}. Source snapshot is unchanged.
              </p>
            ) : null}
          </>
        ) : null}

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {view.descriptionFunctions.map((fn) => (
            <article
              key={fn.id}
              className={cn(
                "rounded-2xl border border-brand-primary/20 bg-white/75 px-5 py-6 shadow-sm",
                !fn.visible && ctx?.editMode && "opacity-50",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-1 h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: fn.color }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <h3 className="font-serif text-xl text-brand-ink tracking-wide">{fn.name}</h3>
                  {fn.description ? (
                    <p className="mt-3 text-sm text-brand-ink/85 leading-relaxed">{fn.description}</p>
                  ) : null}
                  {fn.programs.length > 0 ? (
                    <ul className="mt-4 space-y-1.5">
                      {fn.programs.map((program) => (
                        <li
                          key={program}
                          className="flex gap-2 text-sm text-brand-ink/75 leading-snug"
                        >
                          <span
                            className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-accent"
                            aria-hidden
                          />
                          <span>{program}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>

        <ContentElementsBlock section={section} />
      </div>
    </section>
  );
}

function AdminReconciliationNote({ derived }: { derived: AllocationDerived }) {
  const blocked = !derived.canPublishChart;
  return (
    <div
      className={cn(
        "mx-auto mt-6 max-w-3xl rounded-lg border px-4 py-3 text-sm",
        blocked
          ? "border-amber-500/40 bg-amber-50 text-amber-950"
          : "border-emerald-500/30 bg-emerald-50 text-emerald-950",
      )}
    >
      <p className="font-medium">
        {derived.canPublishChart
          ? "Chart ready to publish — amounts reconcile."
          : "Chart will not publish until amounts are complete and reconciled."}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs opacity-90">
        <li>
          Function amounts complete: {derived.hasCompleteFunctionAmounts ? "yes" : "no"}
          {derived.functionTotal !== null ? ` (total ${formatUsd(derived.functionTotal)})` : ""}
        </li>
        <li>
          Reconciliation:{" "}
          {derived.reconciliationOk
            ? "ok"
            : derived.discrepancy !== null
              ? `off by ${formatUsd(Math.abs(derived.discrepancy))} (actual ${
                  derived.reconciliationActual !== null
                    ? formatUsd(derived.reconciliationActual)
                    : "—"
                } vs expected ${
                  derived.reconciliationExpected !== null
                    ? formatUsd(derived.reconciliationExpected)
                    : "—"
                })`
              : "incomplete"}
        </li>
        <li>
          Mission Share{" "}
          {derived.missionShareIncludedInExpenseTotal
            ? "included in expense total"
            : "excluded from expense total"}
          {derived.missionShareAmount !== null
            ? `: ${formatUsd(derived.missionShareAmount)}`
            : " (not entered)"}
        </li>
      </ul>
    </div>
  );
}

export function InvitationEditable({ section }: { section: PageSection }) {
  const ctx = useBuilderPreview();
  const c = section.content;
  const headline = contentStr(c, "headline");
  const body = contentStr(c, "body");
  const primary = contentStr(c, "primaryCtaLabel");
  const primaryUrl = contentStr(c, "primaryCtaUrl") || "/give";
  const secondary = contentStr(c, "secondaryCtaLabel");
  const secondaryUrl = contentStr(c, "secondaryCtaUrl") || "/contact";

  return (
    <section className="border-t border-brand-primary/15 bg-gradient-to-b from-brand-surface to-white/80 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        {showField(ctx?.editMode, "headline", headline, c) ? (
          <EditableElement sectionId={section.id} elementId="headline" style={getFieldStyle(c, "headline")}>
            <SiteBuilderFormattedContent
              text={headline}
              className="font-serif text-3xl sm:text-4xl text-brand-ink tracking-wide [&_p]:m-0"
              emptyPlaceholder={ctx?.editMode ? "Invitation headline (empty)" : undefined}
            />
          </EditableElement>
        ) : null}
        <GoldRule />
        {showField(ctx?.editMode, "body", body, c) ? (
          <EditableElement
            sectionId={section.id}
            elementId="body"
            style={getFieldStyle(c, "body")}
            className="mx-auto mt-6 max-w-2xl"
          >
            <SiteBuilderFormattedContent
              text={body}
              className="text-base sm:text-lg text-brand-ink/85 leading-relaxed"
              emptyPlaceholder={ctx?.editMode ? "Invitation body (empty)" : undefined}
            />
          </EditableElement>
        ) : null}

        {(primary.trim() || secondary.trim() || ctx?.editMode) && (
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            {(primary.trim() || ctx?.editMode) && (
              <EditableElement
                sectionId={section.id}
                elementId="cta:primary"
                style={getFieldStyle(c, "cta:primary")}
                layout="inline"
                styleOnWrapper={false}
              >
                <Link href={primaryUrl} className={storefrontButtonClasses("primary")}>
                  {primary.trim() || (ctx?.editMode ? "Primary CTA" : "")}
                </Link>
              </EditableElement>
            )}
            {(secondary.trim() || ctx?.editMode) && secondary.trim() ? (
              <EditableElement
                sectionId={section.id}
                elementId="cta:secondary"
                style={getFieldStyle(c, "cta:secondary")}
                layout="inline"
                styleOnWrapper={false}
              >
                <Link href={secondaryUrl} className={storefrontButtonClasses("secondary")}>
                  {secondary.trim()}
                </Link>
              </EditableElement>
            ) : null}
          </div>
        )}
        <ContentElementsBlock section={section} />
      </div>
    </section>
  );
}

export function renderMinistryFundingSection(section: PageSection): ReactNode {
  if (section.sectionKey === "hero") {
    return <OurMissionHeroEditable section={section} />;
  }
  if (isMinistryFundingGoalsSection(section)) {
    return <FundingGoalsEditable section={section} />;
  }
  if (section.sectionKey === "functions-heading") {
    return <FunctionsHeadingEditable section={section} />;
  }
  if (isMinistryFundingAllocationSection(section)) {
    return <AllocationEditable section={section} />;
  }
  if (section.sectionKey === "invitation" || section.sectionType === "cta") {
    return <InvitationEditable section={section} />;
  }
  return null;
}
