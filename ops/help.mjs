// Help page and the guided walkthroughs.
//
// The shop hires people who have never seen this app and nobody has time to sit
// with them for an hour. So the app teaches itself twice: walkthroughs that
// point at the real controls on the real screen, and a page they can come back
// to at the counter with a customer standing there.
//
// Everything here is filtered by role, because showing a baker the invoice
// button is worse than showing nothing — it teaches them a thing the database
// will refuse. The role lists in this file must track the ones in app.mjs
// (TABS, MENU) and the RLS policies behind them.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ALL = ['admin', 'staff', 'baker'];
const COUNTER = ['admin', 'staff'];
const KITCHEN = ['admin', 'baker'];

const CHEV = '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

const PLAY = '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5.5v13l10-6.5z"/></svg>';

// ── Walkthroughs ────────────────────────────────────────────────────────────
//
// A cut-out over the real control rather than a carousel of screenshots: the
// thing being pointed at is the thing they will tap, and it cannot go stale the
// way a picture of the app does.
//
// A tour may ask the app to move first — `view` switches tab, `open` opens a
// sheet — and `reveal` clicks the controls that unhide the rest of a form, so
// the steps that follow have something to point at. Steps whose target is still
// not on screen are dropped before the tour starts, which is how one step list
// covers every role: the baker has no Orders tab and no price boxes, and those
// steps simply do not happen.

