"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { CommunityReactionType } from "@/lib/community/types";
import {
  DEFAULT_STANDARD_REACTION,
  REACTION_EMOJI,
  REACTION_HOLD_TIP_KEY,
  REACTION_LABEL,
  STANDARD_REACTION_TRAY_TYPES,
} from "@/lib/community/reaction-display";
import { cn } from "@/lib/utils";

const LONG_PRESS_MS = 420;
const MOVE_CANCEL_PX = 12;

export function CommunityReactionPicker({
  activeReaction,
  disabled,
  onSelect,
}: {
  activeReaction: CommunityReactionType | null;
  disabled?: boolean;
  onSelect: (type: CommunityReactionType) => void;
}) {
  const tipId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressTapRef = useRef(false);
  const longPressRef = useRef(false);

  const [trayOpen, setTrayOpen] = useState(false);
  const [trayHover, setTrayHover] = useState<CommunityReactionType | null>(null);
  const [tipVisible, setTipVisible] = useState(false);

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const closeTray = useCallback(() => {
    setTrayOpen(false);
    setTrayHover(null);
    longPressRef.current = false;
  }, []);

  const showHoldTip = useCallback(() => {
    try {
      if (localStorage.getItem(REACTION_HOLD_TIP_KEY) === "true") return;
      localStorage.setItem(REACTION_HOLD_TIP_KEY, "true");
    } catch {
      return;
    }
    setTipVisible(true);
    window.setTimeout(() => setTipVisible(false), 2000);
  }, []);

  const commitReaction = useCallback(
    (type: CommunityReactionType) => {
      closeTray();
      onSelect(type);
    },
    [closeTray, onSelect],
  );

  const handleTap = useCallback(() => {
    showHoldTip();
    commitReaction(DEFAULT_STANDARD_REACTION);
  }, [commitReaction, showHoldTip]);

  const openTray = useCallback(() => {
    suppressTapRef.current = true;
    longPressRef.current = true;
    setTrayOpen(true);
    setTrayHover(null);
  }, []);

  const resolveTrayTarget = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    const btn = el?.closest<HTMLButtonElement>("[data-reaction-tray-type]");
    const type = btn?.dataset.reactionTrayType;
    if (
      type &&
      (STANDARD_REACTION_TRAY_TYPES as readonly string[]).includes(type)
    ) {
      return type as CommunityReactionType;
    }
    return null;
  }, []);

  useEffect(() => {
    if (!trayOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current?.contains(e.target as Node)) return;
      closeTray();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeTray();
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [trayOpen, closeTray]);

  const pillClass = cn(
    "inline-flex items-center gap-1.5 rounded-full min-h-[2.25rem] px-3",
    "text-xs font-medium border transition-all duration-150 ease-out",
    "select-none [-webkit-touch-callout:none] touch-manipulation",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35",
    "active:scale-[0.97]",
    disabled && "opacity-55 pointer-events-none",
  );

  const label = activeReaction ? REACTION_LABEL[activeReaction] : "React";
  const emoji = activeReaction ? REACTION_EMOJI[activeReaction] : null;

  return (
    <div ref={rootRef} className="relative inline-flex shrink-0">
      {tipVisible ? (
        <p
          id={tipId}
          role="status"
          className={cn(
            "pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-0 z-[56]",
            "whitespace-nowrap rounded-lg bg-brand-ink/90 px-2.5 py-1.5",
            "text-[11px] font-medium text-white shadow-[0_4px_16px_rgba(30,54,68,0.18)]",
            "animate-in fade-in slide-in-from-bottom-1 duration-200",
          )}
        >
          Hold to choose other reactions
        </p>
      ) : null}

      {trayOpen ? (
        <div
          role="toolbar"
          aria-label="Choose a reaction"
          className={cn(
            "absolute bottom-[calc(100%+0.35rem)] left-0 z-[56]",
            "flex items-center gap-0.5 rounded-full px-1.5 py-1",
            "bg-white/95 border border-black/[0.06]",
            "shadow-[0_8px_28px_rgba(30,54,68,0.14)] backdrop-blur-md",
            "animate-in fade-in zoom-in-95 duration-200 ease-out",
          )}
          onPointerMove={(e) => {
            if (e.pointerType === "mouse" && e.buttons === 0) return;
            setTrayHover(resolveTrayTarget(e.clientX, e.clientY));
          }}
          onPointerUp={(e) => {
            const type = trayHover ?? resolveTrayTarget(e.clientX, e.clientY);
            if (type) commitReaction(type);
            else closeTray();
          }}
          onPointerLeave={() => setTrayHover(null)}
        >
          {STANDARD_REACTION_TRAY_TYPES.map((type) => {
            const selected = trayHover === type;
            return (
              <button
                key={type}
                type="button"
                data-reaction-tray-type={type}
                aria-label={REACTION_LABEL[type]}
                onClick={() => commitReaction(type)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  "text-[1.35rem] leading-none transition-transform duration-150 ease-out",
                  "hover:bg-brand-primary/8 active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30",
                  selected && "scale-[1.18] bg-brand-primary/10",
                )}
              >
                <span aria-hidden>{REACTION_EMOJI[type]}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <button
        type="button"
        disabled={disabled}
        aria-label={activeReaction ? `${label} — tap to change, hold for more` : "React — tap to like, hold for more"}
        aria-describedby={tipVisible ? tipId : undefined}
        aria-haspopup={trayOpen}
        aria-expanded={trayOpen}
        className={cn(
          pillClass,
          activeReaction
            ? "bg-brand-primary text-white border-brand-primary shadow-sm"
            : "bg-white/80 text-brand-ink/70 border-black/[0.06] hover:bg-white hover:border-brand-primary/20 hover:text-brand-ink",
        )}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          if (disabled) return;
          suppressTapRef.current = false;
          longPressRef.current = false;
          pointerStartRef.current = { x: e.clientX, y: e.clientY };
          clearHoldTimer();
          holdTimerRef.current = setTimeout(() => openTray(), LONG_PRESS_MS);
        }}
        onPointerMove={(e) => {
          const start = pointerStartRef.current;
          if (!start || longPressRef.current) return;
          const dx = Math.abs(e.clientX - start.x);
          const dy = Math.abs(e.clientY - start.y);
          if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) clearHoldTimer();
        }}
        onPointerUp={() => {
          clearHoldTimer();
          if (suppressTapRef.current && longPressRef.current) return;
          if (!suppressTapRef.current) handleTap();
          pointerStartRef.current = null;
        }}
        onPointerCancel={() => {
          clearHoldTimer();
          pointerStartRef.current = null;
        }}
      >
        {emoji ? (
          <span className="text-[15px] leading-none" aria-hidden>
            {emoji}
          </span>
        ) : null}
        <span>{label}</span>
      </button>
    </div>
  );
}
