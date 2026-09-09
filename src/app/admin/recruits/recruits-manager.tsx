"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RecruitRecord } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { recruitListSignature } from "@/lib/recruits/recruit-list-signature";
import { recruitPersonCount } from "@/lib/recruits/recruit-person-count";
import { isSent, isTrained } from "@/lib/recruits/recruit-milestones";
import {
  createRecruitAction,
  deleteRecruitAction,
  renameRecruitAction,
  updateRecruitMilestonesAction,
} from "./actions";

type MilestoneField = "jonathanTrainingComplete" | "fullyFunded";

export function RecruitsManager({ initialRecruits }: { initialRecruits: RecruitRecord[] }) {
  const router = useRouter();
  const [recruits, setRecruits] = useState(initialRecruits);
  const [syncedSignature, setSyncedSignature] = useState(() =>
    recruitListSignature(initialRecruits),
  );
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // router.refresh() re-runs the server component but does not reset useState, so adopt the new
  // list whenever the server's data actually changes. Without this the table would keep rendering
  // the list captured on first mount while the summary counts moved on.
  const incomingSignature = recruitListSignature(initialRecruits);
  if (incomingSignature !== syncedSignature) {
    setSyncedSignature(incomingSignature);
    setRecruits(initialRecruits);
  }

  function setPending(id: string, pending: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    setAdding(true);
    setError(null);
    const res = await createRecruitAction({ name });
    setAdding(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    setNewName("");
    router.refresh();
  }

  /** Optimistic toggle; reverts the checkbox if the server rejects the change. */
  async function handleToggle(recruit: RecruitRecord, field: MilestoneField, value: boolean) {
    const next = {
      jonathanTrainingComplete: recruit.jonathanTrainingComplete,
      fullyFunded: recruit.fullyFunded,
      [field]: value,
    };

    setError(null);
    setPending(recruit.id, true);
    setRecruits((list) =>
      list.map((r) => (r.id === recruit.id ? { ...r, ...next } : r)),
    );

    const res = await updateRecruitMilestonesAction(recruit.id, next);
    setPending(recruit.id, false);

    if (!res.ok) {
      setError(res.error);
      setRecruits((list) => list.map((r) => (r.id === recruit.id ? recruit : r)));
      return;
    }
    router.refresh();
  }

  function startEdit(recruit: RecruitRecord) {
    setEditingId(recruit.id);
    setEditingName(recruit.name);
    setError(null);
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const name = editingName.trim();
    if (!name) return;

    setPending(editingId, true);
    setError(null);
    const res = await renameRecruitAction(editingId, { name });
    setPending(editingId, false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    setRecruits((list) =>
      list.map((r) => (r.id === editingId ? { ...r, name } : r)),
    );
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(recruit: RecruitRecord) {
    if (!confirm(`Delete ${recruit.name}? This removes them from all progress counts.`)) return;

    setPending(recruit.id, true);
    setError(null);
    const res = await deleteRecruitAction(recruit.id);
    setPending(recruit.id, false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    setRecruits((list) => list.filter((r) => r.id !== recruit.id));
    if (editingId === recruit.id) setEditingId(null);
    router.refresh();
  }

  return (
    <section className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-brand-primary/25 bg-zinc-950/60 px-5 py-5"
      >
        <div className="flex-1 min-w-[16rem]">
          <label htmlFor="recruit-name" className="text-sm font-medium text-zinc-300">
            Recruit name
          </label>
          <Input
            id="recruit-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Full name"
            maxLength={120}
            className="mt-2 border-zinc-700 bg-black/40"
          />
        </div>
        <Button
          type="submit"
          disabled={adding || !newName.trim()}
          className="bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold"
        >
          {adding ? "Adding…" : "Add Recruit"}
        </Button>
      </form>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {recruits.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No recruits yet. Add the first person above to start the count.
        </p>
      ) : (
        <div className="rounded-2xl border border-brand-primary/25 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-brand-primary/20 hover:bg-transparent">
                <TableHead className="text-zinc-400">Recruit</TableHead>
                <TableHead className="text-zinc-400 w-[13rem]">Jonathan Training</TableHead>
                <TableHead className="text-zinc-400 w-[11rem]">Fully Funded</TableHead>
                <TableHead className="text-zinc-400 w-[9rem]">Status</TableHead>
                <TableHead className="text-zinc-400 w-[10rem] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recruits.map((recruit) => {
                const busy = pendingIds.has(recruit.id);
                const trained = isTrained(recruit);
                const sent = isSent(recruit);
                const fundedBeforeTraining = recruit.fullyFunded && !trained;
                const people = recruitPersonCount(recruit.name);

                return (
                  <TableRow key={recruit.id} className="border-brand-primary/15">
                    <TableCell className="align-top">
                      {editingId === recruit.id ? (
                        <form onSubmit={handleRename} className="flex items-center gap-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            maxLength={120}
                            autoFocus
                            className="h-8 border-zinc-700 bg-black/40"
                          />
                          <Button type="submit" size="sm" disabled={busy || !editingName.trim()}>
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </form>
                      ) : (
                        <>
                          <span className="text-cream">{recruit.name}</span>
                          {people > 1 ? (
                            <span className="ml-2 rounded-full border border-brand-primary/40 px-2 py-0.5 text-[11px] text-brand-primary align-middle">
                              Counts as {people}
                            </span>
                          ) : null}
                          {fundedBeforeTraining ? (
                            <p className="mt-1 text-xs text-zinc-500 leading-snug">
                              Counts toward Sent once training is complete.
                            </p>
                          ) : null}
                        </>
                      )}
                    </TableCell>

                    <TableCell className="align-top">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={recruit.jonathanTrainingComplete}
                          disabled={busy}
                          onChange={(e) =>
                            handleToggle(recruit, "jonathanTrainingComplete", e.target.checked)
                          }
                          className="size-4 accent-brand-accent cursor-pointer"
                          aria-label={`Jonathan Training complete for ${recruit.name}`}
                        />
                        <span className="text-sm text-zinc-400">Complete</span>
                      </label>
                    </TableCell>

                    <TableCell className="align-top">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={recruit.fullyFunded}
                          disabled={busy}
                          onChange={(e) => handleToggle(recruit, "fullyFunded", e.target.checked)}
                          className="size-4 accent-brand-accent cursor-pointer"
                          aria-label={`Fully funded for ${recruit.name}`}
                        />
                        <span className="text-sm text-zinc-400">Funded</span>
                      </label>
                    </TableCell>

                    <TableCell className="align-top">
                      <span
                        className={
                          sent
                            ? "text-sm font-medium text-brand-accent"
                            : trained
                              ? "text-sm text-brand-primary"
                              : "text-sm text-zinc-500"
                        }
                      >
                        {sent ? "Sent" : trained ? "Trained" : "Mobilized"}
                      </span>
                    </TableCell>

                    <TableCell className="align-top text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => startEdit(recruit)}
                          className="border-brand-primary/40"
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => handleDelete(recruit)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
