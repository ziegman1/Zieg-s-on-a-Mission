import Link from "next/link";
import { getCommunityHubSettings } from "@/lib/community/hub-settings";
import { DEFAULT_HUB_INVITATION } from "@/lib/community/settings-types";
import { cn } from "@/lib/utils";

/**
 * Single right-rail invitation — copy from hub settings when configured.
 */
export async function CommunityEngageRail({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "subtle";
}) {
  const hub = await getCommunityHubSettings();
  const title = hub.invitationTitle ?? DEFAULT_HUB_INVITATION.title;
  const body = hub.invitationBody ?? DEFAULT_HUB_INVITATION.body;
  const subtle = variant === "subtle";

  return (
    <aside className={className} aria-label="Join us in mission">
      <div
        className={cn(
          "rounded-2xl overflow-hidden",
          subtle
            ? "bg-white/55 shadow-[0_1px_16px_rgba(28,42,68,0.04)] ring-1 ring-black/[0.03]"
            : "bg-gradient-to-b from-white/90 via-brand-surface/80 to-brand-surface/40 shadow-[0_2px_12px_rgba(28,42,68,0.06)] ring-1 ring-black/[0.04]",
        )}
      >
        <div className={subtle ? "px-4 py-5 sm:px-5 sm:py-5" : "px-5 py-6 sm:px-6 sm:py-7"}>
          <h2
            className={cn(
              "font-serif text-brand-ink tracking-wide leading-snug",
              subtle ? "text-[15px] sm:text-base" : "text-lg sm:text-[1.2rem]",
            )}
          >
            {title}
          </h2>
          <p
            className={cn(
              "mt-2.5 leading-[1.62] text-brand-ink/65",
              subtle ? "text-[12.5px]" : "mt-3 text-[13px] sm:text-sm text-brand-ink/70 leading-[1.65]",
            )}
          >
            {body}
          </p>
          <Link
            href="/partner"
            className={cn(
              "flex w-full items-center justify-center rounded-full text-white transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35 focus-visible:ring-offset-2",
              subtle
                ? "mt-4 bg-brand-primary/80 text-[13px] font-medium px-4 py-2 shadow-[0_1px_8px_rgba(131,176,218,0.2)] hover:bg-brand-primary/90"
                : "mt-5 bg-brand-primary/90 text-sm font-medium px-5 py-2.5 shadow-[0_2px_8px_rgba(131,176,218,0.35)] hover:bg-brand-primary",
            )}
          >
            Become a Ministry Partner
          </Link>
          <p className={subtle ? "mt-3 text-center" : "mt-4 text-center"}>
            <Link
              href="/mission"
              className={cn(
                "hover:text-brand-primary transition-colors",
                subtle ? "text-[11px] text-brand-ink/42" : "text-[12px] text-brand-ink/50",
              )}
            >
              Learn more about the mission
            </Link>
          </p>
        </div>
      </div>
    </aside>
  );
}
