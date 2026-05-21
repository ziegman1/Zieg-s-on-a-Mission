"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  BookOpen,
  Calendar,
  HandHeart,
  Loader2,
  Mail,
  Megaphone,
  Settings2,
  Sparkles,
} from "lucide-react";
import {
  loadCommunityPostForEditAction,
  updateCommunityPostAction,
} from "@/app/admin/community/post-actions";
import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import {
  buildPostComposerPayload,
  type PostComposerFormState,
} from "@/lib/community/post-composer-form";
import {
  COMMUNITY_POST_STATUSES,
  COMMUNITY_POST_TYPES,
  COMPOSER_QUICK_POST_TYPES,
  nowDatetimeLocalValue,
} from "@/lib/community/post-constants";
import type { CommunityOwner } from "@/lib/community/owner-types";
import type { CommunityPostFeedItem, CommunityPostFeedItemBase } from "@/lib/community/types";
import type { CommunityPostType } from "@/lib/community/types";
import { CommunityAvatar } from "@/components/community/community-avatar";
import { CommunityPostCoverUpload } from "@/components/community/community-post-cover-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const QUICK_TYPE_ICONS: Partial<Record<CommunityPostType, typeof Megaphone>> = {
  update: Megaphone,
  prayer: HandHeart,
  praise: Sparkles,
  newsletter: Mail,
  resource: BookOpen,
  event: Calendar,
};

