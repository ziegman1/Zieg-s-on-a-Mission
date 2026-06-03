import { describe, expect, it } from "vitest";
import { mapNotificationRecordToItem } from "./notification-record-mapper";

const baseRow = {
  id: "n1",
  title: "Test notification",
  body: "Body",
  readAt: null,
  createdAt: new Date("2026-05-24T12:00:00Z"),
  postId: "post-1",
  commentId: null,
  metadata: {},
  post: {
    status: "published",
    space: { slug: "prayer-and-praise-room" },
  },
};

describe("mapNotificationRecordToItem", () => {
  it("maps urgent_prayer_request to the post anchor", () => {
    const item = mapNotificationRecordToItem({
      ...baseRow,
      type: "urgent_prayer_request",
    });
    expect(item?.href).toBe("/community/prayer-and-praise-room#post-post-1");
    expect(item?.type).toBe("urgent_prayer_request");
  });

  it("maps blog_published to Mission Hub post when metadata includes hub space", () => {
    const item = mapNotificationRecordToItem({
      ...baseRow,
      type: "blog_published",
      post: null,
      postId: "hub-post-1",
      metadata: {
        sourceKind: "blog",
        sourceId: "blog-1",
        sourcePostId: "hub-post-1",
        blogSlug: "hello-world",
        blogPath: "/blog/hello-world",
        missionHubSpaceSlug: "blog-articles",
      },
    });
    expect(item?.href).toBe("/community/blog-articles#post-hub-post-1");
  });

  it("maps blog_published to Mission Hub post when hub post is published", () => {
    const item = mapNotificationRecordToItem({
      ...baseRow,
      type: "blog_published",
      metadata: {
        sourceKind: "blog",
        sourceId: "blog-1",
        sourcePostId: "hub-post-1",
        blogSlug: "hello-world",
        blogPath: "/blog/hello-world",
        missionHubSpaceSlug: "blog-articles",
      },
      post: { status: "published", space: { slug: "blog-articles" } },
      postId: "hub-post-1",
    });
    expect(item?.href).toBe("/community/blog-articles#post-hub-post-1");
  });

  it("maps newsletter_published using newsletter metadata fallback", () => {
    const item = mapNotificationRecordToItem({
      ...baseRow,
      type: "newsletter_published",
      post: null,
      postId: null,
      metadata: {
        sourceKind: "newsletter",
        sourceId: "nl-1",
        sourcePostId: "hub-post-1",
        newsletterSlug: "april-2026",
        newsletterPath: "/newsletters/april-2026",
        missionHubSpaceSlug: "newsletters",
      },
    });
    expect(item?.href).toBe("/community/newsletters#post-hub-post-1");
  });

  it("falls back to public newsletter path when hub metadata is incomplete", () => {
    const item = mapNotificationRecordToItem({
      ...baseRow,
      type: "newsletter_published",
      post: null,
      postId: null,
      metadata: {
        sourceKind: "newsletter",
        sourceId: "nl-1",
        newsletterSlug: "april-2026",
        newsletterPath: "/newsletters/april-2026",
      },
    });
    expect(item?.href).toBe("/newsletters/april-2026");
  });

  it("returns null for unknown notification types without throwing", () => {
    expect(
      mapNotificationRecordToItem({
        ...baseRow,
        type: "future_notification_kind",
      }),
    ).toBeNull();
  });

  it("does not throw on malformed metadata", () => {
    expect(
      mapNotificationRecordToItem({
        ...baseRow,
        type: "blog_published",
        post: null,
        postId: null,
        metadata: null,
      }),
    ).toEqual(
      expect.objectContaining({
        type: "blog_published",
        href: "/blog",
      }),
    );
  });

  it("does not throw when post exists but space relation is missing", () => {
    const item = mapNotificationRecordToItem({
      ...baseRow,
      type: "urgent_prayer_request",
      post: { status: "published", space: null },
    });
    expect(item?.href).toBe("/community");
    expect(item?.spaceSlug).toBeNull();
  });
});
