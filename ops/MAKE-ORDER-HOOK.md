# The web-order Make.com scenario

What `netlify/functions/stripe-webhook.mjs` sends to `MAKE_ORDER_HOOK_URL` every
time a web order is paid, and what to build in Make so it actually goes
somewhere. This is not written yet — the webhook mints the coupon and sends
this payload; nothing downstream reads it until you build the scenario below.

## 1. Create the scenario

Make → Create a new scenario → search **Webhooks** → **Custom webhook** → **Add**
→ name it (e.g. `Num Nums — web order`) → copy the URL it gives you.

That URL is `MAKE_ORDER_HOOK_URL` — put it in Netlify's env vars for the
**public** site (never the ops site), alongside the Stripe and Supabase keys.
It's the same pattern `submit-review.js` already uses for review submissions,
just a different webhook.

## 2. The exact payload

One POST, JSON, sent once per paid order (not once per cake — a 3-cake cart
is still one call):

```json
{
  "kind": "web-order",
  "store": "harris-park",
  "due_at": "2026-09-20T04:00:00.000Z",
  "name": "Priya Sharma",
  "phone": "0412345678",
  "email": "priya@example.com",
  "cakes": 2,
  "order_nos": ["HP-1842", "HP-1843"],
  "total": 229.98,
  "coupon_code": "NN-A1B2C3",
  "coupon_expires_at": "2026-12-11T09:20:00.000Z"
}
```

Notes on the fields:

- **`due_at`** is UTC ISO — format it to Sydney local in Make before showing it
  to anyone (`due_at` formatted with timezone `Australia/Sydney`), or a
  midnight order reads an hour wrong depending on the DST flip.
- **`phone`** is `""` if the customer left it blank — it's optional. Don't
  send an SMS module a blank string.
- **`coupon_code`** and **`coupon_expires_at`** are `null` if we somehow have
  no email for the customer (shouldn't happen — Stripe Checkout always
  collects one), or if the coupon insert failed. **Route on this being
  non-null before sending the coupon email**, not on `kind` — a null coupon
  with a webhook retry is a real state.
- There is no `line_items` breakdown (size/flavour per cake) in this payload —
  it only carries the count and the total. If you want per-cake detail in the
  notification, that's a small addition to the webhook, not something to fake
  in Make.

## 3. Two routes off one trigger

Add a **Router** after the webhook module, two routes:

### Route A — staff notification (always fires)

Whatever the shop already uses for the two WhatsApp groups or a Slack/email
alert. Suggested text:

> 🎂 New web order — {{cakes}} cake(s), {{formatDate(due_at; "ddd D MMM, h:mma"; "Australia/Sydney")}}
> {{store}} · {{name}} · {{phone}}
> {{order_nos}} · ${{total}}

### Route B — customer coupon email (filter: `coupon_code` is not empty)

Add a filter on this route: **coupon_code — Text operators — Exists**.

Then an **Email** module (or whatever ESP the shop already sends transactional
mail through) to `{{email}}`. Suggested copy, matching the tone already used in
`shop-app/components/ui/sign-up-panel.tsx` and `promo.js`:

> **Subject:** Your 10% off is ready, {{name}}
>
> Thanks for your order! Your cakes are booked in for
> {{formatDate(due_at; "dddd D MMMM, h:mma"; "Australia/Sydney")}} at {{store}}.
>
> Here's 10% off your next one:
>
> **{{coupon_code}}**
>
> Use it at checkout before {{formatDate(coupon_expires_at; "D MMMM YYYY"; "Australia/Sydney")}}.

Do **not** promise the coupon in the *first* email if the customer already
had an account before this order (their sign-up email already promised one) —
that's a separate concern from this scenario and not something Make can
distinguish from this payload alone.

## 4. What this scenario must NOT do

- **Never call back into the shop's Supabase project to write anything.** The
  webhook already wrote the `coupons` row; Make only reads fields off this
  payload and sends messages. Two writers touching `coupons` is exactly the
  kind of race the code was written to avoid.
- **Don't retry-send on every Stripe webhook retry.** Stripe retries a
  `500` for three days; the webhook code already treats a duplicate insert as
  a no-op (`23505`) and returns `already recorded` before it would fire this
  hook again for the same session — so a normal retry doesn't reach Make
  twice. If a scenario run *does* somehow fire twice for the same
  `order_nos`, that's the one case Make can dedupe on: keep a `data store`
  keyed by the first `order_nos[0]` if this ever turns out to matter in
  practice.

## 5. Testing before going live

Use Stripe **test mode** + `stripe listen --forward-to
localhost:8888/.netlify/functions/stripe-webhook` (see the shop's testing
notes in `CLAUDE.md`), place one test cart through, and confirm:

1. The webhook fires the Make scenario exactly once.
2. Route A's staff message shows the right store, date and total.
3. Route B only fires when `coupon_code` is present, and the email arrives
   with a working, correctly-cased code.
4. The code in the email actually redeems at checkout — round-trip it through
   `shop-app`'s coupon field on `/checkout` once.

Never test against the **live** Supabase project or the real WhatsApp/Slack
channel — a test order becomes a coupon a real customer could accidentally
receive if the email step points at production data.
