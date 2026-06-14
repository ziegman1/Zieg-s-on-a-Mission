"use client";

import { useMemo, useState, useTransition } from "react";
import { loadSubscriberActivityAction } from "@/app/admin/community/preference-events-actions";
import type {
  NotificationPreferenceEventSummary30Days,
  NotificationPreferenceEventRow,
} from "@/lib/mission-hub/notification-preference-events";
import {
  NOTIFICATION_PREFERENCE_EVENT_LABELS,
  NOTIFICATION_PREFERENCE_EVENT_TYPES,
  type NotificationPreferenceEventType,
} from "@/lib/mission-hub/notification-preference-event-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SUMMARY_KEYS: {
  key: keyof NotificationPreferenceEventSummary30Days;
  label: string;
}[] = [
  { key: "weekly_digest_enabled", label: "Weekly digest on" },
  { key: "weekly_digest_disabled", label: "Weekly digest off" },
  { key: "email_channel_enabled", label: "Email on" },
  { key: "email_channel_disabled", label: "Email off" },
  { key: "unsubscribe_link_used", label: "Unsubscribes" },
  { key: "suppression_created", label: "Suppressions" },
  { key: "suppression_removed", label: "Unsuppressed" },
];

function formatMetadata(metadata: Record<string, unknown>): string | null {
  const parts: string[] = [];
  if (metadata.reason != null) parts.push(`reason: ${String(metadata.reason)}`);
  if (metadata.source != null) parts.push(`source: ${String(metadata.source)}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function MissionHubSubscriberActivityPanel({
  initialEvents,
  initialSummary,
}: {
  initialEvents: NotificationPreferenceEventRow[];
  initialSummary: NotificationPreferenceEventSummary30Days;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [summary, setSummary] = useState(initialSummary);
  const [filter, setFilter] = useState<NotificationPreferenceEventType | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filterOptions = useMemo(
    () => [
      { value: "all" as const, label: "All events" },
      ...NOTIFICATION_PREFERENCE_EVENT_TYPES.map((type) => ({
        value: type,
        label: NOTIFICATION_PREFERENCE_EVENT_LABELS[type],
      })),
    ],
    [],
  );

  function applyFilter(next: NotificationPreferenceEventType | "all") {
    setFilter(next);
    setError(null);
    startTransition(async () => {
      const result = await loadSubscriberActivityAction({ eventType: next });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEvents(result.events);
      setSummary(result.summary);
    });
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-cream text-base">Subscriber activity</CardTitle>
        <CardDescription className="text-zinc-500 text-xs leading-relaxed">
          Notification preference and suppression changes (last 30 days summary, recent events
          below).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {SUMMARY_KEYS.map((item) => (
            <div
              key={item.key}
              className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2"
            >
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">{item.label}</p>
              <p className="text-lg font-semibold text-zinc-100">{summary[item.key]}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="event-filter" className="text-xs text-zinc-500">
            Filter
          </label>
          <select
            id="event-filter"
            value={filter}
            disabled={pending}
            onChange={(e) =>
              applyFilter(e.target.value as NotificationPreferenceEventType | "all")
            }
            className="h-8 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-200"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {pending ? <span className="text-xs text-zinc-500">Loading…</span> : null}
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        {events.length === 0 ? (
          <p className="text-sm text-zinc-500">No preference events recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-500 uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">Member</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Event</th>
                  <th className="px-3 py-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-300">
                {events.map((event) => {
                  const meta = formatMetadata(event.metadata);
                  return (
                    <tr key={event.id} className="hover:bg-zinc-950/40">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {new Date(event.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">{event.memberName ?? "—"}</td>
                      <td className="px-3 py-2">{event.email}</td>
                      <td className="px-3 py-2">
                        {NOTIFICATION_PREFERENCE_EVENT_LABELS[event.eventType]}
                      </td>
                      <td className="px-3 py-2 text-zinc-500">
                        {meta ?? event.actorType}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
