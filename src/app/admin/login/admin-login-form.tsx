"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminLoginConfigAlert } from "@/components/admin/admin-login-config-alert";
import type { AuthConfigIssue } from "@/lib/auth-env";
import { loginAction, type LoginState } from "./actions";
import { isMissionHubReturnPath, safeCallbackUrl } from "@/lib/auth-callback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const initial: LoginState = { error: null };

export function AdminLoginForm({
  configBlocked = false,
  configIssues,
  authError,
}: {
  configBlocked?: boolean;
  configIssues?: AuthConfigIssue[];
  authError?: string;
}) {
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-8">
      <Card className="w-full max-w-md border-brand-primary/35 bg-zinc-900 text-cream">
        <CardHeader>
          <CardTitle className="font-serif text-2xl text-brand-primary">
            {isMissionHubReturnPath(callbackUrl) ? "Mission Hub — Owner sign in" : "Admin Sign In"}
          </CardTitle>
          <CardDescription>
            {isMissionHubReturnPath(callbackUrl)
              ? "Sign in to publish and manage posts in Mission Hub."
              : "Zieg's on a Mission Merch — Admin"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminLoginConfigAlert issues={configIssues} error={authError} />
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            {state.error && (
              <p className="text-sm text-red-500">{state.error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="jziegenhorn@teamexpansion.org"
                required
                autoComplete="email"
                className="bg-zinc-800 border-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="bg-zinc-800 border-zinc-600"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-brand-accent text-brand-ink hover:bg-brand-accent/90"
              disabled={pending || configBlocked}
            >
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-xs text-zinc-500">
            Seeded admin: <span className="text-zinc-400">jziegenhorn@teamexpansion.org</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
