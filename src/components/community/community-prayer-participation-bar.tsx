"use client";

import { HandHeart, Mic, Sparkles, Users } from "lucide-react";
import { prayerParticipationHints } from "@/lib/community/space-interaction";
import type { PrayerRoomComposerKind } from "@/lib/community/prayer-room-composer";
import { cn } from "@/lib/utils";

const HINT_ICONS: Record<PrayerRoomComposerKind, typeof HandHeart> = {
  prayer_request: HandHeart,
  praise_report: Sparkles,
  encouragement: Users,
  voice_prayer: Mic,
};

export function CommunityPrayerParticipationBar({
  onAction,
  allowVoice = true,
  className,
}: {
  onAction?: (kind: PrayerRoomComposerKind) => void;
  allowVoice?: boolean;
  className?: string;
}) {
  const hints = prayerParticipationHints().filter(
    (h) => h.kind !== "voice_prayer" || allowVoice,
  );

  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      aria-label="Ways to participate in prayer"
    >
      {hints.map(({ label, kind }) => {
        const Icon = HINT_ICONS[kind] ?? HandHeart;
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onAction?.(kind)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2",
              "text-xs font-medium text-brand-ink/72",
              "bg-white/60 ring-1 ring-black/[0.05]",
              "hover:bg-white hover:text-brand-ink hover:ring-brand-primary/15",
              "active:scale-[0.98] touch-manipulation",
              "transition-[transform,background-color] duration-75",
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
