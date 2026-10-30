import {
  RECRUIT_SENT_GOAL,
  sentGoalPercent,
} from "@/lib/recruits/recruit-milestones";
import type { MinistryOutcomeBreakdown } from "@/lib/ministry/ministry-milestones";

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

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

/** The same totals shown on the public homepage. */
export function MinistrySummary({ counts }: { counts: MinistryOutcomeBreakdown }) {
  const percent = sentGoalPercent(counts.unified.sent);
  const remaining = Math.max(0, RECRUIT_SENT_GOAL - counts.unified.sent);
  const hint = `${countLabel(counts.individuals.mobilized, "verified individual", "verified individuals")} and ${countLabel(counts.nationalPartnerInitiatives.mobilized, "national partner participant", "national partner participants")}.`;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent">
          Public totals
        </p>
        <p className="mt-1 text-xs text-zinc-500 max-w-3xl leading-relaxed">
          These totals add verified individual milestones to anonymous national partner participants.
          The homepage uses these same totals. National partner participants are not named, so the
          same person cannot be removed from the total if they attend more than one initiative.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <PreviewCard label="Mobilized" value={counts.unified.mobilized} hint={hint} />
        <PreviewCard
          label="Trained & Equipped"
          value={counts.unified.trainedEquipped}
          hint={`${countLabel(counts.individuals.trainedEquipped, "verified individual", "verified individuals")} and ${countLabel(counts.nationalPartnerInitiatives.trainedEquipped, "national partner participant", "national partner participants")}.`}
        />
        <PreviewCard
          label="Sent"
          value={counts.unified.sent}
          hint={`${countLabel(counts.individuals.sent, "verified individual", "verified individuals")} and ${countLabel(counts.nationalPartnerInitiatives.sent, "national partner participant", "national partner participants")}.`}
        />
      </div>

      <div className="rounded-2xl border border-brand-accent/30 bg-zinc-950/60 px-5 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent/90">
            300 more workers Sent by August 31, 2031
          </p>
          <p className="text-sm text-zinc-400">
            <span className="font-semibold text-cream tabular-nums">{counts.unified.sent}</span> of{" "}
            {RECRUIT_SENT_GOAL} Sent
          </p>
        </div>
        <div
          className="mt-4 h-3 w-full overflow-hidden rounded-full bg-brand-accent/15"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={RECRUIT_SENT_GOAL}
          aria-valuenow={counts.unified.sent}
          aria-label={`Preview progress: ${counts.unified.sent} of ${RECRUIT_SENT_GOAL} sent under the new definitions`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          {remaining > 0
            ? `${remaining} more Sent in this preview to reach 300.`
            : "300 Sent in this preview."}{" "}
          <span className="text-zinc-500">{percent}% in this preview.</span>
        </p>
      </div>
    </section>
  );
}
