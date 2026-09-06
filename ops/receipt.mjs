// A receipt as a real PDF file, written by hand.
//
// Two things ruled out the obvious routes. The ops CSP has no 'unsafe-inline'
// in script-src, so a popup document can never call print() on itself; and a
// PDF library off the CDN is ~350KB on a page staff open over shop wifi — the
// same reason the charts here are hand-rolled SVG. A receipt is text, rules and
// two fonts, which is about a hundred lines of PDF.
//
// Nothing here rounds. Every amount is formatted once, by `money`, in cents.

const A4 = { w: 595.28, h: 841.89 };
const M = 56;                       // page margin, ~20mm
const RIGHT = A4.w - M;

// Base-14 Helvetica advance widths, per 1000 units, for the characters money
// is made of. Right-aligning an amount needs its exact width and nothing else
// on the page is right-aligned, so this is the whole table.
const W = { '0':556,'1':556,'2':556,'3':556,'4':556,'5':556,'6':556,'7':556,
            '8':556,'9':556,'$':556,'.':278,',':278,' ':278,'-':333,'—':1000 };
const widthOf = (s, size) =>
  [...s].reduce((n, ch) => n + (W[ch] ?? 556), 0) / 1000 * size;

// PDF strings are Latin-1 bytes. The few non-ASCII characters this receipt can
// contain are mapped to their WinAnsi codes; anything else a customer's name
// might carry is dropped rather than emitted as a broken glyph.
const WINANSI = { '—': 0x97, '–': 0x96, '·': 0xB7, '“': 0x93, '”': 0x94,
                  '‘': 0x91, '’': 0x92, '…': 0x85, '•': 0x95 };
const latin1 = (s) => [...String(s)].map((ch) => {
  const c = ch.codePointAt(0);
  if (c >= 32 && c <= 126) return ch;
  if (WINANSI[ch]) return String.fromCharCode(WINANSI[ch]);
  if (c >= 160 && c <= 255) return ch;
  return '';
}).join('');

const pdfStr = (s) => latin1(s).replace(/([\\()])/g, '\\$1');

/** Draw commands, in PDF user space (origin bottom-left). */
class Page {
  constructor() { this.ops = []; this.y = A4.h - M; }
  rgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]
      .map((v) => v.toFixed(3)).join(' ');
  }
  text(s, { x = M, size = 10, font = 'F1', colour = '#2C1A0E', y = this.y } = {}) {
    if (s === '' || s == null) return this;
    this.ops.push(`BT ${this.rgb(colour)} rg /${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${pdfStr(s)}) Tj ET`);
    return this;
  }
  right(s, opts = {}) {
    const size = opts.size ?? 10;
    return this.text(s, { ...opts, size, x: RIGHT - widthOf(String(s), size) });
  }
  rule({ y = this.y, from = M, to = RIGHT, colour = '#E8DDD2', w = 1 } = {}) {
    this.ops.push(`${this.rgb(colour)} RG ${w} w ${from.toFixed(2)} ${y.toFixed(2)} m ${to.toFixed(2)} ${y.toFixed(2)} l S`);
    return this;
  }
  box({ x, y, w, h, colour = '#B37B2C' }) {
    this.ops.push(`${this.rgb(colour)} RG 1 w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
    return this;
  }
  down(n) { this.y -= n; return this; }
  build() { return this.ops.join('\n'); }
}

/**
 * Assemble the objects and the xref table.
 *
 * Every offset here is a count of *characters*, because the file is written out
 * as Latin-1, one byte per character. Counting UTF-8 bytes instead put the xref
 * three bytes out for every em dash on the page — a file that still opens in
 * some readers and is rejected by others.
 */
function toPdfSource(content, title) {
  const objs = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    `<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${A4.w} ${A4.h}]`
      + '/Resources<</Font<</F1 5 0 R/F2 6 0 R/F3 7 0 R>>>>/Contents 4 0 R>>',
    `<</Length ${content.length}>>\nstream\n${content}\nendstream`,
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>',
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold/Encoding/WinAnsiEncoding>>',
    '<</Type/Font/Subtype/Type1/BaseFont/Times-Roman/Encoding/WinAnsiEncoding>>',
    `<</Title (${pdfStr(title)})/Producer (Num Num's Bakery ops)>>`,
  ];

  let out = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const startxref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
    + offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
    + `trailer\n<</Size ${objs.length + 1}/Root 1 0 R/Info ${objs.length} 0 R>>\n`
    + `startxref\n${startxref}\n%%EOF`;

  return out;
}

/**
 * The PDF as a string of Latin-1 characters. Separate from the Blob so the
 * test can read the amounts back out of it without going async.
 *
 * @param o      the order row
 * @param ctx    { store, business, money, dateFmt, dateTimeFmt, orderedAt, paidOn }
 */
