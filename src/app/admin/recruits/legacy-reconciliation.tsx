"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MinistrySentDesignation } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LegacyImportPlan } from "@/lib/ministry/legacy-import";
import type { LegacyLinkView } from "@/lib/ministry/legacy-link";
import { DESIGNATION_LABELS, PATHWAY_LABELS } from "@/lib/ministry/ministry-labels";
import {
  LEFTOVER_TEST_CONFIRMATION,
  LEFTOVER_TEST_PERSON_ID,
  proposedVerifiedOutcomes,
  reviewProgress,
  reviewProgressLabel,
  type LegacyReviewStatus,
} from "@/lib/ministry/legacy-review";
import { updateMinistryMilestonesAction } from "./ministry-actions";
import {
  importLegacyRosterAction,
  removeLeftoverTestPersonAction,
  updateLegacyReviewAction,
} from "./legacy-actions";

type Filter = "all" | "pending" | "confirmed" | "clarification";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "pending", label: "Pending Review" },
  { id: "confirmed", label: "Reviewed / Confirmed" },
  { id: "clarification", label: "Needs Clarification" },
  { id: "all", label: "All" },
];

const selectClass =
  "mt-1 w-full rounded-md border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-cream";

function matchesFilter(status: LegacyReviewStatus, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "pending") return status === "PENDING_REVIEW";
  if (filter === "confirmed") return status === "CONFIRMED";
  return status === "NEEDS_CLARIFICATION";
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

