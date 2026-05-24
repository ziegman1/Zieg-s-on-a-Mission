"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import {
  getNewsletterMissionHubDiagnosticsAction,
  removeNewsletterFromMissionHubAction,
  republishNewsletterToMissionHubAction,
  runNewsletterMissionHubSmokeTestAction,
} from "@/app/admin/site-builder/newsletter-actions";
import type { NewsletterMissionHubDiagnostics } from "@/lib/newsletter/mission-hub-lifecycle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  newsletterId: string;
  newsletterStatus: string;
  onMessage?: (message: string) => void;
  onError?: (message: string) => void;
};

export function NewsletterMissionHubPanel({
  newsletterId,
  newsletterStatus,
  onMessage,
  onError,
}: Props) {
  const [diagnostics, setDiagnostics] = useState<NewsletterMissionHubDiagnostics | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const loadDiagnostics = useCallback(async () => {
    setLoading(true);
    const res = await getNewsletterMissionHubDiagnosticsAction(newsletterId);
    setLoading(false);
    if (res.ok) setDiagnostics(res.diagnostics);
    else onError?.(res.error);
  }, [newsletterId, onError]);

  useEffect(() => {
    void loadDiagnostics();
  }, [loadDiagnostics]);

  function handleRemove() {
    const confirmed = window.confirm(
      "Remove this newsletter from Mission Hub and clear notification delivery history?\n\n" +
        "This archives hub posts and clears in-app and email delivery logs. The newsletter itself is not deleted.",
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await removeNewsletterFromMissionHubAction(newsletterId);
      if (res.ok) {
        onMessage?.(res.message);
        await loadDiagnostics();
      } else {
        onError?.(res.error);
      }
    });
  }

  function handleSmokeTest() {
    const testList = "Set TEST_MISSION_HUB_EMAIL_RECIPIENTS on the server for email delivery.";
    const confirmed = window.confirm(
      "Run Mission Hub newsletter smoke test?\n\n" +
        "This will remove from Hub, republish posts, refresh in-app notifications, and send email ONLY to TEST_MISSION_HUB_EMAIL_RECIPIENTS (if configured).\n\n" +
        testList,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await runNewsletterMissionHubSmokeTestAction(newsletterId);
      if (res.ok) {
        onMessage?.(res.message);
        await loadDiagnostics();
      } else {
        onError?.(res.error);
      }
    });
  }

  function handleRepublish(resendEmail: boolean) {
    startTransition(async () => {
      const res = await republishNewsletterToMissionHubAction(newsletterId, {
        resendNewsletterEmail: resendEmail,
      });
      if (res.ok) {
        onMessage?.(res.message);
        await loadDiagnostics();
      } else {
        onError?.(res.error);
      }
    });
  }

  const published = newsletterStatus === "PUBLISHED";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-zinc-200">Mission Hub delivery</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Posts, in-app notifications, and email delivery logs for this issue.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] text-zinc-400"
          disabled={loading || pending}
          onClick={() => void loadDiagnostics()}
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-3 w-3 mr-1" />
          )}
          Refresh
        </Button>
      </div>

      {diagnostics ? (
        <dl className="grid gap-2 text-[11px] text-zinc-400 sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Hub posts</dt>
            <dd className="text-zinc-300 font-mono">
              {diagnostics.posts.length === 0
                ? "None"
                : diagnostics.posts
                    .map(
                      (p) =>
                        `${p.spaceSlug ?? p.spaceId} (${p.status})`,
                    )
                    .join(", ")}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">In-app notifications</dt>
            <dd className="text-zinc-300 font-mono">{diagnostics.inAppNotificationCount}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Email deliveries</dt>
            <dd className="text-zinc-300 font-mono">
              {diagnostics.emailDeliveryCount}
              {Object.keys(diagnostics.emailDeliveryByStatus).length > 0
                ? ` (${Object.entries(diagnostics.emailDeliveryByStatus)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ")})`
                : ""}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-zinc-500">Dedupe keys</dt>
            <dd className="text-zinc-500 font-mono text-[10px] break-all">
              {diagnostics.notificationDedupeKey} · {diagnostics.emailDedupeKey}
            </dd>
          </div>
        </dl>
      ) : loading ? (
        <p className="text-xs text-zinc-500 flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading diagnostics…
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("h-8 text-[10px] rounded-full border-amber-500/40 text-amber-400")}
          disabled={pending}
          onClick={handleRemove}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Remove from Mission Hub
        </Button>
        {published ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-[10px] rounded-full border-emerald-500/40 text-emerald-400"
              disabled={pending}
              onClick={handleSmokeTest}
            >
              Run smoke test
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-[10px] rounded-full"
              disabled={pending}
              onClick={() => handleRepublish(false)}
            >
              Republish to Hub
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-[10px] rounded-full text-zinc-400"
              disabled={pending}
              onClick={() => handleRepublish(true)}
            >
              Republish + resend email
            </Button>
          </>
        ) : (
          <p className="text-[10px] text-zinc-500 self-center">
            Publish the newsletter to republish to Mission Hub.
          </p>
        )}
      </div>

    </div>
  );
}
