import {
  GET_INVOLVED_NAV,
  GIVE_NOW_NAV,
  type GetInvolvedNavItem,
} from "@/data/storefront-navigation";
import type { NavLinkDef } from "@/data/site-copy-defaults";
import type { ContentBlock } from "./types";

export type StorefrontNavExtras = {
  giveNowLabel: string;
  getInvolvedItems: GetInvolvedNavItem[];
};

function navExtraBlock(
  order: { n: number },
  blockKey: string,
  label: string,
  value: string,
  metadata: Record<string, unknown>,
): ContentBlock {
  return {
    id: blockKey,
    sortOrder: order.n++,
    pageKey: "global",
    sectionKey: "navigation",
    blockKey,
    blockType: "nav_link",
    label,
    value,
    lines: [],
    visible: true,
    metadata,
  };
}

/** Append Give Now + Get Involved dropdown blocks (after nav.link.* in encode). */
export function appendNavigationExtraBlocks(
  order: { n: number },
  blocks: ContentBlock[],
): void {
  blocks.push(
    navExtraBlock(
      order,
      "nav.giveNow.label",
      `Give Now button (${GIVE_NOW_NAV.href})`,
      GIVE_NOW_NAV.label,
      { href: GIVE_NOW_NAV.href, role: "give_now" },
    ),
  );

  GET_INVOLVED_NAV.items.forEach((item, i) => {
    blocks.push(
      navExtraBlock(
        order,
        `nav.getInvolved.${i}`,
        `Get Involved item (${item.href})`,
        item.label,
        { href: item.href, description: item.description ?? "", role: "get_involved_item", index: i },
      ),
    );
  });
}

function fieldFromBlock(
  block: ContentBlock | undefined,
  fallback: string,
): string {
  if (!block?.visible) return fallback;
  const v = block.value?.trim() ?? "";
  return v.length > 0 ? v : fallback;
}

export function resolveNavigationExtras(blocks: ContentBlock[]): StorefrontNavExtras {
  const byKey = new Map(blocks.map((b) => [b.blockKey, b]));

  const giveNowLabel = fieldFromBlock(byKey.get("nav.giveNow.label"), GIVE_NOW_NAV.label);

  const getInvolvedItems = GET_INVOLVED_NAV.items.map((def, i) => {
    const b = byKey.get(`nav.getInvolved.${i}`);
    const label = fieldFromBlock(b, def.label);
    const description =
      b?.visible && typeof b.metadata?.description === "string" && b.metadata.description.trim()
        ? String(b.metadata.description).trim()
        : def.description;
    return { href: def.href, label, description };
  });

  return { giveNowLabel, getInvolvedItems };
}

export type StorefrontNavigationPatch = {
  navLinks: NavLinkDef[];
  giveNowLabel: string;
  getInvolvedItems: GetInvolvedNavItem[];
};

/** Update nav.link.* and navigation extra blocks in place. */
export function patchStorefrontNavigationBlocks(
  blocks: ContentBlock[],
  patch: StorefrontNavigationPatch,
): ContentBlock[] {
  const next = blocks.map((b) => ({ ...b, lines: [...b.lines], metadata: { ...b.metadata } }));

  const upsert = (block: ContentBlock) => {
    const idx = next.findIndex((b) => b.blockKey === block.blockKey);
    if (idx >= 0) {
      next[idx] = block;
    } else {
      next.push(block);
    }
  };

  let maxOrder = next.reduce((m, b) => Math.max(m, b.sortOrder), -1);
  const order = { n: maxOrder + 1 };

  patch.navLinks.forEach((link, i) => {
    const existing = [...next]
      .filter((b) => b.pageKey === "global" && b.sectionKey === "navigation")
      .find((b) => b.metadata?.href === link.href || b.blockKey === `nav.link.${i}`);

    upsert({
      id: existing?.id ?? `nav.link.${i}`,
      sortOrder: existing?.sortOrder ?? order.n++,
      pageKey: "global",
      sectionKey: "navigation",
      blockKey: existing?.blockKey ?? `nav.link.${i}`,
      blockType: "nav_link",
      label: `Nav label (${link.href})`,
      value: link.label,
      lines: [],
      visible: true,
      metadata: { href: link.href, index: i },
    });
  });

  upsert(
    navExtraBlock(
      order,
      "nav.giveNow.label",
      `Give Now button (${GIVE_NOW_NAV.href})`,
      patch.giveNowLabel,
      { href: GIVE_NOW_NAV.href, role: "give_now" },
    ),
  );

  patch.getInvolvedItems.forEach((item, i) => {
    const def = GET_INVOLVED_NAV.items[i];
    if (!def) return;
    upsert(
      navExtraBlock(
        order,
        `nav.getInvolved.${i}`,
        `Get Involved item (${def.href})`,
        item.label,
        {
          href: def.href,
          description: item.description ?? "",
          role: "get_involved_item",
          index: i,
        },
      ),
    );
  });

  return next;
}

/** Default navigation blocks for resetSectionToDefaults on global/navigation. */
export function defaultNavigationBlocks(): ContentBlock[] {
  const order = { n: 0 };
  const blocks: ContentBlock[] = [];
  appendNavigationExtraBlocks(order, blocks);
  return blocks;
}
