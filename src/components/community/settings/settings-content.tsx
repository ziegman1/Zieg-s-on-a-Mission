"use client";

import type { SettingsPageData } from "@/lib/community/settings-types";
import { SettingsAccountPanel } from "./settings-account-panel";
import { SettingsCommunityPanel } from "./settings-community-panel";
import { SettingsHubPanel } from "./settings-hub-panel";
import { SettingsNotificationsPanel } from "./settings-notifications-panel";
import { SettingsProfilePanel } from "./settings-profile-panel";
import { SettingsSpacesPanel } from "./settings-spaces-panel";

export function SettingsContent({ data }: { data: SettingsPageData }) {
  switch (data.section) {
    case "profile":
      return <SettingsProfilePanel data={data} />;
    case "notifications":
      return <SettingsNotificationsPanel data={data} />;
    case "account":
      return <SettingsAccountPanel />;
    case "hub":
      return data.hubSettings ? (
        <SettingsHubPanel initial={data.hubSettings} />
      ) : null;
    case "spaces":
      return <SettingsSpacesPanel spaces={data.adminSpaces} />;
    case "community":
      return <SettingsCommunityPanel />;
    default:
      return <SettingsProfilePanel data={data} />;
  }
}
