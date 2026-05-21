import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isCommunityMemberRole } from "@/lib/auth-roles";
import { safeCallbackUrl } from "@/lib/auth-callback";
import { CommunityJoinForm } from "@/components/community/community-join-form";

type PageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function CommunityJoinPage({ searchParams }: PageProps) {
  const { callbackUrl: raw } = await searchParams;
  const callbackUrl = safeCallbackUrl(raw, "/community");
  const session = await auth();
  if (session?.user && isCommunityMemberRole(session.user.role)) {
    redirect(callbackUrl);
  }

  return (
    <Suspense fallback={null}>
      <CommunityJoinForm />
    </Suspense>
  );
}
