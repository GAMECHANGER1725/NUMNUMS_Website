// A tax invoice as a real PDF file, written by hand.
//
// WHAT THE LAW WANTS ON IT
//
// Two separate obligations land on this one page.
//
// 1. A **tax invoice** (A New Tax System (Goods and Services Tax) Act 1999
//    s29-70; ATO "Tax invoices"). For a sale under $1,000 it must carry, or it
//    is not a tax invoice and the customer cannot claim the GST:
//      - the words "tax invoice", prominently
//      - the seller's identity AND the seller's ABN
//      - the date it was issued
//      - a description of what was sold, with quantity and price
//      - the GST amount, or the line "Total price includes GST" where GST is
//        exactly 1/11 of the total
//      - the extent to which each sale is taxable
//    At $1,000 and over it must ALSO carry the buyer's identity or ABN — which
//    is why the customer's name is printed on every one of these, not just the
//    big ones. A wedding cake clears $1,000 easily.
//
// 2. A **proof of transaction** under the Australian Consumer Law (sch 2
//    s100), which must be given for any sale of $75 or more, and within 7 days
//    on request below that. It must state the supplier, the supplier's ABN, the
//    date of the supply, what was supplied, and the price. "Date of the supply"
//    is the pickup, not the day it was typed in — so both dates are printed.
//
// GST: cakes, pastries and confectionery are taxable food (GST Act sch 2; the
// GST-free carve-out is for bread without a sweet coating, which is not what
// this shop sells). Prices are entered GST-inclusive, so GST is 1/11 of the
// total, worked in whole cents.
//
// A discount reduces the consideration, so GST is 1/11 of what the customer is
// actually charged — never of the list price. Charging GST on money that was
// never taken would overstate the shop's liability and hand the customer a
// credit they are not entitled to, so the discount is applied before the tax is
// worked out and both lines are shown.
//
// The two shops are two companies with two ABNs — see STORES in db.mjs. The
// entity and ABN come from the order's store, never from the brand. If a store
// is ever not GST-registered, the document must NOT say "tax invoice" and must
// NOT show GST; `gstRegistered: false` handles that and the heading falls back
// to "Invoice".
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

// Base-14 advance widths, per 1000 units, from the Adobe AFM metrics. Placing
// right-aligned text needs the exact width of the string, and a guessed average
// puts a column of money visibly out of line. Only the two Helvetica faces are
// here because nothing is ever right-aligned in the serif.
const table = (spec) => {
  const t = {};
  for (const [w, chars] of spec) for (const ch of chars) t[ch] = w;
  return t;
};
const HELV = table([
  [191, "'"], [222, 'ijl'], [260, '|'], [278, ' !,./:;I ft[\\]'], [333, '()-`r'],
  [334, '{}'], [355, '"'], [389, '*'], [469, '^'], [500, 'Jcksvxyz'],
  [556, '#$0123456789?_Labdeghnopqu'], [584, '+<=>~'], [611, 'FTZ'],
  [667, '&ABEKSVXY'], [722, 'CDHNRUw'], [778, 'GOQ'], [833, 'Mm'],
  [889, '%'], [944, 'W'], [1015, '@'],
]);
const HELV_BOLD = table([
  [278, ' .,:;Il'], [333, '!'], [556, '$0123456789Jacegos'], [611, 'FLTZ'],
  [667, 'EPSVXY'], [722, 'ABCDHKMNRU'], [778, 'GOQ'], [833, 'M'], [944, 'W'],
]);
const widthOf = (s, size, font = 'F1') => {
  const t = font === 'F2' ? HELV_BOLD : HELV;
  return [...String(s)].reduce((n, ch) => n + (t[ch] ?? HELV[ch] ?? 556), 0) / 1000 * size;
};

