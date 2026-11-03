"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { PageSection } from "@/lib/site-builder/types";
import {
  applyZoamSnapshotToAllocationSection,
  readZoamExistingMeta,
} from "@/lib/ministry-funding/apply-zoam-import";
import type { ZoamImportResult } from "@/lib/ministry-funding/zoam-import";
import { formatUsdFromCents } from "@/lib/ministry-funding/zoam-schema";
import { AllocationDoughnut } from "@/components/ministry-funding/allocation-doughnut";
import { DEFAULT_COLORS_FOR_IMPORT } from "@/lib/ministry-funding/chart-colors";
import { validateZoamMinistryAllocationAction } from "@/app/admin/site-builder/zoam-import-actions";

export function MinistryAllocationImportPanel({
  section,
  onChange,
  embeddedInModal = false,
  onApplied,
  onCancel,
}: {
  section: PageSection;
  onChange: (next: PageSection) => void;
  /** When true, omit the outer chrome (used inside the Site Builder modal). */
  embeddedInModal?: boolean;
  onApplied?: (reportingMonthLabel: string) => void;
  onCancel?: () => void;
}) {
  const [paste, setPaste] = useState("");
  const [result, setResult] = useState<ZoamImportResult | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [validating, setValidating] = useState(false);
  const existing = useMemo(() => readZoamExistingMeta(section), [section]);

  const runValidate = async () => {
    setConfirmReplace(false);
    setValidating(true);
    try {
      const next = await validateZoamMinistryAllocationAction(paste, existing);
      setResult(next);
    } finally {
      setValidating(false);
    }
  };

  const canApply =
    result?.ok === true &&
    !result.compare.isIdenticalDuplicate &&
    (!result.compare.requiresConfirmation || confirmReplace);

  const applyDraft = () => {
    if (!result || !result.ok) return;
    if (result.compare.requiresConfirmation && !confirmReplace) return;
    const next = applyZoamSnapshotToAllocationSection(section, result.snapshot, {
      confirmedReplace: confirmReplace,
    });
    const monthLabel =
      result.snapshot.reportingMonthLabel || result.snapshot.reportingMonth;
    onChange(next);
    setPaste("");
    setResult(null);
    setConfirmReplace(false);
    onApplied?.(monthLabel);
  };

  const coloredSlices =
    result?.ok && result.preview
      ? result.preview.chartSlices.map((slice, i) => ({
          ...slice,
          color: DEFAULT_COLORS_FOR_IMPORT[i % DEFAULT_COLORS_FOR_IMPORT.length]!,
        }))
      : [];

  const body = (
    <div className="space-y-3">
      {!embeddedInModal ? (
        <div>
          <p className="text-sm font-medium text-zinc-100">Import Ministry Allocation</p>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            Paste a <span className="font-mono text-zinc-400">zoam-ministry-allocation/v1</span>{" "}
            snapshot copied from PD Coaching OS. Validate and preview first — Apply updates the draft
            only. Use Save → Publish &amp; Refresh to go live. Does not change Financial Partnership
            Goal figures.
          </p>
        </div>
      ) : null}

      {existing.reportingMonthKey || existing.snapshot ? (
        <p className="text-[11px] text-zinc-400">
          Current draft month:{" "}
          <span className="text-zinc-200">
            {existing.reportingMonthLabel || existing.reportingMonthKey || "—"}
          </span>
          {existing.snapshot?.exportedAt ? (
            <span className="block text-zinc-500">
              Snapshot exported {new Date(existing.snapshot.exportedAt).toLocaleString()}
            </span>
          ) : null}
        </p>
      ) : (
        <p className="text-[11px] text-zinc-500">No allocation snapshot in the draft yet.</p>
      )}

      <div className="space-y-1">
        <Label htmlFor="zoam-paste" className="text-xs text-zinc-400">
          Pasted JSON
        </Label>
        <textarea
          id="zoam-paste"
          value={paste}
          onChange={(e) => {
            setPaste(e.target.value);
            setResult(null);
            setConfirmReplace(false);
          }}
          rows={embeddedInModal ? 10 : 8}
          spellCheck={false}
          placeholder='{ "schemaVersion": "zoam-ministry-allocation/v1", ... }'
          className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 font-mono text-[11px] text-zinc-100 placeholder:text-zinc-600"
        />
      </div>

      <Button
        type="button"
        size="sm"
        className="w-full"
        onClick={() => void runValidate()}
        disabled={!paste.trim() || validating}
      >
        {validating ? "Validating…" : "Validate & Preview"}
      </Button>

      {result ? (
        <div className="space-y-3 border-t border-zinc-800 pt-3">
          <IssueList issues={result.issues} />

          {result.ok && result.preview ? (
            <>
              <div className="space-y-1 rounded border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-[11px] text-zinc-300">
                <p>
                  <span className="text-zinc-500">Incoming month:</span>{" "}
                  {result.preview.reportingMonthLabel} ({result.preview.reportingMonth})
                </p>
                <p>
                  <span className="text-zinc-500">Chart total (7 functions, incl. Mission Share):</span>{" "}
                  {formatUsdFromCents(result.preview.chartTotalInvestmentCents)}
                </p>
                <p>
                  <span className="text-zinc-500">Source allocated investment:</span>{" "}
                  {formatUsdFromCents(result.preview.totalAllocatedInvestmentCents)}
                </p>
                <p>
                  <span className="text-zinc-500">Mission Share:</span>{" "}
                  {formatUsdFromCents(result.preview.missionShareCents)}
                  {result.preview.missionShareFoldedIntoOperations
                    ? " (included in Ministry Operations & Stewardship)"
                    : result.preview.missionShareIncludedInReportedFinancialTotal
                      ? " (in reported total; see notes)"
                      : " (see notes)"}
                </p>
                <p>
                  <span className="text-zinc-500">Reported expenses:</span>{" "}
                  {formatUsdFromCents(result.preview.reportedMonthlyFinancialTotalCents)}
                </p>
                <p>
                  <span className="text-zinc-500">Reconciliation:</span>{" "}
                  {result.preview.reconciliationStatus}
                </p>
                <p>
                  <span className="text-zinc-500">Functions:</span> {result.preview.functions.length}
                </p>
              </div>

              <div className="overflow-x-auto rounded border border-zinc-800">
                <table className="w-full text-left text-[10px] text-zinc-300">
                  <thead className="bg-zinc-900 text-zinc-500">
                    <tr>
                      <th className="px-2 py-1.5 font-medium">Function</th>
                      <th className="px-2 py-1.5 font-medium">Minutes</th>
                      <th className="px-2 py-1.5 font-medium">Direct</th>
                      <th className="px-2 py-1.5 font-medium">Time-weighted</th>
                      <th className="px-2 py-1.5 font-medium">Chart total</th>
                      <th className="px-2 py-1.5 font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.functions.map((fn) => (
                      <tr key={fn.name} className="border-t border-zinc-800">
                        <td className="px-2 py-1.5">
                          {fn.name}
                          {fn.missionShareIncludedCents > 0 ? (
                            <span className="mt-0.5 block text-[9px] text-zinc-500">
                              includes Mission Share{" "}
                              {formatUsdFromCents(fn.missionShareIncludedCents)}
                            </span>
                          ) : null}
                          {fn.synthesizedFromCanonical ? (
                            <span className="mt-0.5 block text-[9px] text-zinc-500">
                              presentation row (omitted from source at $0)
                            </span>
                          ) : null}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">{fn.recordedTimeMinutes}</td>
                        <td className="px-2 py-1.5 tabular-nums">
                          {formatUsdFromCents(fn.directExpenseCents)}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">
                          {formatUsdFromCents(fn.timeWeightedAllocatedExpenseCents)}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">
                          {formatUsdFromCents(fn.totalInvestmentCents)}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums">{fn.percent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded border border-zinc-800 bg-zinc-950/80 p-3">
                <p className="mb-2 text-[11px] font-medium text-zinc-300">
                  Chart preview (public after publish)
                </p>
                {coloredSlices.length > 0 ? (
                  <AllocationDoughnut
                    slices={coloredSlices}
                    title="Estimated Ministry Investment by Function"
                  />
                ) : (
                  <p className="text-[11px] text-amber-200">
                    {result.preview.chartPublicationBlockedReason ||
                      "Chart cannot be published until Ministry Operations & Stewardship is identified."}
                  </p>
                )}
                <p className="mt-3 text-[10px] text-zinc-500">
                  Seven functions only. Team Expansion Mission Share is included in Ministry
                  Operations &amp; Stewardship — not a separate slice.
                </p>
              </div>

              {result.compare.isIdenticalDuplicate ? (
                <p className="rounded border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-[11px] text-zinc-300">
                  Snapshot already saved. Close this modal — the public chart uses the corrected
                  Mission Share presentation automatically. No reimport required.
                </p>
              ) : null}

              {result.compare.requiresConfirmation ? (
                <label className="flex items-start gap-2 text-[11px] text-amber-100">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={confirmReplace}
                    onChange={(e) => setConfirmReplace(e.target.checked)}
                  />
                  <span>
                    I confirm replacing the existing allocation
                    {result.compare.currentReportingMonth
                      ? ` (${result.compare.currentReportingMonth})`
                      : ""}{" "}
                    with {result.compare.incomingReportingMonth}.
                  </span>
                </label>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                {onCancel ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={onCancel}
                  >
                    {result.compare.isIdenticalDuplicate ? "Close" : "Cancel"}
                  </Button>
                ) : null}
                {!result.compare.isIdenticalDuplicate ? (
                  <Button
                    type="button"
                    size="sm"
                    className="w-full flex-1"
                    disabled={!canApply}
                    onClick={applyDraft}
                  >
                    Apply to Draft
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      ) : onCancel ? (
        <div className="flex justify-end border-t border-zinc-800 pt-3">
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      ) : null}
    </div>
  );

  if (embeddedInModal) return body;

  return (
    <div className="space-y-3 rounded-md border border-brand-accent/40 bg-zinc-950/60 p-3">
      {body}
    </div>
  );
}

function IssueList({
  issues,
}: {
  issues: Array<{ severity: "error" | "warning" | "info"; message: string }>;
}) {
  if (issues.length === 0) {
    return (
      <p className="text-[11px] text-emerald-300">Validation passed with no warnings.</p>
    );
  }
  return (
    <ul className="space-y-1 text-[11px]">
      {issues.map((issue, i) => (
        <li
          key={`${issue.severity}-${i}`}
          className={
            issue.severity === "error"
              ? "text-red-300"
              : issue.severity === "warning"
                ? "text-amber-200"
                : "text-sky-200"
          }
        >
          {issue.severity === "error"
            ? "Error: "
            : issue.severity === "warning"
              ? "Warning: "
              : "Note: "}
          {issue.message}
        </li>
      ))}
    </ul>
  );
}
