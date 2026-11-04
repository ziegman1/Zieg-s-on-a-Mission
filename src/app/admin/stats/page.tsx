import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  loadAdminStats,
  parseStatsRange,
  parseTrafficFilter,
  type StatsRangeDays,
  type StatsTrafficFilter,
} from "@/lib/analytics/admin-stats";
import { isAnalyticsEngagementEnabled } from "@/lib/analytics/engagement-flag";

export const dynamic = "force-dynamic";

const FILTERS: { id: StatsTrafficFilter; label: string }[] = [
  { id: "all", label: "All Traffic" },
  { id: "likely_human", label: "Likely Human" },
  { id: "unverified", label: "Unverified" },
  { id: "likely_bot", label: "Likely Bot" },
];

const RANGES: StatsRangeDays[] = [7, 30, 90];

function qs(filter: StatsTrafficFilter, range: StatsRangeDays): string {
  return `?filter=${filter}&range=${range}`;
}

function Tip({ children }: { children: string }) {
  return (
    <p className="text-xs text-zinc-500 mt-1 leading-relaxed" title={children}>
      {children}
    </p>
  );
}

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const filter = parseTrafficFilter(typeof sp.filter === "string" ? sp.filter : undefined);
  const rangeDays = parseStatsRange(typeof sp.range === "string" ? sp.range : undefined);
  const stats = await loadAdminStats({ rangeDays, trafficFilter: filter });
  const engagementEnabled = isAnalyticsEngagementEnabled();
  const cutoffLabel = stats.cutoffIso.replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
  const cutoffSourceLabel =
    stats.cutoffSource === "env"
      ? "from ANALYTICS_CLASSIFICATION_CUTOFF_ISO"
      : stats.cutoffSource === "first_classified_row"
        ? "from first classified page view"
        : "provisional fallback — set env at activation";

  const funnelRows: { key: keyof typeof stats.funnel; label: string; note: string }[] = [
    { key: "our_mission_view", label: "Our Mission views", note: "Page visit to /our-mission" },
    { key: "partner_with_us_click", label: "Partner With Us clicks", note: "Click only — not a donation" },
    { key: "giving_page_visit", label: "Giving page visits", note: "/ministry-funding, /partner, /give, /advocacy-team" },
    { key: "external_giving_link_click", label: "External giving-link clicks", note: "Click only — not a confirmed gift" },
    { key: "mission_hub_entry_click", label: "Mission Hub entry clicks", note: "Nav/CTA to /community (separate from Hub activity log)" },
    { key: "mission_hub_join_click", label: "Mission Hub join clicks", note: "Click to /community/join" },
    { key: "newsletter_signup_complete", label: "Newsletter signup complete", note: "Server-confirmed only (not wired yet)" },
    { key: "contact_submission_complete", label: "Contact submission complete", note: "Server-confirmed only (no contact form yet)" },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="font-serif text-3xl text-brand-primary tracking-wide">Traffic & Stats</h1>
        <p className="text-zinc-400 text-sm mt-2 max-w-3xl leading-relaxed">
          First-party storefront analytics. Classifications are best-effort labels
          (Likely Human / Unverified / Likely Bot) — not proof of personhood. Mission Hub
          member activity remains in Community admin, not here.
        </p>
      </div>

      {!engagementEnabled ? (
        <Card className="border-amber-500/40 bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-200 text-base">Engagement tracking is off</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-100/80 space-y-2 leading-relaxed">
            <p>
              Scroll depth, active time, internal navigation, and CTA click events are not being
              collected because{" "}
              <span className="font-mono text-amber-100">NEXT_PUBLIC_ANALYTICS_ENGAGEMENT_ENABLED</span>{" "}
              is unset. Page views still record.{" "}
              <strong className="text-amber-100 font-medium">Likely Human</strong> stays near zero
              until engagement is enabled — a browser User-Agent alone never qualifies as human.
            </p>
            <p>
              Use <strong className="text-amber-100 font-medium">All Traffic</strong> or{" "}
              <strong className="text-amber-100 font-medium">Unverified</strong> to review real visits
              meanwhile. EEA/UK visitors need analytics opt-in before any collection. Enabling the
              engagement flag still requires a production env change and redeploy after you approve.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-amber-500/30 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-cream text-base">Historical data & cutoff</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-400 space-y-2 leading-relaxed">
          <p>
            Enhanced classification activation:{" "}
            <span className="text-cream font-mono">{cutoffLabel}</span>{" "}
            <span className="text-zinc-500">({cutoffSourceLabel})</span>
            {stats.cutoffProvisional ? (
              <span className="text-amber-400/90">
                {" "}
                — provisional until deploy sets the env timestamp or classified rows exist.
              </span>
            ) : null}{" "}
            Rows with no classification (including all older page views) are treated as{" "}
            <strong className="text-zinc-300 font-medium">Unverified</strong>. We do not
            retroactively guess human/bot labels for legacy traffic.
          </p>
          <p>
            Default filter is <strong className="text-zinc-300 font-medium">All Traffic</strong>.
            Use <strong className="text-zinc-300 font-medium">Likely Human</strong>,{" "}
            <strong className="text-zinc-300 font-medium">Unverified</strong>, and{" "}
            <strong className="text-zinc-300 font-medium">Likely Bot</strong> to slice certainty.
            Unique visitors are estimated from salted IP hashes — not identities.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Traffic classification">
          {FILTERS.map((f) => (
            <Link
              key={f.id}
              href={qs(f.id, rangeDays)}
              className={`rounded-md px-3 py-1.5 text-sm border transition-colors ${
                filter === f.id
                  ? "border-brand-primary bg-brand-primary/20 text-brand-primary"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={qs(filter, r)}
              className={`rounded-md px-3 py-1.5 text-sm border transition-colors ${
                rangeDays === r
                  ? "border-brand-primary bg-brand-primary/20 text-brand-primary"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {r} days
            </Link>
          ))}
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Showing last {rangeDays} days · filter: {FILTERS.find((f) => f.id === filter)?.label}.
        Unfiltered class mix in range — human {stats.classBreakdown.likely_human.toLocaleString()} ·
        unverified {stats.classBreakdown.unverified.toLocaleString()} · bot{" "}
        {stats.classBreakdown.likely_bot.toLocaleString()}.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-brand-primary/25 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-cream">Page views</CardTitle>
            <CardDescription>Matching current filter</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-brand-primary">
              {stats.pageViews.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-brand-primary/25 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-cream">Unique visitors</CardTitle>
            <CardDescription>Estimated (IP hash)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-brand-primary">
              {stats.uniqueVisitors.toLocaleString()}
            </p>
            <Tip>
              Approximate distinct salted IP hashes — NAT, mobile, and VPNs make this an estimate.
            </Tip>
          </CardContent>
        </Card>
        <Card className="border-brand-primary/25 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-cream">Sessions</CardTitle>
            <CardDescription>Tab-scoped, short-lived</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-brand-primary">
              {stats.sessions.toLocaleString()}
            </p>
            <Tip>Ephemeral session IDs (30m idle / 12h max). Pre-cutoff traffic has none.</Tip>
          </CardContent>
        </Card>
        <Card className="border-brand-primary/25 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-cream">Engaged sessions</CardTitle>
            <CardDescription>Scroll, active time, or CTA</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-brand-primary">
              {stats.engagedSessions.toLocaleString()}
            </p>
            <Tip>
              Suggestive interaction — not verified humans. Bots can simulate engagement.
            </Tip>
          </CardContent>
        </Card>
      </div>

      <details className="group rounded-lg border border-zinc-800 bg-zinc-950/50 open:pb-2" open>
        <summary className="cursor-pointer list-none px-4 py-3 text-cream font-medium flex items-center justify-between">
          Views by day
          <span className="text-xs text-zinc-500 group-open:hidden">Show</span>
        </summary>
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {stats.byDay.map(({ date, views }) => (
              <div
                key={date}
                className="flex flex-col items-center rounded border border-zinc-700 px-2 py-1 min-w-[3rem]"
                title={`${date}: ${views} views`}
              >
                <span className="text-xs text-zinc-500">{date.slice(5)}</span>
                <span className="text-sm font-medium text-brand-primary">{views}</span>
              </div>
            ))}
          </div>
        </div>
      </details>

      <div className="grid gap-4 lg:grid-cols-2">
        <details className="rounded-lg border border-zinc-800 bg-zinc-950/50" open>
          <summary className="cursor-pointer px-4 py-3 text-cream font-medium">Top pages</summary>
          <ul className="px-4 pb-4 space-y-2">
            {stats.topPaths.length === 0 ? (
              <li className="text-zinc-500 text-sm">
                No matching page views in this range/filter.
              </li>
            ) : (
              stats.topPaths.map(({ path, views }) => (
                <li key={path} className="flex justify-between text-sm gap-4">
                  <span className="text-cream font-mono truncate">{path || "/"}</span>
                  <span className="text-brand-primary shrink-0">{views.toLocaleString()}</span>
                </li>
              ))
            )}
          </ul>
        </details>

        <details className="rounded-lg border border-zinc-800 bg-zinc-950/50" open>
          <summary className="cursor-pointer px-4 py-3 text-cream font-medium">
            Landing journeys (aggregate)
          </summary>
          <ul className="px-4 pb-4 space-y-2">
            {stats.journeys.length === 0 ? (
              <li className="text-zinc-500 text-sm">
                No session landings yet (requires post-cutoff sessions).
              </li>
            ) : (
              stats.journeys.map(({ path, sessions }) => (
                <li key={path} className="flex justify-between text-sm gap-4">
                  <span className="text-cream font-mono truncate">{path}</span>
                  <span className="text-brand-primary shrink-0">
                    {sessions.toLocaleString()} sessions
                  </span>
                </li>
              ))
            )}
          </ul>
          <p className="px-4 pb-4 text-xs text-zinc-500">
            Aggregated first landing paths only — not identifiable per-person trails.
          </p>
        </details>
      </div>

      <details className="rounded-lg border border-zinc-800 bg-zinc-950/50" open>
        <summary className="cursor-pointer px-4 py-3 text-cream font-medium">
          Human engagement overview
        </summary>
        <div className="px-4 pb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-zinc-300 mb-2">Scroll depth events</p>
            {stats.scrollSummary.length === 0 ? (
              <p className="text-zinc-500 text-sm">No scroll events for this filter.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {stats.scrollSummary.map((s) => (
                  <li key={s.depth} className="flex justify-between">
                    <span className="text-cream">{s.depth}%</span>
                    <span className="text-brand-primary">{s.events.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-sm text-zinc-300 mb-2">Active time buckets (visible/focused)</p>
            {stats.activeTimeSummary.length === 0 ? (
              <p className="text-zinc-500 text-sm">No active-time events for this filter.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {stats.activeTimeSummary.map((s) => (
                  <li key={s.bucketMs} className="flex justify-between">
                    <span className="text-cream">≥ {Math.round(s.bucketMs / 1000)}s</span>
                    <span className="text-brand-primary">{s.events.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </details>

      <details className="rounded-lg border border-zinc-800 bg-zinc-950/50" open>
        <summary className="cursor-pointer px-4 py-3 text-cream font-medium">
          Ministry CTA funnel
        </summary>
        <ul className="px-4 pb-4 space-y-3">
          {funnelRows.map((row) => (
            <li key={row.key} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-zinc-800/80 pb-2">
              <div>
                <p className="text-sm text-cream">{row.label}</p>
                <p className="text-xs text-zinc-500">{row.note}</p>
              </div>
              <p className="text-lg font-semibold text-brand-primary tabular-nums">
                {stats.funnel[row.key].toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
        <p className="px-4 pb-4 text-xs text-zinc-500">
          Clicks are not conversions. External giving clicks are not donations. Denominator for
          rates should be sessions or page views under the same filter — do not mix filters.
        </p>
      </details>
    </div>
  );
}
