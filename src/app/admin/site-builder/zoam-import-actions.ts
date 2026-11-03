"use server";

import {
  validateZoamMinistryAllocationImport,
  type ZoamExistingAllocationMeta,
  type ZoamImportResult,
} from "@/lib/ministry-funding/zoam-import";

/**
 * Server-side validation of a PD Coaching OS ministry allocation paste.
 * Apply-to-draft remains a client draft mutation; publish uses existing Site Builder save.
 */
export async function validateZoamMinistryAllocationAction(
  rawText: string,
  existing?: ZoamExistingAllocationMeta | null,
): Promise<ZoamImportResult> {
  return validateZoamMinistryAllocationImport(rawText, existing);
}
