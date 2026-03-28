/**
 * Centralized cart persistence. All cart reads/writes go through here
 * to avoid stale state and ensure localStorage stays in sync.
 */

/** Prior site cart keys (base64 so old installs migrate without keeping the former name in plain text). */
function legacyStorageKey(b64: string): string | null {
  try {
    if (typeof globalThis.atob !== "function") return null;
    return globalThis.atob(b64);
  } catch {
    return null;
  }
}

const LEGACY_CART_KEY = legacyStorageKey("ZmlkZWxpcy1jYXJ0");
const LEGACY_SHIPPING_REGION_KEY = legacyStorageKey("ZmlkZWxpcy1jYXJ0LXNoaXBwaW5nLXJlZ2lvbg==");

export const CART_KEY = "ziegs-cart";
export const SHIPPING_REGION_KEY = "ziegs-cart-shipping-region";
/** Dispatched after cart or shipping region changes (same tab). */
export const CART_UPDATE_EVENT = "ziegs-cart-update";

export type ShippingRegion = "US" | "INTL";

export type CartLine = {
  productId: string;
  variantId: string;
  quantity: number;
  slug?: string;
  sourceType?: string;
  fulfillmentType?: string;
  sourceProductId?: string | null;
  sourceVariantId?: string | null;
  priceCents?: number;
  imageUrl?: string | null;
  title?: string;
  variantName?: string | null;
};

function migrateLegacyStorageOnce(): void {
  if (typeof window === "undefined") return;
  if (!LEGACY_CART_KEY || !LEGACY_SHIPPING_REGION_KEY) return;
  try {
    const hasNewCart = localStorage.getItem(CART_KEY) !== null;
    const legacyCart = localStorage.getItem(LEGACY_CART_KEY);
    if (legacyCart !== null && !hasNewCart) {
      localStorage.setItem(CART_KEY, legacyCart);
      localStorage.removeItem(LEGACY_CART_KEY);
    }
    const hasNewRegion = localStorage.getItem(SHIPPING_REGION_KEY) !== null;
    const legacyRegion = localStorage.getItem(LEGACY_SHIPPING_REGION_KEY);
    if (legacyRegion !== null && !hasNewRegion) {
      localStorage.setItem(SHIPPING_REGION_KEY, legacyRegion);
      localStorage.removeItem(LEGACY_SHIPPING_REGION_KEY);
    }
  } catch {
    // Ignore quota / security errors
  }
}

export function getCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  migrateLegacyStorageOnce();
  try {
    const s = localStorage.getItem(CART_KEY);
    const parsed = s ? JSON.parse(s) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setCart(items: CartLine[]): void {
  if (typeof window === "undefined") return;
  migrateLegacyStorageOnce();
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CART_UPDATE_EVENT));
  } catch {
    // Ignore quota / security errors
  }
}

export function getShippingRegion(): ShippingRegion | null {
  if (typeof window === "undefined") return null;
  migrateLegacyStorageOnce();
  try {
    const s = localStorage.getItem(SHIPPING_REGION_KEY);
    if (s === "US" || s === "INTL") return s;
    return null;
  } catch {
    return null;
  }
}

export function setShippingRegion(region: ShippingRegion | null): void {
  if (typeof window === "undefined") return;
  migrateLegacyStorageOnce();
  try {
    if (region) {
      localStorage.setItem(SHIPPING_REGION_KEY, region);
    } else {
      localStorage.removeItem(SHIPPING_REGION_KEY);
    }
    window.dispatchEvent(new CustomEvent(CART_UPDATE_EVENT));
  } catch {
    // Ignore
  }
}
