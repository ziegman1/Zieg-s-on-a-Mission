"use client";

import { HandHeart, Mic, Sparkles, Users } from "lucide-react";
import { prayerParticipationHints } from "@/lib/community/space-interaction";
import type { CommunityPostType } from "@/lib/community/types";
import { cn } from "@/lib/utils";

const HINT_ICONS: Record<string, typeof HandHeart> = {
  "Pray With Us": HandHeart,
  "Leave Encouragement": Users,
  "Share Testimony": Sparkles,
  "Send Voice Prayer": Mic,
};

export function CommunityPrayerParticipationBar({
  onAction,
  className,
}: {
  onAction?: (postType: CommunityPostType) => void;
  className?: string;
}) {
  const hints = prayerParticipationHints();

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2",
        className,
      )}
      aria-label="Ways to participate in prayer"
    >
      {hints.map(({ label, postType }) => {
        const Icon = HINT_ICONS[label] ?? HandHeart;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onAction?.(postType)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2",
              "text-xs font-medium text-brand-ink/72",
              "bg-white/60 ring-1 ring-black/[0.05]",
              "hover:bg-white hover:text-brand-ink hover:ring-brand-primary/15 transition-colors",
            )}
          >
            <Icon className="h-3.5 w-3.5 text-brand-primary/80" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
