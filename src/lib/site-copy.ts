import { cache } from "react";
import { DEFAULT_SITE_COPY, type SiteCopy } from "@/data/site-copy-defaults";
import { LEGAL_CONFIG } from "@/data/legal-config";
import {
  blocksFromStoredPayload,
  resolveSiteCopyFromPayload,
} from "@/lib/site-copy-blocks/payload";
import { resolveStorefrontShellContent } from "@/lib/site-builder/global-storefront-content";
import { prisma } from "@/lib/db";

export { mergeSiteCopyPayload } from "@/lib/site-copy-merge";

const SITE_COPY_ID = "default";

function hasDatabaseUrl(): boolean {
  const u = process.env.DATABASE_URL?.trim();
  return Boolean(u);
}

export const getSiteCopy = cache(async (): Promise<SiteCopy> => {
  if (!hasDatabaseUrl()) {
    return structuredClone(DEFAULT_SITE_COPY);
  }
  try {
    const row = await prisma.siteCopy.findUnique({ where: { id: SITE_COPY_ID } });
    return resolveSiteCopyFromPayload(row?.payload ?? {});
  } catch {
    return structuredClone(DEFAULT_SITE_COPY);
  }
});

export const getSiteCopyBlocksForAdmin = cache(async () => {
  if (!hasDatabaseUrl()) {
    return blocksFromStoredPayload({});
  }
  try {
    const row = await prisma.siteCopy.findUnique({ where: { id: SITE_COPY_ID } });
    return blocksFromStoredPayload(row?.payload ?? {});
  } catch {
    return blocksFromStoredPayload({});
  }
});

/** Legal templates + emails: support fields can be overridden from SiteCopy admin. */
export async function getMergedLegalConfig() {
  const shell = await resolveStorefrontShellContent();
  return {
    ...LEGAL_CONFIG,
    supportEmail: shell.legalSupport.value.supportEmail || LEGAL_CONFIG.supportEmail,
    supportResponseTime:
      shell.legalSupport.value.supportResponseTime || LEGAL_CONFIG.supportResponseTime,
  };
}

export function homeHeroWithHrefs(copy: SiteCopy) {
  return {
    headline: copy.homeHero.headline,
    subheadline: copy.homeHero.subheadline ?? "",
    body: copy.homeHero.body,
    primaryCta: { href: "/partner" as const, label: copy.homeHero.primaryCtaLabel },
    secondaryCta: { href: "/mission" as const, label: copy.homeHero.secondaryCtaLabel },
    tertiaryCta: { href: "/partner" as const, label: "Get Involved" },
  };
}
