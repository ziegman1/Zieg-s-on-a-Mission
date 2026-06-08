import { CommunityPostCoverImage } from "@/components/community/community-post-cover-image";
import { formatCommunityPostDate } from "@/lib/community/format-post-date";
import type { PublicSharePreview } from "@/lib/community/post-public-share";

export function CommunityPostSharePreviewCard({
  preview,
  hubShareNote,
}: {
  preview: PublicSharePreview;
  hubShareNote?: string | null;
}) {
  const dateLabel = formatCommunityPostDate(preview.publishedAt);

  return (
    <div className="rounded-xl border border-black/[0.06] overflow-hidden bg-brand-surface/30">
      {preview.coverImageUrl ? (
        <CommunityPostCoverImage src={preview.coverImageUrl} alt="" />
      ) : null}
      <div className="px-4 py-3 space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-ink/40">
          {preview.spaceTitle}
          {dateLabel ? ` · ${dateLabel}` : ""}
        </p>
        <p className="text-sm font-semibold text-brand-ink leading-snug">{preview.title}</p>
        <p className="text-xs text-brand-ink/60 line-clamp-4 leading-relaxed">{preview.excerpt}</p>
        {hubShareNote ? (
          <p className="text-[10px] text-brand-primary/80 pt-1">{hubShareNote}</p>
        ) : null}
      </div>
    </div>
  );
}
