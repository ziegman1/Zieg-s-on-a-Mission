import { describe, expect, it } from "vitest";
import {
  NEWSLETTER_SHARE_SMS_INTRO,
  buildAbsoluteNewsletterShareUrl,
  buildNewsletterShareCopyLinkValue,
  buildNewsletterShareMailtoLink,
  buildNewsletterShareMessage,
  buildNewsletterShareSmsDeepLink,
} from "./newsletter-share";

const ORIGIN = "https://example.com";

describe("newsletter share helpers", () => {
  it("builds absolute newsletter URL from slug", () => {
    expect(buildAbsoluteNewsletterShareUrl("march-update", ORIGIN)).toBe(
      "https://example.com/newsletters/march-update",
    );
  });

  it("builds SMS body with intro, title, and absolute link", () => {
    const message = buildNewsletterShareMessage({
      title: "March Field Update",
      slug: "march-update",
      origin: ORIGIN,
    });

    expect(message).toBe(
      [
        NEWSLETTER_SHARE_SMS_INTRO,
        "",
        "March Field Update",
        "",
        "Read it here:",
        "https://example.com/newsletters/march-update",
      ].join("\n"),
    );
  });

  it("builds native SMS deep link with encoded message body", () => {
    const href = buildNewsletterShareSmsDeepLink({
      title: "March Field Update",
      slug: "march-update",
      origin: ORIGIN,
    });

    expect(href.startsWith("sms:?&body=")).toBe(true);
    expect(decodeURIComponent(href.replace("sms:?&body=", ""))).toBe(
      buildNewsletterShareMessage({
        title: "March Field Update",
        slug: "march-update",
        origin: ORIGIN,
      }),
    );
  });

  it("builds mailto link with subject and encoded message body", () => {
    const href = buildNewsletterShareMailtoLink({
      title: "March Field Update",
      slug: "march-update",
      origin: ORIGIN,
    });

    expect(href.startsWith("mailto:?")).toBe(true);
    const query = href.replace("mailto:?", "");
    const params = new URLSearchParams(query);
    expect(params.get("subject")).toBe("March Field Update");
    expect(params.get("body")).toBe(
      buildNewsletterShareMessage({
        title: "March Field Update",
        slug: "march-update",
        origin: ORIGIN,
      }),
    );
  });

  it("copy link value is the absolute newsletter URL", () => {
    expect(
      buildNewsletterShareCopyLinkValue({
        slug: "march-update",
        origin: ORIGIN,
      }),
    ).toBe("https://example.com/newsletters/march-update");
  });
});
