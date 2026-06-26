import type { PageSection } from "./types";

export type MinistrySectionsLayout = {
  heroes: PageSection[];
  header: PageSection | undefined;
  middle: PageSection[];
  footer: PageSection | undefined;
};

/** Split ministry-page sections so heroes render full-width above the article column. */
export function partitionMinistrySections(sections: PageSection[]): MinistrySectionsLayout {
  const heroes = sections.filter((s) => s.sectionType === "hero");
  const header = sections.find((s) => s.sectionKey === "header");
  const footer = sections.find((s) => s.sectionKey === "footer-nav");
  const middle = sections.filter(
    (s) =>
      s.sectionType !== "hero" && s.sectionKey !== "header" && s.sectionKey !== "footer-nav",
  );
  return { heroes, header, middle, footer };
}
