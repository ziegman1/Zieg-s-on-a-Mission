import { Badge } from "@/components/ui/badge";
import type { CommunitySpaceStatus } from "@/lib/community/types";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<CommunitySpaceStatus, string> = {
  published: "Live",
  draft: "Draft",
  archived: "Archived",
  coming_soon: "Coming soon",
};

export function CommunitySpaceStatusBadge({ status }: { status: CommunitySpaceStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 border-brand-primary/25 text-brand-ink/80 bg-brand-surface/80",
        status === "published" && "border-brand-accent/50 bg-brand-accent/15 text-brand-ink",
        status === "draft" && "border-amber-500/30 bg-amber-500/10 text-amber-950",
        status === "archived" && "border-zinc-400/40 bg-zinc-500/10 text-zinc-300",
      )}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}
