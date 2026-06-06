import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  isEmailSuppressedForMissionHub,
  normalizeSuppressionEmail,
  upsertEmailSuppression,
} from "./email-suppressions";

vi.mock("@/lib/db", () => ({
  prisma: {
    emailSuppressionRecord: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";

describe("email suppressions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes email addresses", () => {
    expect(normalizeSuppressionEmail("  User@Example.com ")).toBe("user@example.com");
  });

  it("detects mission hub suppressions", async () => {
    vi.mocked(prisma.emailSuppressionRecord.findFirst).mockResolvedValue({ id: "1" } as never);
    await expect(isEmailSuppressedForMissionHub("user@example.com")).resolves.toBe(true);
  });

  it("stores mission_hub scoped suppressions", async () => {
    await upsertEmailSuppression({
      email: "user@example.com",
      reason: "unsubscribe",
      userId: "user-1",
    });

    expect(prisma.emailSuppressionRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email_scope: { email: "user@example.com", scope: "mission_hub" } },
      }),
    );
  });
});