export function receiptSource(o, ctx) {
  const { store, business, money, dateFmt, dateTimeFmt, orderedAt, paidOn } = ctx;
  const price = Number(o.price || 0);
  const paid = paidOn(o);
  const owing = Math.max(0, price - paid);

  const stamp = o.status === 'cancelled' ? 'CANCELLED'
    : price > 0 && owing === 0 ? 'PAID IN FULL'
      : paid > 0 ? 'DEPOSIT PAID'
        : 'UNPAID';
  const stampColour = { 'PAID IN FULL': '#6B7A55', 'DEPOSIT PAID': '#B37B2C',
                        UNPAID: '#A03D5E', CANCELLED: '#8B7F76' }[stamp];

  const p = new Page();
  const TAUPE = '#8B7F76', INK = '#2C1A0E', BROWN = '#5C3A22';

  // Masthead
  p.text(business.name, { font: 'F3', size: 26 });
  p.right(o.order_no, { font: 'F2', size: 13 });
  p.down(15).text(business.tagline, { size: 9, colour: TAUPE });
  p.right(dateFmt.format(orderedAt(o)), { size: 9, colour: TAUPE });
  p.down(13).rule({ colour: '#C85478', w: 1.5 });

  p.down(16).text(store ? `${store.label} — ${store.address}` : '', { size: 8.5, colour: TAUPE });
  p.down(12).text(`${business.phone} · ${business.email} · ${business.site}`, { size: 8.5, colour: TAUPE });

  // Title + payment stamp
  p.down(34).text('Receipt', { font: 'F3', size: 17 });
  const sw = widthOf(stamp, 8) + 20;
  p.box({ x: M + 62, y: p.y - 5, w: sw, h: 19, colour: stampColour });
  p.text(stamp, { x: M + 72, size: 8, font: 'F2', colour: stampColour, y: p.y + 1 });

  // Who and when
  const row = (k, v) => { if (v) { p.down(17).text(k, { size: 9, colour: TAUPE }).text(v, { x: M + 150, size: 10 }); } };
  p.down(12);
  row('Billed to', o.customer_name);
  row('Phone', o.customer_phone);
  row('Order placed', dateTimeFmt.format(orderedAt(o)));
  row('Pick up', dateTimeFmt.format(new Date(o.due_at)));
  row('Collected', o.picked_up_at ? dateTimeFmt.format(new Date(o.picked_up_at)) : '');

  // The cake
  p.down(30).text('DESCRIPTION', { size: 8, font: 'F2', colour: TAUPE });
  p.right('AMOUNT', { size: 8, font: 'F2', colour: TAUPE });
  p.down(7).rule();

  const item = [o.kind === 'custom' ? 'Custom cake' : 'Cake', o.flavour, o.size]
    .filter(Boolean).join(' · ');
  p.down(19).text(item, { size: 11, font: 'F2' });
  p.right(price ? money.format(price) : '—', { size: 11 });
  for (const line of [
    o.wording ? `Wording: “${o.wording}”` : '',
    o.design_notes || '',
    o.notes || '',
  ].filter(Boolean)) p.down(13).text(line, { size: 9, colour: BROWN });
  p.down(13).rule();

  // Totals
  const total = (k, v, big) => {
    p.down(big ? 22 : 18);
    p.text(k, { x: A4.w / 2, size: big ? 12 : 10, font: big ? 'F2' : 'F1', colour: big ? INK : BROWN });
    p.right(v, { size: big ? 12 : 10, font: big ? 'F2' : 'F1' });
  };
  total('Total', price ? money.format(price) : '—');
  total(paid > 0 && owing > 0 ? 'Deposit paid' : 'Paid', money.format(paid));
  p.down(9).rule({ from: A4.w / 2, colour: INK, w: 1.2 });
  total(owing > 0 ? 'Balance due at pickup' : 'Balance', money.format(owing), true);

  // Footer, pinned to the bottom so a short receipt does not look unfinished.
  p.y = M + 44;
  p.rule();
  p.down(16).text(`Thank you for ordering with ${business.name}. Every cake we make is 100% eggless.`,
    { size: 8.5, colour: TAUPE });
  p.down(13).text(`Questions about this order? Quote ${o.order_no} when you call ${business.phone}.`,
    { size: 8.5, colour: TAUPE });

  return toPdfSource(p.build(), `Receipt ${o.order_no}`);
}

export function receiptPdf(o, ctx) {
  const src = receiptSource(o, ctx);
  return new Blob([Uint8Array.from([...src], (c) => c.charCodeAt(0) & 0xFF)],
    { type: 'application/pdf' });
}

/** Hands the file to the browser's downloader — no print dialog. */
export function downloadReceipt(o, ctx) {
  const blob = receiptPdf(o, ctx);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Receipt ${o.order_no} ${o.customer_name || ''}`.trim().replace(/[/\\:*?"<>|]/g, '-') + '.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoked late: Safari reads the blob after the click returns.
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
