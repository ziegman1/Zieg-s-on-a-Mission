import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CommunitySettingsShell } from "@/components/community/settings/community-settings-shell";
import {
  hydrateMemberSettingsFields,
  loadSettingsPageData,
} from "@/lib/community/settings-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings | Mission Hub",
  description: "Mission Hub profile, notifications, and preferences.",
};

type PageProps = {
  searchParams: Promise<{ section?: string }>;
};

export default async function CommunitySettingsPage({ searchParams }: PageProps) {
  const { section } = await searchParams;
  let data = await loadSettingsPageData(section);

  if (!data) {
    redirect(`/community/login?callbackUrl=${encodeURIComponent("/community/settings")}`);
  }

  data = await hydrateMemberSettingsFields(data);

  return <CommunitySettingsShell data={data} />;
}
