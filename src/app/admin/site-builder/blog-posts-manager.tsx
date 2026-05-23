"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { BlogPostRecord, BlogPostStatus } from "@/lib/blog/types";
import { slugifyTitle } from "@/lib/blog/slug";
import { mergeAdminBlogPosts } from "@/lib/blog/merge-posts";
import {
  createBlogPostDraftAction,
  deleteBlogPostAction,
  listAdminBlogPosts,
  publishBlogPostAction,
  updateBlogPostDraftAction,
  unpublishBlogPostAction,
} from "./blog-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const emptyForm = (): BlogPostFormState => ({
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  featuredImageUrl: "",
  featuredImageAlt: "",
  status: "DRAFT",
  publishedAt: "",
});

type BlogPostFormState = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  featuredImageUrl: string;
  featuredImageAlt: string;
  status: BlogPostStatus;
  publishedAt: string;
};

function postToForm(post: BlogPostRecord): BlogPostFormState {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    featuredImageUrl: post.featuredImageUrl ?? "",
    featuredImageAlt: post.featuredImageAlt,
    status: post.status,
    publishedAt: post.publishedAt ? post.publishedAt.slice(0, 16) : "",
  };
}

function toDatetimeLocal(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function parsePublishedAtForSave(
  value: string,
  intent: "draft" | "publish",
): string | null {
  if (value.trim()) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return intent === "publish" ? new Date().toISOString() : null;
}

export function BlogPostsManager({
  initialPosts,
  loadError,
  onPostsChange,
  onSuccess,
  onError,
}: {
  initialPosts: BlogPostRecord[];
  loadError?: string | null;
  onPostsChange?: (posts: BlogPostRecord[]) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string | null) => void;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogPostFormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(loadError ?? null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [listBusy, setListBusy] = useState(false);
  const [isPending, startTransition] = useTransition();

  const resetEditor = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm());
    setSlugTouched(false);
    setError(null);
    setSuccess(null);
  }, []);

  const reloadPostsFromDb = useCallback(async (): Promise<boolean> => {
    setListBusy(true);
    try {
      const listRes = await listAdminBlogPosts();
      if (!listRes.ok) {
        setError(listRes.error);
        return false;
      }
      setPosts(listRes.posts);
      onPostsChange?.(listRes.posts);
      setError(null);
      return true;
    } finally {
      setListBusy(false);
    }
  }, [onPostsChange]);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  useEffect(() => {
    if (loadError) setError(loadError);
  }, [loadError]);

  useEffect(() => {
    void reloadPostsFromDb();
  }, [reloadPostsFromDb]);

  function patchForm(patch: Partial<BlogPostFormState>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function startNew() {
    resetEditor();
    setForm(emptyForm());
    setEditingId("new");
  }

  function startEdit(post: BlogPostRecord) {
    setEditingId(post.id);
    setForm(postToForm(post));
    setSlugTouched(true);
    setError(null);
  }

  async function uploadImage(file: File) {
    setUploadBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-blog-image", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
      patchForm({ featuredImageUrl: data.url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadBusy(false);
    }
  }

  function handleTitleChange(title: string) {
    patchForm({ title });
    if (!slugTouched) {
      patchForm({ slug: slugifyTitle(title) });
    }
  }

  function save(intent: "draft" | "publish") {
    setError(null);
    setSuccess(null);

    const title = form.title.trim();
    if (!title) {
      setError("Title is required.");
      return;
    }
    if (intent === "publish" && !form.body.trim()) {
      setError("Body is required before publishing.");
      return;
    }

    const payload = {
      id: editingId === "new" ? undefined : editingId ?? undefined,
      title,
      slug: form.slug,
      excerpt: form.excerpt,
      body: form.body,
      featuredImageUrl: form.featuredImageUrl.trim() || null,
      featuredImageAlt: form.featuredImageAlt,
      status: intent === "publish" ? ("PUBLISHED" as const) : ("DRAFT" as const),
      publishedAt: parsePublishedAtForSave(form.publishedAt, intent),
    };

    const isNew = !editingId || editingId === "new";

    startTransition(async () => {
      try {
        let res;
        if (intent === "publish") {
          res = await publishBlogPostAction(payload);
        } else if (isNew) {
          const { id: _id, ...createInput } = payload;
          res = await createBlogPostDraftAction(createInput);
        } else {
          res = await updateBlogPostDraftAction(editingId!, payload);
        }

        if (!res.ok) {
          setSuccess(null);
          setError(res.error);
          onError?.(res.error);
          return;
        }

        setEditingId(res.post.id);
        setForm(postToForm(res.post));
        setSlugTouched(true);
        setSuccess(res.message);
        onSuccess?.(res.message);

        const listRes = await listAdminBlogPosts();
        if (listRes.ok) {
          const merged = mergeAdminBlogPosts(listRes.posts, res.post);
          setPosts(merged);
          onPostsChange?.(merged);
          if (!listRes.posts.some((p) => p.id === res.post.id)) {
            console.warn(
              "[blog] Saved post",
              res.post.id,
              "but it was missing from list reload — kept in UI from save response.",
            );
          }
          setError(null);
          onError?.(null);
        } else {
          setPosts((prev) => {
            const merged = mergeAdminBlogPosts(prev, res.post);
            onPostsChange?.(merged);
            return merged;
          });
          const listErr = `Post saved (id ${res.post.id}) but list reload failed: ${listRes.error}`;
          setError(listErr);
          onError?.(listErr);
        }

        router.refresh();
      } catch (e) {
        setSuccess(null);
        const msg = e instanceof Error ? e.message : "Could not save post";
        setError(msg);
        onError?.(msg);
      }
    });
  }

  function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteBlogPostAction(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPosts((p) => {
        const next = p.filter((x) => x.id !== id);
        onPostsChange?.(next);
        return next;
      });
      if (editingId === id) resetEditor();
      onSuccess?.(res.message);
    });
  }

  function handleUnpublish(id: string) {
    startTransition(async () => {
      const res = await unpublishBlogPostAction(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPosts((p) => {
        const next = p.map((x) => (x.id === id ? res.post : x));
        onPostsChange?.(next);
        return next;
      });
      if (editingId === id) setForm(postToForm(res.post));
      onSuccess?.(res.message);
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-zinc-950 text-zinc-100">
      <div className="shrink-0 border-b border-zinc-800 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Blog posts</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Published posts appear on /blog automatically.
          </p>
        </div>
        <Button type="button" size="sm" onClick={startNew} className="rounded-full shrink-0">
          <Plus className="h-4 w-4 mr-1" aria-hidden />
          New blog post
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        <ul className="w-56 shrink-0 border-r border-zinc-800 overflow-y-auto p-2 space-y-1">
          {listBusy && posts.length === 0 ? (
            <li className="px-2 py-4 text-xs text-zinc-500 inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              Loading posts…
            </li>
          ) : null}
          {!listBusy && posts.length === 0 ? (
            <li className="px-2 py-4 text-xs text-zinc-500">No posts yet. Create one above.</li>
          ) : (
            posts.map((post) => (
              <li key={post.id}>
                <button
                  type="button"
                  onClick={() => startEdit(post)}
                  className={cn(
                    "w-full text-left rounded-lg px-2 py-2 transition-colors",
                    editingId === post.id ? "bg-zinc-800" : "hover:bg-zinc-900",
                  )}
                >
                  <div className="flex gap-2">
                    <div className="h-10 w-10 shrink-0 rounded-md bg-zinc-800 overflow-hidden">
                      {post.featuredImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.featuredImageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{post.title}</p>
                      <p
                        className={cn(
                          "text-[10px] mt-0.5",
                          post.status === "PUBLISHED" ? "text-emerald-400" : "text-zinc-500",
                        )}
                      >
                        {post.status === "PUBLISHED" ? "Published" : "Draft"}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {editingId === null && !form.title ? (
            <p className="text-sm text-zinc-500 py-8 text-center max-w-sm mx-auto leading-relaxed">
              Select a post to edit, or click <strong className="text-zinc-300">New blog post</strong>{" "}
              to write a story for the public blog.
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-zinc-400">Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="A prayer for provision"
                    className="bg-zinc-900 border-zinc-700"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-zinc-400">URL slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 shrink-0">/blog/</span>
                    <Input
                      value={form.slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        patchForm({ slug: slugifyTitle(e.target.value) });
                      }}
                      className="bg-zinc-900 border-zinc-700 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-zinc-400">Featured image</Label>
                  {form.featuredImageUrl ? (
                    <div className="relative rounded-lg overflow-hidden ring-1 ring-zinc-700 max-w-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.featuredImageUrl}
                        alt={form.featuredImageAlt || "Preview"}
                        className="w-full aspect-video object-cover"
                      />
                    </div>
                  ) : null}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploadBusy}
                    className="text-xs text-zinc-400 file:mr-2 file:rounded file:border-0 file:bg-brand-primary/30 file:px-2 file:py-1"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadImage(f);
                      e.target.value = "";
                    }}
                  />
                  {uploadBusy ? (
                    <span className="text-xs text-zinc-500 inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                    </span>
                  ) : null}
                  <Input
                    value={form.featuredImageUrl}
                    onChange={(e) => patchForm({ featuredImageUrl: e.target.value })}
                    placeholder="Or paste image URL"
                    className="bg-zinc-900 border-zinc-700 text-xs mt-1"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-zinc-400">Featured image alt text</Label>
                  <Input
                    value={form.featuredImageAlt}
                    onChange={(e) => patchForm({ featuredImageAlt: e.target.value })}
                    className="bg-zinc-900 border-zinc-700"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-zinc-400">Excerpt / preview text</Label>
                  <Textarea
                    value={form.excerpt}
                    onChange={(e) => patchForm({ excerpt: e.target.value })}
                    rows={2}
                    placeholder="Short summary for the blog card…"
                    className="bg-zinc-900 border-zinc-700 resize-none"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-zinc-400">Body</Label>
                  <Textarea
                    value={form.body}
                    onChange={(e) => patchForm({ body: e.target.value })}
                    rows={14}
                    placeholder="Write or paste your post. Use blank lines between paragraphs. ## Heading for sections. **bold** for emphasis."
                    className="bg-zinc-900 border-zinc-700 resize-y min-h-[12rem] text-[15px] leading-relaxed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400">Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      patchForm({ status: e.target.value as BlogPostStatus })
                    }
                    className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-900 text-sm px-2"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400">Publish date</Label>
                  <Input
                    type="datetime-local"
                    value={
                      form.publishedAt ||
                      (form.status === "PUBLISHED" ? toDatetimeLocal(new Date().toISOString()) : "")
                    }
                    onChange={(e) => patchForm({ publishedAt: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-sm"
                  />
                </div>
              </div>

              {error ? (
                <p className="text-sm text-red-400" role="alert">
                  {error}
                </p>
              ) : null}
              {success ? (
                <p className="text-sm text-emerald-400" role="status">
                  {success}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending || !form.title.trim()}
                  onClick={() => save("draft")}
                  className="rounded-full"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Save draft
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending || !form.title.trim() || !form.body.trim()}
                  onClick={() => save("publish")}
                  className="rounded-full bg-brand-primary"
                >
                  Publish blog post
                </Button>
                {editingId && editingId !== "new" ? (
                  <>
                    {form.status === "PUBLISHED" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleUnpublish(editingId)}
                        className="rounded-full text-zinc-400"
                      >
                        Unpublish
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleDelete(editingId, form.title)}
                      className="rounded-full text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetEditor}
                  className="rounded-full text-zinc-500 ml-auto"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
