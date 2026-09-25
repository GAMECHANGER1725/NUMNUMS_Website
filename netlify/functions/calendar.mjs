/**
 * The collection as a calendar event (.ics), for "Add to calendar" on the
 * confirmation page.
 *
 * Built from the order rows, keyed by the Stripe session like the receipt —
 * never from query text, or our domain would serve an event reading whatever
 * a stranger typed into a link. A URL, not a blob, because iPhone saves
 * neither a blob nor a data: link; it opens Calendar for a text/calendar
 * response.
 */
import { createClient } from '@supabase/supabase-js';
import { BUSINESS, STORES } from '../../ops/catalog.mjs';

/** RFC 5545 text: escape \ ; , and newlines. */
const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/[;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');
/**
 * Fold at 75 octets (RFC 5545 §3.1): CRLF plus one space continues a line.
 * Counted in UTF-8 bytes, and never splitting a character — the em dash in
 * the summary is three bytes.
 */
function fold(line) {
  const out = [];
  let cur = '', bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > (out.length ? 74 : 75)) { out.push(cur); cur = ''; bytes = 0; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}

/** 20260927T020000Z */
const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function icsFor(rows, sessionId, now = new Date()) {
  const o = rows[0];
  const start = new Date(o.due_at);
  const end = new Date(start.getTime() + 30 * 60_000);
  const store = STORES.find((s) => s.code === o.store);
  const cents = (v) => Math.round(Number(v ?? 0) * 100);
  const owing = rows.reduce((a, r) => a + cents(r.price) - cents(r.discount) - cents(r.deposit), 0);
  const cakes = rows.map((r) => `${r.size} ${r.flavour}${r.wording ? ` ("${r.wording}")` : ''}`).join('; ');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Num Nums Bakery//Orders//EN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${sessionId}@numnumsbakery.com.au`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(`Collect your cake — ${BUSINESS.name} ${store?.label ?? ''}`.trim())}`,
    `LOCATION:${esc(store?.address ?? '')}`,
    `DESCRIPTION:${esc(`Order ${rows.map((r) => r.order_no).join(', ')}: ${cakes}.\n`
      + `Balance to pay at collection: $${(owing / 100).toFixed(2)}.\n`
      + `Questions? ${BUSINESS.phone}`)}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Cake collection', 'TRIGGER:-PT2H', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

const text = (status, body) => new Response(body, { status, headers: { 'content-type': 'text/plain' } });

export default async (req) => {
  const s = new URL(req.url).searchParams.get('s') ?? '';
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(s)) return text(400, 'That calendar link is not complete.');

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await db.from('orders')
    .select('order_no,store,due_at,size,flavour,wording,price,discount,deposit')
    .eq('stripe_session_id', s).order('cart_line');
  if (error) return text(500, 'We could not build that calendar entry. Please try again.');
  if (!data?.length) return text(404, 'We could not find that order.');

  return new Response(icsFor(data, s), {
    status: 200,
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="num-nums-collection-${data[0].order_no}.ics"`,
      'cache-control': 'private, max-age=300',
    },
  });
};
