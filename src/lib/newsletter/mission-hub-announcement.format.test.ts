import { describe, expect, it } from "vitest";
import { formatNewsletterPublishSuccessMessage } from "./mission-hub-announcement";

describe("formatNewsletterPublishSuccessMessage", () => {
  it("shows announcements and Mission Hub in-app + email delivery lines", () => {
    const message = formatNewsletterPublishSuccessMessage({
      newsletterSlug: "march-update",
      hub: {
        ministryUpdates: {
          postId: "post-1",
          spaceSlug: "ministry-updates",
          spaceId: "s1",
          created: true,
          newsletterPath: "/newsletters/march-update",
          targetSpaceType: "ministry_updates",
        },
        newsletterSpace: {
          postId: "post-2",
          spaceSlug: "newsletters",
          spaceId: "s2",
          created: false,
          newsletterPath: "/newsletters/march-update",
          targetSpaceType: "newsletter",
        },
        inAppNotificationsSent: 10,
        inAppNotificationsUpdated: 2,
        emailNotificationsSent: 8,
        emailEnabled: true,
        emailRecipientsPrepared: 12,
        skippedMutedOrDisabled: 3,
      },
    });

    expect(message).toContain("Newsletter published");
    expect(message).toContain("/newsletters/march-update");
    expect(message).toContain("Ministry Updates post created");
    expect(message).toContain("Newsletter space post updated");
    expect(message).toContain("Mission Hub in-app notifications sent: 12");
    expect(message).toContain("Mission Hub email notifications sent: 8");
    expect(message).not.toContain("Mail Suite");
  });
});