// PDF strings are Latin-1 bytes. The few non-ASCII characters this receipt can
// contain are mapped to their WinAnsi codes; anything else a customer's name
// might carry is dropped rather than emitted as a broken glyph.
// WinAnsi has no true minus sign, so U+2212 folds to a hyphen rather than being
// dropped — a discount line reading "$15.00" where it should read "- $15.00" is
// a wrong number, not a missing glyph.
const WINANSI = { '—': 0x97, '–': 0x96, '·': 0xB7, '“': 0x93, '”': 0x94,
                  '‘': 0x91, '’': 0x92, '…': 0x85, '•': 0x95, '−': 0x2D };
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
  /** Right-aligned at `edge`. Only ever used on money and short labels, which
   *  is why the width table below can be as small as it is. */
  rightAt(edge, s, opts = {}) {
    const size = opts.size ?? 10;
    return this.text(s, { ...opts, size, x: edge - widthOf(String(s), size, opts.font) });
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

  // Worked in whole cents so the three amounts always add back up: a third of
  // a cent of float drift is the difference between a valid tax invoice and a
  // total that does not equal its own lines.
  const cents = (v) => Math.round(Number(v || 0) * 100);
  const listC = cents(o.price);
  const offC = Math.min(cents(o.discount), listC);
  const totalC = listC - offC;                      // the consideration, GST-inclusive
  const taxable = store?.gstRegistered !== false;   // every cake is taxable food
  const gstC = taxable ? Math.round(totalC / 11) : 0;
  const netC = totalC - gstC;
  const paidC = cents(paidOn(o));
  const owingC = Math.max(0, totalC - paidC);
  const $ = (c) => money.format(c / 100);

  const heading = taxable ? 'TAX INVOICE' : 'INVOICE';
  const stamp = o.status === 'cancelled' ? 'CANCELLED'
    : totalC > 0 && owingC === 0 ? 'PAID IN FULL'
      : paidC > 0 ? 'DEPOSIT PAID'
        : 'UNPAID';
  const stampColour = { 'PAID IN FULL': '#6B7A55', 'DEPOSIT PAID': '#B37B2C',
                        UNPAID: '#A03D5E', CANCELLED: '#8B7F76' }[stamp];

  const p = new Page();
  const TAUPE = '#8B7F76', INK = '#2C1A0E', BROWN = '#5C3A22';
  const GSTX = RIGHT - 96;            // right edge of the GST column
  const LABX = RIGHT - 210;           // left edge of the totals and the date block

  // ── Masthead ──────────────────────────────────────────────────────────────
  p.text(business.name, { font: 'F3', size: 26 });
  p.rightAt(GSTX + 96, heading, { font: 'F2', size: 12, colour: INK });
  p.down(15).text(business.tagline, { size: 9, colour: TAUPE });
  p.down(13).rule({ colour: '#C85478', w: 1.5 });

  // Seller identity and ABN: both mandatory, both from the store's own company.
  p.down(15).text(store?.entity || business.name, { size: 9.5, font: 'F2' });
  if (store?.abn) p.rightAt(RIGHT, `ABN ${store.abn}`, { size: 9.5, font: 'F2' });
  p.down(12).text(`trading as ${business.name} — ${store?.label ?? ''}`, { size: 8.5, colour: TAUPE });
  p.down(11).text(store?.address || '', { size: 8.5, colour: TAUPE });
  p.down(11).text(`${business.phone} · ${business.email} · ${business.site}`,
    { size: 8.5, colour: TAUPE });

  // ── Invoice head ──────────────────────────────────────────────────────────
  p.down(30).text(taxable ? 'Tax invoice' : 'Invoice', { font: 'F3', size: 17 });
  const sw = widthOf(stamp, 8, 'F2') + 20;
  p.box({ x: M + 96, y: p.y - 5, w: sw, h: 19, colour: stampColour });
  p.text(stamp, { x: M + 106, size: 8, font: 'F2', colour: stampColour, y: p.y + 1 });

  // Left column: who. Right column: which document, and when.
  const startY = p.y;
  const left = (k, v) => { if (v) { p.down(16).text(k, { size: 9, colour: TAUPE })
    .text(v, { x: M + 96, size: 9.5 }); } };
  p.down(10);
  left('Billed to', o.customer_name);       // mandatory at $1,000+, printed always
  left('Phone', o.customer_phone);

  const rightY = { y: startY - 10 };
  const rightRow = (k, v) => { if (!v) return; rightY.y -= 16;
    p.text(k, { x: LABX, size: 9, colour: TAUPE, y: rightY.y });
    p.rightAt(RIGHT, v, { size: 9.5, y: rightY.y }); };
  rightRow('Invoice no.', o.order_no);
  rightRow('Issued', dateFmt.format(orderedAt(o)));
  rightRow('Supply / pick up', dateFmt.format(new Date(o.due_at)));
  if (o.picked_up_at) rightRow('Collected', dateFmt.format(new Date(o.picked_up_at)));
  p.y = Math.min(p.y, rightY.y);

  // ── The cake ──────────────────────────────────────────────────────────────
  p.down(28).text('DESCRIPTION', { size: 8, font: 'F2', colour: TAUPE });
  p.text('QTY', { x: GSTX - 108, size: 8, font: 'F2', colour: TAUPE });
  p.rightAt(GSTX, 'GST', { size: 8, font: 'F2', colour: TAUPE });
  p.rightAt(RIGHT, 'AMOUNT', { size: 8, font: 'F2', colour: TAUPE });
  p.down(7).rule();

  const item = [o.kind === 'custom' ? 'Custom cake' : 'Cake', o.flavour, o.size]
    .filter(Boolean).join(' · ');
  p.down(19).text(item, { size: 11, font: 'F2' });
  p.text('1', { x: GSTX - 108, size: 10 });
  p.rightAt(GSTX, gstC ? $(gstC) : '—', { size: 10 });
  p.rightAt(RIGHT, listC ? $(listC) : '—', { size: 11 });
  for (const line of [
    o.wording ? `Wording: “${o.wording}”` : '',
    o.design_notes || '',
    o.notes || '',
  ].filter(Boolean)) p.down(13).text(line, { size: 9, colour: BROWN });
  // "the extent to which each sale is a taxable sale" — stated per line.
  p.down(13).text(taxable ? 'Taxable supply' : 'No GST charged', { size: 8, colour: TAUPE });
  p.down(11).rule();

  // ── Totals ────────────────────────────────────────────────────────────────
  const total = (k, v, big) => {
    p.down(big ? 21 : 17);
    p.text(k, { x: LABX, size: big ? 12 : 10, font: big ? 'F2' : 'F1',
      colour: big ? INK : BROWN });
    p.rightAt(RIGHT, v, { size: big ? 12 : 10, font: big ? 'F2' : 'F1' });
  };
  if (offC > 0) {
    total('Price', $(listC));
    total('Discount', `− ${$(offC)}`);
  }
  if (taxable) {
    total('Subtotal (ex GST)', $(netC));
    total('GST (10%)', $(gstC));
  }
  total('Total' + (taxable ? ' (inc GST)' : ''), listC ? $(totalC) : '—', true);
  p.down(7).rule({ from: LABX, colour: '#E8DDD2' });
  total(paidC > 0 && owingC > 0 ? 'Deposit paid' : 'Paid', $(paidC));
  p.down(8).rule({ from: LABX, colour: INK, w: 1.2 });
  total(owingC > 0 ? 'Balance due at pickup' : 'Balance', $(owingC), true);

  if (taxable) {
    p.down(18).text('Total price includes GST.', { x: LABX, size: 8.5, colour: TAUPE });
  }

  // ── Footer, pinned to the bottom ──────────────────────────────────────────
  p.y = M + 56;
  p.rule();
  p.down(15).text(`Thank you for ordering with ${business.name}. Every cake we make is 100% eggless.`,
    { size: 8.5, colour: TAUPE });
  p.down(12).text(`Questions about this order? Quote ${o.order_no} when you call ${business.phone}.`,
    { size: 8.5, colour: TAUPE });
  p.down(12).text(
    `${store?.entity || business.name}${store?.abn ? ` · ABN ${store.abn}` : ''}`
      + `${taxable ? ' · Registered for GST' : ''}`,
    { size: 8, colour: TAUPE });

  return toPdfSource(p.build(), `${heading} ${o.order_no}`);
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
  const kind = ctx.store?.gstRegistered === false ? 'Invoice' : 'Tax invoice';
  const a = document.createElement('a');
  a.href = url;
  a.download = `${kind} ${o.order_no} ${o.customer_name || ''}`.trim().replace(/[/\\:*?"<>|]/g, '-') + '.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoked late: Safari reads the blob after the click returns.
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
