import { defaultSectionsForPage } from "./defaults";
import type { ContentElement, ElementStyle } from "./element-types";
import { ELEMENT_STYLES_KEY } from "./element-types";
import { contentStr, getElementStyles, getFieldStyle, newListItem, sortedListItems } from "./content-utils";
import type { ListItem, PageSection, SectionType } from "./types";
import type { BuilderElementType, BuilderSelection } from "./element-types";

export function setFieldStyle(
  section: PageSection,
  elementId: string,
  style: ElementStyle | undefined,
): PageSection {
  const styles = { ...getElementStyles(section.content) };
  if (!style || Object.keys(style).length === 0) {
    delete styles[elementId];
  } else {
    styles[elementId] = style;
  }
  return {
    ...section,
    content: { ...section.content, [ELEMENT_STYLES_KEY]: styles },
  };
}

export function patchFieldStyle(
  section: PageSection,
  elementId: string,
  patch: Partial<ElementStyle>,
): PageSection {
  const prev = getFieldStyle(section.content, elementId) ?? {};
  return setFieldStyle(section, elementId, { ...prev, ...patch });
}

export function getContentElements(content: Record<string, unknown>): ContentElement[] {
  const raw = content.elements;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (x): x is ContentElement =>
        Boolean(x) &&
        typeof x === "object" &&
        typeof (x as ContentElement).id === "string" &&
        typeof (x as ContentElement).text === "string",
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function setContentElements(section: PageSection, elements: ContentElement[]): PageSection {
  return { ...section, content: { ...section.content, elements } };
}

export function newContentElement(
  type: ContentElement["type"],
  sortOrder: number,
): ContentElement {
  return {
    id: `el_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`,
    type,
    text: type === "heading" ? "New heading" : type === "quote" ? "Quote text" : "",
    visible: true,
    sortOrder,
    style: {},
  };
}

function cardsFrom(content: Record<string, unknown>): ListItem[] {
  return sortedListItems(content.cards, { includeHidden: true });
}

const CONTENT_LIST_KEYS: { prefix: string; key: string }[] = [
  { prefix: "bullet:", key: "bullets" },
  { prefix: "topic:", key: "topics" },
  { prefix: "item:", key: "items" },
];

export function findListItemByElementId(
  content: Record<string, unknown>,
  elementId: string,
): ListItem | undefined {
  for (const { prefix, key } of CONTENT_LIST_KEYS) {
    if (!elementId.startsWith(prefix)) continue;
    const id = elementId.slice(prefix.length);
    return sortedListItems(content[key], { includeHidden: true }).find((x) => x.id === id);
  }
  return undefined;
}

function patchContentListItem(
  section: PageSection,
  elementId: string,
  patch: {
    text?: string;
    style?: ElementStyle;
    stylePatch?: Partial<ElementStyle>;
    visible?: boolean;
  },
): PageSection | null {
  for (const { prefix, key } of CONTENT_LIST_KEYS) {
    if (!elementId.startsWith(prefix)) continue;
    const itemId = elementId.slice(prefix.length);
    const list = sortedListItems(section.content[key], { includeHidden: true }).map((item) =>
      item.id === itemId
        ? {
            ...item,
            text: patch.text ?? item.text,
            visible: patch.visible ?? item.visible,
            style: patch.stylePatch
              ? { ...item.style, ...patch.stylePatch }
              : patch.style ?? item.style,
          }
        : item,
    );
    return {
      ...section,
      content: { ...section.content, [key]: list.map((x, i) => ({ ...x, sortOrder: i })) },
    };
  }
  return null;
}

function setCards(section: PageSection, cards: ListItem[]): PageSection {
  return {
    ...section,
    content: {
      ...section.content,
      cards: cards.map((c, i) => ({ ...c, sortOrder: i })),
    },
  };
}

export function elementLabel(section: PageSection, elementId: string): string {
  if (elementId.startsWith("card:")) return "Card";
  if (elementId.startsWith("bullet:")) return "List item";
  if (elementId.startsWith("cta:")) return "Button";
  if (elementId.startsWith("el:")) {
    const el = getContentElements(section.content).find((e) => `el:${e.id}` === elementId);
    return el ? `Text (${el.type})` : "Text box";
  }
  if (elementId === "image") return "Image";
  if (elementId === "quote:text") return "Quote";
  if (elementId === "quote:attribution") return "Attribution";
  return elementId.charAt(0).toUpperCase() + elementId.slice(1).replace(/([A-Z])/g, " $1");
}

export function selectionFromElement(
  section: PageSection,
  elementId: string,
): BuilderSelection | null {
  const type = elementTypeForId(section, elementId);
  if (!type) return null;
  return {
    sectionId: section.id,
    elementId,
    elementType: type,
    label: elementLabel(section, elementId),
  };
}

function elementTypeForId(section: PageSection, elementId: string): BuilderElementType | null {
  if (elementId.startsWith("card:")) return "card";
  if (
    elementId.startsWith("bullet:") ||
    elementId.startsWith("topic:") ||
    elementId.startsWith("item:")
  ) {
    return "list_item";
  }
  if (elementId.startsWith("cta:")) return "button";
  if (elementId.startsWith("el:")) return "custom";
  if (elementId === "image") return "image";
  if (elementId.startsWith("quote:")) return "quote";
  if (
    ["headline", "eyebrow", "body", "subheadline", "intro", "quote", "attribution"].includes(
      elementId,
    )
  ) {
    return "text";
  }
  return null;
}

export function listEditableElements(section: PageSection): string[] {
  const c = section.content;
  const ids: string[] = [];
  const t = section.sectionType;

  if (t === "hero" || t === "text_section" || t === "cta" || t === "image_text_split") {
    for (const key of ["eyebrow", "headline", "subheadline", "intro", "body"]) {
      if (key in c || contentStr(c, key)) ids.push(key);
    }
  }
  if (t === "hero" || t === "text_section" || t === "cta" || t === "image_text_split") {
    if (contentStr(c, "primaryCtaLabel") || t !== "image_text_split") ids.push("cta:primary");
    if (
      contentStr(c, "secondaryCtaLabel") ||
      t === "hero" ||
      t === "cta" ||
      t === "text_section"
    ) {
      ids.push("cta:secondary");
    }
  }
  if (t === "hero" || t === "cta") ids.push("cta:tertiary");
  if (t === "hero" || t === "image_text_split") ids.push("image");
  if (t === "quote") {
    ids.push("quote:text", "quote:attribution");
  }
  if (t === "card_grid") {
    for (const card of cardsFrom(c)) ids.push(`card:${card.id}`);
    if (contentStr(c, "headline")) ids.push("headline");
    if (contentStr(c, "intro")) ids.push("intro");
    if (contentStr(c, "primaryCtaLabel")) ids.push("cta:primary");
  }
  if (t === "text_section" && Array.isArray(c.bullets)) {
    for (const b of sortedListItems(c.bullets, { includeHidden: true })) {
      ids.push(`bullet:${b.id}`);
    }
  }
  if (t === "featured_posts") {
    for (const key of ["headline", "body"]) {
      if (key in c || contentStr(c, key)) ids.push(key);
    }
    for (const topic of sortedListItems(c.topics, { includeHidden: true })) {
      ids.push(`topic:${topic.id}`);
    }
  }
  if (t === "timeline") {
    for (const key of ["headline", "intro"]) {
      if (key in c || contentStr(c, key)) ids.push(key);
    }
    for (const item of sortedListItems(c.items, { includeHidden: true })) {
      ids.push(`item:${item.id}`);
    }
  }
  for (const el of getContentElements(c)) ids.push(`el:${el.id}`);
  return ids;
}

export function updateSectionElement(
  section: PageSection,
  elementId: string,
  patch: {
    text?: string;
    metadata?: Record<string, unknown>;
    style?: ElementStyle;
    stylePatch?: Partial<ElementStyle>;
    visible?: boolean;
  },
): PageSection {
  if (elementId.startsWith("card:")) {
    const cardId = elementId.slice(5);
    const cards = cardsFrom(section.content).map((card) => {
      if (card.id !== cardId) return card;
      const style = patch.style ?? { ...card.style, ...patch.stylePatch };
      return {
        ...card,
        text: patch.text ?? card.text,
        visible: patch.visible ?? card.visible,
        metadata: patch.metadata ? { ...card.metadata, ...patch.metadata } : card.metadata,
        style: style && Object.keys(style).length ? style : card.style,
      };
    });
    return setCards(section, cards);
  }

  const listPatch = patchContentListItem(section, elementId, patch);
  if (listPatch) return listPatch;

  if (elementId.startsWith("el:")) {
    const elId = elementId.slice(3);
    const elements = getContentElements(section.content).map((el) =>
      el.id === elId
        ? {
            ...el,
            text: patch.text ?? el.text,
            visible: patch.visible ?? el.visible,
            style: patch.stylePatch
              ? { ...el.style, ...patch.stylePatch }
              : patch.style ?? el.style,
          }
        : el,
    );
    return setContentElements(section, elements);
  }

  if (elementId.startsWith("cta:")) {
    const slot = elementId.slice(4);
    const labelKey =
      slot === "primary"
        ? "primaryCtaLabel"
        : slot === "secondary"
          ? "secondaryCtaLabel"
          : "tertiaryCtaLabel";
    const urlKey =
      slot === "primary"
        ? "primaryCtaUrl"
        : slot === "secondary"
          ? "secondaryCtaUrl"
          : "tertiaryCtaUrl";
    let next = section;
    if (patch.text !== undefined) {
      next = {
        ...next,
        content: { ...next.content, [labelKey]: patch.text },
      };
    }
    if (patch.metadata?.url !== undefined) {
      next = {
        ...next,
        content: { ...next.content, [urlKey]: patch.metadata.url },
      };
    }
    if (patch.stylePatch || patch.style) {
      next = patchFieldStyle(next, elementId, {
        ...(getFieldStyle(next.content, elementId) ?? {}),
        ...patch.style,
        ...patch.stylePatch,
        visible: patch.visible ?? patch.stylePatch?.visible ?? patch.style?.visible,
      });
    }
    return next;
  }

  if (elementId === "image") {
    let next = section;
    if (patch.text !== undefined) {
      next = { ...next, content: { ...next.content, imageUrl: patch.text } };
    }
    if (patch.metadata?.alt !== undefined) {
      next = { ...next, content: { ...next.content, imageAlt: patch.metadata.alt } };
    }
    if (patch.stylePatch || patch.style) {
      next = patchFieldStyle(next, "image", {
        ...(getFieldStyle(next.content, "image") ?? {}),
        ...patch.style,
        ...patch.stylePatch,
      });
    }
    return next;
  }

  if (elementId === "quote:text") {
    return {
      ...section,
      content: {
        ...section.content,
        quote: patch.text ?? contentStr(section.content, "quote"),
      },
    };
  }
  if (elementId === "quote:attribution") {
    return {
      ...section,
      content: {
        ...section.content,
        attribution: patch.text ?? contentStr(section.content, "attribution"),
      },
    };
  }

  let next: PageSection = {
    ...section,
    content: {
      ...section.content,
      [elementId]: patch.text ?? contentStr(section.content, elementId),
    },
  };
  if (patch.stylePatch || patch.style || patch.visible !== undefined) {
    next = patchFieldStyle(next, elementId, {
      ...(getFieldStyle(next.content, elementId) ?? {}),
      ...patch.style,
      ...patch.stylePatch,
      ...(patch.visible !== undefined ? { visible: patch.visible } : {}),
    });
  }
  return next;
}

export function duplicateSectionElement(section: PageSection, elementId: string): PageSection {
  if (elementId.startsWith("card:")) {
    const cardId = elementId.slice(5);
    const cards = cardsFrom(section.content);
    const src = cards.find((c) => c.id === cardId);
    if (!src) return section;
    const copy: ListItem = {
      ...structuredClone(src),
      id: `card_${Date.now()}`,
      text: `${src.text} (copy)`,
      sortOrder: cards.length,
    };
    return setCards(section, [...cards, copy]);
  }
  if (elementId.startsWith("el:")) {
    const elId = elementId.slice(3);
    const elements = getContentElements(section.content);
    const src = elements.find((e) => e.id === elId);
    if (!src) return section;
    const copy: ContentElement = {
      ...structuredClone(src),
      id: `el_${Date.now()}`,
      sortOrder: elements.length,
    };
    return setContentElements(section, [...elements, copy]);
  }
  return section;
}

export function deleteSectionElement(section: PageSection, elementId: string): PageSection {
  if (elementId.startsWith("card:")) {
    const cardId = elementId.slice(5);
    return setCards(
      section,
      cardsFrom(section.content).filter((c) => c.id !== cardId),
    );
  }
  for (const { prefix, key } of CONTENT_LIST_KEYS) {
    if (!elementId.startsWith(prefix)) continue;
    const itemId = elementId.slice(prefix.length);
    const list = sortedListItems(section.content[key], { includeHidden: true }).filter(
      (x) => x.id !== itemId,
    );
    return { ...section, content: { ...section.content, [key]: list } };
  }
  if (elementId.startsWith("el:")) {
    const elId = elementId.slice(3);
    return setContentElements(
      section,
      getContentElements(section.content).filter((e) => e.id !== elId),
    );
  }
  return patchFieldStyle(section, elementId, { visible: false });
}

export function addCardToSection(section: PageSection): PageSection {
  const cards = cardsFrom(section.content);
  const item = newListItem(cards.length);
  item.metadata = { body: "", amountLabel: "", giftNote: "", cta: "", href: "" };
  return setCards(section, [...cards, item]);
}

export function addContentElementToSection(
  section: PageSection,
  type: ContentElement["type"],
): PageSection {
  const elements = getContentElements(section.content);
  return setContentElements(section, [...elements, newContentElement(type, elements.length)]);
}

export function reorderCards(section: PageSection, cardId: string, dir: -1 | 1): PageSection {
  const cards = cardsFrom(section.content);
  const i = cards.findIndex((c) => c.id === cardId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= cards.length) return section;
  const next = [...cards];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return setCards(section, next);
}

export function reorderContentElements(
  section: PageSection,
  elementId: string,
  dir: -1 | 1,
): PageSection {
  const elId = elementId.startsWith("el:") ? elementId.slice(3) : elementId;
  const elements = getContentElements(section.content);
  const i = elements.findIndex((e) => e.id === elId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= elements.length) return section;
  const next = [...elements];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return setContentElements(
    section,
    next.map((e, idx) => ({ ...e, sortOrder: idx })),
  );
}

export function clearElementStyle(section: PageSection, elementId: string): PageSection {
  if (elementId.startsWith("card:")) {
    const cardId = elementId.slice(5);
    const cards = cardsFrom(section.content).map((c) =>
      c.id === cardId ? { ...c, style: {} } : c,
    );
    return setCards(section, cards);
  }
  if (elementId.startsWith("el:")) {
    const elId = elementId.slice(3);
    const elements = getContentElements(section.content).map((el) =>
      el.id === elId ? { ...el, style: {} } : el,
    );
    return setContentElements(section, elements);
  }
  return setFieldStyle(section, elementId, {});
}

export function restoreElementFromDefaults(
  pageKey: string,
  section: PageSection,
  elementId: string,
): PageSection {
  const defaults = defaultSectionsForPage(pageKey);
  const def = defaults.find((s) => s.sectionKey === section.sectionKey);
  if (!def) return section;

  if (elementId.startsWith("card:")) {
    const cardId = elementId.slice(5);
    const defCards = sortedListItems(def.content.cards, { includeHidden: true });
    const idx = cardsFrom(section.content).findIndex((c) => c.id === cardId);
    const defCard = defCards[idx];
    if (!defCard) return section;
    const cards = cardsFrom(section.content).map((c) =>
      c.id === cardId ? { ...defCard, id: c.id } : c,
    );
    return setCards(section, cards);
  }

  if (elementId.startsWith("el:")) return section;

  const defStyles = getElementStyles(def.content);
  if (defStyles[elementId]) {
    return setFieldStyle(section, elementId, defStyles[elementId]);
  }

  const fieldKeys: Record<string, string> = {
    headline: "headline",
    body: "body",
    eyebrow: "eyebrow",
    intro: "intro",
    subheadline: "subheadline",
    image: "imageUrl",
    "quote:text": "quote",
    "quote:attribution": "attribution",
  };
  const key = fieldKeys[elementId] ?? elementId.replace("quote:", "");
  if (elementId.startsWith("cta:")) {
    const slot = elementId.slice(4);
    const labelKey =
      slot === "primary" ? "primaryCtaLabel" : slot === "secondary" ? "secondaryCtaLabel" : "tertiaryCtaLabel";
    const urlKey =
      slot === "primary" ? "primaryCtaUrl" : slot === "secondary" ? "secondaryCtaUrl" : "tertiaryCtaUrl";
    return {
      ...section,
      content: {
        ...section.content,
        [labelKey]: def.content[labelKey],
        [urlKey]: def.content[urlKey],
      },
    };
  }

  return {
    ...section,
    content: {
      ...section.content,
      [key]: def.content[key],
      [ELEMENT_STYLES_KEY]: {
        ...getElementStyles(section.content),
        [elementId]: defStyles[elementId] ?? getFieldStyle(section.content, elementId),
      },
    },
  };
}

export const EDITABLE_SECTION_TYPES: SectionType[] = [
  "hero",
  "text_section",
  "image_text_split",
  "card_grid",
  "quote",
  "cta",
  "timeline",
  "featured_posts",
];
