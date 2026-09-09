import {
  RECRUIT_SENT_GOAL,
  sentGoalPercent,
  type RecruitCounts,
} from "@/lib/recruits/recruit-milestones";

function SummaryCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-2xl border border-brand-primary/25 bg-zinc-950/60 px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary/85">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl text-cream tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-zinc-500 leading-snug">{hint}</p>
    </div>
  );
}

export function RecruitSummary({ counts }: { counts: RecruitCounts }) {
  const percent = sentGoalPercent(counts.sent);

  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Mobilized" value={counts.mobilized} hint="Every person added" />
        <SummaryCard label="Trained" value={counts.trained} hint="Jonathan Training complete" />
        <SummaryCard label="Sent" value={counts.sent} hint="Trained and fully funded" />
      </div>

      <div className="rounded-2xl border border-brand-primary/25 bg-zinc-950/60 px-5 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary/85">
            Progress toward the goal
          </p>
          <p className="text-sm text-zinc-400">
            <span className="font-semibold text-cream tabular-nums">{counts.sent}</span> of{" "}
            {RECRUIT_SENT_GOAL} Sent
          </p>
        </div>

        <div
          className="mt-4 h-3 w-full overflow-hidden rounded-full bg-brand-primary/15"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={RECRUIT_SENT_GOAL}
          aria-valuenow={counts.sent}
          aria-label={`Progress toward the goal: ${counts.sent} of ${RECRUIT_SENT_GOAL} sent`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="mt-3 text-sm font-medium text-brand-primary tabular-nums">
          {percent}% of 300 by August 31, 2031
        </p>
      </div>
    </section>
  );
}
