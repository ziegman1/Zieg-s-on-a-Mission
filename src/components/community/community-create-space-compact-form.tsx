"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createCommunitySpaceAction } from "@/app/admin/community/actions";
import { CommunityPostCoverUpload } from "@/components/community/community-post-cover-upload";
import { COMMUNITY_SPACE_ICONS, DEFAULT_COMMUNITY_ICON } from "@/lib/community/constants";
import { DEFAULT_SPACE_NOTIFICATION_CATEGORY } from "@/lib/community/space-notification-category";
import { slugifyCommunityTitle } from "@/lib/community/slug";
import type { CommunitySpaceFormInput } from "@/lib/community/space-form";
import type { CommunitySpaceIcon } from "@/lib/community/types";
import { defaultAllowVoiceMessagesForSpace } from "@/lib/community/voice-prayer";
import type { CommunitySpaceType } from "@/lib/community/space-experience";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CommunitySpaceIcon as SpaceIconGlyph } from "./community-space-icon";
import { cn } from "@/lib/utils";

function iconToSpaceType(icon: CommunitySpaceIcon): CommunitySpaceType {
  if (icon === "prayer") return "prayer";
  if (icon === "praise") return "praise_room";
  return "standard";
}

function buildPayload(
  title: string,
  description: string,
  icon: CommunitySpaceIcon,
  coverImageUrl: string,
): CommunitySpaceFormInput {
  const slug = slugifyCommunityTitle(title);
  const spaceType = iconToSpaceType(icon);
  return {
    title: title.trim(),
    slug,
    description: description.trim() || undefined,
    icon,
    status: "published",
    sortOrder: 0,
    coverImageUrl: coverImageUrl.trim() || undefined,
    spaceType,
    themeMood: "",
    welcomeMessage: "",
    engagementPrompt: "",
    allowComments: true,
    allowReactions: true,
    allowMemberPosts: false,
    requirePostApproval: false,
    allowVoiceMessages: defaultAllowVoiceMessagesForSpace(spaceType, slug),
    showWelcomeMessage: true,
    pinWelcomeMessage: true,
    notificationCategory: DEFAULT_SPACE_NOTIFICATION_CATEGORY,
  };
}

export function CommunityCreateSpaceCompactForm({
  autoFocus = true,
  onCreated,
}: {
  autoFocus?: boolean;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<CommunitySpaceIcon>(DEFAULT_COMMUNITY_ICON);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const titleId = "mh-create-space-title";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Enter a space name.");
      return;
    }
    const payload = buildPayload(title, description, icon, coverImageUrl);
    startTransition(async () => {
      const res = await createCommunitySpaceAction(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onCreated();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="space-y-1.5">
        <Label htmlFor={titleId} className="text-xs text-brand-ink/65">
          Space name
        </Label>
        <Input
          id={titleId}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Prayer & Praise Room"
          disabled={isPending}
          autoFocus={autoFocus}
          className="h-10 rounded-xl border-black/[0.08] bg-white text-[15px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-brand-ink/65">Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this space for?"
          rows={3}
          disabled={isPending}
          className="resize-none rounded-xl border-black/[0.08] bg-white text-[14px] leading-relaxed"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-brand-ink/65">Icon</Label>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Space icon">
          {COMMUNITY_SPACE_ICONS.map(({ value, label }) => {
            const active = icon === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                title={label}
                disabled={isPending}
                onClick={() => setIcon(value)}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                  active
                    ? "bg-brand-primary/12 text-brand-primary ring-2 ring-brand-primary/35"
                    : "bg-white text-brand-ink/55 ring-1 ring-black/[0.06] hover:ring-brand-primary/20",
                )}
              >
                <SpaceIconGlyph icon={value} className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

      <CommunityPostCoverUpload
        value={coverImageUrl}
        onChange={setCoverImageUrl}
        variant="light"
        compact
        label="Cover image (optional)"
      />

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <Button
        type="submit"
        disabled={isPending || !title.trim()}
        className="w-full rounded-full min-h-[2.75rem] bg-brand-primary hover:bg-brand-primary"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" aria-hidden />
            Creating…
          </>
        ) : (
          "Create space"
        )}
      </Button>
    </form>
  );
}
