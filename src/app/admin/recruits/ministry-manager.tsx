"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MinistryActivityStatus, MinistryActivityType, MinistryPathway, MinistrySentDesignation } from "@prisma/client";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ACTIVITY_LABELS,
  ACTIVITY_STATUS_LABELS,
  DESIGNATION_LABELS,
  PATHWAY_GUIDANCE,
  PATHWAY_LABELS,
  UNSET_PATHWAY_GUIDANCE,
  ministryPersonMatchesQuery,
} from "@/lib/ministry/ministry-labels";
import type { MinistryActivityView, MinistryPersonView } from "@/lib/ministry/ministry-db";
import { activityDraftStarted, planActivityChanges, type ActivityDraft } from "@/lib/ministry/ministry-form";
import { teamExpansionProgressDiscrepancy } from "@/lib/ministry/ministry-save";
import {
  createMinistryPersonAction,
  deleteMinistryPersonAction,
  saveMinistryPersonAction,
} from "./ministry-actions";

type LegacyOption = { id: string; name: string };

const PATHWAYS = Object.keys(PATHWAY_LABELS) as MinistryPathway[];
const DESIGNATIONS = Object.keys(DESIGNATION_LABELS) as MinistrySentDesignation[];
const ACTIVITY_TYPES = Object.keys(ACTIVITY_LABELS) as MinistryActivityType[];
const ACTIVITY_STATUSES = Object.keys(ACTIVITY_STATUS_LABELS) as MinistryActivityStatus[];

const selectClass =
  "mt-1 w-full rounded-md border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-cream";

const blankActivity: ActivityDraft = {
  activityType: "JONATHAN_TRAINING",
  status: "PARTICIPATED",
  activityOn: "",
  location: "",
  notes: "",
};

type EditorSnapshot = {
  displayName: string;
  pathway: string;
  notes: string;
  householdWithPersonId: string;
  legacyRecruitId: string;
  mobilized: boolean;
  mobilizedOn: string;
  trainedEquipped: boolean;
  trainedEquippedOn: string;
  sent: boolean;
  sentOn: string;
  sentDesignation: string;
  sentVerifiedBy: string;
  sentVerificationNote: string;
  jonathanTrainingComplete: boolean;
  fullyFunded: boolean;
  activityDirty: boolean;
};

export function ministryPersonEditorIsDirty(baseline: EditorSnapshot, draft: EditorSnapshot): boolean {
  return (Object.keys(baseline) as (keyof EditorSnapshot)[]).some((key) => baseline[key] !== draft[key]);
}

function householdPartnerId(person: MinistryPersonView, people: MinistryPersonView[]): string {
  if (!person.householdId) return "";
  const partner = people.find((other) => other.id !== person.id && other.householdId === person.householdId);
  return partner?.id ?? "";
}

function MilestoneMark({ on }: { on: boolean }) {
  return (
    <span className={on ? "text-brand-accent" : "text-zinc-600"} aria-hidden>
      {on ? "Yes" : "—"}
    </span>
  );
}

