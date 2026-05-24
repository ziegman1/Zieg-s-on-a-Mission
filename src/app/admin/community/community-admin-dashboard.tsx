import Link from "next/link";
import type { CommunityAdminStats } from "@/lib/community/admin-community-stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardCard = {
  href: string;
  title: string;
  description: string;
  count: number;
  countLabel: string;
  secondary?: string;
};

function buildCards(stats: CommunityAdminStats): DashboardCard[] {
  return [
    {
      href: "/admin/community",
      title: "Spaces",
      description: "Mission Hub rooms and experience settings",
      count: stats.spaceCount,
      countLabel: "spaces",
    },
    {
      href: "/admin/community/posts",
      title: "Posts",
      description: "Create and moderate hub posts",
      count: stats.postCount,
      countLabel: "posts",
    },
    {
      href: "/admin/community/comments",
      title: "Comments",
      description: "Review member comments",
      count: stats.commentCount,
      countLabel: "comments",
    },
    {
      href: "/admin/community/members",
      title: "Members",
      description: "Search members, notifications, and activity",
      count: stats.memberCount,
      countLabel: "profiles",
      secondary: `${stats.activeMemberCount} active`,
    },
  ];
}

export function CommunityAdminDashboard({ stats }: { stats: CommunityAdminStats }) {
  const cards = buildCards(stats);

  return (
    <section aria-labelledby="mission-hub-admin-overview" className="space-y-3">
      <div>
        <h2
          id="mission-hub-admin-overview"
          className="text-sm font-semibold uppercase tracking-wider text-zinc-400"
        >
          Mission Hub admin
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Quick access to spaces, posts, comments, and member management.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.href} className="border-brand-primary/25 bg-zinc-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-cream text-base">{card.title}</CardTitle>
              <CardDescription className="text-zinc-500 text-xs leading-relaxed">
                {card.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-brand-primary">{card.count}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {card.countLabel}
                {card.secondary ? ` · ${card.secondary}` : null}
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-3 border-brand-primary/50 text-brand-primary"
              >
                <Link href={card.href}>Open {card.title.toLowerCase()}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
