/**
 * Classification cutoff is the moment enhanced analytics became active.
 * Prefer an explicit env timestamp set at deploy/activation; otherwise derive
 * from the earliest classified PageView. Never treat a hardcoded midnight as
 * ground truth for reporting copy.
 */

/** Provisional fallback only when env and DB have no activation signal yet. */
export const ANALYTICS_CLASSIFICATION_CUTOFF_FALLBACK_ISO = "2026-11-03T00:00:00.000Z";

export function parseCutoffIso(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const ms = Date.parse(raw.trim());
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

/** Env override — set ANALYTICS_CLASSIFICATION_CUTOFF_ISO at activation/deploy. */
export function resolveConfiguredCutoffIso(
  envValue: string | null | undefined = process.env.ANALYTICS_CLASSIFICATION_CUTOFF_ISO,
): string | null {
  return parseCutoffIso(envValue);
}

export type CutoffResolution = {
  iso: string;
  source: "env" | "first_classified_row" | "pending_fallback";
  /** True when the value is not yet a real activation time. */
  provisional: boolean;
};

export function resolveCutoffDisplay(params: {
  envIso?: string | null;
  firstClassifiedAt?: Date | string | null;
  now?: Date;
}): CutoffResolution {
  const fromEnv = resolveConfiguredCutoffIso(params.envIso ?? process.env.ANALYTICS_CLASSIFICATION_CUTOFF_ISO);
  if (fromEnv) {
    return { iso: fromEnv, source: "env", provisional: false };
  }

  if (params.firstClassifiedAt) {
    const iso =
      params.firstClassifiedAt instanceof Date
        ? params.firstClassifiedAt.toISOString()
        : parseCutoffIso(String(params.firstClassifiedAt));
    if (iso) {
      return { iso, source: "first_classified_row", provisional: false };
    }
  }

  return {
    iso: ANALYTICS_CLASSIFICATION_CUTOFF_FALLBACK_ISO,
    source: "pending_fallback",
    provisional: true,
  };
}
