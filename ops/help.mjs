// Help page and the first-run guided tour.
//
// The shop hires people who have never seen this app and nobody has time to sit
// with them for an hour. So the app teaches itself twice: a tour that points at
// the real buttons the first time someone signs in, and a page they can come
// back to at the counter with a customer standing there.
//
// Everything here is filtered by role, because a baker being shown the invoice
// button is worse than showing nothing — it teaches them a thing the database
// will refuse. The role lists in this file must track the ones in app.mjs
// (TABS, MENU) and the RLS policies behind them.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ALL = ['admin', 'staff', 'baker'];

const CHEV = '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

/**
 * The sections of the help page, in the order a shift actually happens:
 * sign in, read a card, take an order, find it again, hand it over, then the
 * end-of-day things. Titled by the task, not by the screen — someone looking
 * for help is thinking "she wants to pay the rest", not "order detail sheet".
 */
export const HELP = [
  {
    title: 'Signing in, and what you can see',
    sub: 'Your name, your role, your shop',
    roles: ALL,
    body: `
      <p>Pick your name under <strong>Who's on</strong> and type your password. The app
        stays signed in on that phone, so you only do this once in a while.</p>
      <p>Your name and role sit in the top right of every screen. <strong>The role decides
        what you see</strong> — not a setting you can change here. If it is wrong, tell
        Vaidik; it is changed in the database on purpose, so nobody can give
        themselves more by mistapping.</p>
      <ul class="help-list">
        <li><strong>Staff</strong> — the orders for your own shop: log them, find them,
          take payment, mark a cake at the store or picked up.</li>
        <li><strong>Baker</strong> — the baking queue for both shops and the print board.
          You mark a cake baked. You do not see prices.</li>
        <li><strong>Admin</strong> — all of it: both shops, costs, the numbers, the
          invoice and the export.</li>
      </ul>
      <p class="help-note">If you work at both shops you get a
        <strong>Harris Park / Riverstone</strong> switcher — above the order list, and at the
        top of the baking list. It only changes which shop you are looking at; it never moves
        an order between them.</p>`,
  },
  {
    title: 'Reading an order card',
    sub: 'The stripe, the tags, the dot',
    roles: ALL,
    body: `
      <p>Every cake is one card. Tap it to open everything about it.</p>
      <ul class="help-list">
        <li><strong>The coloured stripe down the left</strong> is how close the pickup is:
          deep rose is overdue, rose is today, gold is tomorrow, pale is later, grey is
          done.</li>
        <li><strong>Custom</strong> or <strong>Normal</strong> sits beside the pickup time on
          every card. Custom is made to a design; normal is off the menu.</li>
        <li><strong>Walk-in</strong> means it was bought and carried out at the counter, not
          ordered ahead.</li>
        <li><strong>The little dot</strong> is where the cake is up to. The colours are
          listed at the top of this page.</li>
        <li><strong>A rose "3D" or "Photo" flag</strong> means the cake needs something
          printed before it can go out.</li>
      </ul>
      <p>The picture is the first photo the customer sent. A normal cake has no design
        photo, so it shows the cake we sell in that flavour.</p>`,
  },
  {
    title: 'Taking a new order',
    sub: 'Tap New — about thirty seconds',
    roles: ['admin', 'staff'],
    body: `
      <p>Tap <strong>New</strong> in the bar at the bottom, then pick what kind of cake it
        is. That first choice changes the rest of the form, so it comes first.</p>
      <ol class="help-steps">
        <li><strong>Custom cake</strong> — made to a design. Design photos are required.
          <br><strong>Normal cake</strong> — off the menu. You are then asked whether it was
          <em>ordered for later</em> or <em>bought in store now</em>.</li>
        <li><strong>Customer and phone.</strong> Start typing the name — if they have ordered
          before, tap the suggestion and the phone fills itself in. The phone number is what
          links this order to the rest of their history, so it is worth getting.</li>
        <li><strong>Order time</strong> is when they placed the order. Leave it if they are
          standing in front of you; set it back if you are typing up a WhatsApp message from
          this morning. <strong>Pick up</strong> is when they are collecting.</li>
        <li><strong>Flavour and size.</strong> Choosing a size fills the price in for you.
          Type over it if the price is different — it will not overwrite what you typed.
          <br>For a stacked cake choose <strong>Tiered</strong> and enter each tier's width
          and height. A tiered cake is quoted, so no price is filled in.</li>
        <li><strong>Wording on cake</strong> is what gets written on it, exactly. Copy it
          from the customer's message rather than retyping it.</li>
        <li><strong>Design photos.</strong> <em>Choose photos</em> picks the ones the customer
          already sent; <em>Take photo</em> opens the camera. Add all of them — the baker
          works from these. They are deleted 14 days after the order.</li>
        <li><strong>Price, discount, deposit.</strong> Price is the full price. Anything you
          take off goes in <strong>Discount</strong> — in dollars or as a percent, whichever
          they said. The line underneath shows what the customer actually owes.</li>
        <li><strong>Payment</strong> — Unpaid, 50% deposit, Other amount, or Paid in full.
          Then <strong>Save order</strong>.</li>
      </ol>
      <p class="help-note">Do not fold the discount into the price. A $130 cake at $10 off is
        a $130 price and a $10 discount, not a $120 price — otherwise nobody can ever see what
        the shop gave away.</p>`,
  },
  {
    title: 'Finding an order again',
    sub: 'Search and the date filter',
    roles: ['admin', 'staff'],
    body: `
      <p>The <strong>Orders</strong> list is the worklist: what is overdue, today, tomorrow,
        coming up, and what was collected in the last week. It is not everything.</p>
      <p>To reach the rest, use the <strong>search box</strong> at the top — a name, a phone
        number, a docket number like <span class="help-kbd">HP-1832</span>, or the cake.
        Search goes to the whole book, not just what is on screen, so an order from March
        will come back.</p>
      <p>The <strong>calendar button</strong> filters by pickup date. Tap a day for one day,
        or two days for a range, or use <em>Today</em> / <em>Next 7 days</em>. Tap
        <strong>Clear</strong> to get the worklist back.</p>`,
  },
  {
    title: 'When the customer comes to collect',
    sub: 'Status, prints, the rest of the money',
    roles: ['admin', 'staff'],
    body: `
      <p>Find the order, tap the card, and work down the sheet.</p>
      <ul class="help-list">
        <li><strong>Status</strong> — tap <em>At store</em> when the cake arrives at the
          counter, <em>Picked up</em> when it leaves with the customer.</li>
        <li>If the cake still has a topper or a photo print waiting, the app stops and
          <strong>tells you which one</strong> before it lets you mark it. That interruption is
          the whole reason this app exists — read it, do not tap past it.</li>
        <li><strong>Payment</strong> — set what they have now paid and tap
          <em>Save payment</em>. The card shows what is still owing in rose.</li>
        <li><strong>Edit details</strong> opens the order back up if something was typed
          wrong. Every change is recorded with your name against it, so fix it rather than
          working around it.</li>
      </ul>
      <p class="help-note">If they pull out, use <strong>Cancelled</strong>. Do not delete
        the order.</p>`,
  },
  {
    title: 'The baking list',
    sub: 'What to make, and by when',
    roles: ['admin', 'baker'],
    body: `
      <p><strong>To bake</strong> is every cake still to be made, both shops together,
        grouped by the day it is wanted. Overdue is at the top.</p>
      <p>The <strong>Both stores / Harris Park / Riverstone</strong> bar filters the list —
        use it when you are loading a van or checking one shop's book. The combined list is
        the working view, so it is what you get by default.</p>
      <p>Open a cake to see the flavour, size, wording and every reference photo the customer
        sent. Tap a photo to see it full size.</p>
      <p>When it is out of the oven, open it and tap <strong>Baked</strong>. If it needs a
        topper or a photo print that is not done yet, the app will say so first.</p>
      <p><strong>Sold in store today</strong> at the top of the list is what walked off the
        counter — so you restock from a number rather than from memory.</p>`,
  },
  {
    title: 'Toppers and photo prints',
    sub: 'The print board',
    roles: ALL,
    body: `
      <p><strong>Prints</strong> is the list of cakes waiting on something printed, split into
        <strong>3D prints</strong> (toppers) and <strong>Photo prints</strong>. Each job points
        at a real order, so there is one record of the cake and the print brief hangs off it.</p>
      <p>Everyone can see this board — the person handing a cake over needs to know its topper
        is done. Who ticks a job off is fixed:</p>
      <ul class="help-list">
        <li><strong>Vaidik</strong> marks 3D toppers printed, and adds new jobs.</li>
        <li><strong>The baker</strong> marks photo prints printed.</li>
        <li><strong>Staff</strong> read the board. If a job is not moving, say something
          rather than working around it.</li>
      </ul>
      <p>A cake that needs both gets two jobs, because they finish at different times and
        belong to different people.</p>`,
  },
  {
    title: 'Price, discount and payment',
    sub: 'What goes in which box',
    roles: ['admin', 'staff'],
    body: `
      <ul class="help-list">
        <li><strong>Price</strong> is the full list price of the cake.</li>
        <li><strong>Discount</strong> is what you took off it. Type dollars or a percent —
          they follow each other. Only dollars are kept, because "16.7% off" is not something
          a customer can check against what they handed over.</li>
        <li><strong>Deposit taken</strong> is money already in the till.</li>
        <li><strong>Payment</strong> is the state: unpaid, half, some other amount, or paid.</li>
      </ul>
      <p>The rose line on the card is what is still owing. Cents are always shown — nothing is
        rounded anywhere in this app.</p>`,
  },
  {
    title: 'The tax invoice',
    sub: 'Admin only',
    roles: ['admin'],
    body: `
      <p>Open an order and tap <strong>Download tax invoice</strong>. It is a proper tax
        invoice — GNT Ventures Pty Ltd, the ABN, both dates, the GST — not a thank-you note,
        so a customer can claim it.</p>
      <p>The design photos print on it. That is deliberate: it is what settles "this is not
        what I asked for" at the counter.</p>
      <p>The file downloads from a link rather than being built on the phone, because a phone
        will not save a file a web page makes by itself. Give it a moment on shop wifi.</p>`,
  },
  {
    title: 'Looking a customer up',
    sub: 'More › Customers › Directory',
    roles: ['admin', 'staff'],
    body: `
      <p>"I ordered here last month" now has an answer. Tap <strong>More</strong>, then
        <strong>Directory</strong>, and search by name or phone.</p>
      <p>Each person shows how many cakes they have had, what they have spent, and when they
        last ordered. Tap them to see every order.</p>
      <p>Staff see the customers of their own shop only.</p>`,
  },
  {
    title: 'The numbers',
    sub: 'More › Analytics',
    roles: ['admin'],
    body: `
      <p>Three pages behind <strong>More</strong>, all off one load of the last 63 days:</p>
      <ul class="help-list">
        <li><strong>Finance</strong> — takings, the week ahead, margin, discounts given, money
          still to collect, cancellations.</li>
        <li><strong>Customers</strong> — repeat rate, leaderboards, how far ahead people book.</li>
        <li><strong>Data</strong> — the two shops side by side, what sells, busiest days and
          pickup times, who logged what, and anything that needs fixing.</li>
      </ul>
      <p>On the takings panel, tap a tile — takings, orders, average, discounts — to draw that
        one underneath. Two things worth trusting the app about:</p>
      <ul class="help-list">
        <li>A <strong>margin</strong> is greyed out and labelled when only some of the orders
          have a cost recorded. A rate from two cakes out of twenty is not a fact.</li>
        <li>A panel says <strong>"too few orders to call"</strong> rather than making a
          recommendation when the numbers behind it are small.</li>
      </ul>
      <p>Every warning row is a button — tap it and it opens the order so you can fix it.</p>
      <p class="help-note">The "Updated · Refresh" line means you are reading a held copy.
        Tap Refresh after logging orders if the numbers look behind.</p>`,
  },
  {
    title: 'Export for the bookkeeper',
    sub: 'More › Export',
    roles: ['admin'],
    body: `
      <p>Pick a month or a financial year and tap <strong>Download CSV</strong>. One row per
        order, by the date it was taken, including cost — so treat the file the way you treat
        the books.</p>`,
  },
  {
    title: 'Staff and sign-ins',
    sub: 'More › Staff',
    roles: ['admin'],
    body: `
      <p>Who has an account, what role they hold, which shop they are on, and who has signed
        in recently.</p>
      <p><strong>This page is read-only.</strong> Roles and shop access are changed in
        Supabase, so the change is deliberate rather than an admin mistapping their own row.</p>`,
  },
  {
    title: 'Cancelling vs deleting',
    sub: 'They are not the same thing',
    roles: ['admin'],
    body: `
      <p><strong>Cancelled</strong> is for an order that was real and fell through. It counts
        in the cancellation rate, which is something the shop wants to know.</p>
      <p><strong>Delete order</strong> is for an order that should never have existed — a
        double entry, a test, the wrong shop. It takes the costs, the prints, the photos and
        the history with it, and it is two taps because it cannot be undone from here.</p>
      <p>Deleting a real cancellation quietly tells the shop that customers are not backing
        out when they are. Deleted orders are listed on the Data page with who removed them.</p>`,
  },
  {
    title: 'When something will not load',
    sub: 'Shop wifi, and expired sign-ins',
    roles: ALL,
    body: `
      <ul class="help-list">
        <li><strong>"Nothing loaded"</strong> — the phone could not reach the order book. Tap
          <em>Try again</em>. Nothing has been lost; the orders are on the server. The small
          grey line underneath is the reason — read it out if you are reporting it.</li>
        <li><strong>"Signed out"</strong> — the sign-in ran out, which happens after a phone
          has been left alone. Tap <em>Sign in again</em>. Trying again will not help.</li>
        <li><strong>A banner saying the list is from a few minutes ago</strong> — the app is
          showing you the last copy it got rather than nothing. Keep working; it will catch
          up.</li>
      </ul>
      <p class="help-note">If the app does something this page does not describe, tell Vaidik.
        The app changes, and this page is meant to change with it.</p>`,
  },
];

