# Build brief: Num Num's Bakery phone assistant

You are building an AI voice agent that answers the bakery's phone. Read `CLAUDE.md` first (the whole project rulebook applies, especially "Phone assistant", the v1/v2 Netlify function rules, "Verify Before Deciding", and "Log Everything"). Then read `phone-agent/prompt.md`: it is the agent's system prompt and is already written. Do not rewrite its content; change it only where a tool you build behaves differently from what it says, and say what you changed.

Pull from GitHub before editing. Commit and push code edits when done (per CLAUDE.md).

## Decisions already made (do not re-open)
- Platform: **ElevenLabs Agents**. The ElevenLabs MCP tools (`agents_*`) are connected in this session.
- Telephony: **Twilio**, imported natively into ElevenLabs (warm transfer needs the native import).
- **Two numbers in total for both shops, not one each.** A new Twilio number is the public line the assistant answers. **0425 697 725 is the owner's own mobile and the WhatsApp number: transfers ring it, and it must NEVER be forwarded to the assistant (loop).**
- **No SMS.** No `send_whatsapp_link`, no text sending. Custom-cake callers are told staff will WhatsApp them.
- **No stock lookups.** Nothing records stock; there is no `check_stock` tool.
- Transfers are rare (severe or unusual cases only), because the owner's phone is also his work phone. Everything else is a logged callback. An unanswered transfer (~25s), busy line or after-hours falls back to a callback.
- Volume is about 9 to 14 calls a day. Do not over-engineer.

## Tools the agent needs
1. **`order_status`**: webhook tool. Input: order number (HP-1234 / RV-1234) or phone, plus the caller's first name. Returns ONLY status (placed / baked / arrived / picked_up / cancelled), pickup shop, pickup date and time. Nothing else, ever: no prices, no payments, no other orders, no surname or contact details. A first-name mismatch or no match returns the same generic "not found" answer. Add basic rate limiting, because this is an unauthenticated public endpoint reading customer data.
2. **`log_request`**: webhook tool. `type` is `change` or `custom_cake`, with a `priority` of normal or urgent. Custom-cake fields: first name, mobile, shop, pickup date and time, occasion, size or serving count, flavour, wording, design idea, allergies or dietary needs, has reference photos, on WhatsApp (true/false).
3. **`log_call`**: webhook tool, called at the end of every call: caller name, phone, shop, call type, 1 to 2 line summary, outcome (resolved / callback needed / transferred), urgency.
4. ElevenLabs system tools: **transfer to number** (0425 697 725, conditions as in the HANDOFF section of the prompt, warm transfer, ~25s timeout and fallback) and **end call**.

## Backend (this repo)
- Webhook endpoints are **Netlify v2 functions** in `netlify/functions/` returning a `Response` (never the v1 `{statusCode, body}` shape: that is a silent 502). Routes in `netlify.toml` only, not a `config.path` export. Tests in `tests/`, shared helpers in `netlify/lib/`. Add the new handlers to `tests/response-shape.test.mjs`. Run `node verify-blog.mjs` before pushing: it is the deploy gate.
- Authenticate every webhook with a shared-secret header that ElevenLabs sends. Reject anything without it.
- Read `ops/db.mjs`, `ops/supabase/` and `netlify/functions/order-status.mjs` before touching Supabase: reuse the existing service-role pattern and the real `orders` columns and `order_status` enum. Do not invent columns.
- Call notes (`log_request`, `log_call`) need a home staff will actually read. Propose the smallest option (a Supabase table with RLS on, readable by admins only, plus an email to `info.numnumsbakery@gmail.com` through `netlify/lib/email-shell.mjs`; a view in the ops app can come later) and build that one. RLS must be verified the way CLAUDE.md describes, not by looking.
- Supabase project `stnmoxsojqbbtgjwkzrc`. Never put a service-role key in a file.

## ElevenLabs agent
- Create the agent with the prompt from `phone-agent/prompt.md` and the opening line it specifies (it includes the "calls may be recorded" notice, which is a legal requirement, so keep it).
- Pick an Australian-accented, warm, calm voice. Say which you picked.
- Turn-taking tuned for phone calls: short turns, interruption allowed, a sensible silence timeout.
- Check ElevenLabs' data retention and recording settings and set them to the shortest that still lets staff review mistakes. `privacy-policy.html` already says recordings are kept only as long as needed.
- Before choosing anything expensive or hard to reverse (voice plan, concurrency, telephony setup), check current ElevenLabs and Twilio pricing and docs online; do not answer from memory.

## Test before declaring done
Use ElevenLabs agent tests or simulated conversations for at least: a flavour/price question; an order status check with the right name and with a wrong name; a custom-cake brief (including a pickup under 2 days away, and a time outside that shop's hours); a change request inside 24 hours; an allergy question (must not give any allergen guarantee, must go to transfer, then fall back to a callback); an upset caller; a request for a flavour we don't make; a request for card details; a caller asking "are you a real person". Report what passed and what didn't, honestly.

## Things only Vaidik can do (ask, don't attempt)
- Buy the Twilio number (it needs an approved Australian regulatory bundle: business name, address, ABN; GNT Ventures Pty Ltd, ABN 39 634 402 412).
- Set secrets: you can read but never write Netlify env vars, and ElevenLabs/Twilio credentials must not go in any file or chat. Give him the exact variable names.
- Switch the website and Google profiles from 0425 697 725 to the new number once it is live. Do not do this yourself before the agent is tested.
- Approve going live. Do not point any real phone number at the agent without his OK.

## Finish by logging
Update the "Phone assistant" section of `CLAUDE.md` and the AI Brain note `/Users/vaidikpatel/Downloads/Home/My AI Brain/companies/Num Nums Bakery/Phone Assistant.md` (outcomes, decisions, open questions) in the same response. Say plainly what is built, what is verified, and what is still waiting on Vaidik.
