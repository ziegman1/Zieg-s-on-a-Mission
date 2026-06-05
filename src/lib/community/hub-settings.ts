import {
  DEFAULT_HUB_INVITATION,
  type CommunityHubSettings,
} from "@/lib/community/settings-types";
import { normalizeWelcomePostPath, resolveWelcomePostPath } from "@/lib/community/welcome-intro";
import { prisma } from "@/lib/db";

function rowToHubSettings(row: {
  title: string | null;
  tagline: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  welcomeText: string | null;
  invitationTitle: string | null;
  invitationBody: string | null;
  welcomePostPath: string | null;
}): CommunityHubSettings {
  return {
    title: row.title,
    tagline: row.tagline,
    logoUrl: row.logoUrl,
    coverImageUrl: row.coverImageUrl,
    welcomeText: row.welcomeText,
    invitationTitle: row.invitationTitle ?? DEFAULT_HUB_INVITATION.title,
    invitationBody: row.invitationBody ?? DEFAULT_HUB_INVITATION.body,
    welcomePostPath: normalizeWelcomePostPath(row.welcomePostPath),
  };
}

const emptyHubSettings = (): CommunityHubSettings => ({
  title: null,
  tagline: null,
  logoUrl: null,
  coverImageUrl: null,
  welcomeText: null,
  invitationTitle: DEFAULT_HUB_INVITATION.title,
  invitationBody: DEFAULT_HUB_INVITATION.body,
  welcomePostPath: null,
});

export async function getCommunityHubSettings(): Promise<CommunityHubSettings> {
  try {
    const row = await prisma.communityHubSettingsRecord.findUnique({
      where: { id: "default" },
    });
    if (!row) return emptyHubSettings();
    return rowToHubSettings(row);
  } catch {
    return emptyHubSettings();
  }
}

export async function upsertCommunityHubSettings(
  input: Partial<CommunityHubSettings>,
): Promise<void> {
  const emptyToNull = (v: string | null | undefined) => {
    const t = v?.trim();
    return t ? t : null;
  };

  const welcomePostPath =
    input.welcomePostPath !== undefined
      ? normalizeWelcomePostPath(emptyToNull(input.welcomePostPath) ?? "")
      : undefined;

  await prisma.communityHubSettingsRecord.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      title: emptyToNull(input.title),
      tagline: emptyToNull(input.tagline),
      logoUrl: emptyToNull(input.logoUrl),
      coverImageUrl: emptyToNull(input.coverImageUrl),
      welcomeText: emptyToNull(input.welcomeText),
      invitationTitle: emptyToNull(input.invitationTitle) ?? DEFAULT_HUB_INVITATION.title,
      invitationBody: emptyToNull(input.invitationBody) ?? DEFAULT_HUB_INVITATION.body,
      welcomePostPath: welcomePostPath ?? null,
    },
    update: {
      title: input.title !== undefined ? emptyToNull(input.title) : undefined,
      tagline: input.tagline !== undefined ? emptyToNull(input.tagline) : undefined,
      logoUrl: input.logoUrl !== undefined ? emptyToNull(input.logoUrl) : undefined,
      coverImageUrl:
        input.coverImageUrl !== undefined ? emptyToNull(input.coverImageUrl) : undefined,
      welcomeText:
        input.welcomeText !== undefined ? emptyToNull(input.welcomeText) : undefined,
      invitationTitle:
        input.invitationTitle !== undefined
          ? emptyToNull(input.invitationTitle)
          : undefined,
      invitationBody:
        input.invitationBody !== undefined ? emptyToNull(input.invitationBody) : undefined,
      welcomePostPath,
    },
  });
}

export async function getWelcomePostPathForIntro(): Promise<string> {
  const hub = await getCommunityHubSettings();
  return resolveWelcomePostPath(hub.welcomePostPath);
}