const STATUS_KEY = [
  ['placed', 'Order placed', 'Logged, not made yet'],
  ['baked', 'Baked', 'Out of the oven'],
  ['arrived', 'At store', 'On the counter, waiting'],
  ['picked_up', 'Picked up', 'Gone with the customer'],
  ['cancelled', 'Cancelled', 'The customer pulled out'],
];

const forRole = (role) => HELP.filter((s) => s.roles.includes(role));

/** The help page. `role` decides which sections exist at all. */
export function helpHtml(me) {
  const sections = forRole(me.role);
  return `
    <div class="panel help-top">
      <p class="help-hello">
        You are signed in as <strong>${esc(me.name)}</strong>, and your role is
        <strong>${esc(me.role)}</strong>. Everything on this page is something you can
        actually do — there is nothing here you will go looking for and not find.
      </p>
      <button class="btn btn-primary help-tour" type="button">Show me around</button>
    </div>

    <div class="panel">
      <div class="panel-title">Where a cake is up to</div>
      <div class="panel-note">The dot on every card, in the order it happens.</div>
      ${STATUS_KEY.map(([code, label, note]) => `
        <div class="list-row">
          <span class="status-dot st-${code}">${esc(label)}</span>
          <span class="grow help-key-note">${esc(note)}</span>
        </div>`).join('')}
    </div>

    ${sections.map((s) => `
      <details class="panel collapse help-sec">
        <summary class="collapse-head">
          <span class="help-head">
            <span class="panel-title">${esc(s.title)}</span>
            <span class="list-meta">${esc(s.sub)}</span>
          </span>
          ${CHEV}
        </summary>
        <div class="collapse-body help-body">${s.body}</div>
      </details>`).join('')}

    <p class="panel-foot help-foot">
      ${sections.length} section${sections.length === 1 ? '' : 's'} · written for the counter,
      not for a manual. Tap <strong>Show me around</strong> any time to run the tour again.
    </p>`;
}

