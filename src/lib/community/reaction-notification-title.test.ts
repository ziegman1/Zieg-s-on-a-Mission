import { describe, expect, it } from "vitest";
import { buildReactionNotificationTitle } from "./reaction-notification-title";

describe("buildReactionNotificationTitle", () => {
  it("formats prayed with named member and untitled post", () => {
    expect(
      buildReactionNotificationTitle({
        actorDisplayName: "Jane Doe",
        reactionType: "prayed",
        postTitle: null,
      }),
    ).toBe("Jane Doe said amen to a post");
  });

  it("formats prayed with unknown actor", () => {
    expect(
      buildReactionNotificationTitle({
        actorDisplayName: "Someone",
        reactionType: "prayed",
        postTitle: "",
      }),
    ).toBe("Someone said amen to a post");
  });

  it("formats prayed with quoted post title", () => {
    expect(
      buildReactionNotificationTitle({
        actorDisplayName: "Jane Doe",
        reactionType: "amen",
        postTitle: "Pray for my family",
      }),
    ).toBe('Jane Doe said amen to "Pray for my family"');
  });

  it("formats like as a standalone sentence", () => {
    expect(
      buildReactionNotificationTitle({
        actorDisplayName: "Jane Doe",
        reactionType: "like",
        postTitle: null,
      }),
    ).toBe("Jane Doe is standing with you");
  });

  it("formats love as a standalone sentence", () => {
    expect(
      buildReactionNotificationTitle({
        actorDisplayName: "Jane Doe",
        reactionType: "love",
        postTitle: "Untitled",
      }),
    ).toBe("Jane Doe is praying with you");
  });

  it("formats celebrating as a standalone sentence", () => {
    expect(
      buildReactionNotificationTitle({
        actorDisplayName: "Jane Doe",
        reactionType: "celebrating",
        postTitle: null,
      }),
    ).toBe("Jane Doe is rejoicing");
  });

  it("formats encouraged as a standalone sentence", () => {
    expect(
      buildReactionNotificationTitle({
        actorDisplayName: "Jane Doe",
        reactionType: "encouraged",
        postTitle: null,
      }),
    ).toBe("Jane Doe was encouraged");
  });

  it("formats unknown reaction types with reacted to", () => {
    expect(
      buildReactionNotificationTitle({
        actorDisplayName: "Jane Doe",
        reactionType: "sparkles",
        postTitle: null,
      }),
    ).toBe("Jane Doe reacted to a post");
  });
});
