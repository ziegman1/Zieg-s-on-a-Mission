"use server";

import {
  getNewsletterById,
  getNewsletterBySlugAnyStatus,
  listNewslettersForAdmin,
  saveNewsletter,
  validateNewsletterInput,
} from "@/lib/newsletter/newsletter-db";
import { formatNewsletterError, logNewsletterAction } from "@/lib/newsletter/errors";
import {
  archiveMissionHubNewsletterAnnouncement,
  formatNewsletterPublishSuccessMessage,
} from "@/lib/newsletter/mission-hub-announcement";
import {
  notifyMissionHubMembersOfNewsletterPublish,
  type NewsletterNotifyResult,
} from "@/lib/newsletter/notify";
import { revalidateNewsletterPaths } from "@/lib/newsletter/revalidate";
import { parseNewsletterBlocks } from "@/lib/newsletter/blocks/parse";
import { parseCtaAlign, type CtaAlign } from "@/lib/newsletter/align";
import {
  isValidNewsletterLinkUrl,
  NEWSLETTER_LINK_URL_ERROR,
  normalizeNewsletterLinkUrl,
} from "@/lib/newsletter/cta-url";
import type { NewsletterBlocks } from "@/lib/newsletter/blocks/types";
import type { NewsletterInput, NewsletterRecord, NewsletterStatus } from "@/lib/newsletter/types";
import { requireAdminSession } from "@/lib/admin-auth";

export type NewsletterFormInput = {
  id?: string;
  title: string;
  subtitle: string;
  slug: string;
  issueDate: string | null;
  headerImageUrl: string | null;
  useDefaultBrandedHeader: boolean;
  featuredImageUrl: string | null;
  excerpt: string;
  body: string;
  bodyBlocks: NewsletterBlocks | unknown;
  ctaLabel: string;
  ctaUrl: string;
  ctaAlign: CtaAlign;
  footerImageUrl: string | null;
  footerAltText: string;
  useDefaultFooterImage: boolean;
  seoTitle: string;
  seoDescription: string;
  status: NewsletterStatus;
  publishedAt: string | null;
};

function normalizeInput(input: NewsletterFormInput): NewsletterInput {
  const ctaUrl = normalizeNewsletterLinkUrl(input.ctaUrl);
  if (ctaUrl && !isValidNewsletterLinkUrl(ctaUrl)) {
    throw new Error(NEWSLETTER_LINK_URL_ERROR);
  }
  return {
    id: input.id?.trim() || undefined,
    title: input.title.trim(),
    subtitle: input.subtitle.trim(),
    slug: input.slug.trim(),
    issueDate: input.issueDate,
    headerImageUrl: input.headerImageUrl?.trim() || null,
    useDefaultBrandedHeader: input.useDefaultBrandedHeader,
    featuredImageUrl: input.featuredImageUrl?.trim() || null,
    excerpt: input.excerpt.trim(),
    body: input.body,
    bodyBlocks: parseNewsletterBlocks(input.bodyBlocks),
    ctaLabel: input.ctaLabel.trim(),
    ctaUrl,
    ctaAlign: parseCtaAlign(input.ctaAlign),
    footerImageUrl: input.footerImageUrl?.trim() || null,
    footerAltText: input.footerAltText.trim(),
    useDefaultFooterImage: input.useDefaultFooterImage,
    seoTitle: input.seoTitle.trim(),
    seoDescription: input.seoDescription.trim(),
    status: input.status,
    publishedAt: input.publishedAt,
  };
}

function parsePublishedAt(value: string | null | undefined, intent: "draft" | "publish"): string | null {
  if (value?.trim()) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return intent === "publish" ? new Date().toISOString() : null;
}

function successMessage(
  intent: "draft" | "publish" | "archive",
  hadExistingId: boolean,
  previousStatus?: NewsletterStatus,
): string {
  if (intent === "archive") return "Newsletter archived";
  if (intent === "draft") return "Draft saved";
  if (hadExistingId && previousStatus === "PUBLISHED") return "Updated published newsletter";
  return "Newsletter published";
}

export type NewsletterPublishHubSummary = {
  ministryUpdatesPostId: string;
  ministryUpdatesSpaceSlug: string;
  ministryUpdatesCreated: boolean;
  newsletterSpacePostId: string | null;
  newsletterSpaceSlug: string | null;
  newsletterSpaceCreated: boolean | null;
  /** @deprecated Use ministryUpdatesPostId. */
  announcementPostId: string;
  /** @deprecated Use ministryUpdatesSpaceSlug. */
  announcementSpaceSlug: string;
  /** @deprecated Use ministryUpdatesCreated. */
  announcementCreated: boolean;
  newsletterPublicPath: string;
  notificationsPrepared: boolean;
  notify: NewsletterNotifyResult;
};

