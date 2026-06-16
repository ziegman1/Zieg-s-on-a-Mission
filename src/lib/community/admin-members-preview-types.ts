export type AdminMemberAvatarPreview = {
  id: string;
  displayName: string;
  profileImageUrl: string | null;
};

export type AdminRecentHubVisitor = {
  id: string;
  label: string;
  email: string | null;
  path: string | null;
  createdAt: string;
  isAnonymous: boolean;
};

export type AdminMembersHubPreview = {
  avatars: AdminMemberAvatarPreview[];
  totalMembers: number;
  engagedToday: number;
  activeThisWeek: number;
  visitsToday: number;
  uniqueMembersVisitedToday: number;
  recentVisitors: AdminRecentHubVisitor[];
};