export function CommunityEditPostDialog({
  postId,
  open,
  onOpenChange,
  spaces,
  owner,
  onSaved,
  onRemovedFromFeed,
}: {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaces: CommunityComposerSpace[];
  owner?: CommunityOwner | null;
  onSaved: (patch: CommunityPostFeedItemBase, visibleInPublishedFeed: boolean) => void;
  onRemovedFromFeed?: () => void;
}) {
  const ownerLabel =
    owner?.name?.trim() || owner?.email?.split("@")[0] || "Owner";
  const composerSpaces = useMemo(() => spaces, [spaces]);

  const [form, setForm] = useState<PostComposerFormState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setForm(null);
      setLoadError(null);
      setError(null);
      setSuccess(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    setError(null);
    setSuccess(false);
    void loadCommunityPostForEditAction(postId).then((res) => {
      setLoading(false);
      if (!res.ok) {
        setLoadError(res.error);
        return;
      }
      setForm(res.form);
      setAdvancedOpen(true);
    });
  }, [open, postId]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setError(null);
      setSuccess(false);
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form?.spaceId) {
      setError("Choose a space for this post.");
      return;
    }
    if (!form.body.trim()) {
      setError("Post body cannot be empty.");
      return;
    }
    setError(null);
    setSuccess(false);
    const payload = buildPostComposerPayload(form);
    startTransition(async () => {
      const res = await updateCommunityPostAction(postId, payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (!res.visibleInPublishedFeed) {
        onRemovedFromFeed?.();
        handleOpenChange(false);
        return;
      }
      if (res.feedPatch) {
        onSaved(res.feedPatch, res.visibleInPublishedFeed);
      }
      setSuccess(true);
      setTimeout(() => handleOpenChange(false), 600);
    });
  }

  const canSave = Boolean(form?.spaceId && form.body.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex flex-col gap-0 p-0 overflow-hidden",
          "sm:max-w-lg max-h-[min(92dvh,44rem)]",
          "rounded-t-3xl sm:rounded-2xl border-brand-primary/15 bg-[#faf8f6]",
          "fixed bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0",
          "sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:bottom-auto",
          "w-full max-w-none sm:max-w-lg",
        )}
      >
        <DialogTitle className="sr-only">Edit post</DialogTitle>

        {loading || !form ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-6">
            {loadError ? (
              <p className="text-sm text-red-600 text-center">{loadError}</p>
            ) : (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary/50" aria-hidden />
                <p className="text-sm text-brand-ink/55">Loading post…</p>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <div className="flex items-center gap-3 px-4 pt-4 pb-2 border-b border-brand-primary/10">
              <CommunityAvatar name={ownerLabel} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-brand-ink truncate">Edit post</p>
                <p className="text-xs text-brand-ink/50">Update for your ministry family</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-brand-ink/70">Space</Label>
                <div className="flex flex-wrap gap-1.5">
                  {composerSpaces.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setForm((f) => f && { ...f, spaceId: s.id })}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                        form.spaceId === s.id
                          ? "bg-brand-primary text-white border-brand-primary"
                          : "bg-white text-brand-ink/75 border-brand-primary/20 hover:border-brand-primary/40",
                        s.status !== "published" && "opacity-80",
                      )}
                    >
                      {s.title}
                      {s.status !== "published" ? ` (${s.status})` : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1"
                role="group"
                aria-label="Post type"
              >
                {COMPOSER_QUICK_POST_TYPES.map(({ value, label }) => {
                  const Icon = QUICK_TYPE_ICONS[value] ?? Megaphone;
                  const active = form.postType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((f) => f && { ...f, postType: value })}
                      className={cn(
                        "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border",
                        active
                          ? "bg-brand-primary/12 text-brand-primary border-brand-primary/35"
                          : "bg-white/90 text-brand-ink/60 border-transparent",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                      {label}
                    </button>
                  );
                })}
              </div>

              <Textarea
                value={form.body}
                onChange={(e) => setForm((f) => f && { ...f, body: e.target.value })}
                rows={5}
                className="min-h-[7rem] resize-y border-brand-primary/20 bg-white text-[15px] leading-relaxed"
              />

              <CommunityPostCoverUpload
                value={form.coverImageUrl}
                onChange={(url) => setForm((f) => f && { ...f, coverImageUrl: url })}
                variant="light"
                compact
              />

              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-ink/55"
                aria-expanded={advancedOpen}
              >
                <Settings2 className="h-3.5 w-3.5" aria-hidden />
                {advancedOpen ? "Hide details" : "Show details"}
              </button>

              {advancedOpen ? (
                <div className="space-y-3 rounded-xl border border-brand-primary/15 bg-white/90 p-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-brand-ink/70">Headline (optional)</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm((f) => f && { ...f, title: e.target.value })}
                      className="h-9 bg-white border-brand-primary/20 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-brand-ink/70">Feed preview (optional)</Label>
                    <Textarea
                      rows={2}
                      value={form.excerpt}
                      onChange={(e) =>
                        setForm((f) => f && { ...f, excerpt: e.target.value })
                      }
                      className="text-sm bg-white border-brand-primary/20 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-brand-ink/70">Status</Label>
                      <select
                        value={form.status}
                        onChange={(e) =>
                          setForm((f) =>
                            f
                              ? {
                                  ...f,
                                  status: e.target.value as PostComposerFormState["status"],
                                  publishedAt:
                                    e.target.value === "published" && !f.publishedAt
                                      ? nowDatetimeLocalValue()
                                      : f.publishedAt,
                                }
                              : f,
                          )
                        }
                        className="w-full h-9 rounded-md border border-brand-primary/20 bg-white px-2 text-sm"
                      >
                        {COMMUNITY_POST_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-brand-ink/70">Post type (all)</Label>
                      <select
                        value={form.postType}
                        onChange={(e) =>
                          setForm((f) =>
                            f
                              ? { ...f, postType: e.target.value as CommunityPostType }
                              : f,
                          )
                        }
                        className="w-full h-9 rounded-md border border-brand-primary/20 bg-white px-2 text-sm"
                      >
                        {COMMUNITY_POST_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {form.status === "published" ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-brand-ink/70">Published date</Label>
                      <Input
                        type="datetime-local"
                        value={form.publishedAt}
                        onChange={(e) =>
                          setForm((f) => f && { ...f, publishedAt: e.target.value })
                        }
                        className="h-9 bg-white border-brand-primary/20 text-sm"
                      />
                    </div>
                  ) : null}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-brand-ink/70">Cover image URL</Label>
                    <Input
                      value={form.coverImageUrl}
                      onChange={(e) =>
                        setForm((f) => f && { ...f, coverImageUrl: e.target.value })
                      }
                      className="h-9 bg-white border-brand-primary/20 text-sm"
                      placeholder="https://… or leave empty"
                      type="url"
                    />
                  </div>
                </div>
              ) : null}

              {error ? <p className="text-xs text-red-600">{error}</p> : null}
              {success ? (
                <p className="text-xs text-brand-primary font-medium">Post saved.</p>
              ) : null}
            </div>

            <div className="shrink-0 flex items-center justify-end gap-2 px-4 py-3 border-t border-brand-primary/10 bg-white/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full text-brand-ink/60"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || !canSave}
                className="rounded-full bg-brand-primary hover:bg-brand-primary/90 px-6"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" aria-hidden />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
