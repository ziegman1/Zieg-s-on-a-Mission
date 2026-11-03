import type { PageSection } from "@/lib/site-builder/types";
import { isMinistryFundingAllocationSection } from "@/lib/site-builder/ministry-funding-page-sections";
import { parseAllocationSection } from "./from-sections";
import { validateZoamMinistryAllocationImport } from "./zoam-import";

/**
 * Server-side gate before persisting ministry-funding sections.
 * Invalid zoam snapshots cannot be saved; incomplete manual charts may save
 * (public page simply hides the chart until reconciled).
 */
export function assertMinistryFundingAllocationSavable(
  sections: PageSection[],
): { ok: true } | { ok: false; error: string } {
  const allocation = sections.find(isMinistryFundingAllocationSection);
  if (!allocation) return { ok: true };

  const raw = allocation.content.zoamSnapshot;
  if (raw == null || raw === "") return { ok: true };

  const json = typeof raw === "string" ? raw : JSON.stringify(raw);
  const validated = validateZoamMinistryAllocationImport(json);
  if (!validated.ok) {
    const firstError = validated.issues.find((i) => i.severity === "error");
    return {
      ok: false,
      error:
        firstError?.message ||
        "Ministry Allocation snapshot failed validation and cannot be saved.",
    };
  }

  const view = parseAllocationSection(allocation, { includeHidden: true });
  if (view?.zoamSnapshot && !view.derived.reconciliationOk) {
    return {
      ok: false,
      error: "Ministry Allocation snapshot does not reconcile and cannot be saved.",
    };
  }

  return { ok: true };
}
