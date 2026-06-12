"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  previewWeeklyMissionHubDigestAction,
  sendWeeklyDigestTestToMeAction,
  sendWeeklyDigestToMembersAction,
  type WeeklyDigestSendActionResult,
} from "@/app/admin/community/digest-actions";
import type { WeeklyMissionHubDigest } from "@/lib/mission-hub/weekly-digest-core";
import type { WeeklyDigestDeliveryResult } from "@/lib/mission-hub/weekly-digest-delivery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function formatRange(isoStart: string, isoEnd: string): string {
  const start = new Date(isoStart);
  const end = new Date(isoEnd);
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

function DeliverySummary({ delivery }: { delivery: WeeklyDigestDeliveryResult }) {
  return (
    <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200 mt-3">
      <p className="font-medium">Delivery complete</p>
      <p className="text-xs text-emerald-300/80 mt-1">
        Sent: {delivery.sent} · Deduped: {delivery.deduped} · Skipped: {delivery.skipped} · Failed:{" "}
        {delivery.failed}
      </p>
      {delivery.errors.length > 0 ? (
        <ul className="text-xs text-amber-300/90 mt-2 list-disc pl-4 space-y-0.5">
          {delivery.errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function DigestPreview({ digest }: { digest: WeeklyMissionHubDigest }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="rounded-lg border border-zinc-700 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-300">
        <p>
          <span className="text-zinc-500">Period:</span>{" "}
          {formatRange(digest.dateRange.start, digest.dateRange.end)}
        </p>
        <p className="mt-1">
          <span className="text-zinc-500">Has content:</span>{" "}
          {digest.hasContent ? "Yes" : "No"}
        </p>
        <p className="mt-1">
          <span className="text-zinc-500">Eligible recipients:</span>{" "}
          {digest.digestEmailRecipientsPrepared}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Reactions: {digest.totals.reactions} · Comments: {digest.totals.comments} · Voice
          prayers: {digest.totals.voicePrayers}
        </p>
      </div>

      {!digest.hasContent ? (
        <p className="text-sm text-zinc-500">Nothing to include in this week&apos;s digest.</p>
      ) : (
        digest.sections.map((section) =>
          section.items.length === 0 ? null : (
            <div key={section.id} className="space-y-2">
              <h3 className="text-sm font-semibold text-brand-primary">{section.title}</h3>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li
                    key={`${item.kind}-${item.id}`}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-cream">{item.title}</p>
                    {item.excerpt ? (
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{item.excerpt}</p>
                    ) : null}
                    <p className="text-[11px] text-zinc-500 mt-1.5">
                      {item.spaceName ?? "Mission Hub"}
                      {item.authorDisplayName ? ` · ${item.authorDisplayName}` : ""}
                      {" · "}
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </p>
                    <p className="text-[11px] text-brand-primary/80 mt-0.5 truncate">{item.href}</p>
                  </li>
                ))}
              </ul>
            </div>
          ),
        )
      )}
    </div>
  );
}

export function WeeklyDigestPreviewPanel() {
  const [digest, setDigest] = useState<WeeklyMissionHubDigest | null>(null);
  const [delivery, setDelivery] = useState<WeeklyDigestDeliveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [sendPending, startSendTransition] = useTransition();

  function loadPreview() {
    setError(null);
    setDelivery(null);
    startTransition(async () => {
      const result = await previewWeeklyMissionHubDigestAction();
      if (!result.ok) {
        setError(result.error);
        setDigest(null);
        return;
      }
      setDigest(result.digest);
    });
  }

  function handleSendResult(result: WeeklyDigestSendActionResult) {
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setDelivery(result.delivery);
    setDigest(result.delivery.digest);
  }

  function sendTest() {
    setError(null);
    setDelivery(null);
    startSendTransition(async () => {
      handleSendResult(await sendWeeklyDigestTestToMeAction());
    });
  }

  function sendToMembers(forceResend: boolean) {
    setError(null);
    setDelivery(null);
    startSendTransition(async () => {
      handleSendResult(await sendWeeklyDigestToMembersAction({ forceResend }));
    });
  }

  const busy = isPending || sendPending;

  return (
    <Card className="border-brand-primary/25 bg-zinc-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-cream text-base">Weekly digest</CardTitle>
        <CardDescription className="text-zinc-500 text-xs leading-relaxed">
          Preview and send &quot;This Week in Mission Hub&quot; for the past 7 days. Saturday
          morning scheduled delivery is optional via Vercel Cron (see docs).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={loadPreview}
            className="border-brand-primary/50 text-brand-primary"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Generating…
              </>
            ) : (
              "Preview this week"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || !digest}
            onClick={sendTest}
            className="border-zinc-600 text-zinc-200"
          >
            {sendPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Sending…
              </>
            ) : (
              "Send test to me"
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={busy || !digest?.hasContent}
            onClick={() => sendToMembers(false)}
            className="bg-brand-primary text-white hover:bg-brand-primary/90"
          >
            Send to members
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy || !digest?.hasContent}
            onClick={() => sendToMembers(true)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            Force resend
          </Button>
        </div>

        {digest && !digest.hasContent ? (
          <p className="text-xs text-amber-400/90 mt-3">
            Member send is disabled when there is no content. Test send is still available.
          </p>
        ) : null}

        {error ? <p className="text-sm text-red-400 mt-3">{error}</p> : null}
        {delivery ? <DeliverySummary delivery={delivery} /> : null}
        {digest ? <DigestPreview digest={digest} /> : null}
      </CardContent>
    </Card>
  );
}
