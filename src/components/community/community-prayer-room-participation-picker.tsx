"use client";

import { HandHeart, Mic, PenLine, Sparkles, Users } from "lucide-react";
import {
  PRAYER_ROOM_COMPOSER_PRESETS,
  type PrayerRoomComposerKind,
} from "@/lib/community/prayer-room-composer";
import { cn } from "@/lib/utils";

const TEXT_KINDS: PrayerRoomComposerKind[] = [
  "prayer_request",
  "praise_report",
  "encouragement",
];

const PICKER_ICONS: Record<PrayerRoomComposerKind, typeof HandHeart> = {
  prayer_request: HandHeart,
  praise_report: Sparkles,
  encouragement: Users,
  voice_prayer: Mic,
};

export function CommunityPrayerRoomParticipationPicker({
  allowVoice,
  onSelect,
  className,
}: {
  allowVoice: boolean;
  onSelect: (kind: PrayerRoomComposerKind) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4 pb-1", className)}>
      <p className="text-center text-[13px] text-brand-ink/52 leading-relaxed px-2">
        Choose how you&apos;d like to participate. Your words bless this community.
      </p>

      <div className="space-y-1.5">
        <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-brand-ink/38">
          Written
        </p>
        <ul className="space-y-1.5" role="list">
          {TEXT_KINDS.map((kind) => {
            const preset = PRAYER_ROOM_COMPOSER_PRESETS[kind];
            const Icon = PICKER_ICONS[kind];
            return (
              <li key={kind}>
                <button
                  type="button"
                  onClick={() => onSelect(kind)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left",
                    "bg-white ring-1 ring-black/[0.06]",
                    "hover:bg-brand-primary/[0.04] hover:ring-brand-primary/18",
                    "active:scale-[0.99] touch-manipulation transition-all duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      "bg-brand-primary/[0.08] text-brand-primary",
                    )}
                    aria-hidden
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium text-brand-ink/90 leading-snug">
                      {preset.choiceLabel}
                    </span>
                  </span>
                  <PenLine className="h-3.5 w-3.5 shrink-0 text-brand-ink/28" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {allowVoice ? (
        <div className="space-y-1.5 pt-0.5">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-brand-ink/38">
            Voice
          </p>
          <button
            type="button"
            onClick={() => onSelect("voice_prayer")}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl px-3.5 py-3.5 text-left",
              "bg-brand-primary/[0.06] ring-1 ring-brand-primary/16",
              "hover:bg-brand-primary/10 active:scale-[0.99] touch-manipulation transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35",
            )}
          >
            <span
              className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                "bg-brand-primary/15 text-brand-primary",
              )}
              aria-hidden
            >
              <Mic className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-medium text-brand-ink/90">
                {PRAYER_ROOM_COMPOSER_PRESETS.voice_prayer.choiceLabel}
              </span>
              <span className="mt-0.5 block text-[12px] text-brand-ink/50">
                Tap to record — we&apos;ll open the mic right away
              </span>
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
