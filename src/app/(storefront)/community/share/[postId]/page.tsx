import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommunityPostCoverImage } from "@/components/community/community-post-cover-image";
import { formatCommunityPostDate } from "@/lib/community/format-post-date";
import {
  MISSION_HUB_LOGIN_PATH,
  MISSION_HUB_JOIN_PATH,
  MISSION_HUB_SHARE_INVITATION,
  buildSharePageSocialMetadata,
} from "@/lib/community/post-public-share";
import { loadPublicSharePagePreview } from "@/lib/community/post-public-share-server";
import { getMissionHubSiteOrigin } from "@/lib/mission-hub/site-url";
import { getSiteCopy } from "@/lib/site-copy";
import { CommunityLinkedText } from "@/components/community/community-linked-text";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ postId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { postId } = await params;
  const preview = await loadPublicSharePagePreview(postId);
  if (!preview) {
    return { title: "Not found", robots: { index: false, follow: false } };
  }

  const siteOrigin = getMissionHubSiteOrigin();
  const social = buildSharePageSocialMetadata(preview, siteOrigin);

  return {
    title: social.title,
    description: social.description,
    alternates: { canonical: social.canonical },
    openGraph: {
      title: social.title,
      description: social.description,
      url: social.canonical,
      type: "article",
      images: [{ url: social.ogImage, alt: social.title }],
    },
    twitter: {
      card: preview.coverImageUrl ? "summary_large_image" : "summary",
      title: social.title,
      description: social.description,
      images: [social.ogImage],
    },
  };
}

export default async function CommunityPostSharePage({ params }: PageProps) {
  const { postId } = await params;
  const [preview, copy] = await Promise.all([
    loadPublicSharePagePreview(postId),
    getSiteCopy(),
  ]);

  if (!preview) notFound();

  const dateLabel = formatCommunityPostDate(preview.publishedAt);
  const hubPostHref = preview.hubPostPath;
  const externalHref = preview.usesHubSharePage ? null : preview.preferredSharePath;

  return (
    <main className="min-h-dvh bg-[#ebe8e4] text-brand-ink">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-ink/45 mb-4">
          {copy.site.name} · Mission Hub
        </p>

        <article className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white/95 shadow-[0_8px_32px_rgba(28,42,68,0.08)]">
          {preview.coverImageUrl ? (
            <CommunityPostCoverImage src={preview.coverImageUrl} alt="" />
          ) : null}

          <div className="px-5 py-6 sm:px-7 sm:py-8 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-brand-primary">{preview.spaceTitle}</p>
              {dateLabel ? (
                <time
                  dateTime={preview.publishedAt}
                  className="block text-[11px] text-brand-ink/45"
                >
                  {dateLabel}
                </time>
              ) : null}
              <h1 className="font-serif text-2xl sm:text-3xl text-brand-ink leading-snug tracking-wide">
                {preview.title}
              </h1>
            </div>

            <p className="text-sm sm:text-base text-brand-ink/75 leading-relaxed whitespace-pre-wrap">
              <CommunityLinkedText text={preview.excerpt} />
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {externalHref ? (
                <Link
                  href={externalHref}
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-5 py-2.5",
                    "text-sm font-semibold bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors",
                  )}
                >
                  Read full update
                </Link>
              ) : null}
              <Link
                href={hubPostHref}
                className={cn(
                  "inline-flex items-center justify-center rounded-full px-5 py-2.5",
                  "text-sm font-semibold",
                  externalHref
                    ? "border border-brand-primary/25 text-brand-primary hover:bg-brand-primary/5"
                    : "bg-brand-primary text-white hover:bg-brand-primary/90",
                  "transition-colors",
                )}
              >
                Read in Mission Hub
              </Link>
            </div>
          </div>
        </article>

        <section
          className="mt-8 rounded-2xl border border-brand-primary/15 bg-brand-primary/[0.04] px-5 py-6 sm:px-7 sm:py-8"
          aria-labelledby="mission-hub-invite-heading"
        >
          <h2
            id="mission-hub-invite-heading"
            className="font-serif text-xl sm:text-2xl text-brand-ink tracking-wide"
          >
            {MISSION_HUB_SHARE_INVITATION.heading}
          </h2>
          <p className="mt-3 text-sm text-brand-ink/70 leading-relaxed">
            {MISSION_HUB_SHARE_INVITATION.intro}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-brand-ink/75 list-disc pl-5">
            {MISSION_HUB_SHARE_INVITATION.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-medium text-brand-ink/80">
            {MISSION_HUB_SHARE_INVITATION.closing}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={MISSION_HUB_JOIN_PATH}
              className="inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90 transition-colors"
            >
              Join Mission Hub
            </Link>
            <Link
              href={MISSION_HUB_LOGIN_PATH}
              className="inline-flex items-center justify-center rounded-full border border-brand-primary/25 px-5 py-2.5 text-sm font-medium text-brand-primary hover:bg-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
