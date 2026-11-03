"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FunctionCardView } from "@/lib/ministry-funding/from-sections";
import {
  ministryFunctionSummary,
  toggleExpandedFunctionId,
} from "@/lib/ministry-funding/function-summary";
import { cn } from "@/lib/utils";

export function MinistryFunctionAccordion({
  functions,
  dimHidden = false,
}: {
  functions: FunctionCardView[];
  /** When true (Site Builder edit mode), dim rows marked not visible. */
  dimHidden?: boolean;
}) {
  const reactId = useId();
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  if (functions.length === 0) return null;

  return (
    <div className="mt-10 overflow-hidden rounded-xl border border-brand-primary/20 bg-white/70">
      <ul className="divide-y divide-brand-primary/15">
        {functions.map((fn) => {
          const open = openIds.has(fn.id);
          const panelId = `${reactId}-panel-${fn.id}`;
          const buttonId = `${reactId}-button-${fn.id}`;
          const summary = ministryFunctionSummary(fn.description);

          return (
            <li
              key={fn.id}
              className={cn(dimHidden && !fn.visible && "opacity-50")}
            >
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIds((prev) => toggleExpandedFunctionId(prev, fn.id))}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors",
                  "hover:bg-brand-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-inset",
                )}
              >
                <span
                  className="mt-1.5 h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: fn.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-lg text-brand-ink tracking-wide">
                    {fn.name}
                  </span>
                  {!open && summary ? (
                    <span className="mt-0.5 block text-sm text-brand-ink/65 leading-snug line-clamp-2 sm:truncate">
                      {summary}
                    </span>
                  ) : null}
                </span>
                <ChevronDown
                  className={cn(
                    "mt-1 h-5 w-5 shrink-0 text-brand-ink/40 transition-transform duration-200",
                    open && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!open}
                className={cn(!open && "hidden")}
              >
                <div className="border-t border-brand-primary/10 px-4 pb-4 pt-1 pl-10">
                  {fn.description ? (
                    <p className="text-sm text-brand-ink/85 leading-relaxed">{fn.description}</p>
                  ) : null}
                  {fn.programs.length > 0 ? (
                    <ul className="mt-3 space-y-1.5">
                      {fn.programs.map((program) => (
                        <li
                          key={program}
                          className="flex gap-2 text-sm text-brand-ink/75 leading-snug"
                        >
                          <span
                            className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-accent"
                            aria-hidden
                          />
                          <span>{program}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
