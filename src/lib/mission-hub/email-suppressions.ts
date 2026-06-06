import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const EMAIL_SUPPRESSION_SCOPES = ["mission_hub", "all"] as const;
export type EmailSuppressionScope = (typeof EMAIL_SUPPRESSION_SCOPES)[number];

export const EMAIL_SUPPRESSION_REASONS = [
  "unsubscribe",
  "bounce",
  "complaint",
  "manual",
] as const;
export type EmailSuppressionReason = (typeof EMAIL_SUPPRESSION_REASONS)[number];

export function normalizeSuppressionEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function isEmailSuppressedForMissionHub(
  email: string,
): Promise<boolean> {
  const normalized = normalizeSuppressionEmail(email);
  if (!normalized) return false;

  const row = await prisma.emailSuppressionRecord.findFirst({
    where: {
      email: normalized,
      scope: { in: ["mission_hub", "all"] },
    },
    select: { id: true },
  });

  return Boolean(row);
}

export async function upsertEmailSuppression(input: {
  email: string;
  scope?: EmailSuppressionScope;
  reason: EmailSuppressionReason;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const email = normalizeSuppressionEmail(input.email);
  if (!email) return;

  const scope = input.scope ?? "mission_hub";
  const metadata = (input.metadata ?? {}) as Prisma.InputJsonValue;

  await prisma.emailSuppressionRecord.upsert({
    where: { email_scope: { email, scope } },
    create: {
      email,
      scope,
      reason: input.reason,
      userId: input.userId ?? null,
      metadata,
    },
    update: {
      reason: input.reason,
      userId: input.userId ?? undefined,
      metadata,
    },
  });
}

export async function removeEmailSuppression(input: {
  email: string;
  scope?: EmailSuppressionScope;
}): Promise<void> {
  const email = normalizeSuppressionEmail(input.email);
  if (!email) return;

  await prisma.emailSuppressionRecord.deleteMany({
    where: {
      email,
      scope: input.scope ?? "mission_hub",
    },
  });
}

export async function countMissionHubEmailSuppressions(): Promise<number> {
  return prisma.emailSuppressionRecord.count({
    where: { scope: { in: ["mission_hub", "all"] } },
  });
}
