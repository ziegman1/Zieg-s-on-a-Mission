export type MissionHubNotificationDeliveryCounts = {
  inAppNotificationsSent: number;
  inAppNotificationsUpdated: number;
  emailNotificationsSent: number;
  emailNotificationsDeduped: number;
  emailNotificationsFailed: number;
  emailEnabled: boolean;
  emailDisabledReason: string | null;
  emailRecipientsPrepared: number;
};

export function formatMissionHubNotificationDeliveryLines(
  notifications: MissionHubNotificationDeliveryCounts,
): string[] {
  const inAppTotal =
    notifications.inAppNotificationsSent + notifications.inAppNotificationsUpdated;
  const lines = [`Mission Hub in-app notifications sent: ${inAppTotal}.`];

  if (!notifications.emailEnabled) {
    lines.push(
      notifications.emailDisabledReason ??
        "Mission Hub email notifications are disabled.",
    );
    if (notifications.emailRecipientsPrepared > 0) {
      lines.push(
        `Email-eligible members (not emailed): ${notifications.emailRecipientsPrepared}.`,
      );
    }
    return lines;
  }

  lines.push(
    `Mission Hub email notifications sent: ${notifications.emailNotificationsSent}.`,
  );
  if (notifications.emailNotificationsDeduped > 0) {
    lines.push(
      `Email notifications skipped (already sent): ${notifications.emailNotificationsDeduped}.`,
    );
  }
  if (notifications.emailNotificationsFailed > 0) {
    lines.push(
      `Email notifications failed: ${notifications.emailNotificationsFailed}. Check server logs for [mission-hub-email].`,
    );
  }

  return lines;
}
