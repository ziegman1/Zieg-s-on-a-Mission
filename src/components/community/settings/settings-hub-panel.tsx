"use client";

import { useState, useTransition } from "react";
import { saveHubSettingsAction } from "@/app/(storefront)/community/settings-actions";
import {
  normalizeHubSettingsInput,
  type CommunityHubSettings,
} from "@/lib/community/settings-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SettingsFieldGroup,
  SettingsPanel,
  SettingsSaveButton,
} from "./settings-ui";

export function SettingsHubPanel({
  initial,
}: {
  initial: CommunityHubSettings;
}) {
  const [hub, setHub] = useState(() =>
    normalizeHubSettingsInput(initial) as CommunityHubSettings,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = normalizeHubSettingsInput(hub);
      if (process.env.NODE_ENV === "development") {
        console.info("saveHubSettingsAction payload", payload);
      }
      const res = await saveHubSettingsAction(hub);
      if (!res.ok) {
        if (process.env.NODE_ENV === "development" && res.validationIssues?.length) {
          console.error("saveHubSettingsAction validation", res.validationIssues);
        }
        const details = res.validationIssues
          ?.map((issue) => {
            const received =
              issue.received === undefined
                ? ""
                : ` (received ${JSON.stringify(issue.received)})`;
            return `${issue.path}: ${issue.message}${received}`;
          })
          .join("; ");
        setError(details ? `${res.error} — ${details}` : res.error);
        return;
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <SettingsPanel
        title="Mission Hub"
        description="Branding and copy shown across the community experience."
        footer={<SettingsSaveButton pending={pending} />}
      >
        <SettingsFieldGroup>
          <div className="space-y-1.5">
            <Label htmlFor="hub-title">Hub title</Label>
            <Input
              id="hub-title"
              value={hub.title ?? ""}
              onChange={(e) => setHub((h) => ({ ...h, title: e.target.value }))}
              placeholder="Mission Hub"
              className="bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hub-tagline">Tagline</Label>
            <Input
              id="hub-tagline"
              value={hub.tagline ?? ""}
              onChange={(e) => setHub((h) => ({ ...h, tagline: e.target.value }))}
              placeholder="Ministry family"
              className="bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hub-logo">Logo image URL</Label>
            <Input
              id="hub-logo"
              value={hub.logoUrl ?? ""}
              onChange={(e) => setHub((h) => ({ ...h, logoUrl: e.target.value }))}
              placeholder="https://…"
              className="bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hub-cover">Cover / banner image URL</Label>
            <Input
              id="hub-cover"
              value={hub.coverImageUrl ?? ""}
              onChange={(e) => setHub((h) => ({ ...h, coverImageUrl: e.target.value }))}
              className="bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hub-welcome">Welcome text</Label>
            <textarea
              id="hub-welcome"
              value={hub.welcomeText ?? ""}
              onChange={(e) => setHub((h) => ({ ...h, welcomeText: e.target.value }))}
              rows={3}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm resize-none"
              placeholder="Optional intro shown in the hub"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hub-welcome-post-path">New member welcome post path</Label>
            <Input
              id="hub-welcome-post-path"
              value={hub.welcomePostPath ?? ""}
              onChange={(e) => setHub((h) => ({ ...h, welcomePostPath: e.target.value }))}
              placeholder="/community/start-here#post-…"
              className="bg-white font-mono text-xs"
            />
            <p className="text-[11px] text-brand-ink/50 leading-relaxed">
              After partnership onboarding, new members land here once (with comments open).
              Use a Mission Hub path and optional <code className="text-[10px]">#post-…</code>{" "}
              anchor. Falls back to <code className="text-[10px]">/community/start-here</code>{" "}
              when empty.
            </p>
          </div>
          <div className="pt-2 border-t border-black/[0.04] space-y-3">
            <p className="text-xs font-semibold text-brand-ink/50 uppercase tracking-wide">
              Partnership invitation (sidebar)
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="inv-title">Card title</Label>
              <Input
                id="inv-title"
                value={hub.invitationTitle ?? ""}
                onChange={(e) => setHub((h) => ({ ...h, invitationTitle: e.target.value }))}
                className="bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-body">Card body</Label>
              <textarea
                id="inv-body"
                value={hub.invitationBody ?? ""}
                onChange={(e) => setHub((h) => ({ ...h, invitationBody: e.target.value }))}
                rows={4}
                className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm resize-none"
              />
            </div>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </SettingsFieldGroup>
      </SettingsPanel>
    </form>
  );
}
