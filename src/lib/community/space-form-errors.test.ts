import { describe, expect, it } from "vitest";
import { formatCommunitySpaceInputErrors } from "./space-form-errors";
import { communitySpaceInputSchema } from "./space-form";

describe("formatCommunitySpaceInputErrors", () => {
  it("includes field-level zod messages", () => {
    const parsed = communitySpaceInputSchema.safeParse({
      title: "Test",
      slug: "bad slug",
      status: "published",
      sortOrder: 0,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const message = formatCommunitySpaceInputErrors(parsed.error);
      expect(message).toContain("slug:");
    }
  });
});
