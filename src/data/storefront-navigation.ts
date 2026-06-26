/**
 * Canonical storefront header and footer navigation structure.
 * Header uses dropdown grouping; footer includes engagement and giving links.
 */

export type StorefrontNavLink = {
  href: string;
  label: string;
};

export type GetInvolvedNavItem = StorefrontNavLink & {
  description?: string;
};

export const ABOUT_MISSION_NAV: StorefrontNavLink = {
  href: "/about",
  label: "About & Mission",
};

/** Header links before the Get Involved dropdown. */
export const HEADER_NAV_BEFORE_GET_INVOLVED = ["/", "/about"] as const;

/** Header links after the Get Involved dropdown. */
export const HEADER_NAV_AFTER_GET_INVOLVED = ["/community", "/blog", "/contact"] as const;

/** Top-level header items in display order (Get Involved is a dropdown, not a direct link). */
export const STOREFRONT_HEADER_NAV: StorefrontNavLink[] = [
  { href: "/", label: "Home" },
  ABOUT_MISSION_NAV,
  { href: "/community", label: "Community" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export const GET_INVOLVED_NAV = {
  label: "Get Involved",
  /** Matches site-copy navLinks entry for admin label overrides. */
  labelHref: "/partner",
  items: [
    {
      href: "/partner",
      label: "Become a Monthly Partner",
      description: "Join as a recurring monthly ministry partner.",
    },
    {
      href: "/advocacy-team",
      label: "Join the Advocacy Team",
      description: "Pray, connect, and help expand ministry partnerships.",
    },
  ] satisfies GetInvolvedNavItem[],
};

export const GIVE_NOW_NAV: StorefrontNavLink = {
  href: "/give",
  label: "Give Now",
};

/** Flat links for footer — includes engagement paths not shown in the header. */
export const STOREFRONT_FOOTER_NAV: StorefrontNavLink[] = [
  { href: "/", label: "Home" },
  ABOUT_MISSION_NAV,
  { href: "/partner", label: "Become a Partner" },
  { href: "/advocacy-team", label: "Advocacy Team" },
  { href: "/community", label: "Community" },
  { href: "/blog", label: "Blog" },
  { href: "/merch", label: "Merch" },
  { href: "/give", label: "Give" },
  { href: "/contact", label: "Contact" },
];

/** Site-copy navLinks shape (admin-editable labels; hrefs fixed by index). */
export function defaultSiteCopyNavLinks(): StorefrontNavLink[] {
  return [
    { href: "/", label: "Home" },
    ABOUT_MISSION_NAV,
    { href: GET_INVOLVED_NAV.labelHref, label: GET_INVOLVED_NAV.label },
    { href: "/community", label: "Community" },
    { href: "/blog", label: "Blog" },
    { href: "/merch", label: "Merch" },
    { href: "/contact", label: "Contact" },
  ];
}

export type NavLabelOverrides = Record<string, string>;

export function navLabel(
  href: string,
  fallback: string,
  overrides: NavLabelOverrides,
): string {
  const custom = overrides[href]?.trim();
  return custom && custom.length > 0 ? custom : fallback;
}
