/** Dev-only diagnostics for admin site/newsletter builder performance. */

const enabled = (): boolean =>
  process.env.NODE_ENV !== "production" &&
  process.env.ADMIN_BUILDER_DIAGNOSTICS !== "0";

export function diagServerAction(name: string, detail?: Record<string, unknown>): void {
  if (!enabled()) return;
  console.debug("[admin-builder] server-action", name, detail ?? {});
}

export function diagRouterReplace(href: string): void {
  if (!enabled()) return;
  console.debug("[admin-builder] router.replace (avoided on site-builder)", href);
}

export function diagHistoryReplace(href: string): void {
  if (!enabled()) return;
  console.debug("[admin-builder] history.replaceState", href);
}

export function diagLocalDraftWrite(draftKey: string): void {
  if (!enabled()) return;
  console.debug("[admin-builder] local-draft-write", { draftKey });
}

export function diagPrismaQuery(label: string): void {
  if (!enabled()) return;
  console.debug("[admin-builder] prisma-query", label);
}