export const TOURS = {
  intro: {
    label: 'Around the app',
    roles: ALL,
    note: 'The five things in the bar, and where everything lives',
    steps: [
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
        text: 'Every screen, top right. Each section on that page has a Show me button that walks you through that job on the real screen.',
      },
      {
        sel: null,
        title: "That's the shape of it",
        text: 'Nothing you tap can lose an order — every change is kept with your name on it. For how to actually do a job, open Help and run its walkthrough.',
      },
    ],
  },

  'new-order': {
    label: 'Logging an order',
    roles: COUNTER,
    note: 'Opens a real order form and names every box',
    open: 'new-order',
    // The form stays hidden until a kind is picked, so pick one for them.
    reveal: ['[data-kind="custom"]'],
    steps: [
      {
        sel: '.kind-pick',
        title: 'Custom or normal, first',
        text: 'This choice changes the rest of the form, so it comes first. Custom is made to a design. Normal is off the menu — and then you are asked whether it was ordered for later or bought in store now.',
      },
      {
        sel: '#dd-store',
        title: 'Which shop it is for',
        text: 'You work at both, so say which one. It decides whose book the cake lands in.',
      },
      {
        sel: '#f-name',
        title: 'The customer',
        text: 'Start typing. If they have ordered before, a suggestion drops down — tap it and the phone fills itself in.',
      },
      {
        sel: '#f-phone',
        title: 'The phone number',
        text: 'This is what ties the order to the rest of their history, so it is worth asking for. Without it they are a new customer every time.',
      },
      {
        sel: '#f-ordered-btn',
        title: 'When they ordered',
        text: 'Leave it if they are standing in front of you. Set it back if you are typing up a WhatsApp message from this morning. The calendar greys out the future, because an order cannot have been placed tomorrow.',
      },
      {
        sel: '#f-due-btn',
        title: 'When they collect',
        text: 'Pick the day, then the time. This one greys out the past instead — a cake cannot be collected yesterday.',
      },
      {
        sel: '#dd-flavour',
        title: 'Flavour',
        text: 'The list is the menu. A premium flavour carries its surcharge with it, so the price below will move when you pick one.',
      },
      {
        sel: '#dd-size',
        title: 'Size — and this fills the price in',
        text: 'Choosing a size puts the list price in the Price box. Choose Tiered for a stacked cake and boxes appear for each tier’s width and height; a tiered cake is quoted, so nothing autofills.',
      },
      {
        sel: '#f-wording',
        title: 'What goes on the cake',
        text: 'Exactly as they said it. Copy it out of their message rather than retyping it — this is what gets piped on.',
      },
      {
        sel: '#f-design',
        title: 'Design notes',
        text: 'Colours, figures, anything the photo does not say. The baker reads this beside the pictures.',
      },
      {
        sel: '#photo-field',
        title: 'Design photos',
        text: 'Choose photos picks the ones the customer already sent; Take photo opens the camera. Add all of them — the first becomes the cover on the card. They are shrunk before upload and deleted 14 days after the order.',
      },
      {
        sel: '#f-price',
        title: 'Price is the full price',
        text: 'The size filled this in. Type over it if the cake is priced differently — once you type, the size will not overwrite you again.',
      },
      {
        sel: '#f-discount',
        title: 'Discount, in dollars or percent',
        text: 'Whichever they said. The two boxes follow each other, and only dollars are kept — a customer cannot check “16.7% off” against what they handed over. Never fold it into the price: a $130 cake at $10 off is a $130 price and a $10 discount.',
      },
      {
        sel: '#f-deposit',
        title: 'Deposit taken',
        text: 'Money already in the till. The line above shows what is left to collect.',
      },
      {
        sel: '#pay-toggle',
        title: 'Where the payment is up to',
        text: 'Unpaid, 50% deposit, another amount, or paid in full. Pick 50% and the deposit works itself out.',
      },
      {
        sel: '#f-notes',
        title: 'Anything else',
        text: 'Things nobody has a box for — allergies, who is collecting, a delivery arrangement.',
      },
      {
        sel: '#save-order',
        title: 'Save it',
        text: 'The cake appears on the order list and on the baker’s queue straight away. The form is still open — carry on and log it for real, or close it with the ✕.',
      },
    ],
  },

  find: {
    label: 'Finding an order again',
    roles: COUNTER,
    note: 'Search, dates, and what the groups mean',
    view: 'log',
    steps: [
      {
        sel: '#log-search',
        title: 'Search reaches the whole book',
        text: 'A name, part of a phone number, a docket number like HP-1832, or the cake. Not just what is on this screen — an order from March comes back.',
      },
      {
        sel: '#logbar',
        title: 'What you are looking at',
        text: 'This says which slice of the book is on screen. “All upcoming” is the worklist: everything still to come, plus anything collected in the last week.',
      },
      {
        sel: '#range-btn',
        title: 'Filter by pickup date',
        text: 'Tap one day for that day, or two days for a range. Today and Next 7 days are there for the common ones. Clear puts the worklist back.',
      },
      {
        sel: '.section-head',
        title: 'The day groups',
        text: 'Overdue sits at the top in rose, then Today, Tomorrow and the days after. The number on the right is how many cakes are in that group.',
      },
      {
        sel: '.docket',
        title: 'And this is one cake',
        text: 'The stripe down the left is how close the pickup is. Tap the card to open everything about the order.',
      },
    ],
  },

  order: {
    label: 'Opening an order',
    roles: ALL,
    note: 'Everything you can do to a cake, on a real one',
    open: 'first-order',
    steps: [
      {
        sel: '.detail-gallery',
        title: 'What the customer sent',
        text: 'Every reference photo, all on screen at once. Tap one to open it full size in a new tab.',
        roles: ALL,
      },
      {
        sel: '.photo-remove',
        title: 'Removing a photo',
        text: 'Two taps, because this button sits on top of a picture people are trying to look at. The file goes first, then the record of it.',
        roles: COUNTER,
      },
      {
        sel: '.addphoto',
        title: 'Adding one later',
        text: 'When the customer sends another picture after the order is logged, put it here rather than starting a new order.',
        roles: COUNTER,
      },
      {
        sel: '#detail-view',
        title: 'The order itself',
        text: 'Customer, both dates, shop, flavour, size, wording and design notes. Log time is when it was typed in; Order time is when they actually asked.',
        roles: ALL,
      },
      {
        sel: '#edit-toggle',
        title: 'Anything typed wrong, fix here',
        text: 'This opens the whole order back up — name, phone, dates, flavour, size, tiers, wording, notes. Every change is kept with your name against it, so fix it rather than working around it.',
        roles: COUNTER,
      },
      {
        sel: '#print-warn',
        title: 'What still has to be printed',
        text: 'A topper or a photo sheet this cake is waiting on. Marking the cake baked or picked up will stop and show you this first — that interruption is the whole reason this app exists.',
        roles: ALL,
      },
      {
        sel: '#status-actions',
        title: 'Move the cake along',
        text: 'Only the steps your role is allowed to make are here. The counter marks a cake At store and Picked up; the kitchen marks it Baked; cancelling belongs to the counter.',
        roles: ALL,
      },
      {
        sel: '#cost-input',
        title: 'What it cost to make',
        text: 'Admin only, and kept in a separate table — this is what turns takings into margin on the Finance page.',
        roles: ['admin'],
      },
      {
        sel: '#pay-net',
        title: 'What they actually owe',
        text: 'Price less discount. Every figure the shop reads comes off this number, not off the list price.',
        roles: COUNTER,
      },
      {
        sel: '#pay-save',
        title: 'Taking the rest of the money',
        text: 'Update the deposit or tick it paid in full, then save. The rose figure on the card is what is still to collect.',
        roles: COUNTER,
      },
      {
        // #edit-trail is filled after a fetch, so it is an empty div at the moment
        // the steps are filtered. The timeline above it is always there.
        sel: '.timeline',
        title: 'Everything that has happened to it',
        text: 'When it was ordered, logged, baked and collected. Underneath, for an admin, every field anyone has changed — the old value, the new one and who did it. Nothing about an order is ever lost.',
        roles: ['admin'],
      },
      {
        sel: '#receipt-btn',
        title: 'The tax invoice',
        text: 'A proper tax invoice — the company, the ABN, both dates, the GST — not a thank-you note, so the customer can claim it. The design photos print on it, which is what settles “this is not what I asked for” at the counter.',
        roles: ['admin'],
      },
      {
        sel: '#order-delete',
        title: 'Delete is not cancel',
        text: 'Delete is for an order that should never have existed: a double entry, a test, the wrong shop. If the customer pulled out, use Cancelled instead — otherwise the shop is told people are backing out when they are not.',
        roles: ['admin'],
      },
      {
        sel: null,
        title: 'Close it with the ✕',
        text: 'Or the back gesture on the phone — it closes the sheet instead of walking out of the app.',
        roles: ALL,
      },
    ],
  },

  bake: {
    label: 'Working the baking list',
    roles: KITCHEN,
    note: 'The queue, the store bar and the counter tally',
    view: 'bake',
    steps: [
      {
        sel: '#view-bake .segmented',
        title: 'Both shops by default',
        text: 'Baking is central, so the combined queue is the working view. The per-shop tabs are for loading a van or checking one shop’s book. The number beside each is how many cakes are waiting.',
      },
      {
        sel: '#view-bake .panel.collapse',
        title: 'What walked off the counter',
        text: 'Cakes sold in store today, by size and flavour, with yesterday underneath. Restock from this rather than from memory.',
      },
      {
        sel: '#view-bake .section-head',
        title: 'Grouped by the day it is wanted',
        text: 'Overdue first, then today and the days after. A cake leaves this list the moment it is marked baked.',
      },
      {
        sel: '#view-bake .docket',
        title: 'One cake',
        text: 'Size, flavour and the pickup time. A rose 3D or Photo flag means something still has to be printed for it. Tap it to see the wording and every reference photo, and to mark it baked.',
      },
    ],
  },

  prints: {
    label: 'The print board',
    roles: ALL,
    note: 'Toppers and photo sheets waiting on the machines',
    view: 'prints',
    steps: [
      {
        sel: '#view-prints .segmented',
        title: '3D and photo are separate lists',
        text: 'Different machines, different people, different finish times. The number beside each is what is still to print.',
      },
      {
        sel: '#print-add',
        title: 'Add a job',
        text: 'A job points at an order rather than restating the cake, so there is one record and the print brief hangs off it.',
        roles: ['admin'],
      },
      {
        sel: '#view-prints .docket',
        title: 'One job',
        text: 'The docket number, the cake, and what has to be printed. Tap it to open the brief and the reference photos.',
      },
      {
        sel: null,
        title: 'Who ticks a job off',
        text: 'Vaidik marks 3D toppers printed; the baker marks photo prints. The counter can read this board — the cake it is handing over is on it — but the database will refuse a write from it, so no button is offered.',
      },
    ],
  },

  'new-print': {
    label: 'Adding a print job',
    roles: ['admin'],
    note: 'Opens the real form and names every box',
    view: 'prints',
    open: 'new-print',
    // Both kinds on, whichever tab the board was left on, so both briefs have
    // something to point at. The skip-if-already-pressed rule is what makes
    // naming both safe: the one already on is left alone rather than toggled off.
    reveal: ['[data-pkind="3d"]', '[data-pkind="photo"]'],
    steps: [
      {
        sel: '.kind-pick',
        title: '3D, photo, or both',
        text: 'Tap both if the cake needs both. It becomes two jobs, because the topper and the photo sheet finish at different times and belong to different people — but you log them in one pass.',
      },
      {
        sel: '#pick-btn',
        title: 'Point it at the cake',
        text: 'A grid of the open orders, by their photo. You recognise the cake by its picture, and picking it carries the shop, the size and the pickup day across without anyone retyping them.',
      },
      {
        sel: '#pj-what-3d',
        title: 'What to 3D print',
        text: 'The topper, the name plate, the figure. Write it the way you would say it to the person at the printer.',
      },
      {
        sel: '#pj-what-photo',
        title: 'What to photo print',
        text: 'Which picture goes on the edible sheet — usually one of the reference photos already on the order.',
      },
      {
        sel: '#pj-new-notes',
        title: 'Notes',
        text: 'Filament colour, sizing, anything the brief above does not carry. Both jobs get the same note.',
      },
      {
        sel: '#pj-new-save',
        title: 'Save',
        text: 'The job lands on the board, and the cake it points at starts showing a print flag on every screen it appears on.',
      },
    ],
  },

  'print-job': {
    label: 'Working a print job',
    roles: ALL,
    note: 'The brief, the photos, and marking it done',
    view: 'prints',
    open: 'first-print',
    steps: [
      {
        sel: '.detail-gallery',
        title: 'The reference photos',
        text: 'The same pictures the customer sent, at the size you need them. Tap one to open it full size.',
      },
      {
        sel: '#print-toggle',
        title: 'Mark it printed',
        text: 'Off the to-print list and onto the cake’s record. Pressed by mistake, the same button moves it back.',
      },
      {
        sel: '#pj-what',
        title: 'Fixing the brief',
        text: 'Change what is being printed, or the notes, without touching the order itself.',
        roles: ['admin'],
      },
      {
        sel: '#pj-delete',
        title: 'Or drop the job',
        text: 'Two taps. Use it when the cake turned out not to need a print — the order stays exactly as it is.',
        roles: ['admin'],
      },
      {
        sel: null,
        title: 'Who ticks which job off',
        text: 'Vaidik marks 3D toppers printed; the baker marks photo prints. The counter reads this board — the cake it is handing over is on it — but the database refuses a write from it, so no button is offered rather than one that errors.',
      },
    ],
  },

  customers: {
    label: 'Looking a customer up',
    roles: COUNTER,
    note: '“I ordered here last month” now has an answer',
    view: 'directory',
    steps: [
      {
        sel: '#cust-search',
        title: 'Name or number',
        text: 'Part of either is enough. You see the customers of your own shop.',
      },
      {
        sel: '#cust-sort',
        title: 'Or sort the whole list',
        text: 'By who ordered most recently, who spends the most, or who has been quiet a while.',
      },
      {
        sel: '#cust-list',
        title: 'What each one shows',
        text: 'How many cakes, what they have spent, and when they last ordered. Tap a person to see every order they have had.',
      },
    ],
  },

  analytics: {
    label: 'Reading the numbers',
    roles: ['admin'],
    note: 'Finance, Customers and Data — and what to trust',
    view: 'analytics',
    steps: [
      {
        sel: '#fresh-when',
        title: 'How old this is',
        text: 'All three pages come off one load of the last 63 days, held so the pages open instantly. Refresh after logging orders if the figures look behind.',
      },
      {
        sel: '#metric-row',
        title: 'Four figures, one chart',
        text: 'Takings, orders, average order and discounts, each against the previous thirty days. Tap one and it becomes the line underneath — they are three different units, so they never share an axis.',
      },
      {
        sel: '.panel-warn',
        title: 'Warnings are buttons',
        text: 'Every row in a warning panel opens the order it is about, so you can fix it from here rather than going to look for it.',
      },
      {
        sel: null,
        title: 'When a number is not a fact',
        text: 'A margin is greyed out and labelled when only some of those orders have a cost recorded. A panel says “too few orders to call” rather than making a recommendation. Believe those caveats — a difference of two cakes looks exactly like a pattern.',
      },
      {
        sel: '.tab[data-tab="more"]',
        title: 'The other two pages',
        text: 'More › Analytics › Customers is repeat rate and leaderboards; Data is the two shops side by side, what sells, busiest days, who logged what, and what has been deleted.',
      },
    ],
  },

  export: {
    label: 'Exporting for the bookkeeper',
    roles: ['admin'],
    note: 'A month or a financial year, as CSV',
    view: 'export',
    steps: [
      {
        sel: '.range-pick',
        title: 'Pick the period',
        text: 'By the date each order was taken, not when the cake was collected. Financial years are there so they line up with what the bookkeeper asks for.',
      },
      {
        sel: '#export-go',
        title: 'Download',
        text: 'One row per order, including cost — so treat the file the way you treat the books. It is written on the phone, so it works with no connection to anything but the order list you already have.',
      },
    ],
  },

  staff: {
    label: 'Staff and sign-ins',
    roles: ['admin'],
    note: 'Who has an account, and who has been on',
    view: 'staff',
    steps: [
      {
        sel: '#view-staff .panel',
        title: 'Everyone with an account',
        text: 'Name, role and which shops they are scoped to.',
      },
      {
        sel: null,
        title: 'And it is read-only on purpose',
        text: 'Roles and shop access are changed in Supabase, so the change is deliberate rather than an admin mistapping their own row. Ask Vaidik; it takes a minute.',
      },
    ],
  },
};

