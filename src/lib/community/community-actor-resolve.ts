import type { CommunityMemberProfile } from "@/lib/community/members";
import { isAdminRole } from "@/lib/admin-users";
import { isCommunityMemberRole } from "@/lib/auth-roles";

export type CommunityActorNameFields = {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  name?: string | null;
};

export type ResolvedCommunityActor = {
  actorUserId: string | null;
  actorMemberId: string | null;
  actorDisplayName: string;
  actorIsOwner: boolean;
};

/** Pure display-name resolution — shared by reactions, notifications, and feed UI. */
export function formatCommunityActorDisplayName(
  member: CommunityActorNameFields | null | undefined,
  user: CommunityActorNameFields | null | undefined,
): string {
  const fromMemberDisplay = member?.displayName?.trim();
  if (fromMemberDisplay) return fromMemberDisplay;

  if (member?.firstName != null || member?.lastName != null) {
    const fromNames = `${(member.firstName ?? "").trim()} ${(member.lastName ?? "").trim()}`.trim();
    if (fromNames) return fromNames;
  }

  const userName = user?.name?.trim();
  if (userName) return userName;

  const email = member?.email?.trim() || user?.email?.trim();
  if (email) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }

  return "Someone";
}

export type CommunityActorSourceInput = {
  sessionUserId: string | null;
  sessionRole: string | undefined | null;
  sessionName: string | null;
  sessionEmail: string | null;
  memberByUserId: CommunityMemberProfile | null;
  memberByVisitorKey: CommunityMemberProfile | null;
  userRecord: { name: string | null; email: string | null } | null;
};

/** Resolve actor identity from preloaded sources (testable without DB). */
export function resolveCommunityActorFromSources(
  input: CommunityActorSourceInput,
): ResolvedCommunityActor {
  const sessionUser = {
    name: input.sessionName,
    email: input.sessionEmail,
  };

  if (input.sessionUserId && isAdminRole(input.sessionRole)) {
    return {
      actorUserId: input.sessionUserId,
      actorMemberId: null,
      actorDisplayName: formatCommunityActorDisplayName(null, sessionUser),
      actorIsOwner: true,
    };
  }

  if (input.memberByUserId) {
    return {
      actorUserId: input.memberByUserId.userId,
      actorMemberId: input.memberByUserId.id,
      actorDisplayName: formatCommunityActorDisplayName(
        input.memberByUserId,
        input.userRecord,
      ),
      actorIsOwner: false,
    };
  }

  if (input.memberByVisitorKey) {
    return {
      actorUserId: input.memberByVisitorKey.userId,
      actorMemberId: input.memberByVisitorKey.id,
      actorDisplayName: formatCommunityActorDisplayName(
        input.memberByVisitorKey,
        input.userRecord,
      ),
      actorIsOwner: false,
    };
  }

  if (input.sessionUserId && input.userRecord) {
    return {
      actorUserId: input.sessionUserId,
      actorMemberId: null,
      actorDisplayName: formatCommunityActorDisplayName(null, input.userRecord),
      actorIsOwner: false,
    };
  }

  if (input.sessionUserId && (input.sessionName?.trim() || input.sessionEmail?.trim())) {
    return {
      actorUserId: input.sessionUserId,
      actorMemberId: null,
      actorDisplayName: formatCommunityActorDisplayName(null, sessionUser),
      actorIsOwner: false,
    };
  }

  return {
    actorUserId: input.sessionUserId,
    actorMemberId: null,
    actorDisplayName: "Someone",
    actorIsOwner: false,
  };
}

export function memberNeedsUserLookup(member: CommunityMemberProfile): boolean {
  if (member.displayName?.trim()) return false;
  const fromNames = `${member.firstName.trim()} ${member.lastName.trim()}`.trim();
  return !fromNames && !member.email?.trim();
}

export function shouldLoadMemberByUserId(
  sessionUserId: string | null,
  sessionRole: string | undefined | null,
): boolean {
  return Boolean(sessionUserId && isCommunityMemberRole(sessionRole));
}
