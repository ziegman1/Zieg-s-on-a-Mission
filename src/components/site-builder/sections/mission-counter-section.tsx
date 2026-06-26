"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { contentStr, fieldVisible, getFieldStyle } from "@/lib/site-builder/content-utils";
import {
  computeMissionCounterValues,
  defaultMissionCounterConfig,
  formatCounterValue,
  parseMissionCounterConfig,
} from "@/lib/site-builder/mission-counter";
import type { PageSection } from "@/lib/site-builder/types";
import { cn } from "@/lib/utils";
import { EditableElement } from "../editable-element";
import { ContentElementsBlock } from "../content-elements-block";
import { SiteBuilderFormattedContent } from "../site-builder-formatted-content";
import { useBuilderPreview } from "../builder-preview-context";

function CounterCard({
  label,
  value,
  labelElementId,
  sectionId,
  labelStyle,
}: {
  label: string;
  value: string;
  labelElementId: string;
  sectionId: string;
  labelStyle: ReturnType<typeof getFieldStyle>;
}) {
  return (
    <div className="rounded-2xl border border-brand-primary/20 bg-white/70 px-5 py-5 shadow-sm">
      <EditableElement
        sectionId={sectionId}
        elementId={labelElementId}
        style={labelStyle}
        layout="block"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary/85">
          {label}
        </p>
      </EditableElement>
      <p
        className="mt-2 font-serif text-3xl sm:text-4xl text-brand-ink tabular-nums tracking-tight"
        aria-live="polite"
      >
        {value}
      </p>
    </div>
  );
}

export function MissionCounterSection({ section }: { section: PageSection }) {
  const ctx = useBuilderPreview();
  const c = section.content;
  const headline = contentStr(c, "headline");
  const body = contentStr(c, "body");
  const populationLabel = contentStr(c, "populationLabel");
  const bornLabel = contentStr(c, "bornLabel");
  const diedLabel = contentStr(c, "diedLabel");
  const sourceNote = contentStr(c, "sourceNote");
  const sourceUrl = contentStr(c, "sourceUrl");

  const config = useMemo(
    () => parseMissionCounterConfig(c, defaultMissionCounterConfig()),
    [c],
  );

  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (ctx?.editMode) return;

    let frame = 0;
    let lastTick = 0;

    const tick = (ts: number) => {
      if (document.visibilityState === "hidden") {
        frame = requestAnimationFrame(tick);
        return;
      }
      if (ts - lastTick >= 1000) {
        lastTick = ts;
        setNowMs(Date.now());
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ctx?.editMode]);

  const values = useMemo(
    () => computeMissionCounterValues(nowMs, config),
    [nowMs, config],
  );

  const show = (key: string, text: string) =>
    ctx?.editMode || (text.trim().length > 0 && fieldVisible(c, key));

  if (
    !ctx?.editMode &&
    !headline.trim() &&
    !body.trim() &&
    !populationLabel.trim() &&
    !bornLabel.trim() &&
    !diedLabel.trim()
  ) {
    return null;
  }

  return (
    <section className="border-y border-brand-primary/15 bg-gradient-to-b from-white to-brand-surface/80 px-4 py-14 sm:py-16">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
        <div className="max-w-xl">
          {show("headline", headline) ? (
            <EditableElement
              sectionId={section.id}
              elementId="headline"
              style={getFieldStyle(c, "headline")}
            >
              <SiteBuilderFormattedContent
                text={headline}
                className="font-serif text-2xl sm:text-3xl text-brand-primary tracking-wide"
                emptyPlaceholder={ctx?.editMode ? "Headline (empty)" : undefined}
              />
            </EditableElement>
          ) : null}
          {show("body", body) ? (
            <EditableElement
              sectionId={section.id}
              elementId="body"
              style={getFieldStyle(c, "body")}
            >
              <SiteBuilderFormattedContent
                text={body}
                className="mt-5 text-brand-ink/88 leading-relaxed"
                emptyPlaceholder={ctx?.editMode ? "Body (empty)" : undefined}
              />
            </EditableElement>
          ) : null}
        </div>

        <div className="space-y-4">
          <CounterCard
            sectionId={section.id}
            labelElementId="populationLabel"
            labelStyle={getFieldStyle(c, "populationLabel")}
            label={populationLabel}
            value={formatCounterValue(values.worldPopulation)}
          />
          <CounterCard
            sectionId={section.id}
            labelElementId="bornLabel"
            labelStyle={getFieldStyle(c, "bornLabel")}
            label={bornLabel}
            value={formatCounterValue(values.bornTodayWithoutAccess)}
          />
          <CounterCard
            sectionId={section.id}
            labelElementId="diedLabel"
            labelStyle={getFieldStyle(c, "diedLabel")}
            label={diedLabel}
            value={formatCounterValue(values.diedTodayWithoutAccess)}
          />
        </div>
      </div>

      {show("sourceNote", sourceNote) ? (
        <EditableElement
          sectionId={section.id}
          elementId="sourceNote"
          style={getFieldStyle(c, "sourceNote")}
          layout="block"
        >
          <p className="mx-auto mt-8 max-w-6xl text-center text-xs text-brand-ink/55 leading-relaxed">
            {sourceNote.trim()}
            {sourceUrl.trim() ? (
              <>
                {" "}
                <Link
                  href={sourceUrl}
                  className={cn(
                    "text-brand-primary hover:underline",
                    ctx?.editMode && "pointer-events-none",
                  )}
                >
                  Learn more
                </Link>
              </>
            ) : null}
          </p>
        </EditableElement>
      ) : null}
      <ContentElementsBlock section={section} />
    </section>
  );
}
