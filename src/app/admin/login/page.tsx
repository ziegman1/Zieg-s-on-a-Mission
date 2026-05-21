import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { safeCallbackUrl } from "@/lib/auth-callback";
import { isAdminRole } from "@/lib/admin-users";
import { AdminLoginForm } from "./admin-login-form";

type PageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const { callbackUrl: raw } = await searchParams;
  const callbackUrl = safeCallbackUrl(raw);
  const session = await auth();
  if (session?.user && isAdminRole(session.user.role)) {
    redirect(callbackUrl);
  }
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
