"use client";

import { useActionState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  communityLoginAction,
  type CommunityAuthState,
} from "@/app/(storefront)/community/auth-actions";
import { buildOwnerLoginUrl, safeCallbackUrl } from "@/lib/auth-callback";
import { storeMissionHubAuthCallback } from "@/lib/community/welcome-intro";
import { CommunityAuthCard } from "./community-auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: CommunityAuthState = { error: null };

export function CommunityLoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const [state, formAction, pending] = useActionState(communityLoginAction, initial);

  useEffect(() => {
    storeMissionHubAuthCallback(callbackUrl);
  }, [callbackUrl]);

  return (
    <CommunityAuthCard
      title="Sign in to Mission Hub"
      description="Sign in with your Mission Hub member account or your owner (admin) email and password."
      footer={
        <div className="text-xs text-brand-ink/55 text-center pt-2 space-y-2">
          <p>
            Owners (Jeremy &amp; Lindsay):{" "}
            <Link
              href={buildOwnerLoginUrl(callbackUrl)}
              className="font-medium text-brand-primary hover:underline"
            >
              Owner sign in
            </Link>{" "}
            — same credentials also work on this form.
          </p>
          <p>
            New here?{" "}
            <Link
              href={`/community/join?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-medium text-brand-primary hover:underline"
            >
              Join Mission Hub
            </Link>
          </p>
        </div>
      }
    >
      <form
        action={formAction}
        className="space-y-4"
        onSubmit={() => storeMissionHubAuthCallback(callbackUrl)}
      >
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="bg-white"
          />
        </div>
        <Button type="submit" className="w-full rounded-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" aria-hidden />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </CommunityAuthCard>
  );
}
