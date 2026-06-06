import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { absoluteMissionHubUrl } from "@/lib/mission-hub/site-url";

export const EMAIL_PREFERENCE_TOKEN_PURPOSES = [
  "preferences",
  "unsubscribe",
] as const;

export type EmailPreferenceTokenPurpose =
  (typeof EMAIL_PREFERENCE_TOKEN_PURPOSES)[number];

type TokenPayload = {
  v: 1;
  userId: string;
  email: string;
  purpose: EmailPreferenceTokenPurpose;
  exp: number;
};

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 365;

function tokenSecret(): string | null {
  const secret =
    process.env.MISSION_HUB_EMAIL_PREFERENCES_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim();
  return secret || null;
}

function signPayload(payload: string): string | null {
  const secret = tokenSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function encodePayload(payload: TokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(encoded: string): TokenPayload | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as TokenPayload;
    if (parsed.v !== 1) return null;
    if (!parsed.userId || !parsed.email || !parsed.purpose || !parsed.exp) return null;
    if (!(EMAIL_PREFERENCE_TOKEN_PURPOSES as readonly string[]).includes(parsed.purpose)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function createEmailPreferenceToken(input: {
  userId: string;
  email: string;
  purpose: EmailPreferenceTokenPurpose;
}): string | null {
  const payload: TokenPayload = {
    v: 1,
    userId: input.userId,
    email: normalizeTokenEmail(input.email),
    purpose: input.purpose,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encoded = encodePayload(payload);
  const signature = signPayload(encoded);
  if (!signature) return null;
  return `${encoded}.${signature}`;
}

export function verifyEmailPreferenceToken(
  token: string,
  expectedPurpose?: EmailPreferenceTokenPurpose,
): TokenPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expectedSignature = signPayload(encoded);
  if (!expectedSignature) return null;

  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const payload = decodePayload(encoded);
  if (!payload) return null;
  if (payload.exp < Date.now()) return null;
  if (expectedPurpose && payload.purpose !== expectedPurpose) return null;

  return payload;
}

export function normalizeTokenEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function buildManagePreferencesUrl(token: string): string {
  return absoluteMissionHubUrl(
    `/community/email-preferences?token=${encodeURIComponent(token)}`,
  );
}

export function buildUnsubscribeUrl(token: string): string {
  return absoluteMissionHubUrl(
    `/community/unsubscribe?token=${encodeURIComponent(token)}`,
  );
}

export function buildEmailPreferenceLinks(input: {
  userId: string;
  email: string;
}): { managePreferencesUrl: string; unsubscribeUrl: string } | null {
  const manageToken = createEmailPreferenceToken({
    userId: input.userId,
    email: input.email,
    purpose: "preferences",
  });
  const unsubscribeToken = createEmailPreferenceToken({
    userId: input.userId,
    email: input.email,
    purpose: "unsubscribe",
  });
  if (!manageToken || !unsubscribeToken) return null;

  return {
    managePreferencesUrl: buildManagePreferencesUrl(manageToken),
    unsubscribeUrl: buildUnsubscribeUrl(unsubscribeToken),
  };
}
