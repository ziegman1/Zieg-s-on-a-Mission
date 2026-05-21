"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  HandHeart,
  ImagePlus,
  Loader2,
  Mail,
  Megaphone,
  Settings2,
  Sparkles,
} from "lucide-react";
import { createCommunityPostAction } from "@/app/admin/community/post-actions";
import type { CommunityPostFormInput } from "@/lib/community/post-form";
import {
  autoExcerptFromBody,
  COMMUNITY_POST_STATUSES,
  COMPOSER_QUICK_POST_TYPES,
  DEFAULT_COMMUNITY_POST_TYPE,
  nowDatetimeLocalValue,
} from "@/lib/community/post-constants";
import {
  publishedComposerSpaces,
  resolveComposerSpaceId,
  type CommunityComposerSpace,
} from "@/lib/community/composer-types";
import type { CommunityOwner } from "@/lib/community/owner-types";
import type { CommunityPostDbStatus, CommunityPostType } from "@/lib/community/types";
import { CommunityAvatar } from "@/components/community/community-avatar";
import { CommunityPostCoverUpload } from "@/components/community/community-post-cover-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const QUICK_TYPE_ICONS: Partial<
  Record<CommunityPostType, typeof Megaphone>
> = {
  update: Megaphone,
  prayer: HandHeart,
  praise: Sparkles,
  newsletter: Mail,
  resource: BookOpen,
  event: Calendar,
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

function buildEmptyForm(
  spaces: CommunityComposerSpace[],
  defaultSpaceId?: string,
  defaultPostType?: CommunityPostType,
): FormState {
  return {
    spaceId: resolveComposerSpaceId(spaces, defaultSpaceId),
    title: "",
    body: "",
    excerpt: "",
    postType: defaultPostType ?? DEFAULT_COMMUNITY_POST_TYPE,
    status: "published",
    coverImageUrl: "",
    publishedAt: nowDatetimeLocalValue(),
  };
}

function buildPayload(form: FormState): CommunityPostFormInput {
  const excerpt =
    form.excerpt.trim() || autoExcerptFromBody(form.body) || undefined;
  return {
    spaceId: form.spaceId,
    title: form.title.trim() || undefined,
    body: form.body.trim(),
    excerpt,
    postType: form.postType,
    status: form.status,
    coverImageUrl: form.coverImageUrl.trim() || undefined,
    publishedAt: form.status === "published" ? form.publishedAt : undefined,
  };
}

export function CommunityCreatePostDialog({
  open,
  onOpenChange,
  spaces,
  defaultSpaceId,
  defaultPostType,
  owner,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaces: CommunityComposerSpace[];
  defaultSpaceId?: string;
  defaultPostType?: CommunityPostType;
  owner?: CommunityOwner | null;
}) {
  const router = useRouter();
  const lockSpace = Boolean(defaultSpaceId);
  const publishedSpaces = useMemo(() => publishedComposerSpaces(spaces), [spaces]);
  const [form, setForm] = useState(() =>
    buildEmptyForm(spaces, defaultSpaceId, defaultPostType),
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ownerLabel =
    owner?.name?.trim() || owner?.email?.split("@")[0] || "You";

  useEffect(() => {
    if (open) {
      setForm(buildEmptyForm(spaces, defaultSpaceId, defaultPostType));
      setAdvancedOpen(false);
      setError(null);
    }
  }, [open, spaces, defaultSpaceId, defaultPostType]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setError(null);
      setAdvancedOpen(false);
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.spaceId) {
      setError("Choose a published space for this post.");
      return;
    }
    if (!form.body.trim()) {
      setError("Write something to share first.");
      return;
    }
    setError(null);
    const payload = buildPayload(form);
    startTransition(async () => {
      const res = await createCommunityPostAction(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      handleOpenChange(false);
      router.refresh();
    });
  }

  const canPost = publishedSpaces.length > 0 && form.body.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex flex-col gap-0 p-0 overflow-hidden",
          "sm:max-w-lg max-h-[min(92dvh,40rem)]",
          "rounded-t-3xl sm:rounded-2xl border-brand-primary/15 bg-[#faf8f6]",
          "fixed bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0",
          "sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:bottom-auto",
          "w-full max-w-none sm:max-w-lg",
        )}
      >
        <DialogTitle className="sr-only">Create post</DialogTitle>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          {/* Header — owner identity */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-2 border-b border-brand-primary/10">
            <CommunityAvatar name={ownerLabel} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-ink truncate">{ownerLabel}</p>
              <p className="text-xs text-brand-ink/50">Sharing with your ministry family</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* Space — hub only */}
            {!lockSpace && publishedSpaces.length > 1 ? (
              <div className="flex flex-wrap gap-1.5">
                {publishedSpaces.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, spaceId: s.id }))}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                      form.spaceId === s.id
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-white text-brand-ink/75 border-brand-primary/20 hover:border-brand-primary/40",
                    )}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            ) : !lockSpace && publishedSpaces.length === 1 ? (
              <p className="text-xs text-brand-ink/55">
                Posting to <span className="font-medium text-brand-primary">{publishedSpaces[0].title}</span>
              </p>
            ) : lockSpace && publishedSpaces.length > 0 ? (
              <p className="text-xs text-brand-ink/55">
                Posting to{" "}
                <span className="font-medium text-brand-primary">
                  {publishedSpaces.find((s) => s.id === form.spaceId)?.title ?? "this space"}
                </span>
              </p>
            ) : null}

            {publishedSpaces.length === 0 ? (
              <p className="text-sm text-brand-ink/65 rounded-xl bg-amber-50 border border-amber-200/80 px-3 py-2">
                Publish a space first, then you can share a post here.
              </p>
            ) : null}

            {/* Post type pills */}
            <div
              className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-thin"
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
                    onClick={() => setForm((f) => ({ ...f, postType: value }))}
                    aria-pressed={active}
                    className={cn(
                      "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border",
                      active
                        ? "bg-brand-primary/12 text-brand-primary border-brand-primary/35"
                        : "bg-white/90 text-brand-ink/60 border-transparent hover:bg-white hover:text-brand-ink",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Primary composer */}
            <Textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="What would you like to share?"
              rows={5}
              className={cn(
                "min-h-[7.5rem] resize-none border-0 bg-transparent text-base leading-relaxed",
                "placeholder:text-brand-ink/40 focus-visible:ring-0 shadow-none px-0",
              )}
              autoFocus
            />

            <CommunityPostCoverUpload
              value={form.coverImageUrl}
              onChange={(url) => setForm((f) => ({ ...f, coverImageUrl: url }))}
              variant="light"
              compact
            />

            {/* Secondary actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  advancedOpen
                    ? "bg-brand-surface text-brand-ink"
                    : "text-brand-ink/55 hover:text-brand-ink hover:bg-white/80",
                )}
                aria-expanded={advancedOpen}
              >
                <Settings2 className="h-3.5 w-3.5" aria-hidden />
                More options
              </button>
            </div>

            {advancedOpen ? (
              <div className="space-y-3 rounded-xl border border-brand-primary/15 bg-white/90 p-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-brand-ink/70">Headline (optional)</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="h-9 bg-white border-brand-primary/20 text-sm"
                    placeholder="Optional title"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-brand-ink/70">Feed preview text (optional)</Label>
                  <Textarea
                    rows={2}
                    value={form.excerpt}
                    onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                    className="text-sm bg-white border-brand-primary/20 resize-none"
                    placeholder="Leave blank to use the start of your post"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-brand-ink/70">Status</Label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          status: e.target.value as CommunityPostDbStatus,
                        }))
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
                  {form.status === "published" ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-brand-ink/70">Published</Label>
                      <Input
                        type="datetime-local"
                        value={form.publishedAt}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, publishedAt: e.target.value }))
                        }
                        className="h-9 bg-white border-brand-primary/20 text-sm"
                      />
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-brand-ink/70">Cover image URL</Label>
                  <Input
                    value={form.coverImageUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, coverImageUrl: e.target.value }))
                    }
                    className="h-9 bg-white border-brand-primary/20 text-sm"
                    placeholder="https://…"
                    type="url"
                  />
                </div>
              </div>
            ) : null}

            {error ? <p className="text-xs text-red-600">{error}</p> : null}
          </div>

          {/* Footer — Post CTA */}
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
              disabled={isPending || !canPost || publishedSpaces.length === 0}
              className="rounded-full bg-brand-primary hover:bg-brand-primary/90 px-6 min-w-[5.5rem]"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" aria-hidden />
                  Posting…
                </>
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