type SaveResult =
  | { ok: true; newsletter: NewsletterRecord; message: string; hub?: NewsletterPublishHubSummary }
  | { ok: false; error: string };

async function persistNewsletter(
  input: NewsletterFormInput,
  intent: "draft" | "publish" | "archive",
): Promise<SaveResult> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const hadExistingId = Boolean(input.id?.trim());
  let previousStatus: NewsletterStatus | undefined;
  if (hadExistingId && input.id) {
    try {
      const existing = await getNewsletterById(input.id);
      previousStatus = existing?.status;
    } catch {
      /* ignore */
    }
  }

  const status: NewsletterStatus =
    intent === "publish" ? "PUBLISHED" : intent === "archive" ? "ARCHIVED" : "DRAFT";

  const normalized = normalizeInput({
    ...input,
    status,
    publishedAt:
      intent === "publish"
        ? parsePublishedAt(input.publishedAt, "publish")
        : intent === "draft"
          ? null
          : input.publishedAt,
  });

  const actionName =
    intent === "publish" ? "publish" : intent === "archive" ? "archive" : "save-draft";
  logNewsletterAction(actionName, {
    title: normalized.title,
    slug: normalized.slug || "(auto)",
    status,
    newsletterId: normalized.id ?? "new",
  });

  try {
    validateNewsletterInput(normalized, intent === "publish" ? "publish" : "draft");
    const newsletter = await saveNewsletter(normalized, intent);

    let hub: NewsletterPublishHubSummary | undefined;
    if (intent === "publish") {
      const notify = await notifyMissionHubMembersOfNewsletterPublish(newsletter, {
        publisherUserId: session.id,
      });
      hub = {
        ministryUpdatesPostId: notify.ministryUpdates.postId,
        ministryUpdatesSpaceSlug: notify.ministryUpdates.spaceSlug,
        ministryUpdatesCreated: notify.ministryUpdatesCreated,
        newsletterSpacePostId: notify.newsletterSpace?.postId ?? null,
        newsletterSpaceSlug: notify.newsletterSpace?.spaceSlug ?? null,
        newsletterSpaceCreated: notify.newsletterSpaceCreated,
        announcementPostId: notify.ministryUpdates.postId,
        announcementSpaceSlug: notify.ministryUpdates.spaceSlug,
        announcementCreated: notify.ministryUpdatesCreated,
        newsletterPublicPath: notify.ministryUpdates.newsletterPath,
        notificationsPrepared: notify.notifications.inAppDelivered,
        notify,
      };
    } else if (
      (intent === "draft" || intent === "archive") &&
      (previousStatus === "PUBLISHED" || normalized.id)
    ) {
      const newsletterId = newsletter.id ?? normalized.id;
      if (newsletterId && newsletter.status !== "PUBLISHED") {
        await archiveMissionHubNewsletterAnnouncement(newsletterId).catch((err) => {
          console.error("[newsletter] archive hub announcement", err);
        });
      }
    }

    logNewsletterAction(actionName, {
      title: newsletter.title,
      slug: newsletter.slug,
      status: newsletter.status,
      newsletterId: newsletter.id,
    });

    if (newsletter.status === "PUBLISHED") {
      revalidateNewsletterPaths(newsletter.slug);
    } else {
      revalidateNewsletterPaths(previousStatus === "PUBLISHED" ? input.slug : undefined);
    }

    const message =
      intent === "publish" && hub
        ? formatNewsletterPublishSuccessMessage({
            newsletterSlug: newsletter.slug,
            hub: {
              ministryUpdates: hub.notify.ministryUpdates,
              newsletterSpace: hub.notify.newsletterSpace,
              inAppNotificationsSent: hub.notify.notifications.inAppNotificationsSent,
              inAppNotificationsUpdated: hub.notify.notifications.inAppNotificationsUpdated,
              emailNotificationsSent: hub.notify.notifications.emailNotificationsSent,
              emailNotificationsDeduped: hub.notify.notifications.emailNotificationsDeduped,
              emailNotificationsFailed: hub.notify.notifications.emailNotificationsFailed,
              emailEnabled: hub.notify.notifications.emailEnabled,
              emailDisabledReason: hub.notify.notifications.emailDisabledReason,
              emailRecipientsPrepared: hub.notify.notifications.emailRecipientsPrepared,
              skippedMutedOrDisabled: hub.notify.notifications.skippedMutedOrDisabled,
            },
          })
        : successMessage(intent, hadExistingId, previousStatus);

    return {
      ok: true,
      newsletter,
      message,
      hub,
    };
  } catch (e) {
    const error = formatNewsletterError(e);
    logNewsletterAction(
      actionName,
      {
        title: normalized.title,
        slug: normalized.slug,
        status,
        newsletterId: normalized.id ?? "new",
      },
      e,
    );
    return { ok: false, error };
  }
}

