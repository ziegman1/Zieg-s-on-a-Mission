import Link from "next/link";
import { CalendarDays, HandHeart, Sparkles, Users } from "lucide-react";

function RailCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof HandHeart;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-black/[0.06] bg-white/75 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-black/[0.05]">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-primary/10 text-brand-primary">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <h2 className="text-sm font-medium text-brand-ink">{title}</h2>
      </div>
      <div className="px-3 py-2.5 text-xs text-brand-ink/70 leading-relaxed">{children}</div>
    </section>
  );
}

export function CommunityRightRail() {
  return (
    <aside className="hidden lg:block w-full space-y-4" aria-label="Mission Hub highlights">
      <RailCard title="Pray With Us This Week" icon={HandHeart}>
        <p className="mb-3">
          Prayer requests and field needs will appear here as we share them with partners.
        </p>
        <p className="text-xs text-brand-ink/55 italic">Coming soon in Mission Hub</p>
      </RailCard>
      <RailCard title="Latest Praise" icon={Sparkles}>
        <p className="mb-3">
          Celebrate what God is doing — praise reports from the journey will show up in this
          feed.
        </p>
        <p className="text-xs text-brand-ink/55 italic">Coming soon in Mission Hub</p>
      </RailCard>
      <RailCard title="Ways to Engage" icon={Users}>
        <ul className="space-y-2">
          <li>
            <Link href="/partner" className="text-brand-primary font-medium hover:underline">
              Become a monthly partner
            </Link>
          </li>
          <li>
            <Link href="/give" className="text-brand-primary font-medium hover:underline">
              Give a one-time gift
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-brand-primary font-medium hover:underline">
              Contact our family
            </Link>
          </li>
        </ul>
      </RailCard>
      <RailCard title="Upcoming" icon={CalendarDays}>
        <p className="mb-3">
          Gatherings, calls, and key dates for our ministry family will be listed here.
        </p>
        <p className="text-xs text-brand-ink/55 italic">Events — coming soon</p>
      </RailCard>
    </aside>
  );
}