const tourFor = (key, role) => {
  const t = TOURS[key];
  return t && t.roles.includes(role) ? t : null;
};

/** The steps this role will actually be shown, before anything is on screen. */
export const tourSteps = (key, role) =>
  (TOURS[key]?.steps || []).filter((s) => !s.roles || s.roles.includes(role));

// ── Help page ───────────────────────────────────────────────────────────────
//
// Sections of the help page, in the order a shift actually happens: sign in,
// read a card, take an order, find it again, hand it over, then the things read
// at the end of a day. Titled by the task, not by the screen — someone looking
// for help is thinking "she wants to pay the rest", not "order detail sheet".

export const HELP = [
  {
    title: 'Signing in, and what you can see',
    sub: 'Your name, your role, your shop',
    roles: ALL,
    tour: 'intro',
    body: `
      <p>Pick your name under <strong>Who's on</strong> and type your password. The app
        stays signed in on that phone, so you only do this once in a while.</p>
      <p>Your name and role sit in the top right of every screen. <strong>The role decides
        what you see</strong> — not a setting you can change here. If it is wrong, tell
        Vaidik; it is changed in the database on purpose, so nobody can give
        themselves more by mistapping.</p>
      <ul class="help-list">
        <li><strong>Staff</strong> — the orders for your own shop: log them, find them,
          take payment, mark a cake at the store or picked up, and look a customer up.</li>
        <li><strong>Baker</strong> — the baking queue for both shops and the print board.
          You mark a cake baked and a photo print done. You do not see prices.</li>
        <li><strong>Admin</strong> — all of it: both shops, costs, the numbers, the
          invoice, the export and the print machines.</li>
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
        <li><strong>A rose “3D” or “Photo” flag</strong> means the cake needs something
          printed before it can go out.</li>
        <li><strong>A rose amount</strong> in the bottom row is what is still to collect.</li>
        <li><strong>Ordered · Log time</strong> at the bottom appears when the two differ —
          an order relayed off WhatsApp hours after the customer actually asked.</li>
      </ul>
      <p>The picture is the first photo the customer sent. A normal cake has no design
        photo, so it shows the cake we sell in that flavour.</p>`,
  },
  {
    title: 'Taking a new order',
    sub: 'Tap New — about thirty seconds',
    roles: COUNTER,
    tour: 'new-order',
    body: `
      <p>Tap <strong>New</strong> in the bar at the bottom, then pick what kind of cake it
        is. That first choice changes the rest of the form, so it comes first.</p>
      <ol class="help-steps">
        <li><strong>Custom cake</strong> — made to a design. Design photos are required.
          <br><strong>Normal cake</strong> — off the menu. You are then asked whether it was
          <em>ordered for later</em> or <em>bought in store now</em>; the second is a walk-in
          and shows as one everywhere.</li>
        <li><strong>Store</strong>, if you work at both. It decides whose book the cake lands
          in, so it is worth a second look.</li>
        <li><strong>Customer and phone.</strong> Start typing the name — if they have ordered
          before, tap the suggestion and the phone fills itself in. The phone number is what
          links this order to the rest of their history, so it is worth getting.</li>
        <li><strong>Order time</strong> is when they placed the order. Leave it if they are
          standing in front of you; set it back if you are typing up a WhatsApp message from
          this morning. The calendar greys out the future, because nothing can have been
          ordered tomorrow.</li>
        <li><strong>Pick up</strong> is the day and time they are collecting. That calendar
          greys out the past instead. <em>Today</em> and <em>Tomorrow</em> are there for the
          common ones.</li>
        <li><strong>Flavour and size.</strong> Choosing a size fills the price in for you, and
          a premium flavour moves it. Type over it if the price is different — once you type,
          the size will not overwrite you again.
          <br>For a stacked cake choose <strong>Tiered</strong> and enter each tier's width
          and height. A tiered cake is quoted, so no price is filled in, and it is not
          reported as underpriced later.</li>
        <li><strong>Wording on cake</strong> is what gets written on it, exactly. Copy it
          from the customer's message rather than retyping it.</li>
        <li><strong>Design notes</strong> — colours, figures, anything the pictures do not
          say. The baker reads this beside them.</li>
        <li><strong>Design photos.</strong> <em>Choose photos</em> picks the ones the customer
          already sent; <em>Take photo</em> opens the camera. Add all of them — the baker
          works from these, and the first becomes the cover on the card. They are shrunk
          before upload and deleted 14 days after the order.</li>
        <li><strong>Price, discount, deposit.</strong> Price is the full price. Anything you
          take off goes in <strong>Discount</strong> — in dollars or as a percent, whichever
          they said. The line underneath shows what the customer actually owes.</li>
        <li><strong>Payment</strong> — Unpaid, 50% deposit, Other amount, or Paid in full.</li>
        <li><strong>Anything else</strong> for what has no box: allergies, who is collecting,
          a delivery arrangement. Then <strong>Save order</strong>.</li>
      </ol>
      <p class="help-note">Do not fold the discount into the price. A $130 cake at $10 off is
        a $130 price and a $10 discount, not a $120 price — otherwise nobody can ever see what
        the shop gave away.</p>`,
  },
  {
    title: 'Finding an order again',
    sub: 'Search and the date filter',
    roles: COUNTER,
    tour: 'find',
    body: `
      <p>The <strong>Orders</strong> list is the worklist: what is overdue, today, tomorrow,
        coming up, and what was collected in the last week. It is not everything.</p>
      <p>To reach the rest, use the <strong>search box</strong> at the top — a name, a phone
        number, a docket number like <span class="help-kbd">HP-1832</span>, or the cake.
        Search goes to the whole book, not just what is on screen, so an order from March
        will come back.</p>
      <p>The <strong>calendar button</strong> filters by pickup date. Tap a day for one day,
        or two days for a range, or use <em>Today</em> / <em>Next 7 days</em>. Tap
        <strong>Clear</strong> to get the worklist back.</p>
      <p>Neither one reloads anything you already have on screen, so typing a name is
        instant. The label on the left always says which slice you are looking at.</p>`,
  },
  {
    title: 'Opening an order',
    sub: 'Everything you can do to a cake',
    roles: ALL,
    tour: 'order',
    body: `
      <p>Tap any card — on the order list, the baking queue or the print board — and the
        whole cake opens. What is in the sheet depends on your role.</p>
      <ul class="help-list">
        <li><strong>The photos</strong> sit at the top, all of them, not one behind a swipe.
          Tap one to open it full size.</li>
        <li><strong>Add a photo</strong> when the customer sends another one later, rather
          than starting a second order. The ✕ on a picture removes it — two taps, because the
          button sits on top of something people are trying to look at.</li>
        <li><strong>The details</strong> — customer, both dates, shop, flavour, size, wording,
          design notes, price, what is paid and what is owed.</li>
        <li><strong>Edit details</strong> opens the order back up: name, phone, both dates,
          flavour, size, tiers, wording, notes. Every change is recorded with your name
          against it, so fix a mistake rather than working around it.</li>
        <li><strong>Status</strong> — only the steps your role is allowed to make are shown.
          If prints are outstanding, the app stops and lists them before it lets you mark the
          cake baked or picked up. Read that; do not tap past it.</li>
        <li><strong>Payment</strong> — update the deposit or tick it paid in full and save.</li>
        <li><strong>History</strong> — when it was logged, baked and collected.</li>
      </ul>
      <p>Close it with the ✕, or with the phone's back gesture — that closes the sheet
        instead of walking out of the app mid-order.</p>`,
  },
  {
    title: 'Money on an order',
    sub: 'Cost, the invoice, and the change trail',
    roles: ['admin'],
    body: `
      <ul class="help-list">
        <li><strong>Cost to make</strong> is admin-only and lives in its own table. It is what
          turns takings into margin on the Finance page — an order with no cost is left out of
          the margin rather than counted as free.</li>
        <li><strong>Download tax invoice</strong> produces a compliant tax invoice: the
          company, the ABN, the issue date and the date of supply, the GST, and the customer's
          name. The design photos print on it, which is what settles “this is not what I asked
          for” at the counter.</li>
        <li><strong>The change trail</strong> under History lists every field anyone has
          edited — old value, new value, who, when.</li>
      </ul>
      <p class="help-note">The invoice downloads from a link rather than being built inside
        the page, because a phone will not save a file a web page makes by itself. On shop
        wifi give it a moment.</p>`,
  },
  {
    title: 'The baking list',
    sub: 'What to make, and by when',
    roles: KITCHEN,
    tour: 'bake',
    body: `
      <p><strong>To bake</strong> is every cake still to be made, both shops together,
        grouped by the day it is wanted. Overdue is at the top.</p>
      <p>The <strong>Both stores / Harris Park / Riverstone</strong> bar filters the list —
        use it when you are loading a van or checking one shop's book. The combined list is
        the working view, so it is what you get by default, and the number beside each tab is
        how many cakes are waiting.</p>
      <p>Open a cake to see the flavour, size, wording and every reference photo the customer
        sent. Tap a photo to see it full size.</p>
      <p>When it is out of the oven, open it and tap <strong>Baked</strong>. If it needs a
        topper or a photo print that is not done yet, the app will say so first.</p>
      <p><strong>Sold in store today</strong> at the top of the list is what walked off the
        counter, by size and flavour, with yesterday underneath — so you restock from a number
        rather than from memory.</p>`,
  },
  {
    title: 'The print board',
    sub: 'Toppers and photo sheets',
    roles: ALL,
    tour: 'prints',
    body: `
      <p><strong>Prints</strong> is the list of cakes waiting on something printed, split into
        <strong>3D prints</strong> (toppers) and <strong>Photo prints</strong>. Each job points
        at a real order, so there is one record of the cake and the print brief hangs off it.</p>
      <p>Everyone can see this board — the person handing a cake over needs to know its topper
        is done. Who ticks a job off is fixed, in the database, not just in the buttons:</p>
      <ul class="help-list">
        <li><strong>Vaidik</strong> marks 3D toppers printed, and adds and edits jobs.</li>
        <li><strong>The baker</strong> marks photo prints printed.</li>
        <li><strong>Staff</strong> read the board. If a job is not moving, say something
          rather than working around it.</li>
      </ul>
      <p>Open a job to see the brief, the notes and the reference photos, and to mark it
        printed. Marked by mistake, the same button puts it back.</p>`,
  },
  {
    title: 'Adding a print job',
    sub: 'Point it at the cake, do not retype it',
    roles: ['admin'],
    tour: 'new-print',
    body: `
      <p>On the <strong>Prints</strong> board, tap <strong>Add a print job</strong>.</p>
      <ol class="help-steps">
        <li><strong>3D, photo, or both.</strong> Tap both if the cake needs both — it becomes
          two jobs, because they finish at different times and belong to different people,
          but you log them in one pass.</li>
        <li><strong>Which cake.</strong> A grid of the open orders by their photo. Picking one
          carries the shop, the size and the pickup day across, so nothing is retyped and
          there is no second version of the cake to keep in step.</li>
        <li><strong>What to print</strong> — the topper, the name plate, the picture. Write it
          the way you would say it to whoever is at the machine.</li>
        <li><strong>Notes</strong> for filament colour, sizing, anything the brief does not
          carry. Both jobs get the same note.</li>
        <li><strong>Save print job.</strong> It lands on the board, and the cake starts
          showing a print flag on every screen it appears on.</li>
      </ol>
      <p>To change a brief or drop a job, open it from the board. Deleting a job is two taps
        and leaves the order exactly as it was.</p>`,
  },
  {
    title: 'Price, discount and payment',
    sub: 'What goes in which box',
    roles: COUNTER,
    body: `
      <ul class="help-list">
        <li><strong>Price</strong> is the full list price of the cake.</li>
        <li><strong>Discount</strong> is what you took off it. Type dollars or a percent —
          they follow each other. Only dollars are kept, because "16.7% off" is not something
          a customer can check against what they handed over.</li>
        <li><strong>Deposit taken</strong> is money already in the till.</li>
        <li><strong>Payment</strong> is the state: unpaid, half, some other amount, or paid.</li>
      </ul>
      <p>If the <strong>price</strong> later changes, whichever discount box you typed in last
        is the one that holds: type "10%" and the dollars move with the price; type "$10" and
        the percentage moves instead.</p>
      <p>The rose line on the card is what is still owing. Cents are always shown — nothing is
        rounded anywhere in this app.</p>`,
  },
  {
    title: 'Looking a customer up',
    sub: 'More › Customers › Directory',
    roles: COUNTER,
    tour: 'customers',
    body: `
      <p>"I ordered here last month" now has an answer. Tap <strong>More</strong>, then
        <strong>Directory</strong>, and search by name or phone.</p>
      <p>Each person shows how many cakes they have had, what they have spent, and when they
        last ordered. Tap them to see every order. The sort bar reorders the whole list — most
        recent, biggest spender, or who has gone quiet.</p>
      <p>Staff see the customers of their own shop only.</p>`,
  },
  {
    title: 'The numbers',
    sub: 'More › Analytics',
    roles: ['admin'],
    tour: 'analytics',
    body: `
      <p>Three pages behind <strong>More</strong>, all off one load of the last 63 days:</p>
      <ul class="help-list">
        <li><strong>Finance</strong> — takings, the week ahead, margin, discounts given, money
          still to collect, cancellations, how people buy, and anything sold under list price.</li>
        <li><strong>Customers</strong> — repeat rate, leaderboards, how far ahead people book,
          and orders with no phone number.</li>
        <li><strong>Data</strong> — the two shops side by side, what sells, busiest days and
          pickup times, who logged what, photos due to be purged, and what has been deleted.</li>
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
    tour: 'export',
    body: `
      <p>Pick a month or a financial year and tap <strong>Download CSV</strong>. One row per
        order, by the date it was taken, including cost — so treat the file the way you treat
        the books.</p>`,
  },
  {
    title: 'Staff and sign-ins',
    sub: 'More › Staff',
    roles: ['admin'],
    tour: 'staff',
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

const showMe = (key, role) => {
  const t = tourFor(key, role);
  return t ? `<button class="btn btn-outline help-run" type="button" data-tour="${esc(key)}">
      <span class="help-run-ico">${PLAY}</span>Show me on the real screen</button>` : '';
};

/** The help page. `me.role` decides which sections exist at all. */
export function helpHtml(me) {
  const sections = forRole(me.role);
  const walks = Object.entries(TOURS).filter(([, t]) => t.roles.includes(me.role));
  return `
    <div class="panel help-top">
      <p class="help-hello">
        You are signed in as <strong>${esc(me.name)}</strong>, and your role is
        <strong>${esc(me.role)}</strong>. Everything on this page is something you can
        actually do — there is nothing here you will go looking for and not find.
      </p>
    </div>

    <div class="panel">
      <div class="panel-title">Walk me through a job</div>
      <div class="panel-note">Each one opens the real screen and points at the real buttons.
        Nothing is saved unless you save it.</div>
      ${walks.map(([key, t]) => `
        <button class="walk" type="button" data-tour="${esc(key)}">
          <span class="walk-ico">${PLAY}</span>
          <span class="walk-lines">
            <span class="walk-name">${esc(t.label)}</span>
            <span class="walk-note">${esc(t.note)}</span>
          </span>
          <span class="walk-chev">${CHEV}</span>
        </button>`).join('')}
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
        <div class="collapse-body help-body">${s.body}${showMe(s.tour, me.role)}</div>
      </details>`).join('')}

    <p class="panel-foot help-foot">
      ${sections.length} section${sections.length === 1 ? '' : 's'} and
      ${walks.length} walkthrough${walks.length === 1 ? '' : 's'} · written for the counter,
      not for a manual. A walkthrough only shows the steps that are on your screen,
      so it is shorter on a quiet day.
    </p>`;
}

// ── Running a walkthrough ───────────────────────────────────────────────────

/** On screen and not inside something hidden. */
function target(sel) {
  if (!sel) return null;
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? el : null;
}

const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

let running = false;

/**
 * Runs one walkthrough over the real screen.
 *
 * `prepare` is the app's half: it switches tab and opens the sheet the tour
 * needs, and returns a string instead of true when it cannot — an empty order
 * book has nothing to point at, and saying so beats a tour that silently
 * collapses to one step. `onDone` fires once, finished or skipped.
 */
export async function startTour(key, { role, prepare = async () => true, onDone = () => {} } = {}) {
  if (running) return;
  const tour = TOURS[key];
  if (!tour) return;

  const ready = await prepare(tour);
  if (ready !== true) { onDone(ready); return; }

  // Unhide the parts of a form that only appear once something is chosen, so
  // the steps that point into them have a target when they are filtered below.
  // Only when it is not already on: these are toggles, and clicking the print
  // kind the board was already showing turned it *off* and hid both briefs.
  for (const sel of tour.reveal || []) {
    const el = document.querySelector(sel);
    if (el && el.getAttribute('aria-pressed') !== 'true') el.click();
  }
  await frame();

  const steps = tourSteps(key, role).filter((s) => !s.sel || target(s.sel));
  if (!steps.length) { onDone('There is nothing on this screen to walk through yet.'); return; }
  running = true;

  let i = 0;
  const root = document.createElement('div');
  root.className = 'tour';
  root.innerHTML = `
    <div class="tour-hole"></div>
    <div class="tour-card" role="dialog" aria-modal="true" aria-label="${esc(tour.label)}">
      <div class="tour-head">
        <span class="tour-step"></span>
        <button class="tour-x" type="button" aria-label="Close the walkthrough">&#10005;</button>
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
    document.removeEventListener('keydown', onKey, true);
    onDone();
  };

  function place() {
    const el = target(steps[i].sel);
    const pad = 6;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!el) {
      // A closing step has nothing to point at: dim everything, centre the card.
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

  /**
   * Most of these tours point into a sheet taller than the phone, so the target
   * has to be brought into view before it can be measured — otherwise the
   * cut-out lands on a field that is scrolled off the screen. Only when it is
   * actually out of view: scrolling a button that is already visible moves the
   * page under the reader for no reason.
   */
  async function paint() {
    const step = steps[i];
    root.querySelector('.tour-step').textContent = `${i + 1} of ${steps.length}`;
    root.querySelector('.tour-title').textContent = step.title;
    root.querySelector('.tour-text').textContent = step.text;
    back.hidden = i === 0;
    next.textContent = i === steps.length - 1 ? 'Done' : 'Next';

    const el = target(step.sel);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.top < 8 || r.bottom > window.innerHeight - 8) {
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        await frame();
      }
    }
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
  // Capture, so Escape closes the walkthrough without also closing what is under it.
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