export function LegacyReconciliation({
  plan,
  links,
  linkError,
  people,
}: {
  plan: LegacyImportPlan;
  links: LegacyLinkView[] | null;
  linkError: string | null;
  people: { id: string; displayName: string; mobilized: boolean; trainedEquipped: boolean; sent: boolean }[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("pending");
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const progress = reviewProgress(
    links && links.length > 0
      ? links.map((link) => link.reviewStatus)
      : plan.ok
        ? plan.individuals.map(() => "PENDING_REVIEW" as const)
        : [],
  );
  const proposed = proposedVerifiedOutcomes(people);
  const leftover = people.find((person) => person.id === LEFTOVER_TEST_PERSON_ID) ?? null;
  const visible = useMemo(
    () => (links ?? []).filter((link) => matchesFilter(link.reviewStatus, filter)),
    [links, filter],
  );
  const open = (links ?? []).find((link) => link.id === openId) ?? null;

  async function runImport() {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await importLegacyRosterAction();
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(result.message ?? "Import finished.");
    router.refresh();
  }

  async function removeTestRecord() {
    setPending(true);
    setError(null);
    const result = await removeLeftoverTestPersonAction(LEFTOVER_TEST_PERSON_ID, confirmation);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setConfirmation("");
    setMessage(result.message ?? "Removed.");
    router.refresh();
  }

  return (
    <section className="space-y-6 border-t border-brand-primary/25 pt-8">
      <div>
        <h2 className="font-serif text-2xl text-brand-primary tracking-wide">
          Legacy Reconciliation
        </h2>
        <p className="text-zinc-400 text-sm mt-2 max-w-3xl leading-relaxed">
          Historical roster rows stay as evidence. Mobilized, Trained &amp; Equipped, and Sent
          stay off until you confirm each one. Fully Funded is not Sent, and a Jonathan Training
          checkbox is not a confirmed milestone. The homepage uses the ministry totals above.
        </p>
      </div>

      {leftover ? (
        <div className="rounded-2xl border border-amber-300/40 bg-amber-950/30 px-5 py-4 space-y-3">
          <p className="text-sm text-amber-100">
            {leftover.displayName} is leftover test data from 26 October. It is still in the
            preview count above ({yesNo(leftover.mobilized)} Mobilized) until you confirm removal.
            Proposed verified totals, with this one record held out by its id, are{" "}
            {proposed.mobilized} Mobilized, {proposed.trainedEquipped} Trained &amp; Equipped, and{" "}
            {proposed.sent} Sent. The public homepage is unchanged.
          </p>
          <label className="block text-xs text-zinc-400" htmlFor="leftover-confirmation">
            Type “{LEFTOVER_TEST_CONFIRMATION}” to remove it
          </label>
          <Input
            id="leftover-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="max-w-md border-zinc-700 bg-black/40"
          />
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            className="border-amber-200/50 text-amber-100"
            onClick={() => void removeTestRecord()}
          >
            Remove leftover test record
          </Button>
        </div>
      ) : null}

      {linkError ? (
        <p className="text-amber-200/90 text-sm max-w-2xl leading-relaxed">{linkError}</p>
      ) : null}

      {!plan.ok ? (
        <p className="text-red-400 text-sm max-w-2xl leading-relaxed">{plan.error}</p>
      ) : (
        <p className="text-sm text-zinc-400">
          Reviewed mapping: {plan.individuals.length} individuals from{" "}
          {new Set(plan.individuals.map((individual) => individual.legacyRecruitId)).size} legacy
          rows. No milestone flags are included in the mapping.
        </p>
      )}

      {plan.ok ? <p className="text-sm text-cream">{reviewProgressLabel(progress)}</p> : null}

      {!linkError && plan.ok ? (
        <Button type="button" disabled={pending} onClick={() => void runImport()}>
          {pending ? "Importing…" : links && links.length > 0 ? "Run import again" : "Store the reviewed import"}
        </Button>
      ) : null}
      {message ? <p className="text-sm text-brand-accent">{message}</p> : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {links && links.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant={filter === item.id ? "default" : "outline"}
                className={filter === item.id ? "" : "border-zinc-700"}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-2xl border border-brand-accent/25">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-accent/20 text-left text-zinc-400">
                  <th className="px-4 py-3 font-medium">Person</th>
                  <th className="px-4 py-3 font-medium">Legacy row</th>
                  <th className="px-4 py-3 font-medium">Jonathan Training</th>
                  <th className="px-4 py-3 font-medium">Fully Funded</th>
                  <th className="px-4 py-3 font-medium">Milestones</th>
                  <th className="px-4 py-3 font-medium">Review</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {visible.map((link) => (
                  <tr key={link.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 text-cream">{link.person.displayName}</td>
                    <td className="px-4 py-3 text-zinc-400">{link.originalDisplayName}</td>
                    <td className="px-4 py-3">{yesNo(link.originalJonathanTraining)}</td>
                    <td className="px-4 py-3">{yesNo(link.originalFullyFunded)}</td>
                    <td className="px-4 py-3 text-zinc-300">
                      {yesNo(link.person.mobilized)} / {yesNo(link.person.trainedEquipped)} /{" "}
                      {yesNo(link.person.sent)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{link.reviewStatus.replaceAll("_", " ")}</td>
                    <td className="px-4 py-3 text-right">
                      <Button type="button" size="sm" variant="outline" onClick={() => setOpenId(link.id)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visible.length === 0 ? (
            <p className="text-sm text-zinc-500">No people in this filter.</p>
          ) : null}
          {open ? <ReviewEditor link={open} links={links} onDone={() => router.refresh()} /> : null}
        </>
      ) : null}
    </section>
  );
}

function ReviewEditor({
  link,
  links,
  onDone,
}: {
  link: LegacyLinkView;
  links: LegacyLinkView[];
  onDone: () => void;
}) {
  const partner = links.find(
    (other) =>
      other.person.id !== link.person.id &&
      link.person.householdId &&
      other.person.householdId === link.person.householdId,
  );
  const [status, setStatus] = useState<LegacyReviewStatus>(link.reviewStatus);
  const [notes, setNotes] = useState(link.notes);
  const [mobilized, setMobilized] = useState(link.person.mobilized);
  const [mobilizedOn, setMobilizedOn] = useState(link.person.mobilizedOn ?? "");
  const [trained, setTrained] = useState(link.person.trainedEquipped);
  const [trainedOn, setTrainedOn] = useState(link.person.trainedEquippedOn ?? "");
  const [sent, setSent] = useState(link.person.sent);
  const [sentOn, setSentOn] = useState(link.person.sentOn ?? "");
  const [designation, setDesignation] = useState(link.person.sentDesignation ?? "");
  const [verifier, setVerifier] = useState(link.person.sentVerifiedBy);
  const [verificationNote, setVerificationNote] = useState(link.person.sentVerificationNote);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const pathway = link.person.pathway ? PATHWAY_LABELS[link.person.pathway] : "Not set";
  const designationLabel = link.person.sentDesignation
    ? DESIGNATION_LABELS[link.person.sentDesignation]
    : "Not set";

  async function saveReview() {
    setPending(true);
    setError(null);
    const result = await updateLegacyReviewAction(link.id, { reviewStatus: status, notes });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDone();
  }

  async function saveMilestones() {
    setPending(true);
    setError(null);
    const result = await updateMinistryMilestonesAction(link.person.id, {
      mobilized,
      mobilizedOn: mobilized ? mobilizedOn : "",
      trainedEquipped: trained,
      trainedEquippedOn: trained ? trainedOn : "",
      sent,
      sentOn: sent ? sentOn : "",
      sentDesignation: sent ? designation : "",
      sentVerifiedBy: sent ? verifier : "",
      sentVerificationNote: sent ? verificationNote : "",
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDone();
  }

  return (
    <div className="rounded-2xl border border-brand-accent/30 bg-zinc-950/60 px-5 py-5 space-y-4">
      <div>
        <h3 className="font-serif text-xl text-cream">{link.person.displayName}</h3>
        <p className="mt-1 text-sm text-zinc-400">{link.evidence}</p>
        <p className="mt-2 text-xs text-zinc-500">
          Pathway: {pathway}. Sent designation: {designationLabel}.
          {partner ? ` Shares a household with ${partner.person.displayName}.` : ""}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-zinc-300">
          Review status
          <select
            className={selectClass}
            value={status}
            onChange={(event) => setStatus(event.target.value as LegacyReviewStatus)}
          >
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="CONFIRMED">Reviewed / Confirmed</option>
            <option value="NEEDS_CLARIFICATION">Needs Clarification</option>
          </select>
        </label>
        <label className="text-sm text-zinc-300 md:col-span-2">
          Review notes
          <textarea
            className={selectClass}
            rows={2}
            maxLength={4000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      </div>
      <Button type="button" disabled={pending} onClick={() => void saveReview()}>
        Save review
      </Button>

      <div className="grid gap-3 border-t border-white/10 pt-4">
        <MilestoneLine
          label="Mobilized"
          hint="A confirmed next step. Being on the old roster does not count."
          checked={mobilized}
          onChecked={setMobilized}
          day={mobilizedOn}
          onDay={setMobilizedOn}
        />
        <MilestoneLine
          label="Trained & Equipped"
          hint="Confirmed training or coaching. A Jonathan Training checkbox does not count by itself."
          checked={trained}
          onChecked={setTrained}
          day={trainedOn}
          onDay={setTrainedOn}
        />
        <MilestoneLine
          label="Sent"
          hint="Preparation put into action toward the unreached. Fully Funded does not count."
          checked={sent}
          onChecked={setSent}
          day={sentOn}
          onDay={setSentOn}
        />
        {sent ? (
          <label className="text-sm text-zinc-300">
            Sent designation
            <select
              className={selectClass}
              required
              value={designation}
              onChange={(event) => setDesignation(event.target.value as MinistrySentDesignation | "")}
            >
              <option value="">Choose a designation</option>
              {Object.entries(DESIGNATION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <Button type="button" disabled={pending} onClick={() => void saveMilestones()}>
        Save milestones
      </Button>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}

function MilestoneLine({
  label,
  hint,
  checked,
  onChecked,
  day,
  onDay,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChecked: (value: boolean) => void;
  day: string;
  onDay: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_11rem] md:items-end">
      <label className="flex items-start gap-2 text-sm text-zinc-200">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChecked(event.target.checked)}
          className="mt-0.5 size-4 accent-brand-accent"
        />
        <span>
          {label}
          <span className="mt-0.5 block text-xs font-normal text-zinc-500">{hint}</span>
        </span>
      </label>
      <label className="text-xs text-zinc-500">
        Date, if known
        <Input
          type="date"
          value={day}
          disabled={!checked}
          onChange={(event) => onDay(event.target.value)}
          className="mt-1 border-zinc-700 bg-black/40"
        />
      </label>
    </div>
  );
}
