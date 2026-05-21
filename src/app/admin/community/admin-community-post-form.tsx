"use client";

import type { CommunityPostRecord, CommunitySpaceRecord } from "@prisma/client";
import { useState } from "react";
import { CommunityPostCoverUpload } from "@/components/community/community-post-cover-upload";
import {
  archiveCommunityPostAction,
  createCommunityPostAction,
  updateCommunityPostAction,
} from "./post-actions";
import type { CommunityPostFormInput } from "@/lib/community/post-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  COMMUNITY_POST_STATUSES,
  COMMUNITY_POST_TYPES,
  DEFAULT_COMMUNITY_POST_TYPE,
} from "@/lib/community/post-constants";
import type { CommunityPostDbStatus, CommunityPostType } from "@/lib/community/types";

type PostWithSpace = CommunityPostRecord & {
  space: Pick<CommunitySpaceRecord, "title" | "slug">;
};

type FormState = {
  spaceId: string;
  title: string;
  body: string;
  excerpt: string;
  postType: CommunityPostType;
  status: CommunityPostDbStatus;
  coverImageUrl: string;
  publishedAt: string;
};

function toDatetimeLocal(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function emptyForm(spaces: CommunitySpaceRecord[]): FormState {
  return {
    spaceId: spaces[0]?.id ?? "",
    title: "",
    body: "",
    excerpt: "",
    postType: DEFAULT_COMMUNITY_POST_TYPE,
    status: "draft",
    coverImageUrl: "",
    publishedAt: "",
  };
}

function postToForm(row: PostWithSpace): FormState {
  const postType = COMMUNITY_POST_TYPES.some((t) => t.value === row.postType)
    ? (row.postType as CommunityPostType)
    : DEFAULT_COMMUNITY_POST_TYPE;
  const status = COMMUNITY_POST_STATUSES.includes(row.status as CommunityPostDbStatus)
    ? (row.status as CommunityPostDbStatus)
    : "draft";
  return {
    spaceId: row.spaceId,
    title: row.title ?? "",
    body: row.body,
    excerpt: row.excerpt ?? "",
    postType,
    status,
    coverImageUrl: row.coverImageUrl ?? "",
    publishedAt: toDatetimeLocal(row.publishedAt),
  };
}

export function AdminCommunityPostForm({
  spaces,
  initialPosts,
}: {
  spaces: CommunitySpaceRecord[];
  initialPosts: PostWithSpace[];
}) {
  const [posts] = useState(initialPosts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(spaces));
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const editingRow = editingId ? posts.find((p) => p.id === editingId) : null;

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm(spaces));
    setErrorMsg(null);
  }

  function startEdit(row: PostWithSpace) {
    setEditingId(row.id);
    setForm(postToForm(row));
    setErrorMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.spaceId) {
      setErrorMsg("Choose a space.");
      return;
    }
    setStatus("saving");
    setErrorMsg(null);

    const payload: CommunityPostFormInput = {
      spaceId: form.spaceId,
      title: form.title || undefined,
      body: form.body,
      excerpt: form.excerpt || undefined,
      postType: form.postType,
      status: form.status,
      coverImageUrl: form.coverImageUrl || undefined,
      publishedAt: form.publishedAt || undefined,
    };

    const res = editingId
      ? await updateCommunityPostAction(editingId, payload)
      : await createCommunityPostAction(payload);

    if (!res.ok) {
      setStatus("error");
      setErrorMsg(res.error);
      return;
    }
    setStatus("idle");
    window.location.reload();
  }

  async function handleArchive(id: string) {
    if (!confirm("Archive this post? It will be removed from the public feed.")) return;
    const res = await archiveCommunityPostAction(id);
    if (!res.ok) setErrorMsg(res.error);
    else window.location.reload();
  }

  if (spaces.length === 0) {
    return (
      <p className="text-zinc-400 text-sm">
        Create at least one community space before adding posts.{" "}
        <a href="/admin/community" className="text-brand-primary hover:underline">
          Manage spaces
        </a>
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
          Posts appear on <a href="/community" className="text-brand-primary hover:underline">Mission Hub</a> when
          status is <strong className="text-zinc-300">published</strong> and the space is published.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={startCreate}>
          New post
        </Button>
      </div>

      {errorMsg ? <p className="text-sm text-red-400">{errorMsg}</p> : null}

      <Card className="border-brand-primary/25 bg-zinc-900 max-w-3xl">
        <CardHeader>
          <CardTitle className="text-cream">
            {editingId ? `Edit: ${editingRow?.title || "Post"}` : "Create a post"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Space</Label>
              <select
                value={form.spaceId}
                onChange={(e) => setForm((f) => ({ ...f, spaceId: e.target.value }))}
                required
                className="w-full h-10 rounded-md border border-zinc-600 bg-zinc-800 px-3 text-sm text-cream"
              >
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.status}) — {s.slug}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Post type</Label>
                <select
                  value={form.postType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, postType: e.target.value as CommunityPostType }))
                  }
                  className="w-full h-10 rounded-md border border-zinc-600 bg-zinc-800 px-3 text-sm text-cream"
                >
                  {COMMUNITY_POST_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Status</Label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as CommunityPostDbStatus }))
                  }
                  className="w-full h-10 rounded-md border border-zinc-600 bg-zinc-800 px-3 text-sm text-cream"
                >
                  {COMMUNITY_POST_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Title (optional)</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="bg-zinc-800 border-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Body</Label>
              <Textarea
                rows={8}
                required
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                className="bg-zinc-800 border-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Excerpt (optional — shown in feed when set)</Label>
              <Textarea
                rows={3}
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                className="bg-zinc-800 border-zinc-600"
              />
            </div>
            <CommunityPostCoverUpload
              label="Cover photo"
              value={form.coverImageUrl}
              onChange={(url) => setForm((f) => ({ ...f, coverImageUrl: url }))}
              variant="dark"
            />
            <div className="space-y-2">
              <Label className="text-zinc-300">Published date (when status is published)</Label>
              <Input
                type="datetime-local"
                value={form.publishedAt}
                onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
                className="bg-zinc-800 border-zinc-600"
              />
              <p className="text-xs text-zinc-500">Leave empty to use now when publishing.</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={status === "saving"}>
                {status === "saving" ? "Saving…" : editingId ? "Save changes" : "Create post"}
              </Button>
              {editingId ? (
                <>
                  <Button type="button" variant="outline" onClick={startCreate}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-amber-600/50 text-amber-200"
                    onClick={() => handleArchive(editingId)}
                  >
                    Archive post
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
              <th className="px-4 py-3 font-medium">Title / preview</th>
              <th className="px-4 py-3 font-medium">Space</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-zinc-500 text-center">
                  No posts yet.
                </td>
              </tr>
            ) : (
              posts.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-900/50">
                  <td className="px-4 py-3 text-cream max-w-xs truncate">
                    {row.title || row.body.slice(0, 60)}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{row.space.title}</td>
                  <td className="px-4 py-3 text-zinc-400 capitalize">{row.postType}</td>
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
