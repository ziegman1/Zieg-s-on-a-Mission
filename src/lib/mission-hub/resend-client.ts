import "server-only";

import { Resend } from "resend";
import {
  formatMissionHubFromHeader,
  getMissionHubEmailConfigProblem,
  getMissionHubReplyToEmail,
  isMissionHubEmailNotificationsEnabled,
} from "@/lib/mission-hub/email-config";

export type SendMissionHubEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendMissionHubEmailResult =
  | { ok: true; resendMessageId: string | null }
  | { ok: false; error: string };

export function canSendMissionHubEmail(): boolean {
  return getMissionHubEmailConfigProblem() === null;
}

export async function sendMissionHubEmail(
  input: SendMissionHubEmailInput,
): Promise<SendMissionHubEmailResult> {
  const problem = getMissionHubEmailConfigProblem();
  if (problem) {
    return { ok: false, error: `Mission Hub email not configured (${problem})` };
  }

  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    return { ok: false, error: "RESEND_API_KEY is not set" };
  }

  const resend = new Resend(key);
  const replyTo = getMissionHubReplyToEmail();

  try {
    const { data, error } = await resend.emails.send({
      from: formatMissionHubFromHeader(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    });

    if (error) {
      console.error("[mission-hub-email] Resend API error", {
        to: input.to,
        subject: input.subject,
        message: error.message,
      });
      return { ok: false, error: error.message };
    }

    return { ok: true, resendMessageId: data?.id ?? null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[mission-hub-email] Resend send failed", {
      to: input.to,
      subject: input.subject,
      message,
    });
    return { ok: false, error: message };
  }
}

export function logMissionHubEmailSkipped(reason: string): void {
  if (!isMissionHubEmailNotificationsEnabled()) return;
  console.info("[mission-hub-email] skipped", { reason });
}
