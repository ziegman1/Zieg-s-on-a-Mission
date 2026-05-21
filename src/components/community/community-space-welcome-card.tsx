import { CommunitySpaceIcon } from "./community-space-icon";
import { CommunityPostCoverImage } from "./community-post-cover-image";
import type { CommunitySpaceDetail } from "@/lib/community/space-experience";
import { themeMoodSurfaceClass } from "@/lib/community/space-experience";
import { cn } from "@/lib/utils";

export function CommunitySpaceWelcomeCard({ space }: { space: CommunitySpaceDetail }) {
  const { experience } = space;
  if (!experience.showWelcomeMessage || !experience.welcomeMessage?.trim()) {
    return null;
  }

  const moodClass = themeMoodSurfaceClass(experience.themeMood);
  const lines = experience.welcomeMessage.trim().split(/\n\n+/);
  const heading = lines[0]?.trim() ?? "";
  const bodyParagraphs = lines.slice(1).map((p) => p.trim()).filter(Boolean);

  return (
    <section
      aria-label="Space welcome"
      className={cn(
        "rounded-2xl border border-brand-primary/12 overflow-hidden",
        "bg-gradient-to-br shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]",
        moodClass,
      )}
    >
      {experience.coverImageUrl ? (
        <div className="relative h-28 sm:h-32 w-full">
          <CommunityPostCoverImage src={experience.coverImageUrl} variant="feed" className="!rounded-none h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#faf8f6]/95 via-[#faf8f6]/40 to-transparent" />
        </div>
      ) : null}
      <div className="px-4 sm:px-5 py-4 sm:py-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary/15 ring-2 ring-white/90">
            <CommunitySpaceIcon icon={space.icon} className="h-5 w-5 text-brand-primary" />
          </span>
          <div className="min-w-0 flex-1 space-y-3">
            {heading ? (
              <h2 className="font-serif text-xl sm:text-[1.35rem] leading-snug text-brand-ink tracking-wide">
                {heading}
              </h2>
            ) : null}
            {bodyParagraphs.length > 0 ? (
              <div className="space-y-3 text-[15px] leading-[1.65] text-brand-ink/82">
                {bodyParagraphs.map((para, i) => (
                  <p key={i} className="whitespace-pre-wrap">
                    {para}
                  </p>
                ))}
              </div>
            ) : heading && lines.length === 1 ? null : (
              <p className="text-[15px] leading-[1.65] text-brand-ink/82 whitespace-pre-wrap">
                {experience.welcomeMessage}
              </p>
            )}
            {experience.engagementPrompt ? (
              <p className="text-sm font-medium text-brand-primary/90 italic border-t border-brand-primary/10 pt-3">
                {experience.engagementPrompt}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
