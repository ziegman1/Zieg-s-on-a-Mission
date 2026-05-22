import { DEFAULT_SITE_COPY } from "@/data/site-copy-defaults";
import { mergeSiteCopyPayload } from "@/lib/site-copy-merge";
import type { ContentBlock, SiteCopyBlocksPayload } from "./types";
import { SITE_COPY_PAYLOAD_VERSION } from "./types";
import { siteCopyToBlocks } from "./encode";
import { blocksToSiteCopy } from "./resolve";

function isV2Payload(raw: unknown): raw is SiteCopyBlocksPayload {
  return (
    Boolean(raw) &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    (raw as SiteCopyBlocksPayload).version === SITE_COPY_PAYLOAD_VERSION &&
    Array.isArray((raw as SiteCopyBlocksPayload).blocks)
  );
}

/** Load blocks from DB payload — migrates legacy v1 on first read without writing. */
export function blocksFromStoredPayload(dbPayload: unknown): ContentBlock[] {
  if (isV2Payload(dbPayload)) {
    return dbPayload.blocks;
  }
  const merged = mergeSiteCopyPayload(dbPayload ?? {});
  return siteCopyToBlocks(merged);
}

export function toStoredPayload(blocks: ContentBlock[]): SiteCopyBlocksPayload {
  return {
    version: SITE_COPY_PAYLOAD_VERSION,
    blocks,
  };
}

export function resolveSiteCopyFromPayload(dbPayload: unknown) {
  if (isV2Payload(dbPayload)) {
    return blocksToSiteCopy(dbPayload.blocks);
  }
  return mergeSiteCopyPayload(dbPayload ?? {});
}

export function defaultBlocks(): ContentBlock[] {
  return siteCopyToBlocks(structuredClone(DEFAULT_SITE_COPY));
}

export function blocksForPage(blocks: ContentBlock[], pageKey: string): ContentBlock[] {
  return blocks.filter((b) => b.pageKey === pageKey);
}

export function blocksForSection(
  blocks: ContentBlock[],
  pageKey: string,
  sectionKey: string,
): ContentBlock[] {
  return blocks.filter((b) => b.pageKey === pageKey && b.sectionKey === sectionKey);
}

export function resetSectionToDefaults(
  blocks: ContentBlock[],
  pageKey: string,
  sectionKey: string,
): ContentBlock[] {
  const defaults = defaultBlocks();
  const defaultSection = defaults.filter(
    (b) => b.pageKey === pageKey && b.sectionKey === sectionKey,
  );
  const rest = blocks.filter((b) => !(b.pageKey === pageKey && b.sectionKey === sectionKey));
  return [...rest, ...defaultSection];
}
