import { COMMUNITY_POST_TYPES } from "@/lib/community/post-constants";
import type { CommunityPostType } from "@/lib/community/types";
import { cn } from "@/lib/utils";

const LABEL: Record<CommunityPostType, string> = Object.fromEntries(
  COMMUNITY_POST_TYPES.map((t) => [t.value, t.label]),
) as Record<CommunityPostType, string>;

export function CommunityPostTypeBadge({
  type,
  className,
}: {
  type: CommunityPostType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[11px] font-medium text-brand-ink/40",
        className,
      )}
    >
      {LABEL[type] ?? type}
    </span>
  );
}
