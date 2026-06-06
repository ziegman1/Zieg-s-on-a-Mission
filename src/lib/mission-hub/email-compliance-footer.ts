import { LEGAL_CONFIG } from "@/data/legal-config";
import { absoluteMissionHubUrl } from "@/lib/mission-hub/site-url";
import { buildEmailPreferenceLinks } from "@/lib/mission-hub/email-preference-tokens";

export type MissionHubEmailComplianceLinks = {
  managePreferencesUrl: string;
  unsubscribeUrl: string;
};

export function resolveMissionHubEmailComplianceLinks(input?: {
  userId?: string;
  email?: string;
}): MissionHubEmailComplianceLinks {
  if (input?.userId && input.email) {
    const tokenized = buildEmailPreferenceLinks({
      userId: input.userId,
      email: input.email,
    });
    if (tokenized) return tokenized;
  }

  return {
    managePreferencesUrl: absoluteMissionHubUrl("/community/settings?section=notifications"),
    unsubscribeUrl: absoluteMissionHubUrl("/community/unsubscribe"),
  };
}

export function buildMissionHubEmailComplianceFooterText(
  links: MissionHubEmailComplianceLinks,
): string {
  return [
    "—",
    `${LEGAL_CONFIG.siteUrl.replace(/^https?:\/\//, "")}`,
    `Manage preferences: ${links.managePreferencesUrl}`,
    `Unsubscribe from Mission Hub emails: ${links.unsubscribeUrl}`,
    `You received this because you are part of the Zieg's on a Mission community.`,
    `Questions? ${LEGAL_CONFIG.supportEmail}`,
  ].join("\n");
}

export function buildMissionHubEmailComplianceFooterHtml(
  links: MissionHubEmailComplianceLinks,
): string {
  const siteLabel = escapeHtml(LEGAL_CONFIG.siteUrl.replace(/^https?:\/\//, ""));
  const supportEmail = escapeHtml(LEGAL_CONFIG.supportEmail);

  return `
<hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
<div style="font-size: 12px; color: #737373; line-height: 1.6;">
  <p style="margin: 0 0 8px;">You are receiving Mission Hub email from ${siteLabel}.</p>
  <p style="margin: 0 0 8px;">
    <a href="${escapeHtml(links.managePreferencesUrl)}" style="color: #5a8fb8;">Manage email preferences</a>
    &nbsp;·&nbsp;
    <a href="${escapeHtml(links.unsubscribeUrl)}" style="color: #5a8fb8;">Unsubscribe</a>
  </p>
  <p style="margin: 0;">Questions? <a href="mailto:${supportEmail}" style="color: #5a8fb8;">${supportEmail}</a></p>
</div>`.trim();
}

export function appendMissionHubEmailCompliance(input: {
  html: string;
  text: string;
  userId?: string;
  email?: string;
}): { html: string; text: string; links: MissionHubEmailComplianceLinks } {
  const links = resolveMissionHubEmailComplianceLinks({
    userId: input.userId,
    email: input.email,
  });
  const footerText = buildMissionHubEmailComplianceFooterText(links);
  const footerHtml = buildMissionHubEmailComplianceFooterHtml(links);

  return {
    html: `${input.html}\n${footerHtml}`,
    text: `${input.text}\n\n${footerText}`,
    links,
  };
}

export function finalizeMissionHubEmailContent(input: {
  subject: string;
  html: string;
  text: string;
  recipientUserId: string;
  recipientEmail: string;
}): {
  subject: string;
  html: string;
  text: string;
  complianceLinks: MissionHubEmailComplianceLinks;
} {
  const compliance = appendMissionHubEmailCompliance({
    html: input.html,
    text: input.text,
    userId: input.recipientUserId,
    email: input.recipientEmail,
  });
  return {
    subject: input.subject,
    html: compliance.html,
    text: compliance.text,
    complianceLinks: compliance.links,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
