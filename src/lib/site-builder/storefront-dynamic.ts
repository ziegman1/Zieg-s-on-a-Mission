/**
 * Builder-backed storefront routes read from DB — avoid stale static HTML.
 * Next.js requires `dynamic` to be defined inline in each page file (no re-export).
 * Use: `export const dynamic = "force-dynamic";`
 */
export const STOREFRONT_DYNAMIC = "force-dynamic" as const;
