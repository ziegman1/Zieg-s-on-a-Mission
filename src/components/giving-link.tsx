"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from "react";
import {
  givingAnchorProps,
  isAbsoluteHttpUrl,
  isLegacyGivingHref,
  resolveGivingHref,
} from "@/data/giving";
import { flushAnalytics, trackCtaClick } from "@/lib/analytics/client";

type GivingLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href?: string | null;
  children: ReactNode;
  /** When false, leave non-legacy relative hrefs untouched (default true for give CTAs). */
  forceCanonicalWhenLegacy?: boolean;
  /**
   * Analytics event for this CTA. Defaults to external_giving_link_click for absolute URLs.
   * Set null to disable tracking on this instance.
   */
  analyticsEvent?: "external_giving_link_click" | "partner_with_us_click" | null;
};

/**
 * Storefront link for financial giving CTAs.
 * Legacy /give and Aplos URLs resolve to Mission Multiplied; absolute URLs open in a new tab.
 */
export function GivingLink({
  href,
  children,
  forceCanonicalWhenLegacy = true,
  analyticsEvent,
  onClick,
  ...rest
}: GivingLinkProps) {
  const resolved = forceCanonicalWhenLegacy
    ? resolveGivingHref(href)
    : (href?.trim() || resolveGivingHref(href));
  const props = givingAnchorProps(resolved);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    const path = typeof window !== "undefined" ? window.location.pathname : "/";
    const event =
      analyticsEvent === null
        ? null
        : analyticsEvent ??
          (isAbsoluteHttpUrl(props.href) ? "external_giving_link_click" : null);
    if (event) {
      let hrefHost: string | undefined;
      try {
        if (isAbsoluteHttpUrl(props.href)) hrefHost = new URL(props.href).host;
      } catch {
        hrefHost = undefined;
      }
      trackCtaClick(event, path, hrefHost ? { hrefHost, cta: event } : { cta: event });
      flushAnalytics();
    }
  };

  if (isAbsoluteHttpUrl(props.href)) {
    return (
      <a {...rest} href={props.href} target={props.target} rel={props.rel} onClick={handleClick}>
        {children}
      </a>
    );
  }

  return (
    <Link {...rest} href={props.href} onClick={handleClick}>
      {children}
    </Link>
  );
}

type StorefrontHrefLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: string;
  children: ReactNode;
};

function missionHubAnalyticsEvent(
  href: string,
): "mission_hub_entry_click" | "mission_hub_join_click" | null {
  const path = href.split("?")[0]?.split("#")[0] ?? href;
  if (path === "/community/join" || path.startsWith("/community/join/")) {
    return "mission_hub_join_click";
  }
  if (path === "/community" || path.startsWith("/community/")) {
    if (path.startsWith("/community/login")) return null;
    return "mission_hub_entry_click";
  }
  return null;
}

/**
 * Site Builder / marketing CTA link: rewrites legacy giving URLs and opens absolute HTTP(S) in a new tab.
 * Informational relative paths (e.g. /partner, /ministry-funding) stay in-app.
 */
export function StorefrontHrefLink({
  href,
  children,
  onClick,
  ...rest
}: StorefrontHrefLinkProps) {
  if (isLegacyGivingHref(href) || isAbsoluteHttpUrl(href)) {
    return (
      <GivingLink href={href} onClick={onClick} {...rest}>
        {children}
      </GivingLink>
    );
  }

  const hubEvent = missionHubAnalyticsEvent(href);
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || !hubEvent) return;
    const path = typeof window !== "undefined" ? window.location.pathname : "/";
    trackCtaClick(hubEvent, path, { cta: hubEvent, to: href.split("?")[0] ?? href });
    flushAnalytics();
  };

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
