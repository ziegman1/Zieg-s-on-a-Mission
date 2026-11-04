"use client";

import { clearClientSession } from "./session-id";

/**
 * In-memory gate for client analytics. Defaults to blocked until the server
 * privacy status is loaded (unknown geography → protective).
 */
let collectionAllowed = false;
let statusLoaded = false;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function subscribeAnalyticsPrivacy(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isAnalyticsPrivacyStatusLoaded(): boolean {
  return statusLoaded;
}

export function isAnalyticsCollectionAllowed(): boolean {
  return collectionAllowed;
}

export function setAnalyticsCollectionAllowed(allowed: boolean): void {
  collectionAllowed = allowed;
  statusLoaded = true;
  if (!allowed) {
    clearClientSession();
  }
  notify();
}

/** Reset between tests. */
export function resetAnalyticsPrivacyClientState(): void {
  collectionAllowed = false;
  statusLoaded = false;
}
