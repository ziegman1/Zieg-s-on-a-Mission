import {
  SESSION_INACTIVITY_MS,
  SESSION_MAX_LIFETIME_MS,
  SESSION_STORAGE_KEY,
} from "./constants";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidSessionId(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export type ClientSessionState = {
  id: string;
  createdAt: number;
  lastActivityAt: number;
};

export function createClientSessionState(now = Date.now()): ClientSessionState {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  // Fallback above may not be UUID — callers in browser should use crypto.randomUUID.
  return { id, createdAt: now, lastActivityAt: now };
}

export function isSessionExpired(state: ClientSessionState, now = Date.now()): boolean {
  if (now - state.createdAt > SESSION_MAX_LIFETIME_MS) return true;
  if (now - state.lastActivityAt > SESSION_INACTIVITY_MS) return true;
  return false;
}

export function readClientSession(): ClientSessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClientSessionState;
    if (!isValidSessionId(parsed.id)) return null;
    if (typeof parsed.createdAt !== "number" || typeof parsed.lastActivityAt !== "number") {
      return null;
    }
    if (isSessionExpired(parsed)) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeClientSession(state: ClientSessionState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode / blocked storage — tracking continues without durable session.
  }
}

/** Remove analytics sessionStorage key (e.g. before consent or after decline). */
export function clearClientSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Touch or create the tab session. Returns null when device storage is not allowed
 * (EEA/UK/unknown without opt-in) so callers skip analytics entirely.
 */
export function touchClientSession(
  now = Date.now(),
  options?: { allowDeviceStorage?: boolean },
): ClientSessionState | null {
  const allowDeviceStorage = options?.allowDeviceStorage !== false;
  if (!allowDeviceStorage) {
    clearClientSession();
    return null;
  }

  const existing = readClientSession();
  if (existing && isValidSessionId(existing.id) && !isSessionExpired(existing, now)) {
    const next = { ...existing, lastActivityAt: now };
    writeClientSession(next);
    return next;
  }
  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? { id: crypto.randomUUID(), createdAt: now, lastActivityAt: now }
      : createClientSessionState(now);
  if (!isValidSessionId(created.id)) {
    // Extremely defensive: invent a UUID-shaped id
    const id = "00000000-0000-4000-8000-000000000000".replace(/0/g, () =>
      Math.floor(Math.random() * 16).toString(16),
    );
    const fallback = { id, createdAt: now, lastActivityAt: now };
    writeClientSession(fallback);
    return fallback;
  }
  writeClientSession(created);
  return created;
}
