import {
  RECRUIT_SENT_GOAL,
  sentGoalPercent,
} from "@/lib/recruits/recruit-milestones";
import type { MinistryOutcomeCounts } from "@/lib/ministry/ministry-milestones";

function PreviewCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-2xl border border-brand-accent/30 bg-zinc-950/60 px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent/90">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl text-cream tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-zinc-500 leading-snug">{hint}</p>
    </div>
  );
}

/** Preview only. The public site still uses the legacy Recruit Tracker totals. */
export function MinistrySummary({ counts }: { counts: MinistryOutcomeCounts }) {
  const percent = sentGoalPercent(counts.sent);
  const remaining = Math.max(0, RECRUIT_SENT_GOAL - counts.sent);

  return (
    <section className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent">
          New definitions — preview
        </p>
        <p className="mt-1 text-xs text-zinc-500 max-w-3xl leading-relaxed">
          These numbers count only confirmed milestones on individual people. They are not on the
          public site. The public totals below are still the legacy Recruit Tracker figures.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <PreviewCard
          label="Mobilized"
          value={counts.mobilized}
          hint="Confirmed next step. Adding a name does not count."
        />
        <PreviewCard
          label="Trained & Equipped"
          value={counts.trainedEquipped}
          hint="Confirmed training or coaching. One count per person."
        />
        <PreviewCard
          label="Sent"
          value={counts.sent}
          hint="Confirmed sending milestone with a designation."
        />
      </div>

      <div className="rounded-2xl border border-brand-accent/30 bg-zinc-950/60 px-5 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent/90">
            300 more workers Sent by August 31, 2031
          </p>
          <p className="text-sm text-zinc-400">
            <span className="font-semibold text-cream tabular-nums">{counts.sent}</span> of{" "}
            {RECRUIT_SENT_GOAL} Sent
          </p>
        </div>
        <div
          className="mt-4 h-3 w-full overflow-hidden rounded-full bg-brand-accent/15"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={RECRUIT_SENT_GOAL}
          aria-valuenow={counts.sent}
          aria-label={`Preview progress: ${counts.sent} of ${RECRUIT_SENT_GOAL} sent under the new definitions`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          {remaining > 0
            ? `${remaining} more confirmed Sent workers to reach 300.`
            : "300 confirmed Sent workers."}{" "}
          <span className="text-zinc-500">{percent}% in this preview.</span>
        </p>
      </div>
    </section>
  );
}
