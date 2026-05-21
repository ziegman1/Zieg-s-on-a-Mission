import { revalidatePath } from "next/cache";
import { isAdminRole } from "@/lib/admin-users";
import { formatMemberDisplayName } from "@/lib/community/members";
import { COMMUNITY_POST_AUTHOR_NAME } from "@/lib/community/post-constants";

export type PostAuthorUserRow = {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
  communityMember: {
    firstName: string;
    lastName: string;
    displayName: string | null;
    profileImageUrl: string | null;
  } | null;
};

export type ResolvedPostAuthor = {
  /** Public label in the feed (e.g. "Jeremy & Lindsay" for admins) */
  authorName: string;
  authorImageUrl: string | null;
  /** Name used for avatar initials when no image */
  authorAvatarName: string;
};

/** Revalidate Mission Hub feed pages after author profile image changes. */
export function revalidateCommunityFeeds(): void {
  revalidatePath("/community", "layout");
}

export function resolvePostAuthor(authorUser: PostAuthorUserRow | null): ResolvedPostAuthor {
  if (!authorUser) {
    return {
      authorName: COMMUNITY_POST_AUTHOR_NAME,
      authorImageUrl: null,
      authorAvatarName: COMMUNITY_POST_AUTHOR_NAME,
    };
  }

  if (isAdminRole(authorUser.role)) {
    const avatarName = authorUser.name?.trim() || "Owner";
    return {
      authorName: COMMUNITY_POST_AUTHOR_NAME,
      authorImageUrl: authorUser.image ?? null,
      authorAvatarName: avatarName,
    };
  }

  const member = authorUser.communityMember;
  if (member) {
    const authorName =
      member.displayName?.trim() ||
      formatMemberDisplayName(member.firstName, member.lastName);
    return {
      authorName,
      authorImageUrl: member.profileImageUrl ?? authorUser.image ?? null,
      authorAvatarName: authorName,
    };
  }

  const authorName = authorUser.name?.trim() || COMMUNITY_POST_AUTHOR_NAME;
  return {
    authorName,
    authorImageUrl: authorUser.image ?? null,
    authorAvatarName: authorName,
  };
}

export const postAuthorUserSelect = {
  id: true,
  name: true,
  image: true,
  role: true,
  communityMember: {
    select: {
      firstName: true,
      lastName: true,
      displayName: true,
      profileImageUrl: true,
    },
  },
} as const;
