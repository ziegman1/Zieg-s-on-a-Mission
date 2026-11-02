"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { contentStr } from "@/lib/site-builder/content-utils";
import { patchSectionContent } from "@/lib/site-builder/patch-section";
import type { PageSection } from "@/lib/site-builder/types";
import {
  deriveFundingGoals,
  formatUsd,
  normalizeMoneyFieldInput,
  parseMoneyInput,
} from "@/lib/ministry-funding/calculations";

/**
 * Dedicated financial inputs for the Ministry Funding goals section.
 * Plain currency/date controls — not rich-text copy fields.
 */
export function FundingGoalsPropertiesFields({
  section,
  onChange,
}: {
  section: PageSection;
  onChange: (next: PageSection) => void;
}) {
  const c = section.content;
  const monthlyGoal = contentStr(c, "monthlyGoal");
  const monthlyRecurring = contentStr(c, "monthlyRecurring");
  const figuresUpdatedAt = contentStr(c, "figuresUpdatedAt");

  const derived = deriveFundingGoals({
    monthlyGoal: parseMoneyInput(monthlyGoal),
    monthlyRecurring: parseMoneyInput(monthlyRecurring),
  });

  const setMoney = (key: "monthlyGoal" | "monthlyRecurring", value: string) => {
    onChange(patchSectionContent(section, key, normalizeMoneyFieldInput(value)));
  };

  const setDate = (value: string) => {
    onChange(patchSectionContent(section, "figuresUpdatedAt", value));
  };

  return (
    <div className="space-y-3 rounded-md border border-brand-accent/40 bg-zinc-950/60 p-3">
      <div>
        <p className="text-sm font-medium text-zinc-100">Financial partnership figures</p>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
          Enter verified monthly recurring amounts only. Annual totals, remaining need, and the
          progress bar calculate automatically. Leave a field blank until verified — blank is not
          $0.
        </p>
      </div>

      <MoneyInput
        id="monthly-funding-goal"
        label="Monthly Funding Goal ($)"
        value={monthlyGoal}
        onChange={(v) => setMoney("monthlyGoal", v)}
        hint="Primary monthly partnership goal"
      />
      <MoneyInput
        id="monthly-recurring-partnership"
        label="Current Monthly Recurring Partnership ($)"
        value={monthlyRecurring}
        onChange={(v) => setMoney("monthlyRecurring", v)}
        hint="Recurring monthly commitments only — not one-time gifts"
      />
      <div className="space-y-1">
        <Label htmlFor="figures-updated-at" className="text-xs text-zinc-400">
          Last Updated
        </Label>
        <Input
          id="figures-updated-at"
          type="date"
          value={toDateInputValue(figuresUpdatedAt)}
          onChange={(e) => setDate(e.target.value)}
          className="bg-zinc-950 text-zinc-100"
        />
        <p className="text-[10px] text-zinc-500">Date these figures were last verified</p>
      </div>

      <div className="rounded border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-[11px] text-zinc-400 space-y-1">
        <p className="font-medium text-zinc-300">Live calculation preview</p>
        <p>Annual goal: {moneyOrDash(derived.annualGoal)}</p>
        <p>Annualized recurring: {moneyOrDash(derived.annualizedRecurring)}</p>
        <p>Remaining monthly: {moneyOrDash(derived.remainingMonthly)}</p>
        <p>Remaining annualized: {moneyOrDash(derived.remainingAnnual)}</p>
        <p>
          Progress:{" "}
          {derived.percentAchieved === null
            ? derived.isComplete
              ? "n/a (zero goal)"
              : "—"
            : `${derived.percentAchieved}%`}
          {derived.progressBarPercent !== null
            ? ` · bar ${derived.progressBarPercent}%`
            : ""}
        </p>
      </div>
    </div>
  );
}

function MoneyInput({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-zinc-400">
        {label}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
          $
        </span>
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="Leave blank if unverified"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-zinc-950 pl-6 text-zinc-100 tabular-nums"
          aria-describedby={`${id}-hint`}
        />
      </div>
      <p id={`${id}-hint`} className="text-[10px] text-zinc-500">
        {hint}
      </p>
    </div>
  );
}

function moneyOrDash(n: number | null): string {
  return n === null ? "—" : formatUsd(n);
}

/** Accept YYYY-MM-DD for date inputs; ignore free-text legacy values. */
function toDateInputValue(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return "";
}
