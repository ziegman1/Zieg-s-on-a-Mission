"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  givingAnchorProps,
  isAbsoluteHttpUrl,
  isLegacyGivingHref,
  resolveGivingHref,
} from "@/data/giving";

type GivingLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href?: string | null;
  children: ReactNode;
  /** When false, leave non-legacy relative hrefs untouched (default true for give CTAs). */
  forceCanonicalWhenLegacy?: boolean;
};

/**
 * Storefront link for financial giving CTAs.
 * Legacy /give and Aplos URLs resolve to Mission Multiplied; absolute URLs open in a new tab.
 */
export function GivingLink({
  href,
  children,
  forceCanonicalWhenLegacy = true,
  ...rest
}: GivingLinkProps) {
  const resolved = forceCanonicalWhenLegacy
    ? resolveGivingHref(href)
    : (href?.trim() || resolveGivingHref(href));
  const props = givingAnchorProps(resolved);

  if (isAbsoluteHttpUrl(props.href)) {
    return (
      <a {...rest} href={props.href} target={props.target} rel={props.rel}>
        {children}
      </a>
    );
  }

  return (
    <Link {...rest} href={props.href}>
      {children}
    </Link>
  );
}

type StorefrontHrefLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & {
  href: string;
  children: ReactNode;
};

/**
 * Site Builder / marketing CTA link: rewrites legacy giving URLs and opens absolute HTTP(S) in a new tab.
 * Informational relative paths (e.g. /partner, /ministry-funding) stay in-app.
 */
export function StorefrontHrefLink({ href, children, ...rest }: StorefrontHrefLinkProps) {
  if (isLegacyGivingHref(href) || isAbsoluteHttpUrl(href)) {
    return (
      <GivingLink href={href} {...rest}>
        {children}
      </GivingLink>
    );
  }
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}
