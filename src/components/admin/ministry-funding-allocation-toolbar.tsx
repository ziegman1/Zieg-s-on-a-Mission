"use client";

import { useMemo, useState } from "react";
import type { PageSection } from "@/lib/site-builder/types";
import { isMinistryFundingAllocationSection } from "@/lib/site-builder/ministry-funding-page-sections";
import { readZoamExistingMeta } from "@/lib/ministry-funding/apply-zoam-import";
import { MinistryAllocationImportPanel } from "@/components/admin/ministry-allocation-import-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type MinistryFundingMonthLabel = {
  key: string | null;
  label: string | null;
};

/**
 * Persistent Ministry Funding toolbar: opens the ZOAM importer in a modal.
 * Visible for the whole ministry-funding page, independent of section selection.
 */
export function MinistryFundingAllocationToolbar({
  sections,
  publishedMonth,
  onAllocationSectionChange,
  onAppliedMessage,
}: {
  sections: PageSection[];
  /** Last saved / published reporting month for this page. */
  publishedMonth: MinistryFundingMonthLabel;
  onAllocationSectionChange: (next: PageSection) => void;
  onAppliedMessage: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const allocationSection = useMemo(
    () => sections.find(isMinistryFundingAllocationSection) ?? null,
    [sections],
  );
  const draftMeta = useMemo(
    () => readZoamExistingMeta(allocationSection),
    [allocationSection],
  );

  const publishedLabel = publishedMonth.label || publishedMonth.key || null;
  const draftLabel = draftMeta.reportingMonthLabel || draftMeta.reportingMonthKey || null;
  const draftDiffers =
    Boolean(draftLabel) &&
    (draftMeta.reportingMonthKey || draftLabel) !==
      (publishedMonth.key || publishedLabel);

  if (!allocationSection) return null;

  return (
    <>
      <div className="shrink-0 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-100">Ministry Allocation Data</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
              Update the ministry investment chart using monthly allocation data from PD Coaching OS.
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-400">
              <span>
                Published month:{" "}
                <span className="text-zinc-200">{publishedLabel || "None yet"}</span>
              </span>
              {draftDiffers ? (
                <span>
                  Draft month: <span className="text-amber-200">{draftLabel}</span>
                </span>
              ) : null}
            </div>
          </div>
          <Button type="button" size="sm" className="shrink-0" onClick={() => setOpen(true)}>
            Import Monthly Data
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex max-h-[min(92vh,900px)] w-[calc(100%-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden border-zinc-700 bg-zinc-950 p-0 text-zinc-100 sm:max-w-3xl"
          showCloseButton
        >
          <DialogHeader className="shrink-0 border-b border-zinc-800 px-4 py-3 text-left sm:px-5">
            <DialogTitle className="text-zinc-50">Import Monthly Ministry Allocation</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Paste a <span className="font-mono text-zinc-400">zoam-ministry-allocation/v1</span>{" "}
              snapshot from PD Coaching OS. Apply updates the draft only — use Save → Publish &amp;
              Refresh to go live. Financial Partnership Goal figures are not changed.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            <MinistryAllocationImportPanel
              section={allocationSection}
              onChange={onAllocationSectionChange}
              embeddedInModal
              onApplied={(reportingMonthLabel) => {
                setOpen(false);
                onAppliedMessage(
                  `Applied Ministry Allocation draft for ${reportingMonthLabel}. Save, then Publish & Refresh to go live.`,
                );
              }}
              onCancel={() => setOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function monthLabelFromAllocationSection(
  section: PageSection | null | undefined,
): MinistryFundingMonthLabel {
  const meta = readZoamExistingMeta(section);
  return {
    key: meta.reportingMonthKey,
    label: meta.reportingMonthLabel,
  };
}
