import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/mission-hub/notification-preference-events", () => ({
  recordSuppressionCreatedEvent: vi.fn(),
  recordSuppressionRemovedEvent: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    emailSuppressionRecord: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import {
  isEmailSuppressedForMissionHub,
  normalizeSuppressionEmail,
  removeEmailSuppression,
  upsertEmailSuppression,
} from "./email-suppressions";
import {
  recordSuppressionCreatedEvent,
  recordSuppressionRemovedEvent,
} from "@/lib/mission-hub/notification-preference-events";

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

  it("stores mission_hub scoped suppressions and logs create event", async () => {
    vi.mocked(prisma.emailSuppressionRecord.findUnique).mockResolvedValue(null);

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
    expect(recordSuppressionCreatedEvent).toHaveBeenCalled();
  });

  it("does not log create event when suppression already exists", async () => {
    vi.mocked(prisma.emailSuppressionRecord.findUnique).mockResolvedValue({ id: "1" } as never);

    await upsertEmailSuppression({
      email: "user@example.com",
      reason: "unsubscribe",
      userId: "user-1",
    });

    expect(recordSuppressionCreatedEvent).not.toHaveBeenCalled();
  });

  it("logs remove event when deleting suppression", async () => {
    vi.mocked(prisma.emailSuppressionRecord.findFirst).mockResolvedValue({
      id: "1",
      userId: "user-1",
    } as never);

    await removeEmailSuppression({ email: "user@example.com" });

    expect(prisma.emailSuppressionRecord.deleteMany).toHaveBeenCalled();
    expect(recordSuppressionRemovedEvent).toHaveBeenCalled();
  });
});
