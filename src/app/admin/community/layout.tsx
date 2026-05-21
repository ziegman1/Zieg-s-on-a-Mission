import { CommunityAdminNav } from "./community-admin-nav";

export default function AdminCommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <CommunityAdminNav />
      {children}
    </div>
  );
}
