import type { Metadata } from "next";
import Link from "next/link";
import { PrivacyAnalyticsPreferences } from "@/components/privacy-analytics-preferences";
import { LegalPageShell } from "../legal/page-shell";
import { getMergedLegalConfig, getSiteCopy } from "@/lib/site-copy";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getSiteCopy();
  return {
    title: "Privacy Policy",
    description: `Privacy Policy for ${copy.site.name}.`,
  };
}

export default async function PrivacyPage() {
  const copy = await getSiteCopy();
  const { supportEmail, privacyEffectiveDate, siteUrl } = await getMergedLegalConfig();

  return (
    <LegalPageShell title="Privacy Policy">
      <p className="text-brand-ink/60 text-sm">
        <strong>Effective date:</strong> {privacyEffectiveDate}
      </p>

      <p>
        {copy.site.name} operates {siteUrl}. This Privacy Policy describes how we collect, use, and
        protect information when you visit our site or make a purchase.
      </p>

      <h2>Information We Collect</h2>
      <ul>
        <li>
          <strong>Order information:</strong> Name, email, billing and shipping address, phone (if
          provided), and order details.
        </li>
        <li>
          <strong>Payment:</strong> Processed by Stripe. We do not store full card numbers.
        </li>
        <li>
          <strong>Session data:</strong> For admin sign-in and site functionality.
        </li>
        <li>
          <strong>Device/usage:</strong> Hosting provider may collect basic server logs. We collect
          first-party analytics for internal ministry and site improvement: page paths, referrer
          (when present), a salted hash of IP address (for approximate unique-visitor estimates —
          not a personal identity), short-lived tab session identifiers stored in browser
          session storage (not a persistent cookie), coarse engagement signals (scroll depth
          thresholds and active-time buckets while the tab is visible and focused), and
          allowlisted ministry CTA events (for example Partner With Us or giving-link clicks).
          We may label traffic as likely human, unverified, or likely bot using request and
          engagement signals; these labels are estimates, not proof of personhood. We do not use
          third-party analytics, marketing pixels, session replay, keystroke logging, precise
          mouse tracking, fingerprints, or payment/donation amounts in analytics.
        </li>
      </ul>

      <h2>How We Use Your Information</h2>
      <p>
        To process orders, communicate with you, provide support, prevent fraud, understand
        aggregate storefront traffic and ministry CTA interest, and comply with law.
      </p>

      <h2>Service Providers</h2>
      <p>We share data with Stripe (payments), Printify (fulfillment), Vercel (hosting), and Resend (email). See their privacy policies for details. We do not sell your information.</p>

      <h2>Cookies &amp; local storage</h2>
      <p>
        We use essential cookies for sessions and cart persistence. Short-lived analytics session
        identifiers use browser session storage (cleared when the tab/session ends) and are not
        marketing cookies. No third-party analytics or marketing cookies. If your browser sends a
        Do Not Track signal, we skip engagement and CTA analytics events; where analytics is
        otherwise allowed, basic first-party page view recording for site operations may still
        occur and is labeled unverified unless other server-side signals apply.
      </p>

      <h2>Regional analytics choice (EEA / UK)</h2>
      <p>
        When our hosting provider indicates you are visiting from the EEA or United Kingdom — or
        when we cannot determine your location — we do not write analytics session storage, record
        page views or engagement, or store salted visitor estimates until you accept analytics.
        You can Accept or Decline in the on-site prompt, and change your choice later via
        &quot;Analytics preferences&quot; in the site footer (shown in those regions). An HttpOnly
        preference cookie stores only your choice (granted or denied), not a tracking profile.
        Visitors in other regions (including the United States) receive the disclosed first-party
        analytics described above without that prompt, still with Do Not Track honored for
        engagement and CTA events.
      </p>
      <PrivacyAnalyticsPreferences />

      <h2>Data Retention</h2>
      <p>
        We retain order and account data as needed for orders, support, and legal compliance.
        First-party analytics events and sessions are kept only as long as operationally useful
        (target about 90 days) and then deleted. Request deletion at {supportEmail}.
      </p>

      <h2>Your Rights</h2>
      <p>Contact {supportEmail} for access, correction, or deletion requests.</p>

      <h2>California Privacy Rights</h2>
      <p>If applicable under California law, you may have additional rights. Contact {supportEmail}.</p>

      <h2>Other U.S. State Privacy Rights</h2>
      <p>Certain states may provide additional rights. Contact {supportEmail}.</p>

      <h2>Children</h2>
      <p>Our site is not intended for children under 13.</p>

      <h2>Security</h2>
      <p>We use reasonable measures. No method is 100% secure.</p>

      <h2>Changes</h2>
      <p>We may update this policy. Continued use constitutes acceptance.</p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
      </p>

      <p className="mt-8 pt-6 border-t border-brand-primary/25">
        <Link href="/" className="text-brand-primary hover:underline">
          Back to home
        </Link>
      </p>
    </LegalPageShell>
  );
}
