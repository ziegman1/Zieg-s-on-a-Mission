import Link from "next/link";
import { safeCallbackUrl } from "@/lib/auth-callback";

export function CommunityJoinPrompt({
  returnPath = "/community",
  message = "Join Mission Hub to comment.",
}: {
  returnPath?: string;
  message?: string;
}) {
  const path = safeCallbackUrl(returnPath, "/community");
  const loginHref = `/community/login?callbackUrl=${encodeURIComponent(path)}`;
  const joinHref = `/community/join?callbackUrl=${encodeURIComponent(path)}`;

  return (
    <div className="rounded-xl border border-brand-primary/15 bg-brand-surface/50 px-4 py-4 space-y-3">
      <p className="text-sm font-medium text-brand-ink">{message}</p>
      <p className="text-xs text-brand-ink/60">
        Create a free account with your email and password. Your name and photo appear on comments
        automatically.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={joinHref}
          className="inline-flex items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90 transition-colors"
        >
          Join Mission Hub
        </Link>
        <Link
          href={loginHref}
          className="inline-flex items-center justify-center rounded-full border border-brand-primary/25 px-4 py-2 text-sm font-medium text-brand-primary hover:bg-white transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
