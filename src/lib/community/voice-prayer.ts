import { mergeSpaceSettings } from "@/lib/community/settings-types";
import {
  isPrayerSpace,
  resolveInteractionSpaceType,
} from "@/lib/community/space-interaction";

export type VoicePrayerSpaceGate = {
  spaceType?: string | null;
  slug?: string | null;
  allowVoiceMessages?: boolean;
  settings?: unknown;
};

/** Default for new prayer rooms; standard spaces default off. */
export function defaultAllowVoiceMessagesForSpace(
  spaceType: string | null | undefined,
  slug?: string | null,
): boolean {
  return isPrayerSpace(resolveInteractionSpaceType(spaceType, slug));
}

/**
 * Hydrate allow-voice from DB column, then settings JSON, then prayer-space default.
 */
export function hydrateAllowVoiceMessages(input: VoicePrayerSpaceGate): boolean {
  if (typeof input.allowVoiceMessages === "boolean") {
    return input.allowVoiceMessages;
  }
  const settings = mergeSpaceSettings(input.settings);
  if (typeof settings.allowVoiceMessages === "boolean") {
    return settings.allowVoiceMessages;
  }
  return defaultAllowVoiceMessagesForSpace(input.spaceType, input.slug);
}

/** Voice prayer UI and uploads only in prayer rooms with the toggle enabled. */
export function canUseVoicePrayer(space: VoicePrayerSpaceGate): boolean {
  if (!defaultAllowVoiceMessagesForSpace(space.spaceType, space.slug)) {
    return false;
  }
  return hydrateAllowVoiceMessages(space);
}

/** Settings JSON fragment kept in sync with `community_spaces.allow_voice_messages`. */
export function voicePrayerSettingsPatch(allowVoiceMessages: boolean): {
  allowVoiceMessages: boolean;
} {
  return { allowVoiceMessages };
}
