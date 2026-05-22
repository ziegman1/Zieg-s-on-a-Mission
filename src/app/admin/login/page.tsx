import { Suspense } from "react";
import { redirect } from "next/navigation";
import { safeCallbackUrl } from "@/lib/auth-callback";
import { isAdminRole } from "@/lib/admin-users";
import { safeAuth } from "@/lib/safe-auth";
import { AdminLoginForm } from "./admin-login-form";

type PageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const { callbackUrl: raw } = await searchParams;
  const callbackUrl = safeCallbackUrl(raw);
  const authResult = await safeAuth();

  if (authResult.ok && authResult.session?.user && isAdminRole(authResult.session.user.role)) {
    redirect(callbackUrl);
  }

  const configIssues = !authResult.ok && "configIssues" in authResult ? authResult.configIssues : undefined;
  const authError = !authResult.ok && "error" in authResult ? authResult.error : undefined;

  return (
    <Suspense fallback={null}>
      <AdminLoginForm
        configIssues={configIssues}
        authError={authError}
        configBlocked={Boolean(configIssues?.length)}
      />
    </Suspense>
  );
}
