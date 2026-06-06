"use client";

import { useEffect, useState } from "react";
import { loadUnsubscribeLanding } from "@/app/(storefront)/community/email-preference-actions";
import Link from "next/link";

export function UnsubscribePublicPanel({ token }: { token: string }) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "success"; email: string }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await loadUnsubscribeLanding(token);
      if (cancelled) return;
      if (!res.ok) {
        setState({ status: "error", message: res.error });
        return;
      }
      setState({ status: "success", email: res.email });
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.status === "loading") {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-sm text-brand-ink/70">
        Processing unsubscribe…
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-xl font-semibold text-brand-ink mb-2">Unsubscribe</h1>
        <p className="text-sm text-red-600">{state.message}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold text-brand-ink mb-2">You&apos;re unsubscribed</h1>
      <p className="text-sm text-brand-ink/70 leading-relaxed mb-4">
        <span className="font-medium">{state.email}</span> will no longer receive Mission Hub
        email notifications. This does not change Mail Suite preferences.
      </p>
      <p className="text-sm">
        Changed your mind?{" "}
        <Link href="/community/settings?section=notifications" className="text-[#5a8fb8] underline">
          Manage notification settings
        </Link>{" "}
        after signing in.
      </p>
    </main>
  );
}
