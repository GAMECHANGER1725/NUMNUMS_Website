/**
 * The phone assistant's rules (phone-agent/prompt.md), kept out of the handler
 * so tests/phone.test.mjs can hold them still.
 *
 * Everything here is reached from a PUBLIC phone line: whatever a caller says
 * arrives as text the model typed. So every field is bounded and cleaned, an
 * order lookup answers only what the counter would say to someone holding the
 * docket, and a wrong name gets exactly the same answer as a wrong number.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { COLLECTION, slotLabel } from '../../ops/catalog.mjs';
import { earliestDueDay } from './shared.mjs';
import { shell, esc, para, fine, BODY, DISPLAY, textFooter } from './email-shell.mjs';

/** ElevenLabs sends this header on every webhook; the value is a workspace secret there and PHONE_AGENT_SECRET here. */
export const SECRET_HEADER = 'x-phone-agent-secret';

/**
 * Rate limit on order lookups, counted from `phone_lookups`. Three misses an
 * hour from one caller is plenty for someone fumbling their own docket and
 * useless for someone guessing; sixty an hour across the line is ~5x the
 * busiest day (9-14 calls a day, 2026-11-07), so it only trips on abuse.
 */
export const MAX_MISSES_PER_CALLER = 3;
export const MAX_LOOKUPS_PER_HOUR = 60;

export const STORE_LABEL = { 'harris-park': 'Harris Park', riverstone: 'Riverstone' };

/** Constant-time compare. An unset secret refuses everything rather than accepting everything. */
export function authorised(req, secret = process.env.PHONE_AGENT_SECRET) {
  const want = String(secret ?? '').trim();
  if (!want) return false;
  const got = String(req.headers.get(SECRET_HEADER) ?? '');
  const h = (s) => createHash('sha256').update(s).digest();
  return timingSafeEqual(h(got), h(want));
}

