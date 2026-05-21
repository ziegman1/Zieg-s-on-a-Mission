"use client";

import type { SpaceFormState } from "@/lib/community/space-form-state";
import {
  COMMUNITY_SPACE_TYPES,
  COMMUNITY_THEME_MOODS,
} from "@/lib/community/space-experience";
import {
  isPrayerSpace,
  resolveInteractionSpaceType,
} from "@/lib/community/space-interaction";
import { defaultAllowVoiceMessagesForSpace } from "@/lib/community/voice-prayer";
import { COMMUNITY_SPACE_ICONS, COMMUNITY_SPACE_STATUSES } from "@/lib/community/constants";
import type { CommunitySpaceDbStatus } from "@/lib/community/types";
import { CommunityPostCoverUpload } from "./community-post-cover-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="pt-2 border-t border-black/[0.06] first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary/80">
        {title}
      </p>
      {description ? (
        <p className="mt-1 text-xs text-brand-ink/50 leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  fieldClass,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  fieldClass?: string;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer",
        fieldClass ?? "border-brand-primary/15 bg-white/60",
        disabled && "opacity-60 cursor-not-allowed",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 rounded border-brand-primary/30"
      />
      <span className="min-w-0">
        <span className="text-sm font-medium text-brand-ink">{label}</span>
        {description ? (
          <span className="block text-xs text-brand-ink/50 mt-0.5">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

export function CommunitySpaceExperienceForm({
  form,
  setForm,
  onTitleChange,
  slugTouched,
  setSlugTouched,
  variant = "light",
  showStatus = true,
  showSortOrder = true,
}: {
  form: SpaceFormState;
  setForm: React.Dispatch<React.SetStateAction<SpaceFormState>>;
  onTitleChange: (title: string) => void;
  slugTouched: boolean;
  setSlugTouched: (v: boolean) => void;
  variant?: "light" | "dark";
  showStatus?: boolean;
  showSortOrder?: boolean;
}) {
  const isLight = variant === "light";
  const isPrayerRoom = isPrayerSpace(
    resolveInteractionSpaceType(form.spaceType, form.slug),
  );
  const fieldClass = isLight
    ? "bg-white border-brand-primary/20 text-brand-ink focus-visible:ring-brand-primary/30"
    : "bg-zinc-800 border-zinc-600 text-cream";
  const selectClass = cn(
    "w-full h-10 rounded-md border px-3 text-sm",
    fieldClass,
  );

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Basic info"
        description="Name, look, and type of this ministry environment."
      />
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className={isLight ? "text-xs text-brand-ink/70" : "text-zinc-300"}>
            Space name
          </Label>
          <Input
            value={form.title}
            onChange={(e) => onTitleChange(e.target.value)}
            required
            className={fieldClass}
          />
        </div>
        <div className="space-y-1.5">
          <Label className={isLight ? "text-xs text-brand-ink/70" : "text-zinc-300"}>
            URL slug
          </Label>
          <Input
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setForm((f) => ({ ...f, slug: e.target.value }));
            }}
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className={cn(fieldClass, "font-mono text-sm")}
          />
        </div>
        <div className="space-y-1.5">
          <Label className={isLight ? "text-xs text-brand-ink/70" : "text-zinc-300"}>
            Description
          </Label>
          <Textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={fieldClass}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className={isLight ? "text-xs text-brand-ink/70" : "text-zinc-300"}>Icon</Label>
            <select
              value={form.icon}
              onChange={(e) =>
                setForm((f) => ({ ...f, icon: e.target.value as SpaceFormState["icon"] }))
              }
              className={selectClass}
            >
              {COMMUNITY_SPACE_ICONS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>
          {showStatus ? (
            <div className="space-y-1.5">
              <Label className={isLight ? "text-xs text-brand-ink/70" : "text-zinc-300"}>
                Status
              </Label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as CommunitySpaceDbStatus,
                  }))
                }
                className={selectClass}
              >
                {COMMUNITY_SPACE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        <CommunityPostCoverUpload
          label="Cover image"
          value={form.coverImageUrl}
          onChange={(url) => setForm((f) => ({ ...f, coverImageUrl: url }))}
          variant={variant}
          showUrlField
          uploadEndpoint="/api/community/upload-cover?kind=space"
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className={isLight ? "text-xs text-brand-ink/70" : "text-zinc-300"}>
              Space type
            </Label>
            <select
              value={form.spaceType}
              onChange={(e) => {
                const spaceType = e.target.value as SpaceFormState["spaceType"];
                setForm((f) => ({
                  ...f,
                  spaceType,
                  allowVoiceMessages: defaultAllowVoiceMessagesForSpace(
                    spaceType,
                    f.slug,
                  ),
                }));
              }}
              className={selectClass}
            >
              {COMMUNITY_SPACE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className={isLight ? "text-xs text-brand-ink/70" : "text-zinc-300"}>
              Theme mood
            </Label>
            <select
              value={form.themeMood}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  themeMood: e.target.value as SpaceFormState["themeMood"],
                }))
              }
              className={selectClass}
            >
              <option value="">Default</option>
              {COMMUNITY_THEME_MOODS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {showSortOrder ? (
          <p className="text-xs text-brand-ink/50 max-w-md">
            List order is managed in{" "}
            <span className="font-medium">Settings → Spaces → Display order</span> (up/down
            controls). New spaces are added at the end unless the slug is Start Here or Welcome.
          </p>
        ) : null}
      </div>

      <SectionHeading
        title="Welcome experience"
        description="Orient members when they enter this space."
      />
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className={isLight ? "text-xs text-brand-ink/70" : "text-zinc-300"}>
            Welcome message
          </Label>
          <Textarea
            rows={8}
            value={form.welcomeMessage}
            onChange={(e) => setForm((f) => ({ ...f, welcomeMessage: e.target.value }))}
            className={cn(fieldClass, "font-serif leading-relaxed")}
            placeholder="A warm, permanent introduction to this room…"
          />
          <p className="text-[11px] text-brand-ink/45 leading-relaxed">
            This message appears permanently at the top of the space and helps orient and engage
            members entering the room.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className={isLight ? "text-xs text-brand-ink/70" : "text-zinc-300"}>
            Engagement prompt
          </Label>
          <Input
            value={form.engagementPrompt}
            onChange={(e) => setForm((f) => ({ ...f, engagementPrompt: e.target.value }))}
            className={fieldClass}
            placeholder="How can we pray with you today?"
          />
        </div>
      </div>

      <SectionHeading
        title="Community settings"
        description="How members can participate in this space."
      />
      <div className="space-y-2">
        <ToggleRow
          label="Allow comments"
          checked={form.allowComments}
          onChange={(v) => setForm((f) => ({ ...f, allowComments: v }))}
          fieldClass={isLight ? undefined : "border-zinc-600 bg-zinc-800/50"}
        />
        <ToggleRow
          label="Allow reactions"
          checked={form.allowReactions}
          onChange={(v) => setForm((f) => ({ ...f, allowReactions: v }))}
          fieldClass={isLight ? undefined : "border-zinc-600 bg-zinc-800/50"}
        />
        <ToggleRow
          label="Allow member posts"
          description="Members can publish posts here (future-ready)."
          checked={form.allowMemberPosts}
          onChange={(v) => setForm((f) => ({ ...f, allowMemberPosts: v }))}
          fieldClass={isLight ? undefined : "border-zinc-600 bg-zinc-800/50"}
        />
        <ToggleRow
          label="Require post approval"
          checked={form.requirePostApproval}
          onChange={(v) => setForm((f) => ({ ...f, requirePostApproval: v }))}
          fieldClass={isLight ? undefined : "border-zinc-600 bg-zinc-800/50"}
        />
        {isPrayerRoom ? (
          <ToggleRow
            label="Allow voice prayers"
            description="Members can respond to prayer requests with recorded voice prayers."
            checked={form.allowVoiceMessages}
            onChange={(v) => setForm((f) => ({ ...f, allowVoiceMessages: v }))}
            fieldClass={isLight ? undefined : "border-zinc-600 bg-zinc-800/50"}
          />
        ) : (
          <p className="text-xs text-brand-ink/45 px-1">
            Voice prayers are available only for Prayer or Prayer room space types.
          </p>
        )}
      </div>

      <SectionHeading title="Display" />
      <div className="space-y-2">
        <ToggleRow
          label="Show welcome message"
          checked={form.showWelcomeMessage}
          onChange={(v) => setForm((f) => ({ ...f, showWelcomeMessage: v }))}
          fieldClass={isLight ? undefined : "border-zinc-600 bg-zinc-800/50"}
        />
        <ToggleRow
          label="Pin welcome message"
          description="Keeps the welcome card at the top of the feed."
          checked={form.pinWelcomeMessage}
          onChange={(v) => setForm((f) => ({ ...f, pinWelcomeMessage: v }))}
          fieldClass={isLight ? undefined : "border-zinc-600 bg-zinc-800/50"}
        />
      </div>
    </div>
  );
}
