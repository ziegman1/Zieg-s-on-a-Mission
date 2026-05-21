/** Serializable owner session passed to Mission Hub client components (from server `auth()`). */
export type CommunityOwner = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
};
