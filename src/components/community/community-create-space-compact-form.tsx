"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  createCommunitySpaceAction,
} from "@/app/(storefront)/community/space-actions";
import type { CreateCommunitySpaceResult } from "@/lib/community/create-community-space-core";
import { CommunityPostCoverUpload } from "@/components/community/community-post-cover-upload";
import { COMMUNITY_SPACE_ICONS, DEFAULT_COMMUNITY_ICON } from "@/lib/community/constants";
import { buildCompactSpaceCreatePayload } from "@/lib/community/compact-space-create-payload";
import type { CommunitySpaceIcon } from "@/lib/community/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CommunitySpaceIcon as SpaceIconGlyph } from "./community-space-icon";
import { cn } from "@/lib/utils";

export type CompactSpaceCreateSuccess = Extract<CreateCommunitySpaceResult, { ok: true }>;

const CLIENT_MARKER = "mh-create-v3";

function logClient(phase: string, detail?: Record<string, unknown>) {
  console.log("[MH create-space client]", { phase, marker: CLIENT_MARKER, ...detail });
}

export function CommunityCreateSpaceCompactForm({
  autoFocus = true,
  onCreated,
}: {
  autoFocus?: boolean;
  /** Called only after the server action succeeds — parent navigates to the space. */
  onCreated: (result: CompactSpaceCreateSuccess) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<CommunitySpaceIcon>(DEFAULT_COMMUNITY_ICON);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [buildLabel, setBuildLabel] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const titleId = "mh-create-space-title";

  useEffect(() => {
    const envSha = process.env.NEXT_PUBLIC_MISSION_HUB_BUILD_SHA?.slice(0, 7);
    if (envSha) {
      setBuildLabel(`${CLIENT_MARKER}@${envSha}`);
      return;
    }
    void fetch("/api/mission-hub/build-info", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { label?: string; sha?: string }) => {
        setBuildLabel(`${CLIENT_MARKER}@${data.sha ?? data.label ?? "?"}`);
      })
      .catch(() => {
        setBuildLabel(CLIENT_MARKER);
      });
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError("Enter a space name.");
      return;
    }

    const payload = buildCompactSpaceCreatePayload({
      title,
      description,
      icon,
      coverImageUrl,
    });

    logClient("submit_started", {
      title: payload.title,
      slug: payload.slug,
      status: payload.status,
      notificationCategory: payload.notificationCategory,
    });

    startTransition(async () => {
      try {
        const res = await createCommunitySpaceAction(payload);
        logClient("server_action_returned", { ok: res.ok, requestId: res.requestId, res });

        try {
          sessionStorage.setItem(
            "mh:last-create-space",
            JSON.stringify({ at: new Date().toISOString(), res }),
          );
        } catch {
          /* ignore storage errors */
        }

        if (!res.ok) {
          setError(res.error);
          return;
        }

        const message = res.existing
          ? `"${res.title}" already exists. Opening it now… (ref ${res.requestId})`
          : `"${res.title}" created! Opening your new space… (ref ${res.requestId})`;
        setSuccess(message);
        logClient("success_navigate", { slug: res.slug, requestId: res.requestId });
        onCreated(res);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not create space.";
        logClient("client_exception", { message: msg });
        setError(`${msg} — try again or use Admin → Community.`);
        console.error("[CommunityCreateSpaceCompactForm]", e);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 pb-1">
      {buildLabel ? (
        <p className="text-[10px] text-brand-ink/35 font-mono" aria-hidden>
          Create space · {buildLabel}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor={titleId} className="text-xs text-brand-ink/65">
          Space name
        </Label>
        <Input
          id={titleId}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Prayer & Praise Room"
          disabled={isPending || Boolean(success)}
          autoFocus={autoFocus}
          enterKeyHint="next"
          className="h-10 rounded-xl border-black/[0.08] bg-white text-[15px] scroll-mt-3"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-brand-ink/65">Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this space for?"
          rows={3}
          disabled={isPending || Boolean(success)}
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
                disabled={isPending || Boolean(success)}
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

      {error ? (
        <p className="text-xs text-red-600 font-medium" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="text-xs text-emerald-700 font-medium" role="status">
          {success}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isPending || !title.trim() || Boolean(success)}
        className="w-full rounded-full min-h-[2.75rem] bg-brand-primary hover:bg-brand-primary"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" aria-hidden />
            Creating…
          </>
        ) : success ? (
          "Opening space…"
        ) : (
          "Create space"
        )}
      </Button>
    </form>
  );
}
