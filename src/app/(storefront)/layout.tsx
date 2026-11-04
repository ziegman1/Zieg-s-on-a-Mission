import Link from "next/link";
import { headers } from "next/headers";
import {
  AnalyticsConsentBanner,
  AnalyticsPreferencesButton,
} from "@/components/analytics-consent-banner";
import { AnalyticsPrivacyProvider } from "@/components/analytics-privacy-provider";
import { GivingLink, StorefrontHrefLink } from "@/components/giving-link";
import { PageViewTracker } from "@/components/page-view-tracker";
import { StorefrontHeader } from "@/components/storefront-header";
import { SiteBuilderFormattedContent } from "@/components/site-builder/site-builder-formatted-content";
import { isAbsoluteHttpUrl, isLegacyGivingHref, resolveGivingHref } from "@/data/giving";
import { resolveStorefrontShellContent } from "@/lib/site-builder/global-storefront-content";

const FOOTER_LEGAL = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/shipping", label: "Shipping" },
  { href: "/returns", label: "Returns" },
] as const;

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shell = await resolveStorefrontShellContent();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isMissionHub =
    pathname === "/community" || pathname.startsWith("/community/");
  const isCampaignLanding =
    pathname === "/support-campaign" || pathname === "/campaign";

  if (isMissionHub) {
    return (
      <AnalyticsPrivacyProvider>
        <div className="min-h-dvh bg-[#ebe8e4] text-brand-ink">
          <PageViewTracker />
          {children}
          <div className="fixed bottom-3 right-3 z-50">
            <AnalyticsPreferencesButton className="rounded-md bg-black/50 px-2 py-1 text-xs text-white/90 hover:bg-black/70" />
          </div>
          <AnalyticsConsentBanner />
        </div>
      </AnalyticsPrivacyProvider>
    );
  }

  return (
    <AnalyticsPrivacyProvider>
      <div className="min-h-screen flex flex-col bg-brand-surface text-brand-ink">
        <PageViewTracker />
        <StorefrontHeader
          siteName={shell.siteName.value}
          labelOverrides={shell.headerNavLabelOverrides.value}
          giveNowLabel={shell.giveNow.value.label}
          giveNowHref={shell.giveNow.value.href}
          getInvolvedItems={shell.getInvolved.value.items}
        />
        <main className="flex-1">{children}</main>
        {!isCampaignLanding ? (
          <footer className="border-t border-brand-primary/25 bg-white/40 py-12 px-4">
            <div className="max-w-7xl mx-auto text-center text-sm text-brand-ink/80">
              <p className="font-serif text-lg text-brand-primary tracking-wide">{shell.siteName.value}</p>
              {shell.footerBlurb.value.trim() ? (
                <SiteBuilderFormattedContent
                  text={shell.footerBlurb.value}
                  className="mt-2 max-w-lg mx-auto leading-relaxed text-sm text-brand-ink/80 [&_p]:text-sm [&_p]:text-brand-ink/80"
                />
              ) : null}
              <nav className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-brand-ink/90">
                {shell.footerNavLinks.value.map(({ href, label }) => {
                  const resolvedHref = isLegacyGivingHref(href)
                    ? resolveGivingHref(href)
                    : href;
                  const className = "hover:text-brand-primary transition-colors";
                  if (isAbsoluteHttpUrl(resolvedHref) || isLegacyGivingHref(href)) {
                    return (
                      <GivingLink key={`${href}-${label}`} href={resolvedHref} className={className}>
                        {label}
                      </GivingLink>
                    );
                  }
                  return (
                    <StorefrontHrefLink
                      key={`${href}-${label}`}
                      href={resolvedHref}
                      className={className}
                    >
                      {label}
                    </StorefrontHrefLink>
                  );
                })}
                {FOOTER_LEGAL.map(({ href, label }) => (
                  <Link key={href} href={href} className="hover:text-brand-primary transition-colors">
                    {label}
                  </Link>
                ))}
                <AnalyticsPreferencesButton className="hover:text-brand-primary transition-colors" />
              </nav>
            {shell.legalSupport.value.supportEmail.trim() ? (
              <p className="mt-6 text-brand-ink/60">
                Questions?{" "}
                <a
                  href={`mailto:${shell.legalSupport.value.supportEmail}`}
                  className="text-brand-primary hover:underline"
                >
                  {shell.legalSupport.value.supportEmail}
                </a>
                {shell.legalSupport.value.supportResponseTime.trim()
                  ? ` — we aim to respond ${shell.legalSupport.value.supportResponseTime}.`
                  : null}
              </p>
            ) : null}
            <p className="mt-6 text-brand-ink/60">
              © {new Date().getFullYear()} {shell.siteName.value}. All rights reserved.
            </p>
          </div>
        </footer>
      ) : null}
        <AnalyticsConsentBanner />
      </div>
    </AnalyticsPrivacyProvider>
  );
}
