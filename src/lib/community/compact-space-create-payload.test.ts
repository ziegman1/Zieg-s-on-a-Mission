import { describe, expect, it } from "vitest";
import {
  buildCompactSpaceCreatePayload,
  inferSpaceNotificationCategory,
} from "./compact-space-create-payload";
import { communitySpaceInputSchema } from "./space-form";

describe("compact space create payload", () => {
  it("builds a valid published payload for Blog Articles", () => {
    const payload = buildCompactSpaceCreatePayload({ title: "Blog Articles" });
    expect(payload.slug).toBe("blog-articles");
    expect(payload.status).toBe("published");
    expect(payload.notificationCategory).toBe("blog_articles");
    expect(payload.allowComments).toBe(true);
    expect(payload.allowReactions).toBe(true);
    expect(payload.allowMemberPosts).toBe(false);
    expect(payload.requirePostApproval).toBe(false);

    const parsed = communitySpaceInputSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("maps blog icon to blog_articles notification category", () => {
    expect(
      inferSpaceNotificationCategory("My Space", "blog"),
    ).toBe("blog_articles");
  });

  it("defaults notificationCategory to custom for generic titles", () => {
    expect(
      inferSpaceNotificationCategory("Team Chat", "events"),
    ).toBe("custom");
  });

  it("accepts optional cover image URL when valid", () => {
    const payload = buildCompactSpaceCreatePayload({
      title: "Photo Wall",
      coverImageUrl: "https://example.com/cover.jpg",
    });
    const parsed = communitySpaceInputSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid cover image URL at schema layer", () => {
    const payload = buildCompactSpaceCreatePayload({
      title: "Photo Wall",
      coverImageUrl: "not-a-url",
    });
    const parsed = communitySpaceInputSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });
});

describe("space notification category module init", () => {
  it("loads without circular dependency errors", async () => {
    const mod = await import("./space-notification-category");
    expect(mod.DEFAULT_SPACE_NOTIFICATION_CATEGORY).toBe("custom");
    expect(mod.mergeSpaceSettingsWithNotificationCategory({}, "blog_articles")).toEqual(
      expect.objectContaining({ notificationCategory: "blog_articles" }),
    );
  });
});
