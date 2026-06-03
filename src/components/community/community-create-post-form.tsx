"use client";

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  HandHeart,
  Loader2,
  Mail,
  Megaphone,
  Mic,
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
import { canShowUrgentPrayerRequestOption } from "@/lib/community/urgent-prayer-metadata";
import { CommunityAvatar } from "@/components/community/community-avatar";
import { CommunityPostCoverUpload } from "@/components/community/community-post-cover-upload";
import { Button } from "@/components/ui/button";
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

type FormState = {
  spaceId: string;
  title: string;
  body: string;
  excerpt: string;
  postType: CommunityPostType;
  status: CommunityPostDbStatus;
  coverImageUrl: string;
  publishedAt: string;
  urgentPrayerRequest: boolean;
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
    urgentPrayerRequest: false,
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
    urgentPrayerRequest: form.urgentPrayerRequest || undefined,
  };
}

export function CommunityCreatePostForm({
  spaces,
  defaultSpaceId,
  defaultPostType,
  owner,
  autoFocus = true,
  onSuccess,
  onCancel,
  compactHeader = false,
}: {
  spaces: CommunityComposerSpace[];
  defaultSpaceId?: string;
  defaultPostType?: CommunityPostType;
  owner?: CommunityOwner | null;
  autoFocus?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  /** Mobile sheet: tighter header */
  compactHeader?: boolean;
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
  const bodyId = useId();

  const ownerLabel =
    owner?.name?.trim() || owner?.email?.split("@")[0] || "You";

  useEffect(() => {
    setForm(buildEmptyForm(spaces, defaultSpaceId, defaultPostType));
    setAdvancedOpen(false);
    setError(null);
  }, [spaces, defaultSpaceId, defaultPostType]);

  useEffect(() => {
    if (!autoFocus) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(bodyId) as HTMLTextAreaElement | null;
      if (!el) return;
      el.focus({ preventScroll: true });
      const len = el.value.length;
      el.setSelectionRange(len, len);
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [autoFocus, bodyId, form.spaceId, form.postType]);

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
      onSuccess();
      router.refresh();
    });
  }

  const canPost = publishedSpaces.length > 0 && form.body.trim().length > 0;

  const selectedSpace = publishedSpaces.find((s) => s.id === form.spaceId);
  const showUrgentPrayerOption =
    selectedSpace &&
    canShowUrgentPrayerRequestOption({
      spaceSlug: selectedSpace.slug,
      notificationCategory: selectedSpace.notificationCategory,
      postType: form.postType,
    });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
      {!compactHeader ? (
        <div className="flex items-center gap-3 px-0 sm:px-0 pb-2 border-b border-brand-primary/10">
          <CommunityAvatar name={ownerLabel} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-brand-ink truncate">{ownerLabel}</p>
            <p className="text-xs text-brand-ink/50">Sharing with your ministry family</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-brand-ink/55 pb-2">
          Sharing as <span className="font-medium text-brand-ink">{ownerLabel}</span>
        </p>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto py-2 space-y-2.5">
        {!lockSpace && publishedSpaces.length > 1 ? (
          <div className="flex flex-wrap gap-1.5">
            {publishedSpaces.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, spaceId: s.id }))}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors border",
                  form.spaceId === s.id
                    ? "bg-brand-primary text-white border-brand-primary"
                    : "bg-white text-brand-ink/75 border-brand-primary/20",
                )}
              >
                {s.title}
              </button>
            ))}
          </div>
        ) : lockSpace && publishedSpaces.length > 0 ? (
          <p className="text-[11px] text-brand-ink/50">
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

        <div
          className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5 mh-scrollbar-none"
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
                  "shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border",
                  active
                    ? "bg-brand-primary/12 text-brand-primary border-brand-primary/35"
                    : "bg-white/90 text-brand-ink/60 border-transparent",
                )}
              >
                <Icon className="h-3 w-3" aria-hidden />
                {label}
              </button>
            );
          })}
          <span
            className="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-brand-ink/35 border border-dashed border-black/[0.08]"
            title="Voice posts — coming soon"
          >
            <Mic className="h-3 w-3" aria-hidden />
            Voice
          </span>
        </div>

        <Textarea
          id={bodyId}
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          placeholder="What would you like to share?"
          rows={4}
          enterKeyHint="send"
          className={cn(
            "min-h-[5.5rem] resize-none border-0 bg-transparent text-[15px] leading-relaxed",
            "placeholder:text-brand-ink/40 focus-visible:ring-0 shadow-none px-0",
          )}
        />

        <CommunityPostCoverUpload
          value={form.coverImageUrl}
          onChange={(url) => setForm((f) => ({ ...f, coverImageUrl: url }))}
          variant="light"
          compact
        />

        {showUrgentPrayerOption ? (
          <label className="flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.urgentPrayerRequest}
              onChange={(e) =>
                setForm((f) => ({ ...f, urgentPrayerRequest: e.target.checked }))
              }
              className="mt-0.5 h-4 w-4 rounded border-amber-300 text-brand-primary focus:ring-brand-primary/30"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-brand-ink">
                Mark as urgent prayer request
              </span>
              <span className="block text-[11px] text-brand-ink/60 mt-0.5 leading-snug">
                Urgent prayer requests send a dedicated email notification to Mission Hub
                members, inviting them to pray and respond.
              </span>
            </span>
          </label>
        ) : null}

        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
            advancedOpen ? "bg-brand-surface text-brand-ink" : "text-brand-ink/55",
          )}
          aria-expanded={advancedOpen}
        >
          <Settings2 className="h-3 w-3" aria-hidden />
          More options
        </button>

        {advancedOpen ? (
          <div className="space-y-2.5 rounded-xl border border-brand-primary/15 bg-white/90 p-3">
            <div className="space-y-1">
              <Label className="text-xs text-brand-ink/70">Headline (optional)</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="h-9 bg-white border-brand-primary/20 text-sm"
                placeholder="Optional title"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-brand-ink/70">Feed preview (optional)</Label>
              <Textarea
                rows={2}
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                className="text-sm bg-white border-brand-primary/20 resize-none"
              />
            </div>
          </div>
        ) : null}

        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>

      <div className="shrink-0 flex items-center justify-end gap-2 pt-2 border-t border-brand-primary/10">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full text-brand-ink/60 h-8"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending || !canPost || publishedSpaces.length === 0}
          className="rounded-full bg-brand-primary hover:bg-brand-primary/90 px-5 h-9 text-sm font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" aria-hidden />
              Posting…
            </>
          ) : (
            "Post"
          )}
        </Button>
      </div>
    </form>
  );
}
