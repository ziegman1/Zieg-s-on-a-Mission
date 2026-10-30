"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { MinistryOutcomeCounts } from "@/lib/ministry/ministry-milestones";
import { initiativeContribution } from "@/lib/ministry/ministry-milestones";
import {
  NATIONAL_PARTNER_TRAINING_LABELS,
  NATIONAL_PARTNER_TRAINING_TYPES,
  formatNationalPartnerInitiativeAudit,
  formatNationalPartnerInitiativeErrors,
  nationalPartnerInitiativeCreateSchema,
  nationalPartnerInitiativeSchema,
  type NationalPartnerInitiativeAuditView,
  type NationalPartnerInitiativeView,
  type NationalPartnerTrainingType,
} from "@/lib/ministry/national-partner-initiatives";
import {
  createNationalPartnerInitiativeAction,
  deleteNationalPartnerInitiativeAction,
  updateNationalPartnerInitiativeAction,
} from "./initiative-actions";

type Draft = {
  nation: string;
  area: string;
  trainingType: NationalPartnerTrainingType;
  completedCount: string;
};

const blankDraft: Draft = {
  nation: "",
  area: "",
  trainingType: "JONATHAN_TRAINING",
  completedCount: "",
};

const selectClass =
  "mt-1 w-full rounded-md border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-cream";

function sameDraft(left: Draft, right: Draft): boolean {
  return (
    left.nation === right.nation &&
    left.area === right.area &&
    left.trainingType === right.trainingType &&
    left.completedCount === right.completedCount
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-1 font-serif text-2xl text-cream tabular-nums">{value}</p>
    </div>
  );
}

