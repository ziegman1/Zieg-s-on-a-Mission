"use client";

import { CommunityAvatar } from "./community-avatar";
import type { AdminMemberAvatarPreview } from "@/lib/community/admin-members-preview-types";
import { cn } from "@/lib/utils";

export function MembersAvatarStack({
  members,
  totalCount,
  className,
}: {
  members: AdminMemberAvatarPreview[];
  totalCount: number;
  className?: string;
}) {
  const extra = Math.max(0, totalCount - members.length);

  if (members.length === 0) {
    return (
      <span
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-full",
          "bg-brand-primary/15 text-[10px] font-bold text-brand-primary ring-2 ring-white",
          className,
        )}
        aria-hidden
      >
        {totalCount > 0 ? totalCount : "·"}
      </span>
    );
  }

  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <span className="flex items-center pl-0.5">
        {members.map((member, index) => (
          <span
            key={member.id}
            className={cn(
              "relative transition-transform duration-200",
              index > 0 && "-ml-2.5",
              "group-hover:scale-[1.04] group-active:scale-[0.98]",
            )}
            style={{ zIndex: 10 - index }}
          >
            <CommunityAvatar
              name={member.displayName}
              imageUrl={member.profileImageUrl}
              size="sm"
              className="!h-7 !w-7 !text-[10px] ring-2 ring-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
            />
          </span>
        ))}
      </span>
      {extra > 0 ? (
        <span
          className={cn(
            "absolute -right-0.5 -bottom-0.5 z-[11]",
            "flex h-4 min-w-4 items-center justify-center rounded-full",
            "bg-brand-primary px-1 text-[9px] font-bold leading-none text-white",
            "ring-2 ring-white shadow-sm",
          )}
          aria-hidden
        >
          +{extra > 99 ? "99" : extra}
        </span>
      ) : null}
    </span>
  );
}
