import { CommunityAvatar } from "./community-avatar";
import { CommunityEngagementBarPreview } from "./community-engagement-bar";

/** Static design preview — not a real post */
const PREVIEW = {
  authorName: "Jeremy & Lindsay",
  spaceLabel: "Ministry Updates",
  timestamp: "Design preview",
  title: "What God is doing on the field",
  body: "This is how updates will look in Mission Hub — short reflections, prayer prompts, and praise reports shared with our ministry family in one place.",
};

export function CommunityPreviewPostCard() {
  return (
    <article className="rounded-2xl border border-dashed border-brand-accent/50 bg-white/95 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-2 bg-brand-accent/15 border-b border-brand-accent/25">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-ink/80">
          Design preview
        </span>
        <span className="text-[11px] text-brand-ink/55">Posts are not live yet</span>
      </div>
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start gap-3">
          <CommunityAvatar name={PREVIEW.authorName} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-semibold text-brand-ink">{PREVIEW.authorName}</span>
              <span className="text-xs text-brand-primary font-medium">{PREVIEW.spaceLabel}</span>
            </div>
            <time className="text-xs text-brand-ink/50">{PREVIEW.timestamp}</time>
          </div>
        </div>
        <div>
          <h3 className="font-serif text-lg text-brand-ink tracking-wide">{PREVIEW.title}</h3>
          <p className="mt-2 text-sm text-brand-ink/80 leading-relaxed">{PREVIEW.body}</p>
        </div>
        <div
          className="rounded-xl bg-gradient-to-br from-brand-primary/10 to-brand-surface min-h-[10rem] flex items-center justify-center border border-brand-primary/10 px-4 py-8"
          aria-hidden
        >
          <span className="text-xs text-brand-ink/40 font-medium text-center">
            Photos keep their original shape (portrait, square, or landscape)
          </span>
        </div>
        <CommunityEngagementBarPreview />
      </div>
    </article>
  );
}
