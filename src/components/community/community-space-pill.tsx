import Link from "next/link";
import type { CommunitySpace } from "@/lib/community/types";
import { cn } from "@/lib/utils";
import { CommunitySpaceIcon } from "./community-space-icon";

export function CommunitySpacePill({
  space,
  active = false,
  linked = true,
  variant = "filter",
  className,
}: {
  space: CommunitySpace;
  active?: boolean;
  linked?: boolean;
  /** filter: horizontal feed chips; nav: unused (sidebar uses NavLink) */
  variant?: "filter" | "nav";
  className?: string;
}) {
  const href = linked && space.status === "published" ? `/community/${space.slug}` : undefined;
  const isFilter = variant === "filter";

  const inner = isFilter ? (
    <>
      <CommunitySpaceIcon icon={space.icon} className="h-3.5 w-3.5 shrink-0 opacity-90" />
      <span className="truncate max-w-[8.5rem]">{space.title}</span>
    </>
  ) : (
    <>
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          active ? "bg-white/25 text-white" : "bg-brand-primary/15 text-brand-primary",
        )}
      >
        <CommunitySpaceIcon icon={space.icon} className="h-3.5 w-3.5" />
      </span>
      <span className="truncate max-w-[9rem]">{space.title}</span>
    </>
  );

  const pillClass = cn(
    "inline-flex items-center gap-1.5 font-medium transition-colors shrink-0",
    isFilter ? "rounded-full px-3 py-1 text-[13px]" : "rounded-full px-3 py-1.5 text-sm gap-2",
    className,
    active
      ? "bg-brand-ink/88 text-white"
      : "bg-white/50 text-brand-ink/62 hover:bg-white/72 hover:text-brand-ink/85",
    !linked && space.status === "coming_soon" && "opacity-60 cursor-default",
  );

  if (href) {
    return (
      <Link href={href} className={pillClass} aria-current={active ? "page" : undefined}>
        {inner}
      </Link>
    );
  }

  return <span className={pillClass}>{inner}</span>;
}
