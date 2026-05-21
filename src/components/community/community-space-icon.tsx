import {
  BookOpen,
  CalendarDays,
  FileText,
  HandHeart,
  Mail,
  Megaphone,
  Sparkles,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { CommunitySpaceIcon } from "@/lib/community/types";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<CommunitySpaceIcon, LucideIcon> = {
  prayer: HandHeart,
  praise: Sparkles,
  updates: Megaphone,
  behind_scenes: Video,
  newsletter: Mail,
  blog: BookOpen,
  resources: FileText,
  events: CalendarDays,
};

export function CommunitySpaceIcon({
  icon,
  className,
}: {
  icon: CommunitySpaceIcon;
  className?: string;
}) {
  const Icon = ICON_MAP[icon];
  return <Icon className={cn("h-5 w-5 shrink-0", className)} aria-hidden />;
}
