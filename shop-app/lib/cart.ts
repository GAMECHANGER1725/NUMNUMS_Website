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
  /** Sydney wall-clock hour, 9–18. */
  dueHour: number;
  lines: CartLine[];
  coupon: CartCoupon | null;
};

export const emptyCart = (): Cart =>
  ({ store: "", dueDate: "", dueHour: 12, lines: [], coupon: null });

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
    const c = JSON.parse(raw) as Partial<Cart>;
    // Anything unexpected is treated as no cart rather than crashing the page.
    if (!Array.isArray(c.lines)) return emptyCart();
    const coupon = c.coupon;
    return {
      store: typeof c.store === "string" ? c.store : "",
      dueDate: typeof c.dueDate === "string" ? c.dueDate : "",
      dueHour: Number.isInteger(c.dueHour) ? (c.dueHour as number) : 12,
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

export const LEAD_HOURS = 48;
export const OPEN_HOUR = 9;
export const CLOSE_HOUR = 18;

const sydneyDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });

/**
 * The first whole hour at or after `d`, Sydney local.
 *
 * Rounds **up**, and that is the whole point: truncating 09:30 to 9 offered a
 * 9am slot 47.5 hours out, which the server then refused. Returns the hour it
 * rolls into on the next day when it passes closing.
 */
function nextWholeHour(d: Date): { day: string; hour: number } {
  const [h, m] = d
    .toLocaleString("en-GB", { timeZone: "Australia/Sydney", hour: "2-digit", minute: "2-digit", hour12: false })
    .split(":").map(Number);
  const hour = m > 0 ? h + 1 : h;
  if (hour > CLOSE_HOUR) {
    return { day: sydneyDay(new Date(d.getTime() + 86_400_000)), hour: OPEN_HOUR };
  }
  return { day: sydneyDay(d), hour: Math.max(hour, OPEN_HOUR) };
}

/**
 * Earliest date the shop will take, as an `<input type="date">` min.
 *
 * The lead time is 48 **hours**, not two days, so the first bookable date is
 * only the day-after-tomorrow when there is still a collection slot left on it.
 * Order at 8pm and the whole of that day is already inside the window — offering
 * it would hand the customer a date the server then refuses, which reads as a
 * broken form rather than as a rule.
 */
export function minDueDate(now = new Date()): string {
  return nextWholeHour(new Date(now.getTime() + LEAD_HOURS * 3600_000)).day;
}

/**
 * The hours still bookable on `date`. Empty for a date before the lead time,
 * the full list for any date beyond it.
 */
export function availableHours(date: string, now = new Date()): number[] {
  const all: number[] = [];
  for (let h = OPEN_HOUR; h <= CLOSE_HOUR; h++) all.push(h);
  if (!date) return all;
  const first = nextWholeHour(new Date(now.getTime() + LEAD_HOURS * 3600_000));
  if (date > first.day) return all;
  if (date < first.day) return [];
  return all.filter((h) => h >= first.hour);
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
