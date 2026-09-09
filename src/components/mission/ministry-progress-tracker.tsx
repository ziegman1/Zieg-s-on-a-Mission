import {
  RECRUIT_SENT_GOAL,
  sentGoalPercent,
  type RecruitCounts,
} from "@/lib/recruits/recruit-milestones";

function MilestoneStep({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="flex-1 min-w-0 text-center sm:text-left">
      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-primary/85">
        {label}
      </p>
      <p className="mt-1 font-serif text-3xl sm:text-4xl text-brand-ink tabular-nums tracking-tight">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-brand-ink/55 leading-snug">{note}</p>
    </div>
  );
}

/** Chevron between milestones; decorative, since the labels already convey the order. */
function StepArrow() {
  return (
    <span
      aria-hidden
      className="hidden sm:block shrink-0 self-start mt-5 text-brand-primary/40 text-lg"
    >
      →
    </span>
  );
}

/**
 * Public ministry progress tracker.
 *
 * Receives aggregate integers only — no recruit record ever reaches this component.
 */
export function MinistryProgressTracker({ counts }: { counts: RecruitCounts }) {
  const { mobilized, trained, sent } = counts;
  const percent = sentGoalPercent(sent);
  const remaining = Math.max(0, RECRUIT_SENT_GOAL - sent);

  return (
    <section
      className="rounded-2xl border border-brand-primary/25 bg-white/75 shadow-sm px-5 py-6 sm:px-7 sm:py-8"
      aria-labelledby="ministry-progress-heading"
    >
      <p
        id="ministry-progress-heading"
        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-primary"
      >
        The Progress So Far
      </p>

      <div className="mt-5 flex items-start gap-3 sm:gap-4">
        <MilestoneStep label="Mobilized" value={mobilized} note="Answered the call" />
        <StepArrow />
        <MilestoneStep label="Trained" value={trained} note="Training complete" />
        <StepArrow />
        <MilestoneStep label="Sent" value={sent} note="Fully funded" />
      </div>

      <div className="mt-7 border-t border-brand-primary/15 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <p className="font-serif text-2xl sm:text-3xl text-brand-ink tracking-wide">
            <span className="tabular-nums">{sent}</span>{" "}
            <span className="text-lg text-brand-ink/60">of {RECRUIT_SENT_GOAL} Sent</span>
          </p>
          <p className="text-sm font-semibold text-brand-primary tabular-nums">{percent}%</p>
        </div>

        <div
          className="mt-4 h-4 w-full overflow-hidden rounded-full bg-brand-primary/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={RECRUIT_SENT_GOAL}
          aria-valuenow={sent}
          aria-label={`Progress toward the goal: ${sent} of ${RECRUIT_SENT_GOAL} missionaries sent`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="mt-3 text-xs text-brand-ink/60 leading-relaxed">
          {remaining > 0 ? (
            <>
              <span className="font-medium text-brand-ink">{remaining}</span> more to reach 300
              missionaries sent to the unreached by August 31, 2031.
            </>
          ) : (
            <span className="font-medium text-brand-primary">
              300 sent — goal reached. To God be the glory.
            </span>
          )}
        </p>
      </div>
    </section>
  );
}
