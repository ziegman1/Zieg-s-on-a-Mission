import { describe, expect, it } from "vitest";
import { formatNewsletterPublishSuccessMessage } from "./mission-hub-announcement";

describe("formatNewsletterPublishSuccessMessage", () => {
  it("shows announcement status and prepared recipient counts", () => {
    const message = formatNewsletterPublishSuccessMessage({
      newsletterSlug: "march-update",
      hub: {
        announcement: {
          postId: "post-1",
          spaceSlug: "ministry-updates",
          created: true,
          newsletterPath: "/newsletters/march-update",
        },
        announcementCreated: true,
        emailRecipientsPrepared: 12,
        inAppRecipientsPrepared: 15,
        pushRecipientsPrepared: 0,
        skippedMutedOrDisabled: 3,
        deliveryEnabled: false,
      },
    });

    expect(message).toContain("Newsletter published");
    expect(message).toContain("/newsletters/march-update");
    expect(message).toContain("Mission Hub announcement created");
    expect(message).toContain("Email recipients prepared: 12");
    expect(message).toContain("In-app recipients prepared: 15");
    expect(message).toContain("Push recipients prepared: 0");
    expect(message).toContain("Skipped (muted or disabled): 3");
    expect(message).toContain("Delivery disabled");
  });
});
