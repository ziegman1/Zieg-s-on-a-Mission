"use client";

import { useMemo, useState } from "react";
import type { CommunitySpaceRecord } from "@prisma/client";
import {
  archiveCommunitySpaceAction,
  createCommunitySpaceAction,
  updateCommunitySpaceAction,
} from "./actions";
import { CommunitySpaceExperienceForm } from "@/components/community/community-space-experience-form";
import {
  emptySpaceForm,
  spaceFormToPayload,
  spaceRecordToForm,
  type SpaceFormState,
} from "@/lib/community/space-form-state";
import { slugifyCommunityTitle } from "@/lib/community/slug";
import { SettingsSpacesOrderPanel } from "@/components/community/settings/settings-spaces-order-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CommunitySpacesManager({ initialSpaces }: { initialSpaces: CommunitySpaceRecord[] }) {
  const [spaces, setSpaces] = useState(initialSpaces);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SpaceFormState>(emptySpaceForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const editingRow = useMemo(
    () => (editingId ? spaces.find((s) => s.id === editingId) : null),
    [editingId, spaces],
  );

  const orderItems = useMemo(
    () =>
      spaces.map((s) => ({
        id: s.id,
        title: s.title,
        slug: s.slug,
        status: s.status,
        sortOrder: s.sortOrder,
      })),
    [spaces],
  );

  function startCreate() {
    setEditingId(null);
    setForm(emptySpaceForm());
    setSlugTouched(false);
    setErrorMsg(null);
  }

  function startEdit(row: CommunitySpaceRecord) {
    setEditingId(row.id);
    setForm(spaceRecordToForm(row));
    setSlugTouched(true);
    setErrorMsg(null);
  }

  function onTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: slugTouched ? f.slug : slugifyCommunityTitle(title),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg(null);
    const payload = spaceFormToPayload(form);

    const res = editingId
      ? await updateCommunitySpaceAction(editingId, payload)
      : await createCommunitySpaceAction(payload);

    if (!res.ok) {
      setStatus("error");
      setErrorMsg(res.error);
      return;
    }

    setStatus("saved");
    window.location.reload();
  }

  async function handleArchive(id: string) {
    if (!confirm("Archive this space? It will no longer appear on the public Mission Hub.")) return;
    setErrorMsg(null);
    const res = await archiveCommunitySpaceAction(id);
    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }
    setSpaces((list) =>
      list.map((s) => (s.id === id ? { ...s, status: "archived" } : s)),
    );
    if (editingId === id) startCreate();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
          Shape intentional ministry environments — welcome messages, engagement prompts, and how
          members participate. Published spaces appear on{" "}
          <a href="/community" className="text-brand-primary hover:underline">
            /community
          </a>
          .
        </p>
        <Button type="button" variant="outline" size="sm" onClick={startCreate}>
          New space
        </Button>
      </div>

      {errorMsg ? <p className="text-sm text-red-400">{errorMsg}</p> : null}
      {status === "saved" ? (
        <p className="text-sm text-emerald-400">Saved.</p>
      ) : null}

      {spaces.length >= 2 ? (
        <Card className="border-brand-primary/25 bg-zinc-900 max-w-2xl">
          <CardHeader>
            <CardTitle className="text-cream text-lg">Display order</CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-300 [&_p]:text-zinc-400">
            <SettingsSpacesOrderPanel spaces={orderItems} />
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-brand-primary/25 bg-zinc-900 max-w-3xl">
        <CardHeader>
          <CardTitle className="text-cream">
            {editingId ? `Edit: ${editingRow?.title ?? "Space"}` : "Create a space"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <CommunitySpaceExperienceForm
              form={form}
              setForm={setForm}
              onTitleChange={onTitleChange}
              slugTouched={slugTouched}
              setSlugTouched={setSlugTouched}
              variant="dark"
            />
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={status === "saving"}>
                {status === "saving" ? "Saving…" : editingId ? "Save changes" : "Create space"}
              </Button>
              {editingId ? (
                <>
                  <Button type="button" variant="outline" onClick={startCreate}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-amber-600/50 text-amber-200 hover:bg-amber-950/40"
                    onClick={() => handleArchive(editingId)}
                  >
                    Archive space
                  </Button>
                </>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-brand-primary/25">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-xs tracking-wide">
            <tr>
              <th className="px-4 py-3 font-medium w-12">#</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {spaces.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-zinc-500 text-center">
                  No spaces yet. Create one above.
                </td>
              </tr>
            ) : (
              spaces.map((row, index) => (
                <tr key={row.id} className="hover:bg-zinc-900/50">
                  <td className="px-4 py-3 text-zinc-500 tabular-nums">{index + 1}</td>
                  <td className="px-4 py-3 text-cream">{row.title}</td>
                  <td className="px-4 py-3 text-zinc-400 capitalize">
                    {(row.spaceType ?? "standard").replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-400">{row.slug}</td>
                  <td className="px-4 py-3 capitalize text-zinc-300">{row.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => startEdit(row)}>
                        Edit
                      </Button>
                      {row.status !== "archived" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-amber-300/90"
                          onClick={() => handleArchive(row.id)}
                        >
                          Archive
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
