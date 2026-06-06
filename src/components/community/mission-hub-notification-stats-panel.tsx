import type { MissionHubNotificationAdminStats } from "@/lib/mission-hub/admin-notification-reporting";

export function MissionHubNotificationStatsPanel({
  stats,
}: {
  stats: MissionHubNotificationAdminStats;
}) {
  const cards = [
    { label: "Email enabled", value: stats.emailEnabled },
    { label: "Digest users", value: stats.digestUsers },
    { label: "Daily digest", value: stats.dailyDigestUsers },
    { label: "Weekly digest", value: stats.weeklyDigestUsers },
    { label: "Unsubscribed", value: stats.unsubscribedUsers },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3"
        >
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
