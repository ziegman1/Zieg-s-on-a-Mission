"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { saveSpaceSettingsAction } from "@/app/(storefront)/community/settings-actions";
import { CommunitySpaceExperienceForm } from "@/components/community/community-space-experience-form";
import type { AdminSpaceSettingsRow } from "@/lib/community/settings-types";
import {
  spaceFormToPayload,
  type SpaceFormState,
} from "@/lib/community/space-form-state";
import { parseSpaceIcon, parseSpaceType, parseThemeMood } from "@/lib/community/space-experience";
import { hydrateAllowVoiceMessages } from "@/lib/community/voice-prayer";
import { sortSpacesByDisplayOrder } from "@/lib/community/space-order";
import type { CommunitySpaceDbStatus } from "@/lib/community/types";
import { COMMUNITY_SPACE_STATUSES } from "@/lib/community/constants";
import {
  SettingsPanel,
  SettingsSaveButton,
  SettingsToggleRow,
} from "./settings-ui";
import { SettingsSpacesOrderSection } from "./settings-spaces-order-section";
import { cn } from "@/lib/utils";

function sortAdminSpaces(spaces: AdminSpaceSettingsRow[]): AdminSpaceSettingsRow[] {
  return sortSpacesByDisplayOrder(spaces);
}

function adminRowToForm(space: AdminSpaceSettingsRow): SpaceFormState {
  const status = COMMUNITY_SPACE_STATUSES.includes(space.status as CommunitySpaceDbStatus)
    ? (space.status as CommunitySpaceDbStatus)
    : "draft";
  return {
    title: space.title,
    slug: space.slug,
    description: space.description,
    icon: parseSpaceIcon(space.icon),
    status,
    sortOrder: space.sortOrder,
    coverImageUrl: space.coverImageUrl ?? "",
    spaceType: parseSpaceType(space.spaceType, space.slug),
    themeMood: parseThemeMood(space.themeMood) ?? "",
    welcomeMessage: space.welcomeMessage ?? "",
    engagementPrompt: space.engagementPrompt ?? "",
    allowComments: space.allowComments,
    allowReactions: space.allowReactions,
    allowMemberPosts: space.allowMemberPosts,
    requirePostApproval: space.requirePostApproval,
    allowVoiceMessages: hydrateAllowVoiceMessages({
      spaceType: space.spaceType,
      slug: space.slug,
      allowVoiceMessages: space.allowVoiceMessages,
      settings: space.settings,
    }),
    showWelcomeMessage: space.showWelcomeMessage,
    pinWelcomeMessage: space.pinWelcomeMessage,
  };
}

