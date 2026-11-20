# Phone assistant rules (`phone-agent/`)

Loaded when working in `phone-agent/` (and imported from `netlify/CLAUDE.md`
for `phone-agent.mjs` / `phone.mjs`). Site-wide rules are in the root
`CLAUDE.md`; status is in `context/00-context.md`.

## Phone assistant (`phone-agent/`) — built, not live

`phone-agent/prompt.md` is the system prompt for an AI voice agent answering
the shop line (a new Twilio number, not yet bought). Its prices, flavours, hours and addresses are
copied from `ops/catalog.mjs` and `locations.html`, so **a price, flavour or
hours change must be made in that prompt too, and re-sent to the ElevenLabs
agent** (the file is not read by ElevenLabs; the agent holds its own copy).
Nothing gates it yet.
- **ElevenLabs agent `agent_6601m6t68y1jfazb59p3d30maf49`** (2026-11-07):
  timezone `Australia/Sydney` (that is how it knows today's date), patient
  turn-taking, 30-day retention with recordings on (shortest that still lets
  staff review a mistake; default was 2 years), max 3 concurrent / 60 calls a
  day / **bursting off** (bursting bills double), parallel tool calls **off**
  (with them on, `log_call` and the transfer fired together and the log could
  lose the race). Warm (conference) transfer to +61425697725. Voice is a
  placeholder until Vaidik picks one.
- **The three tools are one v2 function**, `netlify/functions/phone-agent.mjs`
  `?tool=order_status|log_request|log_call`, called at its function path (no
  `netlify.toml` route, like receipt). Rules live in `netlify/lib/phone.mjs`,
  gated by `tests/phone.test.mjs` from `verify-blog.mjs`.
  - **Every request needs header `x-phone-agent-secret` = `PHONE_AGENT_SECRET`**
    (public-site env var). Unset refuses everything, by design.
  - `caller_id` and `conversation_id` are filled by ElevenLabs from
    `system__caller_id` / `system__conversation_id`, never by the model, so the
    rate limit keys on something a caller cannot talk around.
  - **`order_status` answers status, shop, date and time and nothing else**,
    only when the first word of `customer_name` matches. A wrong name, wrong
    number and a rate-limited caller get the **identical** answer. Limit: 3
    misses per caller per hour, 60 lookups an hour across the line, counted in
    `phone_lookups` (service role only). An unlogged lookup is an unlimited
    one, so a failed insert fails the lookup.
  - **`log_request` enforces the custom-cake rule itself** (`pickupProblem`:
    `earliestDueDay` + `COLLECTION`), instead of trusting the model with date
    arithmetic, and returns a `problem` without logging. A change is forced
    urgent when it is a cancellation or the order is due within 24h.
  - **A connected transfer ends the agent's part of the call**, so the prompt
    logs *before* transferring, and logs as soon as a callback is agreed
    (callers hang up first; test NN03 caught it). ElevenLabs documents no ring
    timeout and no return-to-agent on an unanswered transfer.
- **Call notes**: `phone_notes` (admin read only; RLS checked as admin, staff,
  baker, customer and anon, section 6 of `verify-rls.sql`), plus an email to
  info.numnumsbakery@gmail.com through `email-shell.mjs` (transactional, no
  unsubscribe) and a **push to admins only** (`notifyStaff` gained a `roles`
  option), because Gmail is read every 2-3 days. Lock screen: first name, shop
  and kind only. A resolved call is stored but not notified; a call that
  already produced a brief/change does not notify twice. An ops view of the
  notes is not built.
- **Twilio (or any best provider) is allowed for the voice line; SMS is not
  wanted** (Vaidik, 2026-11-07, correcting an earlier "no Twilio"). **Two
  numbers in total for both shops, never one per shop:** 0425 697 725 is
  the owner's own mobile and the WhatsApp number (transfers ring it), and a
  new Twilio number becomes the public line the assistant answers.
  **0425 697 725 must never be forwarded to the assistant:** it is also the
  transfer destination, so that would loop the call.
- **Calls only, no SMS** (Vaidik, 2026-11-07). At ~4.3
  orders/day (30 days to 2026-11-07) plus 5–10 other calls, a text sender
  is not worth running. Custom-cake callers are told staff will message
  them on WhatsApp; staff work from the call note. Do not add a
  `send_whatsapp_link` tool back without asking.
- **Transfers ring one person (the owner), for both shops** — no new transfer number needed.
- **Transfers are rare: the owner's mobile is also his work phone.** Live
  transfer only for an upset caller, someone insisting on a person, or an
  allergy question. Everything else is a logged callback, and an unanswered
  transfer falls back to a callback after ~25 seconds (2026-11-07).
- **No stock lookups**: nothing records stock, so "cake today or
  tomorrow" calls go to a person. Don't invent a `check_stock` answer.
- **Alternatives to ElevenLabs researched 2026-11-07 and not adopted** (Vaidik asked
  for cheaper with great Indian voices). Vapi ($0.05/min hosting + STT/LLM/TTS/telephony
  at cost, realistic all-in $0.13-0.22), Retell ($0.07-0.31, own-Twilio no extra fee),
  Bolna (India-focused, $0.04-0.10 claimed, telephony via Exotel, prices unconfirmed) and
  Sarvam Bulbul (Indian TTS, ~INR 3/1k chars, no documented Indian-*English*/Australian
  accent) were checked. Retell's own docs say ElevenLabs handles niche accents best, and
  at ~600-1,200 min/month the saving is tens of dollars while a move costs the built
  agent, tests and native Twilio warm transfer. Sources were mostly vendor blogs; revisit
  only if the bill actually hurts or the voice shortlist fails by ear.
- Order status uses the real `order_status` enum (placed, baked, arrived,
  picked_up, cancelled). There is no "ready".
- `privacy-policy.html` describes the assistant (§1 Phone calls, §5) and
  names ElevenLabs. If the provider changes, change that page.