/** Bounded, single-line, control characters out. */
export const clean = (raw, max = 200) =>
  String(raw ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

/** "h p one eight three one" arrives as "HP 1831", "hp-1831", "HP1831". All mean HP-1831. */
export function orderNo(raw) {
  const m = String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').match(/^(HP|RV)(\d{4,5})$/);
  return m ? `${m[1]}-${m[2]}` : null;
}

/** Same rule as `orders.phone_key`: the last nine digits, so 0412… and +61412… match. */
export function phoneKey(raw) {
  const d = String(raw ?? '').replace(/\D/g, '');
  return d.length >= 9 ? d.slice(-9) : null;
}

/** +61412345678 -> 0412345678, the way the shop writes it. */
export const localPhone = (raw) => clean(raw, 20).replace(/^\+61/, '0');

/** First word of a name, lower-case, letters only. "Priya Shah" and "priya" match; "Pria" does not. */
export function firstName(raw) {
  const t = String(raw ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().split(/\s+/)[0] ?? '';
  return t.toLowerCase().replace(/[^a-z]/g, '') || null;
}

export function storeCode(raw) {
  const s = String(raw ?? '').toLowerCase().replace(/[^a-z]/g, '');
  if (s === 'harrispark' || s === 'hp' || s === 'harris') return 'harris-park';
  if (s === 'riverstone' || s === 'rv') return 'riverstone';
  return null;
}

const dayFmt = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', weekday: 'long', day: 'numeric', month: 'long' });
const timeFmt = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', hour: 'numeric', minute: '2-digit', hour12: true });

/** What the agent reads out: "Saturday 14 November", "3:30 pm". */
export const spokenWhen = (iso) => ({ pickup_date: dayFmt.format(new Date(iso)), pickup_time: timeFmt.format(new Date(iso)) });

/** A YYYY-MM-DD day, spoken. Noon UTC is the same calendar day in Sydney all year. */
const spokenDay = (day) => dayFmt.format(new Date(`${day}T02:00:00Z`));

/**
 * The prompt's custom-cake rule, enforced here instead of by the model doing
 * date arithmetic on the phone: at least 2 days' notice (the same Sydney
 * calendar-day rule as the shop, `earliestDueDay`) and inside that shop's
 * collection hours (`COLLECTION`). Returns what to tell the caller, or null.
 */
export function pickupProblem(store, date, time, now = new Date()) {
  const win = COLLECTION[store];
  if (!win) return 'Ask which shop they will collect from: Harris Park or Riverstone.';
  const d = String(date ?? '');
  const real = /^\d{4}-\d{2}-\d{2}$/.test(d) && new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d;
  if (!real) return 'Pickup date was not understood. Confirm the day and date with the caller and send it as YYYY-MM-DD.';
  const earliest = earliestDueDay(now);
  if (d < earliest) {
    return `That is less than 2 days away. The earliest a custom cake can be collected is ${spokenDay(earliest)}. Ask for another day; if they need it sooner, log an urgent callback instead.`;
  }
  const t = String(time ?? '').match(/^(\d{1,2}):(\d{2})$/);
  const min = t ? Number(t[1]) * 60 + Number(t[2]) : NaN;
  if (!(min >= 0 && min < 24 * 60)) return 'Pickup time was not understood. Send it as 24-hour HH:MM.';
  if (min < win.open || min > win.close) {
    return `${STORE_LABEL[store]} collects cakes from ${slotLabel(win.open)} to ${slotLabel(win.close)}. Ask for a time inside those hours.`;
  }
  return null;
}

const KIND_LABEL = { change: 'Change request', custom_cake: 'Custom cake brief', call: 'Call note' };
const OUTCOME_LABEL = { resolved: 'Resolved', callback_needed: 'Callback needed', transferred: 'Transferred' };

/** Field rows for the email, in the order staff read them. Empty fields are left out. */
function rowsOf(note) {
  const d = note.details ?? {};
  const yesNo = (v) => (v === true ? 'Yes' : v === false ? 'No' : '');
  return [
    ['Name', note.caller_name],
    ['Mobile', note.caller_phone],
    ['Called from', note.caller_id && note.caller_id !== note.caller_phone ? note.caller_id : ''],
    ['Shop', STORE_LABEL[note.store] ?? ''],
    ['Order', note.order_no],
    ['Change', d.what_to_change],
    ['Pickup', [d.pickup_date_spoken, d.pickup_time].filter(Boolean).join(', ')],
    ['Occasion', d.occasion],
    ['Size / serves', d.size_or_servings],
    ['Flavour', d.flavour],
    ['Writing', d.wording],
    ['Design', d.design],
    ['Allergies / diet', d.allergies],
    ['Has photos', yesNo(d.has_photos)],
    ['On WhatsApp', yesNo(d.on_whatsapp)],
    ['Call type', d.call_type],
    ['Outcome', OUTCOME_LABEL[note.outcome] ?? ''],
  ].filter(([, v]) => v);
}

/**
 * The staff email. Transactional, so NO unsubscribe slot (see email-shell.mjs).
 * Every value is something a caller said, so it is escaped here.
 */
export function noteEmail(note, site) {
  const urgent = note.priority === 'urgent';
  const kind = KIND_LABEL[note.kind] ?? 'Phone note';
  const who = note.caller_name || 'Unknown caller';
  const subject = `${urgent ? '[URGENT] ' : ''}Phone: ${kind} · ${who}${note.store ? ` · ${STORE_LABEL[note.store]}` : ''}`;
  const fields = rowsOf(note);

  const table = fields.map(([k, v]) => `
            <tr>
              <td class="rule" style="padding:8px 12px 8px 0;border-bottom:1px solid #EBD3DA;font-family:${BODY};font-size:12px;line-height:18px;letter-spacing:1px;text-transform:uppercase;color:#8A6B55;white-space:nowrap;vertical-align:top;">${esc(k)}</td>
              <td class="rule muted" style="padding:8px 0;border-bottom:1px solid #EBD3DA;font-family:${BODY};font-size:15px;line-height:22px;color:#2C1A0E;">${esc(v)}</td>
            </tr>`).join('');

  const rows = `
        <tr><td class="pad" style="padding:26px 56px 0 56px;">
          ${urgent ? `<p style="margin:0 0 10px 0;font-family:${BODY};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#C85478;font-weight:500;">Urgent</p>` : ''}
          <h1 class="h1 ink" style="margin:0;font-family:${DISPLAY};font-size:30px;line-height:36px;font-weight:300;color:#2C1A0E;letter-spacing:-0.5px;">${esc(kind)}</h1>
        </td></tr>
${note.summary ? para(esc(note.summary), 14) : ''}
        <tr><td class="pad" style="padding:18px 56px 0 56px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${table}
          </table>
        </td></tr>
${fine('Taken by the phone assistant. The full recording and transcript are in ElevenLabs under this conversation id: ' + esc(note.conversation_id || 'none'), 20)}`;

  const html = shell({ title: subject, preheader: note.summary || kind, site, rows });
  const text = [
    urgent ? 'URGENT' : '',
    kind,
    note.summary ?? '',
    '',
    ...fields.map(([k, v]) => `${k}: ${v}`),
    '',
    `Conversation: ${note.conversation_id || 'none'}`,
    '',
    textFooter(),
  ].join('\n').replace(/^\n+/, '');
  return { subject, html, text };
}

/**
 * The lock-screen version. First name, shop and what kind of note only: no
 * phone number and no summary, because a lock screen is read by whoever is at
 * the counter, and the summary is free text that may well contain the number.
 */
export function noteMessage(note) {
  const first = clean(note.caller_name, 40).split(' ')[0] || 'A caller';
  const what = note.kind === 'call' ? (OUTCOME_LABEL[note.outcome] ?? 'Call note').toLowerCase() : (KIND_LABEL[note.kind] ?? '').toLowerCase();
  return {
    title: `${note.priority === 'urgent' ? 'URGENT · ' : ''}Phone${note.store ? ` · ${STORE_LABEL[note.store]}` : ''}`,
    body: `${first}: ${what}. Details in the shop inbox.`,
    url: './',
    tag: `phone-${note.conversation_id || note.created_at || Date.now()}`,
  };
}