// ── Guided tour ─────────────────────────────────────────────────────────────
//
// A cut-out over the real button rather than a carousel of screenshots: the
// thing being pointed at is the thing they will tap, and it cannot go stale the
// way a picture of the app does.
//
// Steps whose target is not on screen are dropped before the tour starts, so
// one list covers every role — the baker has no Orders tab and no search box,
// and those steps simply do not happen.

export const TOUR = [
  {
    sel: '#me-role',
    title: 'This is your role',
    text: 'What you can see and change comes from this. The app never offers you a button the database would refuse.',
  },
  {
    sel: '#store-switch',
    title: 'Which shop',
    text: 'You are on both shops, so this picks whose orders you are looking at. It never moves an order between them.',
  },
  {
    sel: '.tab[data-tab="log"]',
    title: 'Orders',
    text: 'The worklist: overdue first, then today, tomorrow and what is coming. Tap any card to open the cake.',
  },
  {
    sel: '#log-search',
    title: 'Find anything',
    text: 'A name, a phone number, a docket number or a cake. This searches the whole book, not just what is on screen.',
  },
  {
    sel: '#range-btn',
    title: 'Or pick dates',
    text: 'Filter by pickup day, or a range. Clear puts the worklist back.',
  },
  {
    sel: '.tab[data-tab="new"]',
    title: 'Log an order here',
    text: 'Custom or normal, then the customer, the cake, the photos and the money. About thirty seconds.',
  },
  {
    sel: '.tab[data-tab="bake"]',
    title: 'What to bake',
    text: 'Both shops together, grouped by the day each cake is wanted. Mark a cake baked from inside it.',
  },
  {
    sel: '.tab[data-tab="prints"]',
    title: 'Toppers and photo prints',
    text: 'Cakes waiting on something printed. Marking one baked or picked up will remind you about these first.',
  },
  {
    sel: '.tab[data-tab="more"]',
    title: 'Everything read at the end of a day',
    text: 'The numbers, the customer directory, staff and the bookkeeper export live behind here.',
  },
  {
    sel: '#help-btn',
    title: 'And help lives here',
    text: 'Every screen, top right. Open it at the counter — it is written for exactly that.',
  },
  {
    sel: null,
    title: "That's the whole app",
    text: 'Nothing you tap can lose an order — every change is kept with your name on it. If something does not make sense, open Help.',
  },
];

