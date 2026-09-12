/**
 * The cart lives in localStorage, not on a server.
 *
 * Browsing stays on the static site — that is where the SEO lives — so "add to
 * cart" on /cakes writes this key and the React app reads it on mount. No round
 * trip, no session, and no second copy of the catalogue.
 *
 * The key is versioned on purpose: a schema change meeting a stale cart in
 * somebody's browser is a crash on first load, and the cheapest fix is for the
 * old key to simply stop being read.
 */
export const CART_KEY = "nn_cart_v1";

/** Stripe caps session metadata, so the cart is bounded. Mirrors MAX_LINES. */
export const MAX_LINES = 10;

export type CartLine = { size: string; flavour: string; wording: string };

export type Cart = {
  store: string;
  /** Sydney wall-clock date, YYYY-MM-DD. The server resolves the real instant. */
  dueDate: string;
  /** Sydney wall-clock hour, 9–18. */
  dueHour: number;
  lines: CartLine[];
};

export const emptyCart = (): Cart => ({ store: "", dueDate: "", dueHour: 12, lines: [] });

export function readCart(): Cart {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(CART_KEY);
  } catch {
    return emptyCart(); // private mode throws
  }
  if (!raw) return emptyCart();
  try {
    const c = JSON.parse(raw) as Partial<Cart>;
    // Anything unexpected is treated as no cart rather than crashing the page.
    if (!Array.isArray(c.lines)) return emptyCart();
    return {
      store: typeof c.store === "string" ? c.store : "",
      dueDate: typeof c.dueDate === "string" ? c.dueDate : "",
      dueHour: Number.isInteger(c.dueHour) ? (c.dueHour as number) : 12,
      lines: c.lines
        .filter((l): l is CartLine => Boolean(l && typeof l.size === "string" && typeof l.flavour === "string"))
        .slice(0, MAX_LINES)
        .map((l) => ({ size: l.size, flavour: l.flavour, wording: String(l.wording ?? "") })),
    };
  } catch {
    return emptyCart();
  }
}

export function writeCart(cart: Cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    /* the page still works; the cart just will not survive a reload */
  }
  // Same-tab listeners: the storage event only fires in *other* tabs.
  window.dispatchEvent(new CustomEvent("nn-cart"));
}

export function clearCart() {
  try {
    localStorage.removeItem(CART_KEY);
  } catch {
    /* no-op */
  }
  window.dispatchEvent(new CustomEvent("nn-cart"));
}

/** Earliest date the shop will take, as an <input type="date"> min. */
export function minDueDate(now = new Date()): string {
  const d = new Date(now.getTime() + 48 * 3600_000);
  return d.toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
}

export function maxDueDate(now = new Date()): string {
  const d = new Date(now.getTime() + 120 * 86_400_000);
  return d.toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
}

export const STORES = [
  { code: "harris-park", label: "Harris Park", address: "Shop 1, 96–98 Wigram Street" },
  { code: "riverstone", label: "Riverstone", address: "Shop 8, Riverstone Shopping Centre" },
];

export const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ── reading the cart from React ─────────────────────────────────────────── */

const EMPTY = emptyCart();
let cachedRaw: string | null = null;
let cachedCart: Cart = EMPTY;

/**
 * `useSyncExternalStore` needs a snapshot that is referentially stable between
 * renders, or it re-renders forever. So the parsed cart is memoised against the
 * raw string and only re-parsed when that actually changes.
 */
function getSnapshot(): Cart {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(CART_KEY);
  } catch {
    return EMPTY;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedCart = readCart();
  }
  return cachedCart;
}

/** The server render and the first client paint both see an empty cart. */
const getServerSnapshot = (): Cart => EMPTY;

function subscribe(onChange: () => void) {
  window.addEventListener("nn-cart", onChange);
  window.addEventListener("storage", onChange); // another tab
  return () => {
    window.removeEventListener("nn-cart", onChange);
    window.removeEventListener("storage", onChange);
  };
}

export const cartStore = { subscribe, getSnapshot, getServerSnapshot };