function SpaceEditor({
  space,
  onSaved,
}: {
  space: AdminSpaceSettingsRow;
  onSaved?: (patch: Partial<AdminSpaceSettingsRow>) => void;
}) {
  const [form, setForm] = useState<SpaceFormState>(() => adminRowToForm(space));
  const [featured, setFeatured] = useState(space.featured);
  const [slugTouched] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setForm(adminRowToForm(space));
    setFeatured(space.featured);
    setError(null);
    setSuccess(false);
  }, [space]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const payload = spaceFormToPayload(form);
    startTransition(async () => {
      const res = await saveSpaceSettingsAction(space.id, {
        ...payload,
        featured,
        settings: {
          ...space.settings,
          allowVoiceMessages: payload.allowVoiceMessages,
        },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(true);
      onSaved?.({
        ...payload,
        featured,
        settings: {
          ...space.settings,
          allowVoiceMessages: payload.allowVoiceMessages,
        },
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-black/[0.04]">
        <h3 className="text-sm font-semibold text-brand-ink">
          Editing: <span className="font-serif font-normal tracking-wide">{space.title}</span>
        </h3>
        <span
          className={cn(
            "text-[11px] font-medium capitalize px-2 py-0.5 rounded-full",
            space.status === "published"
              ? "bg-emerald-500/10 text-emerald-800/80"
              : space.status === "draft"
                ? "bg-amber-500/10 text-amber-900/70"
                : "bg-black/[0.06] text-brand-ink/50",
          )}
        >
          {space.status}
        </span>
        <span className="text-xs text-brand-ink/40 font-mono">/{space.slug}</span>
      </div>
      <CommunitySpaceExperienceForm
        form={form}
        setForm={setForm}
        onTitleChange={(title) => setForm((f) => ({ ...f, title }))}
        slugTouched={slugTouched}
        setSlugTouched={() => {}}
        variant="light"
      />
      <div className="space-y-3 border-t border-black/[0.04] pt-4">
        <SettingsToggleRow
          label="Featured space"
          checked={featured}
          onChange={setFeatured}
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? (
        <p className="text-sm text-brand-primary font-medium">Changes saved.</p>
      ) : null}
      <SettingsSaveButton pending={pending} />
    </form>
  );
}

export function SettingsSpacesPanel({ spaces: spacesProp }: { spaces: AdminSpaceSettingsRow[] }) {
  const [spaces, setSpaces] = useState(spacesProp);
  useEffect(() => {
    setSpaces(spacesProp);
  }, [spacesProp]);

  const sortedSpaces = useMemo(() => sortAdminSpaces(spaces), [spaces]);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => sortedSpaces[0]?.id ?? null,
  );

  const selectedSpace = useMemo(
    () => sortedSpaces.find((s) => s.id === selectedId) ?? sortedSpaces[0] ?? null,
    [sortedSpaces, selectedId],
  );

  useEffect(() => {
    if (selectedId && sortedSpaces.some((s) => s.id === selectedId)) return;
    setSelectedId(sortedSpaces[0]?.id ?? null);
  }, [sortedSpaces, selectedId]);

  if (spaces.length === 0) {
    return (
      <SettingsPanel title="Spaces" description="No spaces yet.">
        <p className="text-sm text-brand-ink/55">Create a space from the admin dashboard.</p>
      </SettingsPanel>
    );
  }

  return (
    <SettingsPanel
      title="Spaces"
      description="Shape each room’s welcome message, engagement tone, and participation rules."
    >
      <SettingsSpacesOrderSection spaces={spaces} />

      <div className="space-y-3 pt-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary/80">
            Select room to edit
          </p>
          <p className="mt-1 text-xs text-brand-ink/50">
            Choose one room below. Its settings appear underneath.
          </p>
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Rooms to edit"
        >
          {sortedSpaces.map((space) => {
            const selected = selectedSpace?.id === space.id;
            return (
              <button
                key={space.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setSelectedId(space.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35",
                  selected
                    ? "bg-brand-ink text-white border-brand-ink shadow-sm"
                    : "bg-white/70 text-brand-ink/75 border-black/[0.08] hover:bg-white hover:text-brand-ink hover:border-black/[0.12]",
                )}
              >
                <span className="truncate max-w-[12rem] sm:max-w-[16rem]">{space.title}</span>
                {space.status !== "published" ? (
                  <span
                    className={cn(
                      "text-[10px] capitalize shrink-0",
                      selected ? "text-white/70" : "text-brand-ink/40",
                    )}
                  >
                    {space.status}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {selectedSpace ? (
        <div className="rounded-lg border border-black/[0.06] bg-white/50 px-4 sm:px-5 py-4 sm:py-5">
          <SpaceEditor
            key={selectedSpace.id}
            space={selectedSpace}
            onSaved={(patch) => {
              setSpaces((prev) =>
                prev.map((s) => (s.id === selectedSpace.id ? { ...s, ...patch } : s)),
              );
            }}
          />
        </div>
      ) : null}

      <p className="text-xs text-brand-ink/45">
        Create or archive spaces in{" "}
        <a href="/admin/community" className="text-brand-primary hover:underline">
          admin dashboard
        </a>
        .
      </p>
    </SettingsPanel>
  );
}
