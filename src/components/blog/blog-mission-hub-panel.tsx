"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import {
  getBlogMissionHubDiagnosticsAction,
  republishBlogToMissionHubAction,
} from "@/app/admin/site-builder/blog-actions";
import type { BlogMissionHubDiagnostics } from "@/lib/blog/mission-hub-lifecycle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  blogPostId: string;
  blogStatus: string;
  onMessage?: (message: string) => void;
  onError?: (message: string) => void;
};

export function BlogMissionHubPanel({
  blogPostId,
  blogStatus,
  onMessage,
  onError,
}: Props) {
  const [diagnostics, setDiagnostics] = useState<BlogMissionHubDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  const loadDiagnostics = useCallback(async () => {
    setLoading(true);
    const res = await getBlogMissionHubDiagnosticsAction(blogPostId);
    setLoading(false);
    if (res.ok) setDiagnostics(res.diagnostics);
    else onError?.(res.error);
  }, [blogPostId, onError]);

  useEffect(() => {
    void loadDiagnostics();
  }, [loadDiagnostics]);

  function handleRepublish(resendEmail: boolean) {
    startTransition(async () => {
      const res = await republishBlogToMissionHubAction(blogPostId, {
        resendBlogEmail: resendEmail,
      });
      if (res.ok) {
        onMessage?.(res.message);
        await loadDiagnostics();
      } else {
        onError?.(res.error);
      }
    });
  }

  const published = blogStatus === "PUBLISHED";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-zinc-200">Mission Hub delivery</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Blog Articles space post, in-app notifications, and email delivery logs.
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
                    .map((p) => `${p.spaceSlug ?? p.spaceId} (${p.status})`)
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
        {published ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn("h-8 text-[10px] rounded-full border-emerald-500/40 text-emerald-400")}
              disabled={pending}
              onClick={() => handleRepublish(false)}
            >
              Republish to Mission Hub
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
            Publish the blog post to sync with Mission Hub.
          </p>
        )}
      </div>
    </div>
  );
}
