export type AdminMemberAvatarPreview = {
  id: string;
  displayName: string;
  profileImageUrl: string | null;
};

export type AdminMembersHubPreview = {
  avatars: AdminMemberAvatarPreview[];
  totalMembers: number;
  activeToday: number;
};
