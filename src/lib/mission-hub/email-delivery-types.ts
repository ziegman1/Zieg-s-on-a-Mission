import type { MissionHubEmailNotificationKind } from "@/lib/mission-hub/email-dedupe";

export type MissionHubEmailDeliveryMetadata = {
  sourceKind: "newsletter" | "blog" | "post" | "weekly_digest";
  sourceId: string;
  sourcePostId: string;
  spaceId?: string;
  spaceSlug?: string;
  newsletterSlug?: string;
  newsletterPublicUrl?: string;
  blogSlug?: string;
  blogPublicUrl?: string;
  missionHubPostUrl?: string;
  digestWeekKey?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
};

export type MissionHubEmailDeliveryPayload = {
  recipientUserId: string;
  recipientEmail: string;
  notificationKind: MissionHubEmailNotificationKind;
  dedupeKey: string;
  subject: string;
  html: string;
  text: string;
  metadata: MissionHubEmailDeliveryMetadata;
  forceResend?: boolean;
};

export type QueueMissionHubEmailResult =
  | { action: "sent"; deliveryId: string; resendMessageId: string | null }
  | { action: "deduped"; deliveryId?: string }
  | { action: "failed"; deliveryId: string; error: string }
  | { action: "skipped"; reason: string };
