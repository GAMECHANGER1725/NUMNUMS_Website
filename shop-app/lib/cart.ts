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
import { collectionSlots } from "./catalog";

export const CART_KEY = "nn_cart_v1";

/**
 * The cap is on **cakes**, not on rows.
 *
 * Every cake becomes its own `orders` row — one job per cake is how the kitchen
 * works — and every row becomes a Stripe line item and a metadata key, which
 * caps at 50. So a line of quantity 4 counts as four against this, and
 * `create-checkout` re-checks it after expanding server-side.
 */
export const MAX_CAKES = 10;
export const MAX_QTY = 10;

export type CartLine = { size: string; flavour: string; wording: string; qty: number };

/** Display only. `create-checkout` re-validates the code and re-prices. */
export type CartCoupon = { code: string; percent: number };

export type Cart = {
  store: string;
  /** Sydney wall-clock date, YYYY-MM-DD. The server resolves the real instant. */
  dueDate: string;
  /**
   * Sydney wall-clock collection time as **minutes from midnight**, on the
   * half hour. Minutes because Riverstone closes at 6:30pm, which an hour
   * cannot express. 0 means "not chosen yet" — no shop opens at midnight.
   */
  dueMin: number;
  lines: CartLine[];
  coupon: CartCoupon | null;
};

export const emptyCart = (): Cart =>
  ({ store: "", dueDate: "", dueMin: 0, lines: [], coupon: null });

/** Cakes in the cart, which is not the same as rows in the cart. */
export const cartCount = (cart: Cart) => cart.lines.reduce((n, l) => n + l.qty, 0);

const clampQty = (v: unknown) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_QTY) : 1;
};

/**
 * Fold identical cakes into one line.
 *
 * Carts written before quantities existed hold one row per cake, so a customer
 * who added the same cake twice has two identical rows sitting in localStorage
 * right now. Left alone they render as two lines with the same React key —
 * which is a silent bug, not a warning the customer ever sees.
 */
export function mergeLines(lines: CartLine[]): CartLine[] {
  const out: CartLine[] = [];
  for (const l of lines) {
    const same = out.find(
      (o) => o.size === l.size && o.flavour === l.flavour && o.wording === l.wording,
    );
    if (same) same.qty = Math.min(same.qty + l.qty, MAX_QTY);
    else out.push({ ...l });
  }
  return out;
}

/**
 * Trim a list of lines so the cakes in it never exceed `MAX_CAKES`. The last
 * line in is the one shortened, so an existing cart is never silently reduced
 * under someone who is only adding.
 */
export function capLines(lines: CartLine[]): CartLine[] {
  const out: CartLine[] = [];
  let left = MAX_CAKES;
  for (const l of lines) {
    if (left <= 0) break;
    out.push({ ...l, qty: Math.min(l.qty, left) });
    left -= out[out.length - 1].qty;
  }
  return out;
}

/**
 * Add a cake, merging into the line it matches.
 *
 * Same size, same flavour and the same writing is the same cake, so it becomes
 * a quantity rather than a second row — otherwise "add to order" twice reads as
 * a broken button. Different writing is a different cake and stays its own row,
 * because the writing is what the kitchen pipes on it.
 */
export function addLine(cart: Cart, line: Omit<CartLine, "qty">, qty = 1): Cart {
  const same = (l: CartLine) =>
    l.size === line.size && l.flavour === line.flavour && l.wording === line.wording;
  const i = cart.lines.findIndex(same);
  const lines = i === -1
    ? [...cart.lines, { ...line, qty }]
    : cart.lines.map((l, j) => (j === i ? { ...l, qty: Math.min(l.qty + qty, MAX_QTY) } : l));
  return { ...cart, lines: capLines(lines) };
}

export function readCart(): Cart {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(CART_KEY);
  } catch {
    return emptyCart(); // private mode throws
  }
  if (!raw) return emptyCart();
  try {
    const c = JSON.parse(raw) as Partial<Cart> & { dueHour?: number };
    // Anything unexpected is treated as no cart rather than crashing the page.
    if (!Array.isArray(c.lines)) return emptyCart();
    const coupon = c.coupon;
    // Carts written before 2026-09-21 hold `dueHour` (an integer hour, when
    // both shops shared one 9–18 window). Read as minutes, `dueHour: 12`
    // would mean 00:12 — a valid-looking number that is silently the wrong
    // time, which is the worst kind of migration bug. Convert it.
    const dueMin = Number.isInteger(c.dueMin) ? (c.dueMin as number)
      : Number.isInteger(c.dueHour) ? (c.dueHour as number) * 60
        : 0;
    return {
      store: typeof c.store === "string" ? c.store : "",
      dueDate: typeof c.dueDate === "string" ? c.dueDate : "",
      dueMin,
      // A cart written before quantities existed has no qty; it means one cake.
      lines: capLines(
        mergeLines(c.lines
          .filter((l): l is CartLine => Boolean(l && typeof l.size === "string" && typeof l.flavour === "string"))
          .map((l) => ({
            size: l.size,
            flavour: l.flavour,
            wording: String(l.wording ?? ""),
            qty: clampQty(l.qty),
          }))),
      ),
      coupon: coupon && typeof coupon.code === "string" && Number.isFinite(coupon.percent)
        ? { code: coupon.code, percent: Number(coupon.percent) }
        : null,
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

/**
 * A shop cake is **next day**, not a number of hours. Must agree with
 * `netlify/lib/shared.mjs` — that is the copy the money is checked against.
 * Custom cakes are a different product and keep their own 48 hours' notice.
 */
export const LEAD_DAYS = 1;
/** Sydney hour at or after which an order rolls to the day after. 24 = none. */
export const CUTOFF_HOUR = 24;

const sydneyParts = (d: Date) => {
  const p: Record<string, string> = {};
  for (const { type, value } of new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false,
  }).formatToParts(d)) {
    if (type !== "literal") p[type] = value;
  }
  // "24" is a real answer from hour12:false at midnight in some engines.
  return { y: +p.year, m: +p.month, d: +p.day, hour: +p.hour % 24 };
};

/**
 * Earliest collection date, as an `input`-style `YYYY-MM-DD`.
 *
 * Built as a calendar date in Sydney parts and read back the same way. Never
 * add 86_400_000ms to an instant for this: the day that lands on is wrong on
 * the two nights a year DST shifts, and it books cakes for the wrong date.
 */
export function minDueDate(now = new Date()): string {
  const p = sydneyParts(now);
  const roll = p.hour >= CUTOFF_HOUR ? 1 : 0;
  const d = new Date(Date.UTC(p.y, p.m - 1, p.d + LEAD_DAYS + roll));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
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

/**
 * Half now, half at the counter.
 *
 * DISPLAY ONLY. `depositCents` in `netlify/lib/shared.mjs` is the real rule
 * and the one the card is charged against; this mirrors it so the summary can
 * show the number before the server has seen the cart. The two must round the
 * same way — floor — or the cart quotes a figure Stripe then contradicts,
 * which is the one number a customer will always check.
 */
export const DEPOSIT_RATE = 0.5;

export function depositCents(netCents: number): number {
  const total = Math.max(0, Math.round(netCents));
  if (total === 0) return 0;
  const half = Math.floor(total * DEPOSIT_RATE);
  return Math.min(Math.max(half, 1), total - 1) || total;
}

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