export function MinistryManager({
  people,
  legacyRecruits,
}: {
  people: MinistryPersonView[];
  legacyRecruits: LegacyOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pathway, setPathway] = useState("");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const listScroll = useRef(0);
  const pendingScroll = useRef<number | null>(null);

  const selected = people.find((person) => person.id === selectedId) ?? null;
  const visiblePeople = people.filter((person) => ministryPersonMatchesQuery(person, query));

  useEffect(() => {
    if (pendingScroll.current == null) return;
    const y = pendingScroll.current;
    pendingScroll.current = null;
    const restore = () => window.scrollTo(0, y);
    restore();
    const id = window.setTimeout(restore, 0);
    return () => window.clearTimeout(id);
  }, [people]);

  function refreshKeepingPlace(scrollY = window.scrollY) {
    pendingScroll.current = scrollY;
    router.refresh();
  }

  function closeEditor() {
    setSelectedId(null);
    const target = returnFocus.current;
    window.requestAnimationFrame(() => target?.focus());
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setAdding(true);
    setError(null);
    const result = await createMinistryPersonAction({ displayName: name, pathway, notes });
    setAdding(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setName("");
    setPathway("");
    setNotes("");
    refreshKeepingPlace();
  }

  async function handleDeletePerson(person: MinistryPersonView) {
    if (!confirm(`Remove ${person.displayName} from the Ministry Impact Tracker? Their legacy recruit record, if any, stays.`)) {
      return;
    }
    setPending(true);
    setError(null);
    const result = await deleteMinistryPersonAction(person.id);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (selectedId === person.id) {
      const scrollY = listScroll.current;
      closeEditor();
      refreshKeepingPlace(scrollY);
      return;
    }
    refreshKeepingPlace();
  }

  return (
    <section className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="grid gap-4 rounded-2xl border border-brand-accent/30 bg-zinc-950/60 px-5 py-5 md:grid-cols-2"
      >
        <div className="md:col-span-2">
          <h2 className="font-serif text-xl text-cream">Add a person</h2>
          <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
            {pathway === "TEAM_EXPANSION_RECRUIT"
              ? "A new Team Expansion Recruit is recorded as Mobilized. Jonathan Training, funding, and Sent stay off until you confirm them."
              : "Adding someone does not count them as Mobilized, Trained & Equipped, or Sent."}
          </p>
        </div>
        <div>
          <label htmlFor="ministry-name" className="text-sm text-zinc-300">
            Name
          </label>
          <Input
            id="ministry-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            placeholder="One person"
            className="mt-1 border-zinc-700 bg-black/40"
          />
        </div>
        <div>
          <label htmlFor="ministry-pathway" className="text-sm text-zinc-300">
            Pathway
          </label>
          <select
            id="ministry-pathway"
            value={pathway}
            onChange={(event) => setPathway(event.target.value)}
            className={selectClass}
          >
            <option value="">Not set yet</option>
            {PATHWAYS.map((value) => (
              <option key={value} value={value}>
                {PATHWAY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="ministry-notes" className="text-sm text-zinc-300">
            Notes
          </label>
          <textarea
            id="ministry-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={4000}
            rows={2}
            className={selectClass}
          />
        </div>
        <div>
          <Button
            type="submit"
            disabled={adding || !name.trim()}
            className="bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold"
          >
            {adding ? "Adding…" : "Add person"}
          </Button>
        </div>
      </form>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {people.length === 0 ? (
        <p className="text-sm text-zinc-500">No people in the new tracker yet.</p>
      ) : (
        <>
      <div>
        <label htmlFor="ministry-search" className="text-sm text-zinc-300">
          Search people
        </label>
        <Input
          id="ministry-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name, pathway, notes, or activity"
          className="mt-1 max-w-md border-zinc-700 bg-black/40"
        />
      </div>
      {visiblePeople.length === 0 ? (
        <p className="text-sm text-zinc-500">No people match that search.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-accent/25">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-accent/20 text-left text-zinc-400">
                <th className="px-4 py-3 font-medium">Person</th>
                <th className="px-4 py-3 font-medium">Pathway</th>
                <th className="px-4 py-3 font-medium">Mobilized</th>
                <th className="px-4 py-3 font-medium">Trained</th>
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {visiblePeople.map((person) => (
                <tr key={person.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-cream">{person.displayName}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {person.pathway ? PATHWAY_LABELS[person.pathway] : "Not set"}
                  </td>
                  <td className="px-4 py-3">
                    <MilestoneMark on={person.mobilized} />
                  </td>
                  <td className="px-4 py-3">
                    <MilestoneMark on={person.trainedEquipped} />
                  </td>
                  <td className="px-4 py-3">
                    <MilestoneMark on={person.sent} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-brand-accent/40"
                      onClick={(event) => {
                        setError(null);
                        listScroll.current = window.scrollY;
                        returnFocus.current = event.currentTarget;
                        setSelectedId(person.id);
                      }}
                    >
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </>
      )}

      {selected ? (
        <PersonEditor
          key={selected.id}
          person={selected}
          people={people}
          legacyRecruits={legacyRecruits}
          pending={pending}
          error={error}
          onError={setError}
          onClose={closeEditor}
          onDelete={() => handleDeletePerson(selected)}
          onSaved={() => {
            const scrollY = listScroll.current;
            closeEditor();
            refreshKeepingPlace(scrollY);
          }}
        />
      ) : null}
    </section>
  );
}

function PersonEditor({
  person,
  people,
  legacyRecruits,
  pending,
  error,
  onError,
  onClose,
  onDelete,
  onSaved,
}: {
  person: MinistryPersonView;
  people: MinistryPersonView[];
  legacyRecruits: LegacyOption[];
  pending: boolean;
  error: string | null;
  onError: (message: string | null) => void;
  onClose: () => void;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const [displayName, setDisplayName] = useState(person.displayName);
  const [pathway, setPathway] = useState(person.pathway ?? "");
  const [notes, setNotes] = useState(person.notes);
  const [householdWithPersonId, setHouseholdWithPersonId] = useState(
    householdPartnerId(person, people),
  );
  const [legacyRecruitId, setLegacyRecruitId] = useState(person.legacyRecruitId ?? "");
  const [mobilized, setMobilized] = useState(person.mobilized);
  const [mobilizedOn, setMobilizedOn] = useState(person.mobilizedOn ?? "");
  const [trainedEquipped, setTrainedEquipped] = useState(person.trainedEquipped);
  const [trainedEquippedOn, setTrainedEquippedOn] = useState(person.trainedEquippedOn ?? "");
  const [sent, setSent] = useState(person.sent);
  const [sentOn, setSentOn] = useState(person.sentOn ?? "");
  const [sentDesignation, setSentDesignation] = useState(person.sentDesignation ?? "");
  const [sentVerifiedBy, setSentVerifiedBy] = useState(person.sentVerifiedBy);
  const [sentVerificationNote, setSentVerificationNote] = useState(person.sentVerificationNote);
  const [jonathanTrainingComplete, setJonathanTrainingComplete] = useState(
    person.jonathanTrainingComplete,
  );
  const [fullyFunded, setFullyFunded] = useState(person.fullyFunded);
  const [saving, setSaving] = useState<string | null>(null);
  const [newActivity, setNewActivity] = useState<ActivityDraft>(blankActivity);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityEdit, setActivityEdit] = useState<ActivityDraft>(blankActivity);
  const [removedActivityIds, setRemovedActivityIds] = useState<string[]>([]);
  const saveLock = useRef(false);
  const editorFormId = `editor-${person.id}`;
  const editingActivity = person.activities.find((activity) => activity.id === editingActivityId) ?? null;
  const activityEditBaseline: ActivityDraft | null = editingActivity
    ? {
        activityType: editingActivity.activityType,
        status: editingActivity.status,
        activityOn: editingActivity.activityOn ?? "",
        location: editingActivity.location,
        notes: editingActivity.notes,
      }
    : null;
  const newActivityStarted = activityDraftStarted(newActivity, blankActivity);
  const activityEditStarted = activityEditBaseline
    ? activityDraftStarted(activityEdit, activityEditBaseline)
    : false;
  const activityDirty =
    newActivityStarted || activityEditStarted || removedActivityIds.length > 0;
  const recruitPathway = pathway === "TEAM_EXPANSION_RECRUIT";
  const recruitTrained = jonathanTrainingComplete;
  const recruitSent = jonathanTrainingComplete && fullyFunded;
  const discrepancy = recruitPathway
    ? teamExpansionProgressDiscrepancy(person, { jonathanTrainingComplete, fullyFunded })
    : null;
  const trainingEvidence = person.activities.filter(
    (activity) => activity.activityType === "JONATHAN_TRAINING",
  );

  const baseline: EditorSnapshot = {
    displayName: person.displayName,
    pathway: person.pathway ?? "",
    notes: person.notes,
    householdWithPersonId: householdPartnerId(person, people),
    legacyRecruitId: person.legacyRecruitId ?? "",
    mobilized: person.mobilized,
    mobilizedOn: person.mobilizedOn ?? "",
    trainedEquipped: person.trainedEquipped,
    trainedEquippedOn: person.trainedEquippedOn ?? "",
    sent: person.sent,
    sentOn: person.sentOn ?? "",
    sentDesignation: person.sentDesignation ?? "",
    sentVerifiedBy: person.sentVerifiedBy,
    sentVerificationNote: person.sentVerificationNote,
    jonathanTrainingComplete: person.jonathanTrainingComplete,
    fullyFunded: person.fullyFunded,
    activityDirty: false,
  };
  const draft: EditorSnapshot = {
    displayName,
    pathway,
    notes,
    householdWithPersonId,
    legacyRecruitId,
    mobilized,
    mobilizedOn,
    trainedEquipped,
    trainedEquippedOn,
    sent,
    sentOn,
    sentDesignation,
    sentVerifiedBy,
    sentVerificationNote,
    jonathanTrainingComplete,
    fullyFunded,
    activityDirty,
  };
  const dirty = ministryPersonEditorIsDirty(baseline, draft);
  const busy = saving !== null || pending;

  function requestClose() {
    if (busy) return;
    if (dirty && !window.confirm("Discard unsaved changes to this person?")) return;
    onClose();
  }

  const guidance =
    pathway && pathway in PATHWAY_GUIDANCE
      ? PATHWAY_GUIDANCE[pathway as MinistryPathway]
      : UNSET_PATHWAY_GUIDANCE;
  const mates = people.filter(
    (other) => other.id !== person.id && person.householdId && other.householdId === person.householdId,
  );

  async function saveChanges(event: React.FormEvent | null, confirmHistoryChange = false) {
    event?.preventDefault();
    if (saveLock.current) return;
    const activityPlan = planActivityChanges({
      create: newActivityStarted ? newActivity : null,
      update:
        activityEditStarted && editingActivity
          ? { id: editingActivity.id, draft: activityEdit }
          : null,
      deleteIds: removedActivityIds,
    });
    if (!activityPlan.ok) {
      onError(activityPlan.error);
      return;
    }
    if (recruitPathway && recruitSent && !sentDesignation) {
      onError("Choose a Sent designation");
      return;
    }
    saveLock.current = true;
    setSaving("save");
    onError(null);
    let result: Awaited<ReturnType<typeof saveMinistryPersonAction>>;
    try {
      result = await saveMinistryPersonAction(person.id, {
        displayName,
        pathway,
        notes,
        householdWithPersonId,
        legacyRecruitId,
        jonathanTrainingComplete,
        fullyFunded,
        confirmHistoryChange,
        mobilized: recruitPathway ? true : mobilized,
        mobilizedOn,
        trainedEquipped: recruitPathway ? recruitTrained : trainedEquipped,
        trainedEquippedOn,
        sent: recruitPathway ? recruitSent : sent,
        sentOn,
        sentDesignation,
        sentVerifiedBy,
        sentVerificationNote,
        activityCreate: activityPlan.create,
        activityUpdate: activityPlan.update
          ? { id: activityPlan.update.id, ...activityPlan.update.draft }
          : null,
        activityDeleteIds: activityPlan.deleteIds,
      });
    } finally {
      saveLock.current = false;
      setSaving(null);
    }
    if (!result.ok) {
      if (result.needsConfirmation && !confirmHistoryChange) {
        const accepted = window.confirm(`${result.error}\n\nSave this change?`);
        if (accepted) {
          await saveChanges(null, true);
          return;
        }
      }
      onError(result.error);
      return;
    }
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(next) => { if (!next) requestClose(); }}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          document.getElementById(`name-${person.id}`)?.focus();
        }}
        className="grid h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-none border-brand-accent/30 bg-zinc-950 p-0 text-cream top-0 left-0 sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[min(92dvh,52rem)] sm:w-[min(44rem,calc(100%-2rem))] sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-start gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate font-serif text-xl text-cream">
              {person.displayName}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-zinc-500">
              Profile, milestones, and activities for this person.
            </DialogDescription>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={onDelete}
            className="h-11 shrink-0 text-red-400 hover:text-red-300 sm:h-9"
          >
            Remove person
          </Button>
          <button
            type="button"
            onClick={requestClose}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-cream hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:outline-none sm:size-9"
          >
            <XIcon aria-hidden />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="min-h-0 space-y-6 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <form id={editorFormId} onSubmit={(event) => void saveChanges(event)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <h3 className="md:col-span-2 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300">
          Profile
        </h3>
        <div>
          <label className="text-sm text-zinc-300" htmlFor={`name-${person.id}`}>
            Name
          </label>
          <Input
            id={`name-${person.id}`}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={120}
            className="mt-1 border-zinc-700 bg-black/40"
          />
        </div>
        <div>
          <label className="text-sm text-zinc-300" htmlFor={`pathway-${person.id}`}>
            Pathway
          </label>
          <select
            id={`pathway-${person.id}`}
            value={pathway}
            onChange={(event) => setPathway(event.target.value)}
            className={selectClass}
          >
            <option value="">Not set yet</option>
            {PATHWAYS.map((value) => (
              <option key={value} value={value}>
                {PATHWAY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-zinc-300" htmlFor={`household-${person.id}`}>
            Household
          </label>
          <select
            id={`household-${person.id}`}
            value={householdWithPersonId}
            onChange={(event) => setHouseholdWithPersonId(event.target.value)}
            className={selectClass}
          >
            <option value="">No household link</option>
            {people
              .filter((other) => other.id !== person.id)
              .map((other) => (
                <option key={other.id} value={other.id}>
                  Same household as {other.displayName}
                </option>
              ))}
          </select>
          {mates.length > 0 ? (
            <p className="mt-1 text-xs text-zinc-500">
              Currently linked with {mates.map((mate) => mate.displayName).join(", ")}. Milestones
              stay individual.
            </p>
          ) : null}
        </div>
        <div>
          <label className="text-sm text-zinc-300" htmlFor={`legacy-${person.id}`}>
            Legacy recruit record
          </label>
          <select
            id={`legacy-${person.id}`}
            value={legacyRecruitId}
            onChange={(event) => setLegacyRecruitId(event.target.value)}
            className={selectClass}
          >
            <option value="">Not linked</option>
            {legacyRecruits.map((recruit) => (
              <option key={recruit.id} value={recruit.id}>
                {recruit.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500">
            Links this person for review. It does not copy or change the legacy checkboxes.
          </p>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-zinc-300" htmlFor={`notes-${person.id}`}>
            Notes
          </label>
          <textarea
            id={`notes-${person.id}`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            maxLength={4000}
            className={selectClass}
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-white/10 pt-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300">
          {recruitPathway ? "Progression" : "Milestones"}
        </h3>
        <p className="text-xs text-zinc-500 leading-relaxed">{guidance}</p>
        {discrepancy ? (
          <p className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100" role="status">
            {discrepancy}
          </p>
        ) : null}
        {recruitPathway && (mobilized !== true || trainedEquipped !== recruitTrained || sent !== recruitSent) ? (
          <p className="text-xs text-zinc-400">
            Milestone choices from another pathway stay in this form. Saving uses the Team Expansion Recruit rules below.
          </p>
        ) : null}
        {recruitPathway ? (
          <RecruitProgression
            personId={person.id}
            mobilizedOn={mobilizedOn}
            onMobilizedOn={setMobilizedOn}
            jonathanTrainingComplete={jonathanTrainingComplete}
            onJonathanTrainingComplete={setJonathanTrainingComplete}
            fullyFunded={fullyFunded}
            onFullyFunded={setFullyFunded}
            trainedEquippedOn={trainedEquippedOn}
            onTrainedEquippedOn={setTrainedEquippedOn}
            sentOn={sentOn}
            onSentOn={setSentOn}
            trained={recruitTrained}
            sent={recruitSent}
            trainingEvidence={trainingEvidence}
          />
        ) : (
          <>
            <MilestoneRow
              id={`mobilized-${person.id}`}
              label="Mobilized"
              hint="Confirmed that we helped them take a meaningful next step."
              checked={mobilized}
              onChecked={setMobilized}
              day={mobilizedOn}
              onDay={setMobilizedOn}
            />
            <MilestoneRow
              id={`trained-${person.id}`}
              label="Trained & Equipped"
              hint="Confirmed training, coaching, or preparation. Several activities still count once."
              checked={trainedEquipped}
              onChecked={setTrainedEquipped}
              day={trainedEquippedOn}
              onDay={setTrainedEquippedOn}
            />
            <MilestoneRow
              id={`sent-${person.id}`}
              label="Sent"
              hint="Confirmed sending milestone. A designation is required. Funding and activity completion do not do this."
              checked={sent}
              onChecked={setSent}
              day={sentOn}
              onDay={setSentOn}
            />
          </>
        )}
        {(
          recruitPathway
            ? recruitSent || Boolean(sentDesignation || person.sentVerifiedBy || person.sentVerificationNote || person.sentOn)
            : sent
        ) ? (
          <div className="grid gap-4 md:grid-cols-2 rounded-xl border border-brand-accent/20 px-4 py-4">
            {recruitPathway && !recruitSent && sentDesignation && sentDesignation in DESIGNATION_LABELS ? (
              <p className="md:col-span-2 text-sm text-zinc-300">
                Saved designation: {DESIGNATION_LABELS[sentDesignation as MinistrySentDesignation]}. It stays selected in this form. Turning Sent off records it in the milestone history.
              </p>
            ) : null}
            {recruitPathway && !recruitSent && (person.sentOn || person.sentVerifiedBy || person.sentVerificationNote) ? (
              <div className="md:col-span-2 space-y-1 text-sm text-zinc-400">
                {person.sentOn ? <p>Recorded Sent date: {person.sentOn}</p> : null}
                {person.sentVerifiedBy ? <p>Verification: {person.sentVerifiedBy}</p> : null}
                {person.sentVerificationNote ? <p>{person.sentVerificationNote}</p> : null}
              </div>
            ) : null}
            {(!recruitPathway && sent) || recruitSent ? (
              <div>
                <label className="text-sm text-zinc-300" htmlFor={`designation-${person.id}`}>
                  Sent designation
                </label>
                <select
                  id={`designation-${person.id}`}
                  value={sentDesignation}
                  onChange={(event) => setSentDesignation(event.target.value)}
                  className={selectClass}
                  required
                >
                  <option value="">Choose the kind of worker</option>
                  {DESIGNATIONS.map((value) => (
                    <option key={value} value={value}>
                      {DESIGNATION_LABELS[value]}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-zinc-500">
                  This is the assignment they were sent into, not the pathway they came through.
                </p>
              </div>
            ) : null}
            {(!recruitPathway && sent) || recruitSent ? (
              <>
                <div>
                  <label className="text-sm text-zinc-300" htmlFor={`verifier-${person.id}`}>
                    Verification source or person
                  </label>
                  <Input
                    id={`verifier-${person.id}`}
                    value={sentVerifiedBy}
                    onChange={(event) => setSentVerifiedBy(event.target.value)}
                    maxLength={120}
                    className="mt-1 border-zinc-700 bg-black/40"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-zinc-300" htmlFor={`verification-note-${person.id}`}>
                    Verification notes
                  </label>
                  <textarea
                    id={`verification-note-${person.id}`}
                    value={sentVerificationNote}
                    onChange={(event) => setSentVerificationNote(event.target.value)}
                    rows={2}
                    maxLength={4000}
                    className={selectClass}
                  />
                </div>
              </>
            ) : null}
          </div>
        ) : null}
        {person.milestoneAudit ? (
          <div>
            <h4 className="text-sm text-zinc-300">Milestone history</h4>
            <pre className="mt-1 whitespace-pre-wrap font-sans text-xs text-zinc-500">{person.milestoneAudit}</pre>
          </div>
        ) : null}
      </div>
      </form>

      <ActivityEditor
        activities={person.activities}
        removedActivityIds={removedActivityIds}
        newActivity={newActivity}
        onNewActivity={setNewActivity}
        editingActivityId={editingActivityId}
        activityEdit={activityEdit}
        onActivityEdit={setActivityEdit}
        onEdit={(activity) => {
          setEditingActivityId(activity.id);
          setActivityEdit({
            activityType: activity.activityType,
            status: activity.status,
            activityOn: activity.activityOn ?? "",
            location: activity.location,
            notes: activity.notes,
          });
        }}
        onCancelEdit={() => setEditingActivityId(null)}
        onRemove={(activityId) => {
          if (!window.confirm("Remove this activity when you save? This does not change milestones.")) return;
          setRemovedActivityIds((ids) => (ids.includes(activityId) ? ids : [...ids, activityId]));
          if (editingActivityId === activityId) setEditingActivityId(null);
        }}
        onUndoRemove={(activityId) => {
          setRemovedActivityIds((ids) => ids.filter((id) => id !== activityId));
        }}
      />
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-white/10 bg-zinc-950 px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
          <Button
            type="submit"
            form={editorFormId}
            disabled={busy || !displayName.trim()}
            className="h-11 bg-brand-accent text-brand-ink hover:bg-brand-accent/90 sm:h-9"
          >
            {saving === "save" ? "Saving…" : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={requestClose}
            className="h-11 border-zinc-700 sm:h-9"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RecruitProgression({
  personId,
  mobilizedOn,
  onMobilizedOn,
  jonathanTrainingComplete,
  onJonathanTrainingComplete,
  fullyFunded,
  onFullyFunded,
  trainedEquippedOn,
  onTrainedEquippedOn,
  sentOn,
  onSentOn,
  trained,
  sent,
  trainingEvidence,
}: {
  personId: string;
  mobilizedOn: string;
  onMobilizedOn: (value: string) => void;
  jonathanTrainingComplete: boolean;
  onJonathanTrainingComplete: (value: boolean) => void;
  fullyFunded: boolean;
  onFullyFunded: (value: boolean) => void;
  trainedEquippedOn: string;
  onTrainedEquippedOn: (value: string) => void;
  sentOn: string;
  onSentOn: (value: string) => void;
  trained: boolean;
  sent: boolean;
  trainingEvidence: MinistryActivityView[];
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">
        Leave a date blank to keep a day already on the record. Saving does not invent a Mobilized or Sent date.
      </p>
      <CalculatedMilestone
        label="Mobilized"
        on
        detail="Automatic for a Team Expansion Recruit."
        day={mobilizedOn}
        onDay={onMobilizedOn}
        dayId={`mobilized-${personId}-date`}
      />
      <label className="flex items-start gap-2 text-sm text-zinc-200" htmlFor={`jonathan-${personId}`}>
        <input
          id={`jonathan-${personId}`}
          type="checkbox"
          checked={jonathanTrainingComplete}
          onChange={(event) => onJonathanTrainingComplete(event.target.checked)}
          className="mt-0.5 size-4 accent-brand-accent"
        />
        <span>
          Jonathan Training Complete
          <span className="mt-0.5 block text-xs font-normal text-zinc-500">
            Checking this records Trained & Equipped. It does not add or remove a Jonathan Training activity.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm text-zinc-200" htmlFor={`funded-${personId}`}>
        <input
          id={`funded-${personId}`}
          type="checkbox"
          checked={fullyFunded}
          onChange={(event) => onFullyFunded(event.target.checked)}
          className="mt-0.5 size-4 accent-brand-accent"
        />
        <span>
          Fully Funded
          <span className="mt-0.5 block text-xs font-normal text-zinc-500">
            Funding can be recorded before Jonathan Training. It does not mark Sent by itself.
          </span>
        </span>
      </label>
      <CalculatedMilestone
        label="Trained & Equipped"
        on={trained}
        detail="Follows Jonathan Training Complete."
        day={trainedEquippedOn}
        onDay={onTrainedEquippedOn}
        dayId={`trained-${personId}-date`}
      />
      <CalculatedMilestone
        label="Sent"
        on={sent}
        detail="Follows Jonathan Training Complete and Fully Funded."
        day={sentOn}
        onDay={onSentOn}
        dayId={`sent-${personId}-date`}
      />
      {trainingEvidence.length > 0 ? (
        <div>
          <p className="text-sm text-zinc-300">Historical Jonathan Training activities</p>
          <ul className="mt-1 space-y-1 text-xs text-zinc-500">
            {trainingEvidence.map((activity) => (
              <li key={activity.id}>
                {ACTIVITY_LABELS[activity.activityType]} · {ACTIVITY_STATUS_LABELS[activity.status]}
                {activity.activityOn ? ` · ${activity.activityOn}` : ""}
                {activity.location ? ` · ${activity.location}` : ""}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-zinc-500">
            These activities stay as recorded. They do not check Jonathan Training Complete.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function CalculatedMilestone({
  label,
  on,
  detail,
  day,
  onDay,
  dayId,
}: {
  label: string;
  on: boolean;
  detail: string;
  day: string;
  onDay: (value: string) => void;
  dayId: string;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_11rem] md:items-end">
      <p className="text-sm text-zinc-200">
        {label}: <span className={on ? "text-brand-accent" : "text-zinc-400"}>{on ? "Yes" : "No"}</span>
        <span className="mt-0.5 block text-xs font-normal text-zinc-500">{detail}</span>
      </p>
      <div>
        <label className="text-xs text-zinc-500" htmlFor={dayId}>
          Date, if known
        </label>
        <Input
          id={dayId}
          type="date"
          value={day}
          onChange={(event) => onDay(event.target.value)}
          className="mt-1 border-zinc-700 bg-black/40"
        />
      </div>
    </div>
  );
}

function MilestoneRow({
  id,
  label,
  hint,
  checked,
  onChecked,
  day,
  onDay,
}: {
  id: string;
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
          id={id}
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
      <div>
        <label className="text-xs text-zinc-500" htmlFor={`${id}-date`}>
          Date, if known
        </label>
        <Input
          id={`${id}-date`}
          type="date"
          value={day}
          onChange={(event) => onDay(event.target.value)}
          disabled={!checked}
          className="mt-1 border-zinc-700 bg-black/40"
        />
      </div>
    </div>
  );
}

export function ActivityEditor({
  activities,
  removedActivityIds,
  newActivity,
  onNewActivity,
  editingActivityId,
  activityEdit,
  onActivityEdit,
  onEdit,
  onCancelEdit,
  onRemove,
  onUndoRemove,
}: {
  activities: MinistryActivityView[];
  removedActivityIds: string[];
  newActivity: ActivityDraft;
  onNewActivity: (value: ActivityDraft) => void;
  editingActivityId: string | null;
  activityEdit: ActivityDraft;
  onActivityEdit: (value: ActivityDraft) => void;
  onEdit: (activity: MinistryActivityView) => void;
  onCancelEdit: () => void;
  onRemove: (activityId: string) => void;
  onUndoRemove: (activityId: string) => void;
}) {
  return (
    <div className="space-y-4 border-t border-white/10 pt-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300">
        Activities
      </h3>
      <p className="text-xs text-zinc-500 leading-relaxed">
        Jonathan Training and DMM Training are one program. Put the venue, such as Emerald Hills,
        a church, or another country, in the location field. Completing an activity does not mark
        someone Sent, and choosing an activity does not change the pathway. Save Changes stores
        an activity only after you edit this form.
      </p>

      {activities.length === 0 ? (
        <p className="text-sm text-zinc-500">No activities yet.</p>
      ) : (
        <ul className="space-y-3">
          {activities.map((activity) =>
            removedActivityIds.includes(activity.id) ? (
              <li
                key={activity.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3"
              >
                <p className="text-sm text-zinc-500">
                  {ACTIVITY_LABELS[activity.activityType]} will be removed when you save.
                </p>
                <Button type="button" size="sm" variant="outline" onClick={() => onUndoRemove(activity.id)}>
                  Undo
                </Button>
              </li>
            ) : editingActivityId === activity.id ? (
              <li key={activity.id}>
                <ActivityFields
                  idPrefix={activity.id}
                  value={activityEdit}
                  onChange={onActivityEdit}
                  onCancel={onCancelEdit}
                />
              </li>
            ) : (
              <li
                key={activity.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/10 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-cream">
                    {ACTIVITY_LABELS[activity.activityType]}{" "}
                    <span className="text-zinc-500">· {ACTIVITY_STATUS_LABELS[activity.status]}</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {activity.activityOn || "No date"}
                    {activity.location ? ` · ${activity.location}` : ""}
                    {activity.notes ? ` · ${activity.notes}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-zinc-700"
                    onClick={() => onEdit(activity)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-400"
                    onClick={() => onRemove(activity.id)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      <div className="space-y-2">
        <h4 className="text-sm text-zinc-300">New activity</h4>
        <ActivityFields idPrefix="new-activity" value={newActivity} onChange={onNewActivity} />
      </div>
    </div>
  );
}

function ActivityFields({
  idPrefix,
  value,
  onChange,
  onCancel,
}: {
  idPrefix: string;
  value: ActivityDraft;
  onChange: (value: ActivityDraft) => void;
  onCancel?: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-white/10 px-4 py-4 md:grid-cols-2">
      <div>
        <label className="text-xs text-zinc-500" htmlFor={`${idPrefix}-type`}>
          Program
        </label>
        <select
          id={`${idPrefix}-type`}
          value={value.activityType}
          onChange={(event) =>
            onChange({ ...value, activityType: event.target.value as MinistryActivityType })
          }
          className={selectClass}
        >
          {ACTIVITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {ACTIVITY_LABELS[type]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-zinc-500" htmlFor={`${idPrefix}-status`}>
          Status
        </label>
        <select
          id={`${idPrefix}-status`}
          value={value.status}
          onChange={(event) =>
            onChange({ ...value, status: event.target.value as MinistryActivityStatus })
          }
          className={selectClass}
        >
          {ACTIVITY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {ACTIVITY_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-zinc-500" htmlFor={`${idPrefix}-date`}>
          Date, if known
        </label>
        <Input
          id={`${idPrefix}-date`}
          type="date"
          value={value.activityOn}
          onChange={(event) => onChange({ ...value, activityOn: event.target.value })}
          className="mt-1 border-zinc-700 bg-black/40"
        />
      </div>
      <div>
        <label className="text-xs text-zinc-500" htmlFor={`${idPrefix}-location`}>
          Venue or location
        </label>
        <Input
          id={`${idPrefix}-location`}
          value={value.location}
          onChange={(event) => onChange({ ...value, location: event.target.value })}
          maxLength={200}
          placeholder="Emerald Hills, a church, a country"
          className="mt-1 border-zinc-700 bg-black/40"
        />
      </div>
      <div className="md:col-span-2">
        <label className="text-xs text-zinc-500" htmlFor={`${idPrefix}-notes`}>
          Notes
        </label>
        <textarea
          id={`${idPrefix}-notes`}
          value={value.notes}
          onChange={(event) => onChange({ ...value, notes: event.target.value })}
          rows={2}
          maxLength={4000}
          className={selectClass}
        />
      </div>
      {onCancel ? (
        <div className="md:col-span-2">
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel edit
          </Button>
        </div>
      ) : null}
    </div>
  );
}
