export const COMMUNITY_NOTIFICATION_TYPES = [
  "comment_on_post",
  "reply_to_comment",
  "reaction_on_post",
  "new_post",
  "member_joined",
  "newsletter_published",
] as const;

export type CommunityNotificationType = (typeof COMMUNITY_NOTIFICATION_TYPES)[number];

export function isCommunityNotificationType(
  value: string,
): value is CommunityNotificationType {
  return (COMMUNITY_NOTIFICATION_TYPES as readonly string[]).includes(value);
}

export type CommunityNotificationItem = {
  id: string;
  type: CommunityNotificationType;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
  postId: string | null;
  commentId: string | null;
  spaceSlug: string | null;
  href: string;
};
