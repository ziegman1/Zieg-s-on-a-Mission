"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { loadHubMembersPanelAction } from "@/app/(storefront)/community/hub-admin-members-actions";
import type { AdminMemberPortalRow } from "@/lib/community/admin-members-portal-types";
import type { AdminMembersHubPreview } from "@/lib/community/admin-members-preview-types";
import type { CommunityOwner } from "@/lib/community/owner-types";
import { CommunityBottomSheet } from "./community-bottom-sheet";
import { CommunityMembersAdminPanel } from "./community-members-admin-panel";
import { MembersAvatarStack } from "./members-avatar-stack";
import { cn } from "@/lib/utils";

const DESKTOP_MQ = "(min-width: 1024px)";

export function CommunityTopbarMembersCluster({
  owner,
  preview,
}: {
  owner: CommunityOwner | null;
  preview: AdminMembersHubPreview | null;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [members, setMembers] = useState<AdminMemberPortalRow[] | null>(null);
  const [hubPreview, setHubPreview] = useState<AdminMembersHubPreview | null>(preview);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setHubPreview(preview);
  }, [preview]);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const loadPanel = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await loadHubMembersPanelAction();
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMembers(result.members);
    setHubPreview(result.preview);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (members !== null) return;
    void loadPanel();
  }, [open, members, loadPanel]);

  useEffect(() => {
    if (!open || isDesktop) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, isDesktop]);

  useEffect(() => {
    if (!open || !isDesktop) return;
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, isDesktop]);

  if (!owner || !hubPreview) return null;

  const panelPreview = hubPreview;
  const panelBody = (
    <CommunityMembersAdminPanel
      preview={panelPreview}
      members={members}
      loading={loading || pending}
      error={error}
    />
  );

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open && members === null) {
            startTransition(() => {
              void loadPanel();
            });
          }
        }}
        className={cn(
          "group relative inline-flex h-10 items-center justify-center rounded-full px-1",
          "hover:bg-brand-surface/80 transition-[transform,background-color] duration-150",
          "touch-manipulation active:scale-[0.97]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35",
          open && "bg-brand-primary/8",
        )}
        aria-label={`Members, ${panelPreview.totalMembers} active in Mission Hub`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <MembersAvatarStack
          members={panelPreview.avatars}
          totalCount={panelPreview.totalMembers}
        />
      </button>

      {open && isDesktop ? (
        <>
          <div
            className={cn(
              "absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))]",
              "rounded-2xl border border-black/[0.05] bg-white/98 backdrop-blur-xl",
              "shadow-[0_12px_40px_rgba(28,42,68,0.14)]",
              "overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200",
            )}
            role="dialog"
            aria-label="Mission Hub members"
          >
            <div className="border-b border-black/[0.06] px-4 py-3">
              <p className="font-serif text-base text-brand-ink tracking-wide">Members</p>
              <p className="text-[11px] text-brand-ink/50 mt-0.5">
                Your Mission Hub community
              </p>
            </div>
            <div className="px-4 py-3">{panelBody}</div>
          </div>
        </>
      ) : null}

      {!isDesktop ? (
        <CommunityBottomSheet
          open={open}
          onOpenChange={setOpen}
          title="Members"
          description="Mission Hub community"
        >
          {panelBody}
        </CommunityBottomSheet>
      ) : null}
    </div>
  );
}
