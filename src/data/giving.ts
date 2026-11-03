/**
 * Canonical financial giving destination for Zieg's On A Mission.
 * All direct Give / Donate / Become a Financial Partner actions should use this URL.
 */

export const CANONICAL_GIVING_URL =
  "https://mission-multiplied.raiselysite.com/jeremy-ziegenhorn" as const;

/** Former internal donation-only path. */
export const LEGACY_GIVING_PATH = "/give" as const;

/** Known legacy processor URLs that should resolve to Mission Multiplied. */
export const LEGACY_EXTERNAL_GIVING_URLS = [
  "https://app.aplos.com/aws/give/TeamExpansion/jeremylindsayZiegenhorn",
] as const;

export function isAbsoluteHttpUrl(href: string): boolean {
  return /^https?:\/\//i.test(href.trim());
}

export function normalizeHrefForCompare(href: string): string {
  return href.trim().replace(/\/+$/, "");
}

export function isLegacyGivingHref(href: string): boolean {
  const raw = href.trim();
  if (!raw) return false;
  if (raw === LEGACY_GIVING_PATH || raw.startsWith(`${LEGACY_GIVING_PATH}?`)) return true;
  const normalized = normalizeHrefForCompare(raw);
  return LEGACY_EXTERNAL_GIVING_URLS.some(
    (legacy) => normalizeHrefForCompare(legacy) === normalized,
  );
}

/** Prefer the canonical Mission Multiplied URL for empty or legacy giving hrefs. */
export function resolveGivingHref(href?: string | null): string {
  const raw = typeof href === "string" ? href.trim() : "";
  if (!raw || isLegacyGivingHref(raw)) return CANONICAL_GIVING_URL;
  return raw;
}

export type GivingAnchorProps = {
  href: string;
  target?: "_blank";
  rel?: "noopener noreferrer";
};

/** Props for anchors that open the canonical (or other absolute) giving destination. */
export function givingAnchorProps(href?: string | null): GivingAnchorProps {
  const resolved = resolveGivingHref(href);
  if (isAbsoluteHttpUrl(resolved)) {
    return {
      href: resolved,
      target: "_blank",
      rel: "noopener noreferrer",
    };
  }
  return { href: resolved };
}

/**
 * Rewrite legacy giving URLs inside Site Builder section content (CTA fields + card metadata).
 * Returns whether any value changed.
 */
export function migrateGivingUrlsInSectionContent(
  content: Record<string, unknown>,
): boolean {
  let changed = false;

  for (const key of ["primaryCtaUrl", "secondaryCtaUrl", "tertiaryCtaUrl"] as const) {
    const value = content[key];
    if (typeof value === "string" && isLegacyGivingHref(value)) {
      content[key] = CANONICAL_GIVING_URL;
      changed = true;
    }
  }

  const cards = content.cards;
  if (Array.isArray(cards)) {
    for (const card of cards) {
      if (!card || typeof card !== "object" || Array.isArray(card)) continue;
      const row = card as Record<string, unknown>;
      const meta = row.metadata;
      if (!meta || typeof meta !== "object" || Array.isArray(meta)) continue;
      const metadata = meta as Record<string, unknown>;
      if (typeof metadata.href === "string" && isLegacyGivingHref(metadata.href)) {
        metadata.href = CANONICAL_GIVING_URL;
        changed = true;
      }
    }
  }

  const bullets = content.bullets;
  if (Array.isArray(bullets)) {
    for (const bullet of bullets) {
      if (!bullet || typeof bullet !== "object" || Array.isArray(bullet)) continue;
      const row = bullet as Record<string, unknown>;
      if (typeof row.href === "string" && isLegacyGivingHref(row.href)) {
        row.href = CANONICAL_GIVING_URL;
        changed = true;
      }
    }
  }

  return changed;
}
