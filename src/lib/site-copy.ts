import { cache } from "react";
import { DEFAULT_SITE_COPY, type SiteCopy } from "@/data/site-copy-defaults";
import { LEGAL_CONFIG } from "@/data/legal-config";
import {
  blocksFromStoredPayload,
  resolveSiteCopyFromPayload,
} from "@/lib/site-copy-blocks/payload";
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
  const copy = await getSiteCopy();
  return {
    ...LEGAL_CONFIG,
    supportEmail: copy.legalSupport.supportEmail || LEGAL_CONFIG.supportEmail,
    supportResponseTime:
      copy.legalSupport.supportResponseTime || LEGAL_CONFIG.supportResponseTime,
  };
}

export function homeHeroWithHrefs(copy: SiteCopy) {
  return {
    headline: copy.homeHero.headline,
    body: copy.homeHero.body,
    primaryCta: { href: "/partner" as const, label: copy.homeHero.primaryCtaLabel },
    secondaryCta: { href: "/give" as const, label: copy.homeHero.secondaryCtaLabel },
  };
}