export function NationalPartnerInitiatives({
  initiatives,
  audits,
  counts,
}: {
  initiatives: NationalPartnerInitiativeView[];
  audits: NationalPartnerInitiativeAuditView[];
  counts: MinistryOutcomeCounts;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [baseline, setBaseline] = useState<Draft>(blankDraft);
  const [submissionKey, setSubmissionKey] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);
  const formId = "national-partner-initiative-form";
  const dirty = open && !sameDraft(draft, baseline);
  const parsedCount = /^[1-9]\d*$/.test(draft.completedCount) ? Number(draft.completedCount) : null;
  const contribution = parsedCount === null ? null : initiativeContribution(parsedCount);

  function openAdd() {
    setEditingId(null);
    setDraft(blankDraft);
    setBaseline(blankDraft);
    setSubmissionKey(crypto.randomUUID());
    setModalError(null);
    setOpen(true);
  }

  function openEdit(initiative: NationalPartnerInitiativeView) {
    const next: Draft = {
      nation: initiative.nation,
      area: initiative.area,
      trainingType: initiative.trainingType,
      completedCount: String(initiative.completedCount),
    };
    setEditingId(initiative.id);
    setDraft(next);
    setBaseline(next);
    setSubmissionKey(null);
    setModalError(null);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setModalError(null);
  }

  function requestClose() {
    if (saving) return;
    if (dirty && !window.confirm("Discard unsaved changes to this initiative?")) return;
    close();
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saveLock.current) return;
    const parsed = editingId
      ? nationalPartnerInitiativeSchema.safeParse(draft)
      : nationalPartnerInitiativeCreateSchema.safeParse({ ...draft, submissionKey });
    if (!parsed.success) {
      setModalError(formatNationalPartnerInitiativeErrors(parsed.error));
      return;
    }
    saveLock.current = true;
    setSaving(true);
    setModalError(null);
    try {
      const result = editingId
        ? await updateNationalPartnerInitiativeAction(editingId, {
            nation: draft.nation,
            area: draft.area,
            trainingType: draft.trainingType,
            completedCount: draft.completedCount,
          })
        : await createNationalPartnerInitiativeAction({
            nation: draft.nation,
            area: draft.area,
            trainingType: draft.trainingType,
            completedCount: draft.completedCount,
            submissionKey: submissionKey ?? "",
          });
      if (!result.ok) {
        setModalError(result.error);
        return;
      }
      close();
      router.refresh();
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  async function remove(initiative: NationalPartnerInitiativeView) {
    if (saving) return;
    const accepted = window.confirm(
      "Remove this initiative? Its completed count will be taken out of the Mobilized, Trained & Equipped, and Sent totals.",
    );
    if (!accepted) return;
    setSaving(true);
    setSectionError(null);
    try {
      const result = await deleteNationalPartnerInitiativeAction(initiative.id);
      if (!result.ok) {
        setSectionError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-brand-primary tracking-wide">
            National Partner Training Initiatives
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
            Record a completed training by nation, area, training type, and how many participants
            finished. Names are not collected. Each saved initiative adds its completed count to
            Mobilized, Trained &amp; Equipped, and Sent.
          </p>
        </div>
        <Button type="button" onClick={openAdd} disabled={saving}>
          Add Initiative
        </Button>
      </div>

      <p className="max-w-3xl text-xs leading-relaxed text-zinc-500">
        Participants are not named. The same person cannot be identified if they attend more than
        one initiative, so those counts stay added together.
      </p>

      {sectionError ? <p className="text-sm text-red-400">{sectionError}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryStat label="Initiatives" value={initiatives.length} />
        <SummaryStat label="Participants completed" value={counts.mobilized} />
        <SummaryStat label="Mobilized" value={counts.mobilized} />
        <SummaryStat label="Trained & Equipped" value={counts.trainedEquipped} />
        <SummaryStat label="Sent" value={counts.sent} />
      </div>
      <p className="text-xs text-zinc-500">These four totals count only these initiatives.</p>

      {initiatives.length === 0 ? (
        <p className="text-sm text-zinc-500">No national partner training initiatives yet.</p>
      ) : (
        <ul className="space-y-3">
          {initiatives.map((initiative) => (
            <li
              key={initiative.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3"
            >
              <div>
                <p className="text-sm text-cream">
                  {initiative.nation}
                  <span className="text-zinc-500"> · {initiative.area}</span>
                </p>
                <p className="mt-1 text-sm text-zinc-300">
                  {NATIONAL_PARTNER_TRAINING_LABELS[initiative.trainingType]}
                  <span className="text-zinc-500"> · {initiative.completedCount} completed</span>
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Mobilized {initiative.completedCount} · Trained &amp; Equipped{" "}
                  {initiative.completedCount} · Sent {initiative.completedCount}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-zinc-700"
                  onClick={() => openEdit(initiative)}
                  disabled={saving}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-red-400"
                  onClick={() => remove(initiative)}
                  disabled={saving}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {audits.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Count history
          </h3>
          <ul className="space-y-1">
            {audits.map((audit) => (
              <li key={audit.id} className="text-xs leading-relaxed text-zinc-500">
                {formatNationalPartnerInitiativeAudit(audit)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {open ? (
        <Dialog open onOpenChange={(next) => { if (!next) requestClose(); }}>
          <DialogContent
            showCloseButton={false}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              document.getElementById("initiative-nation")?.focus();
            }}
            className="grid h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-none border-brand-accent/30 bg-zinc-950 p-0 text-cream top-0 left-0 sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[min(92dvh,40rem)] sm:w-[min(40rem,calc(100%-2rem))] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-start gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
              <div className="min-w-0 flex-1">
                <DialogTitle className="font-serif text-xl text-cream">
                  {editingId ? "Edit initiative" : "Add initiative"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-zinc-500">
                  A saved initiative is a completed and commissioned training. It does not change
                  anyone&apos;s pathway or individual milestones.
                </DialogDescription>
              </div>
              <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={requestClose}>
                <XIcon className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            <form id={formId} onSubmit={save} className="min-h-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              <div>
                <label className="text-xs text-zinc-500" htmlFor="initiative-nation">
                  Nation
                </label>
                <Input
                  id="initiative-nation"
                  value={draft.nation}
                  onChange={(event) => setDraft({ ...draft, nation: event.target.value })}
                  maxLength={120}
                  className="mt-1 border-zinc-700 bg-black/40"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500" htmlFor="initiative-area">
                  Area / Region / State
                </label>
                <Input
                  id="initiative-area"
                  value={draft.area}
                  onChange={(event) => setDraft({ ...draft, area: event.target.value })}
                  maxLength={200}
                  className="mt-1 border-zinc-700 bg-black/40"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500" htmlFor="initiative-training">
                  Training type
                </label>
                <select
                  id="initiative-training"
                  value={draft.trainingType}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      trainingType: event.target.value as NationalPartnerTrainingType,
                    })
                  }
                  className={selectClass}
                >
                  {NATIONAL_PARTNER_TRAINING_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {NATIONAL_PARTNER_TRAINING_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500" htmlFor="initiative-count">
                  Number completed
                </label>
                <Input
                  id="initiative-count"
                  inputMode="numeric"
                  value={draft.completedCount}
                  onChange={(event) => setDraft({ ...draft, completedCount: event.target.value })}
                  className="mt-1 border-zinc-700 bg-black/40"
                />
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">
                {contribution
                  ? `This initiative contributes Mobilized ${contribution.mobilized}, Trained & Equipped ${contribution.trainedEquipped}, and Sent ${contribution.sent}.`
                  : "Enter how many completed training to see this initiative's contribution."}
              </p>
              {modalError ? <p className="text-sm text-red-400">{modalError}</p> : null}
            </form>

            <div className="flex shrink-0 justify-end gap-2 border-t border-white/10 px-4 py-3 sm:px-5">
              <Button type="button" variant="outline" className="border-zinc-700" disabled={saving} onClick={requestClose}>
                Cancel
              </Button>
              <Button type="submit" form={formId} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </section>
  );
}
