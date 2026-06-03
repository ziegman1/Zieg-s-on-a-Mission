import { describe, expect, it } from "vitest";
import { blogPublishNotificationDedupeKey } from "./mission-hub-dedupe";
import { blogPublishEmailDedupeKey } from "@/lib/mission-hub/email-dedupe";

describe("blog publish dedupe keys", () => {
  it("uses stable in-app dedupe key per blog post", () => {
    expect(blogPublishNotificationDedupeKey("blog_abc")).toBe("blog:blog_abc:published");
  });

  it("uses stable email dedupe key per blog post", () => {
    expect(blogPublishEmailDedupeKey("blog_abc")).toBe("blog:blog_abc:email");
  });
});