/** On screen and not inside something hidden. */
function target(sel) {
  if (!sel) return null;
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? el : null;
}

let running = false;

/**
 * Runs the tour over whatever is currently on screen.
 * `onDone` fires once, whether it was finished or skipped.
 */
export function startTour({ onDone = () => {} } = {}) {
  if (running) return;
  const steps = TOUR.filter((s) => !s.sel || target(s.sel));
  if (!steps.length) { onDone(); return; }
  running = true;

  let i = 0;
  const root = document.createElement('div');
  root.className = 'tour';
  root.innerHTML = `
    <div class="tour-hole"></div>
    <div class="tour-card" role="dialog" aria-modal="true" aria-label="Guided tour">
      <div class="tour-head">
        <span class="tour-step"></span>
        <button class="tour-x" type="button" aria-label="Skip the tour">&#10005;</button>
      </div>
      <h2 class="tour-title display"></h2>
      <p class="tour-text"></p>
      <div class="tour-foot">
        <button class="btn btn-quiet tour-back" type="button">Back</button>
        <button class="btn btn-primary tour-next" type="button">Next</button>
      </div>
    </div>`;
  document.body.appendChild(root);

  const hole = root.querySelector('.tour-hole');
  const card = root.querySelector('.tour-card');
  const back = root.querySelector('.tour-back');
  const next = root.querySelector('.tour-next');

  const end = () => {
    if (!running) return;
    running = false;
    root.remove();
    window.removeEventListener('resize', place);
    document.removeEventListener('keydown', onKey);
    onDone();
  };

  function place() {
    const step = steps[i];
    const el = target(step.sel);
    const pad = 6;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!el) {
      // The closing step has nothing to point at: dim everything, centre the card.
      hole.classList.add('is-blank');
      hole.style.cssText = `left:${vw / 2}px;top:${vh / 2}px;width:0;height:0;`;
      card.style.left = `${Math.max(12, (vw - card.offsetWidth) / 2)}px`;
      card.style.top = `${Math.max(12, (vh - card.offsetHeight) / 2)}px`;
      return;
    }

    const r = el.getBoundingClientRect();
    hole.classList.remove('is-blank');
    hole.style.cssText = `left:${r.left - pad}px;top:${r.top - pad}px;`
      + `width:${r.width + pad * 2}px;height:${r.height + pad * 2}px;`;

    // Below the target when it sits in the top half, above it when it does not —
    // which is what keeps the card off the tab bar it is pointing at.
    const h = card.offsetHeight;
    const below = r.bottom < vh / 2;
    const top = below ? r.bottom + pad + 10 : r.top - pad - 10 - h;
    card.style.top = `${Math.min(vh - h - 12, Math.max(12, top))}px`;

    const w = card.offsetWidth;
    card.style.left = `${Math.min(vw - w - 12, Math.max(12, r.left + r.width / 2 - w / 2))}px`;
  }

  function paint() {
    const step = steps[i];
    root.querySelector('.tour-step').textContent = `${i + 1} of ${steps.length}`;
    root.querySelector('.tour-title').textContent = step.title;
    root.querySelector('.tour-text').textContent = step.text;
    back.hidden = i === 0;
    next.textContent = i === steps.length - 1 ? 'Done' : 'Next';
    place();
  }

  const move = (n) => {
    if (n < 0 || n >= steps.length) { end(); return; }
    i = n;
    paint();
  };

  function onKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); end(); }
    else if (e.key === 'ArrowRight') move(i + 1);
    else if (e.key === 'ArrowLeft' && i > 0) move(i - 1);
  }

  next.addEventListener('click', () => move(i + 1));
  back.addEventListener('click', () => move(i - 1));
  root.querySelector('.tour-x').addEventListener('click', end);
  // Tapping the dimmed area moves on; it is the gesture people try first.
  root.addEventListener('click', (e) => { if (e.target === root) move(i + 1); });
  window.addEventListener('resize', place);
  // Capture, so Escape closes the tour without also closing whatever is under it.
  document.addEventListener('keydown', onKey, true);

  paint();
  next.focus();
}

// ── Has this person been shown it ───────────────────────────────────────────
//
// Per user, not per phone: the counter iPad is shared, and the second person to
// sign in on it needs the tour as much as the first. Bumping the version shows
// it again to everyone, which is what a big change to the app is worth.

const SEEN = 'ops-tour-v1';

const store = () => { try { return window.localStorage; } catch { return null; } };

export function tourSeen(userId) {
  return store()?.getItem(`${SEEN}:${userId}`) === 'yes';
}

export function markTourSeen(userId) {
  try { store()?.setItem(`${SEEN}:${userId}`, 'yes'); } catch { /* private mode; it just runs again */ }
}
