export * from "@/lib/mission-hub/weekly-digest-core";
export { generateWeeklyMissionHubDigest } from "@/lib/mission-hub/weekly-digest-fetch";
export { countWeeklyDigestEmailRecipients } from "@/lib/mission-hub/weekly-digest-recipients";

import type { WeeklyMissionHubDigest } from "@/lib/mission-hub/weekly-digest-core";
import { generateWeeklyMissionHubDigest } from "@/lib/mission-hub/weekly-digest-fetch";
import { countWeeklyDigestEmailRecipients } from "@/lib/mission-hub/weekly-digest-recipients";

export type DigestNewsletterItem = import("@/lib/mission-hub/weekly-digest-core").DigestContentItem;
export type DigestPostItem = import("@/lib/mission-hub/weekly-digest-core").DigestContentItem;
export type WeeklyDigestPrep = WeeklyMissionHubDigest;

/** Collect digest content and recipient prep count. Does not send email. */
export async function prepareWeeklyMissionHubDigest(
  window: import("@/lib/mission-hub/weekly-digest-core").DigestWindowInput | Date = new Date(),
): Promise<WeeklyMissionHubDigest> {
  const rangeInput = window instanceof Date ? { end: window } : window;
  const [digest, digestEmailRecipientsPrepared] = await Promise.all([
    generateWeeklyMissionHubDigest(rangeInput),
    countWeeklyDigestEmailRecipients(),
  ]);
  return { ...digest, digestEmailRecipientsPrepared };
}