export async function listAdminNewsletters(): Promise<
  { ok: true; newsletters: NewsletterRecord[] } | { ok: false; error: string }
> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  try {
    const newsletters = await listNewslettersForAdmin();
    logNewsletterAction("list-admin", { count: newsletters.length });
    return { ok: true, newsletters };
  } catch (e) {
    return { ok: false, error: formatNewsletterError(e) };
  }
}

export async function getNewsletterAction(
  id: string,
): Promise<{ ok: true; newsletter: NewsletterRecord } | { ok: false; error: string }> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  try {
    const newsletter = await getNewsletterById(id);
    if (!newsletter) return { ok: false, error: "Newsletter not found" };
    return { ok: true, newsletter };
  } catch (e) {
    return { ok: false, error: formatNewsletterError(e) };
  }
}

export async function fetchNewsletterBySlugAction(
  slug: string,
): Promise<{ ok: true; newsletter: NewsletterRecord } | { ok: false; error: string }> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  try {
    const newsletter = await getNewsletterBySlugAnyStatus(slug.trim());
    if (!newsletter) return { ok: false, error: "Newsletter not found" };
    return { ok: true, newsletter };
  } catch (e) {
    return { ok: false, error: formatNewsletterError(e) };
  }
}

export async function createNewsletterDraftAction(
  input: Omit<NewsletterFormInput, "id">,
): Promise<SaveResult> {
  return persistNewsletter({ ...input, id: undefined }, "draft");
}

export async function updateNewsletterDraftAction(
  id: string,
  input: NewsletterFormInput,
): Promise<SaveResult> {
  return persistNewsletter({ ...input, id }, "draft");
}

export async function saveNewsletterDraftAction(input: NewsletterFormInput): Promise<SaveResult> {
  if (input.id?.trim()) {
    return updateNewsletterDraftAction(input.id.trim(), input);
  }
  const { id: _id, ...rest } = input;
  return createNewsletterDraftAction(rest);
}

export async function publishNewsletterAction(input: NewsletterFormInput): Promise<SaveResult> {
  return persistNewsletter(input, "publish");
}

export async function archiveNewsletterAction(
  id: string,
): Promise<SaveResult> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  try {
    const existing = await getNewsletterById(id);
    if (!existing) return { ok: false, error: "Newsletter not found" };
    return persistNewsletter(
      {
        id: existing.id,
        title: existing.title,
        subtitle: existing.subtitle,
        slug: existing.slug,
        issueDate: existing.issueDate,
        headerImageUrl: existing.headerImageUrl,
        useDefaultBrandedHeader: existing.useDefaultBrandedHeader,
        featuredImageUrl: existing.featuredImageUrl,
        excerpt: existing.excerpt,
        body: existing.body,
        bodyBlocks: existing.bodyBlocks,
        ctaLabel: existing.ctaLabel,
        ctaUrl: existing.ctaUrl,
        ctaAlign: existing.ctaAlign,
        footerImageUrl: existing.footerImageUrl,
        footerAltText: existing.footerAltText,
        useDefaultFooterImage: existing.useDefaultFooterImage,
        seoTitle: existing.seoTitle,
        seoDescription: existing.seoDescription,
        status: "ARCHIVED",
        publishedAt: existing.publishedAt,
      },
      "archive",
    );
  } catch (e) {
    return { ok: false, error: formatNewsletterError(e) };
  }
}

export async function unpublishNewsletterAction(
  id: string,
): Promise<SaveResult> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  try {
    const existing = await getNewsletterById(id);
    if (!existing) return { ok: false, error: "Newsletter not found" };
    return persistNewsletter(
      {
        id: existing.id,
        title: existing.title,
        subtitle: existing.subtitle,
        slug: existing.slug,
        issueDate: existing.issueDate,
        headerImageUrl: existing.headerImageUrl,
        useDefaultBrandedHeader: existing.useDefaultBrandedHeader,
        featuredImageUrl: existing.featuredImageUrl,
        excerpt: existing.excerpt,
        body: existing.body,
        bodyBlocks: existing.bodyBlocks,
        ctaLabel: existing.ctaLabel,
        ctaUrl: existing.ctaUrl,
        ctaAlign: existing.ctaAlign,
        footerImageUrl: existing.footerImageUrl,
        footerAltText: existing.footerAltText,
        useDefaultFooterImage: existing.useDefaultFooterImage,
        seoTitle: existing.seoTitle,
        seoDescription: existing.seoDescription,
        status: "DRAFT",
        publishedAt: null,
      },
      "draft",
    );
  } catch (e) {
    return { ok: false, error: formatNewsletterError(e) };
  }
}
