export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsletterArticle } from "@/components/newsletter/newsletter-article";
import { getNewsletterBrandSettings } from "@/lib/newsletter/brand-settings";
import {
  getNewsletterBySlug,
  getNewsletterBySlugAnyStatus,
  getPublishedNewsletterSlugs,
  isNewsletterPubliclyVisible,
} from "@/lib/newsletter/newsletter-db";
import { requireAdminSession } from "@/lib/admin-auth";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await getPublishedNewsletterSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const newsletter = await getNewsletterBySlug(slug);
  if (!newsletter) return { title: "Newsletter" };
  const title = newsletter.seoTitle.trim() || newsletter.title;
  const description =
    newsletter.seoDescription.trim() || newsletter.excerpt.trim() || newsletter.subtitle.trim() || undefined;
  return {
    title,
    description,
    openGraph: newsletter.featuredImageUrl
      ? { images: [{ url: newsletter.featuredImageUrl, alt: newsletter.title }] }
      : undefined,
  };
}

export default async function NewsletterDetailPage({ params }: Props) {
  const { slug } = await params;
  let newsletter = await getNewsletterBySlug(slug);
  let isAdminPreview = false;
  const adminSession = await requireAdminSession();

  if (!newsletter) {
    if (adminSession) {
      const draft = await getNewsletterBySlugAnyStatus(slug);
      if (draft && !isNewsletterPubliclyVisible(draft.status)) {
        newsletter = draft;
        isAdminPreview = true;
      }
    }
  }

  if (!newsletter) notFound();

  const brand = await getNewsletterBrandSettings();
  const showAdminSharePanel =
    Boolean(adminSession) && isNewsletterPubliclyVisible(newsletter.status);

  return (
    <NewsletterArticle
      newsletter={newsletter}
      brand={brand}
      showAdminSharePanel={showAdminSharePanel}
      adminPreviewBanner={
        isAdminPreview ? (
          <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800">
            Admin preview — this newsletter is not public ({newsletter.status.toLowerCase()}).
          </p>
        ) : undefined
      }
    />
  );
}
