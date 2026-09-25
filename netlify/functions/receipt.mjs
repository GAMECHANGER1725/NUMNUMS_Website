/**
 * The customer's tax invoice for a web order, as a PDF at its own URL.
 *
 * It is the ops invoice — `receiptSource` in ops/receipt.mjs, the same seller
 * identity, ABN and GST working — not a second document that could disagree
 * with the one the shop hands over at the counter.
 *
 * A URL, never a blob built in the browser: a programmatic click on a blob is a
 * silent no-op on iPhone (see the ops invoice notes in CLAUDE.md). `?download=1`
 * answers `Content-Disposition: attachment`, which every browser saves;
 * without it the PDF opens in the tab to be read.
 *
 * The Stripe session id is the key. It is long and random and only reaches the
 * customer through Stripe's redirect, so holding it is holding the receipt —
 * the same trust a Stripe receipt link carries. The name and phone printed on
 * the invoice are there because a tax invoice must identify the buyer.
 */
import { createClient } from '@supabase/supabase-js';
import { receiptSource, receiptName } from '../../ops/receipt.mjs';
import { BUSINESS, STORES, flavourSlug } from '../../ops/catalog.mjs';
import { paidOn } from '../../ops/stats.mjs';
import { siteFor } from '../lib/email-shell.mjs';

// The same formatters the ops app hands receiptSource, so the two invoices
// print dates and money identically.
const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
const dateFmt = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', weekday: 'short', day: 'numeric', month: 'short' });
const dateTimeFmt = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
const orderedAt = (o) => new Date(o.ordered_at || o.created_at);

/** Width and height from a JPEG's SOFn marker — the PDF image object needs both. */
export function jpegSize(b) {
  let i = 2;                                   // past FFD8
  while (i + 9 < b.length) {
    if (b[i] !== 0xFF) return null;
    const m = b[i + 1];
    const len = (b[i + 2] << 8) | b[i + 3];
    // SOF0–SOF15, minus DHT (C4), JPG (C8) and DAC (CC), which share the range.
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
      return { height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8] };
    }
    i += 2 + len;
  }
  return null;
}

/** The cake's product shot, or nothing. A missing photo must never cost the customer their invoice. */
async function cakePhoto(site, flavour) {
  try {
    const res = await fetch(`${site}/shop/cakes/${flavourSlug(flavour)}.jpg`,
      { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return [];
    const bytes = new Uint8Array(await res.arrayBuffer());
    const size = jpegSize(bytes);
    return size ? [{ bytes, ...size }] : [];
  } catch {
    return [];
  }
}

const text = (status, body) => new Response(body, { status, headers: { 'content-type': 'text/plain' } });

export default async (req) => {
  const url = new URL(req.url);
  const s = url.searchParams.get('s') ?? '';
  const no = url.searchParams.get('o') ?? '';
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(s) || !/^[A-Z]{1,4}-\d{1,8}$/.test(no)) {
    return text(400, 'That receipt link is not complete.');
  }

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data: o, error } = await db.from('orders').select('*')
    .eq('stripe_session_id', s).eq('order_no', no).maybeSingle();
  if (error) return text(500, 'We could not load that receipt. Please try again.');
  if (!o) return text(404, 'We could not find that receipt.');

  const src = receiptSource(o, {
    store: STORES.find((st) => st.code === o.store),
    business: BUSINESS, money, dateFmt, dateTimeFmt, orderedAt, paidOn,
    photos: await cakePhoto(siteFor(req), o.flavour),
    photoLabel: 'YOUR CAKE',
  });

  const name = receiptName(o, { business: BUSINESS });
  // The ASCII fallback keeps old clients happy; filename* carries the real
  // name, apostrophe and all.
  const ascii = name.replace(/[^\x20-\x7E]/g, '').replace(/"/g, '');
  const disposition = url.searchParams.get('download') ? 'attachment' : 'inline';

  return new Response(Buffer.from(src, 'latin1'), {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      // Private: it carries a name and a phone number, so no shared cache may keep it.
      'cache-control': 'private, max-age=300',
    },
  });
};
