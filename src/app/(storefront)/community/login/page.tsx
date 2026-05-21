import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isCommunityMemberRole } from "@/lib/auth-roles";
import { isAdminRole } from "@/lib/admin-users";
import { safeCallbackUrl } from "@/lib/auth-callback";
import { CommunityLoginForm } from "@/components/community/community-login-form";

type PageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function CommunityLoginPage({ searchParams }: PageProps) {
  const { callbackUrl: raw } = await searchParams;
  const callbackUrl = safeCallbackUrl(raw, "/community");
  const session = await auth();
  if (session?.user && (isCommunityMemberRole(session.user.role) || isAdminRole(session.user.role))) {
    redirect(callbackUrl);
  }

  return (
    <Suspense fallback={null}>
      <CommunityLoginForm />
    </Suspense>
  );
}
