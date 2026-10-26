"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MinistryActivityStatus, MinistryActivityType, MinistryPathway, MinistrySentDesignation } from "@prisma/client";
import { Button } from "@/components/ui/button";
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
import {
  createMinistryActivityAction,
  createMinistryPersonAction,
  deleteMinistryActivityAction,
  deleteMinistryPersonAction,
  updateMinistryActivityAction,
  updateMinistryMilestonesAction,
  updateMinistryPersonAction,
} from "./ministry-actions";

type LegacyOption = { id: string; name: string };

const PATHWAYS = Object.keys(PATHWAY_LABELS) as MinistryPathway[];
const DESIGNATIONS = Object.keys(DESIGNATION_LABELS) as MinistrySentDesignation[];
const ACTIVITY_TYPES = Object.keys(ACTIVITY_LABELS) as MinistryActivityType[];
const ACTIVITY_STATUSES = Object.keys(ACTIVITY_STATUS_LABELS) as MinistryActivityStatus[];

const selectClass =
  "mt-1 w-full rounded-md border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-cream";

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

  const selected = people.find((person) => person.id === selectedId) ?? null;
  const visiblePeople = people.filter((person) => ministryPersonMatchesQuery(person, query));

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
    router.refresh();
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
    if (selectedId === person.id) setSelectedId(null);
    router.refresh();
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
            Adding someone does not count them as Mobilized, Trained & Equipped, or Sent.
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
                      onClick={() => {
                        setError(null);
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
          key={selected.id + selected.activities.map((activity) => activity.id).join(",")}
          person={selected}
          people={people}
          legacyRecruits={legacyRecruits}
          pending={pending}
          onError={setError}
          onDelete={() => handleDeletePerson(selected)}
          onSaved={() => router.refresh()}
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
  onError,
  onDelete,
  onSaved,
}: {
  person: MinistryPersonView;
  people: MinistryPersonView[];
  legacyRecruits: LegacyOption[];
  pending: boolean;
  onError: (message: string | null) => void;
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
  const [saving, setSaving] = useState<string | null>(null);

  const guidance =
    pathway && pathway in PATHWAY_GUIDANCE
      ? PATHWAY_GUIDANCE[pathway as MinistryPathway]
      : UNSET_PATHWAY_GUIDANCE;
  const mates = people.filter(
    (other) => other.id !== person.id && person.householdId && other.householdId === person.householdId,
  );

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSaving("profile");
    onError(null);
    const result = await updateMinistryPersonAction(person.id, {
      displayName,
      pathway,
      notes,
      householdWithPersonId,
      legacyRecruitId,
    });
    setSaving(null);
    if (!result.ok) {
      onError(result.error);
      return;
    }
    onSaved();
  }

  async function saveMilestones(event: React.FormEvent) {
    event.preventDefault();
    setSaving("milestones");
    onError(null);
    const result = await updateMinistryMilestonesAction(person.id, {
      mobilized,
      mobilizedOn,
      trainedEquipped,
      trainedEquippedOn,
      sent,
      sentOn,
      sentDesignation,
      sentVerifiedBy,
      sentVerificationNote,
    });
    setSaving(null);
    if (!result.ok) {
      onError(result.error);
      return;
    }
    onSaved();
  }

  return (
    <div className="space-y-6 rounded-2xl border border-brand-accent/30 bg-zinc-950/40 px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-serif text-xl text-cream">{person.displayName}</h2>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={onDelete}
          className="text-red-400 hover:text-red-300"
        >
          Remove person
        </Button>
      </div>

      <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
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
        <div>
          <Button type="submit" size="sm" disabled={saving !== null || !displayName.trim()}>
            {saving === "profile" ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </form>

      <form onSubmit={saveMilestones} className="space-y-4 border-t border-white/10 pt-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300">
          Milestones
        </h3>
        <p className="text-xs text-zinc-500 leading-relaxed">{guidance}</p>
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
        {sent ? (
          <div className="grid gap-4 md:grid-cols-2 rounded-xl border border-brand-accent/20 px-4 py-4">
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
          </div>
        ) : null}
        <Button type="submit" size="sm" disabled={saving !== null}>
          {saving === "milestones" ? "Saving…" : "Save milestones"}
        </Button>
      </form>

      <ActivityEditor
        personId={person.id}
        activities={person.activities}
        onError={onError}
        onSaved={onSaved}
      />
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

function ActivityEditor({
  personId,
  activities,
  onError,
  onSaved,
}: {
  personId: string;
  activities: MinistryActivityView[];
  onError: (message: string | null) => void;
  onSaved: () => void;
}) {
  const blank = {
    activityType: "JONATHAN_TRAINING" as MinistryActivityType,
    status: "PARTICIPATED" as MinistryActivityStatus,
    activityOn: "",
    location: "",
    notes: "",
  };
  const [draft, setDraft] = useState(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState(blank);
  const [saving, setSaving] = useState(false);

  async function addActivity(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    onError(null);
    const result = await createMinistryActivityAction(personId, draft);
    setSaving(false);
    if (!result.ok) {
      onError(result.error);
      return;
    }
    setDraft(blank);
    onSaved();
  }

  async function saveActivity(event: React.FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    setSaving(true);
    onError(null);
    const result = await updateMinistryActivityAction(editingId, edit);
    setSaving(false);
    if (!result.ok) {
      onError(result.error);
      return;
    }
    setEditingId(null);
    onSaved();
  }

  async function removeActivity(activity: MinistryActivityView) {
    if (!confirm("Remove this activity? This does not change milestones.")) return;
    setSaving(true);
    onError(null);
    const result = await deleteMinistryActivityAction(activity.id);
    setSaving(false);
    if (!result.ok) {
      onError(result.error);
      return;
    }
    onSaved();
  }

  return (
    <div className="space-y-4 border-t border-white/10 pt-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300">
        Activities
      </h3>
      <p className="text-xs text-zinc-500 leading-relaxed">
        Jonathan Training and DMM Training are one program. Put the venue, such as Emerald Hills,
        a church, or another country, in the location field. Completing an activity does not mark
        someone Sent.
      </p>

      {activities.length === 0 ? (
        <p className="text-sm text-zinc-500">No activities yet.</p>
      ) : (
        <ul className="space-y-3">
          {activities.map((activity) =>
            editingId === activity.id ? (
              <li key={activity.id}>
                <ActivityFields
                  idPrefix={activity.id}
                  value={edit}
                  onChange={setEdit}
                  onSubmit={saveActivity}
                  submitLabel={saving ? "Saving…" : "Save activity"}
                  disabled={saving}
                  onCancel={() => setEditingId(null)}
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
                    onClick={() => {
                      setEditingId(activity.id);
                      setEdit({
                        activityType: activity.activityType,
                        status: activity.status,
                        activityOn: activity.activityOn ?? "",
                        location: activity.location,
                        notes: activity.notes,
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-400"
                    disabled={saving}
                    onClick={() => removeActivity(activity)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      <ActivityFields
        idPrefix={`new-${personId}`}
        value={draft}
        onChange={setDraft}
        onSubmit={addActivity}
        submitLabel={saving ? "Adding…" : "Add activity"}
        disabled={saving}
      />
    </div>
  );
}

function ActivityFields({
  idPrefix,
  value,
  onChange,
  onSubmit,
  submitLabel,
  disabled,
  onCancel,
}: {
  idPrefix: string;
  value: {
    activityType: MinistryActivityType;
    status: MinistryActivityStatus;
    activityOn: string;
    location: string;
    notes: string;
  };
  onChange: (value: {
    activityType: MinistryActivityType;
    status: MinistryActivityStatus;
    activityOn: string;
    location: string;
    notes: string;
  }) => void;
  onSubmit: (event: React.FormEvent) => void;
  submitLabel: string;
  disabled: boolean;
  onCancel?: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border border-white/10 px-4 py-4 md:grid-cols-2">
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
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={disabled}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
