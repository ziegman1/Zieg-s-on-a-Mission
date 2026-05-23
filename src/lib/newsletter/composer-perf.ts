/** Dev-only timing markers for newsletter/site builder performance audits. */
export function perfMark(label: string, detail?: unknown): void {
  if (process.env.NODE_ENV === "production") return;
  const suffix = detail !== undefined ? ` ${JSON.stringify(detail)}` : "";
  console.debug(`[composer-perf] ${label}${suffix} @ ${Math.round(performance.now())}ms`);
}

export function perfMeasure<T>(label: string, fn: () => T): T {
  if (process.env.NODE_ENV === "production") return fn();
  const start = performance.now();
  const result = fn();
  console.debug(`[composer-perf] ${label} took ${Math.round(performance.now() - start)}ms`);
  return result;
}
