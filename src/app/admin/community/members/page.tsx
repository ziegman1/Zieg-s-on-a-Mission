import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { listMembersForAdminPortal } from "@/lib/community/admin-members-portal";
import { getCurrentCommunityOwner } from "@/lib/community/owner";
import { loadMissionHubNotificationAdminStats } from "@/lib/mission-hub/admin-notification-reporting";
import { AdminMembersPortal } from "@/components/community/admin-members-portal";
import { MissionHubNotificationStatsPanel } from "@/components/community/mission-hub-notification-stats-panel";
import { MissionHubSubscriberActivityPanel } from "@/components/community/mission-hub-subscriber-activity-panel";
import {
  loadNotificationPreferenceEventSummary30Days,
  loadNotificationPreferenceEventsForAdmin,
} from "@/lib/mission-hub/notification-preference-events";

export const dynamic = "force-dynamic";

const MEMBERS_ROUTE = "/admin/community/members";

export default async function AdminCommunityMembersPage() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? MEMBERS_ROUTE;
  const owner = await getCurrentCommunityOwner();

  console.info("[admin/members] route", {
    route: MEMBERS_ROUTE,
    pathname,
    registered: true,
    authorized: Boolean(owner),
    actorUserId: owner?.id ?? null,
    actorRole: owner?.role ?? null,
  });

  if (!owner) {
    console.warn("[admin/members] unauthorized — redirecting to admin login");
    redirect(`/admin/login?callbackUrl=${encodeURIComponent(MEMBERS_ROUTE)}`);
  }

  let members: Awaited<ReturnType<typeof listMembersForAdminPortal>> = [];
  let notificationStats: Awaited<
    ReturnType<typeof loadMissionHubNotificationAdminStats>
  > | null = null;
  let preferenceEvents: Awaited<
    ReturnType<typeof loadNotificationPreferenceEventsForAdmin>
  > = [];
  let preferenceSummary: Awaited<
    ReturnType<typeof loadNotificationPreferenceEventSummary30Days>
  > | null = null;
  let dbError: string | null = null;

  try {
    [members, notificationStats, preferenceEvents, preferenceSummary] = await Promise.all([
      listMembersForAdminPortal(),
      loadMissionHubNotificationAdminStats(),
      loadNotificationPreferenceEventsForAdmin({ limit: 75 }),
      loadNotificationPreferenceEventSummary30Days(),
    ]);
    console.info("[admin/members] query", { count: members.length });
  } catch (e) {
    console.error("[admin/members] query failed", e);
    dbError =
      "Could not load members. Run `npm run db:migrate:deploy` after applying community migrations.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-brand-primary tracking-wide">
          Mission Hub — Members
        </h1>
        <p className="text-zinc-400 text-sm mt-2 max-w-3xl leading-relaxed">
          Owner and staff can review who is in Mission Hub, notification preferences, engagement,
          and delivery history. Member preferences are read-only here — partners manage their own
          settings in Mission Hub.
        </p>
      </div>
      {dbError ? (
        <p className="text-red-400 text-sm max-w-2xl leading-relaxed">{dbError}</p>
      ) : (
        <>
          {notificationStats ? (
            <MissionHubNotificationStatsPanel stats={notificationStats} />
          ) : null}
          {preferenceSummary ? (
            <MissionHubSubscriberActivityPanel
              initialEvents={preferenceEvents}
              initialSummary={preferenceSummary}
            />
          ) : null}
          <AdminMembersPortal initialMembers={members} />
        </>
      )}
    </div>
  );
}
