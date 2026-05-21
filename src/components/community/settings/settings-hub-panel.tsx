"use client";

import { useState, useTransition } from "react";
import { saveHubSettingsAction } from "@/app/(storefront)/community/settings-actions";
import type { CommunityHubSettings, SettingsPageData } from "@/lib/community/settings-types";
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
  const [hub, setHub] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await saveHubSettingsAction(hub);
      if (!res.ok) setError(res.error);
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
