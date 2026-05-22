import { ReactNode } from "react";
import { PageSectionsRenderer } from "@/components/site-builder/page-sections-renderer";
import { getSiteCopy } from "@/lib/site-copy";
import { getPublishedPageSections, pageHasCustomSections } from "./sections-db";

export async function renderStorefrontPage(
  pageKey: string,
  legacy: () => ReactNode,
): Promise<ReactNode> {
  const hasCustom = await pageHasCustomSections(pageKey);
  if (!hasCustom) {
    return legacy();
  }
  const [sections, copy] = await Promise.all([
    getPublishedPageSections(pageKey),
    getSiteCopy(),
  ]);
  return (
    <PageSectionsRenderer
      pageKey={pageKey}
      sections={sections}
      siteTagline={copy.site.tagline}
    />
  );
}
