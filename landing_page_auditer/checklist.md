# Audit Checklist — Enquiry-Funnel Landing Pages (Num Num's default lens)

This is the audit engine. Each check is pass/fail, carries a severity, and is
tagged with how a fix should be delivered: **[COPY]** = node-level text swap
safe for Claude Code, **[STRUCT]** = layout/element change needing deliberate
handling, **[OPS]** = off-page, not gradable from the page itself (report
separately, never as a page verdict).

Severity meaning:
- **CRITICAL** — directly blocks or kills the enquiry. Fix first.
- **HIGH** — materially suppresses enquiries.
- **MEDIUM** — meaningful but secondary.

The conversion on this page is an **enquiry** (a sent WhatsApp message / placed
call to start a custom order), **not a checkout**. Grade everything against
that. Do not recommend carts, "buy now" buttons, or checkout flows — custom
orders run through WhatsApp/phone with ~48h notice and must never be routed to
Uber Eats / Menulog / DoorDash (those are ready-made only).

---

## Layer 1 — Offer & Value

**1.1 Eggless USP leads, above the fold** — CRITICAL — [COPY]
The headline or subhead states "100% eggless" and what the business does, visible
without scrolling. This is the single reason the target customer is on the page;
if it's buried or absent, the page fails its primary job.
Source confidence: 9/10 (NN/g clarity research).

**1.2 Dream outcome in customer terms** — HIGH — [COPY]
Copy describes the customer's outcome (a beautiful cake the whole family can eat,
a stress-free celebration) — not just features/ingredients.
Confidence: 7/10 (Hormozi value equation; emotional targeting).

**1.3 Eggless claim substantiated** — CRITICAL — [COPY] or [STRUCT]
The "100% eggless" claim is backed by at least one proof element (explanation of
the eggless kitchen, FAQ on no egg products, reviews mentioning it). A bare claim
creates anxiety on a sight-unseen $70–$300+ order. Adding proof text = COPY;
adding a new proof section/element = STRUCT.
Confidence: 9/10.

**1.4 Both locations + service area clear** — HIGH — [COPY]
Harris Park and Riverstone are both named, with service/delivery area. Local
relevance drives the decision; vague coverage causes drop-off.
NB: teal #4EC4D8 is Riverstone-only branding — flag misuse if seen.
Confidence: 9/10.

**1.5 Enquiry framed as low-risk** — HIGH — [COPY]
The enquiry reads as easy and no-obligation (e.g. "Send your date + design for a
free quote — no obligation"). Lowers perceived risk of reaching out.
Avoid percentage-off discount language; use value-add framing.
Confidence: 6/10 (local-service convention — weaker evidence, still sound).

**1.6 Lead time / response expectation stated** — MEDIUM — [COPY]
The page sets expectations: custom orders need ~48h notice; a rough reply time
("we usually reply within the hour during opening hours"). Reduces uncertainty.
Confidence: 7/10.

---

## Layer 2 — Conversion Copywriting

**2.1 Problem-led, not slogan-led** — HIGH — [COPY]
Early copy names the visitor's actual problem (finding genuinely eggless cakes
that still taste good / are safe for the occasion) before pitching, rather than
opening with "Welcome" or an About story.
Confidence: 7/10 (PAS is convention; problem-salience is well-grounded).

**2.2 Voice-of-customer language** — HIGH — [COPY]
Headlines/subheads/testimonials use real customer phrasing (e.g. "so moist you
won't miss the eggs," "everyone could finally eat the cake"), not internal jargon.
Confidence: 8/10 (Copyhackers documented lifts).

**2.3 Concrete benefits, not vague adjectives** — HIGH — [COPY]
Benefits are specific ("moist texture without egg," "no egg in the kitchen at
all") rather than "delicious" / "amazing." Specificity reads as credible.
Confidence: 9/10.

**2.4 Objections handled in-flow** — HIGH — [COPY]
At least 3–5 real objections are addressed near where they arise: is it truly
eggless, can you match a reference photo, how much notice, do you deliver here,
vegetarian/halal-friendly. Not dumped in a far-off FAQ.
Confidence: 8/10 (CXL/MECLABS case studies).

**2.5 FAQ written as real questions** — MEDIUM — [COPY]
FAQ entries are phrased as the customer would ask ("Do you use any egg products?")
not as internal categories ("Our Philosophy").
Confidence: 7/10.

**2.6 Page sequence: motivation → value → proof → CTA** — HIGH — [STRUCT]
The page roughly follows need/value → proof → enquiry, instead of leading with
biography. Reordering sections is structural.
Confidence: 8/10 (MECLABS conversion sequence).

> Cut from source report: standalone "4 U's headline" check (5/10, unvalidated
> as a bundle). Its useful parts — specific + benefit-led — live in 1.1 and 2.3.

---

## Layer 3 — Page Structure & UX

**3.1 One dominant primary CTA** — HIGH — [STRUCT]
The page has a single clearly dominant action (start a WhatsApp/phone enquiry).
No competing primary CTAs fighting it for attention.
Confidence: 7/10 (attention-ratio heuristic; choice-overload research).

**3.2 Primary CTA above the fold** — HIGH — [STRUCT]
On mobile and desktop, the enquiry CTA is visible without scrolling. If the only
CTA is below the fold, fail.
Confidence: 8/10.

**3.3 Lean navigation, no distractions from enquiry** — MEDIUM — [STRUCT]
Nav is simple and doesn't introduce competing primary actions.
NB: this is a full brand/homepage site (gallery, two locations, ordering info) —
do NOT strip navigation as if it were a single-purpose ad landing page. The
source report's "remove top nav" advice assumes a campaign page and is wrong
here. Reframe: keep nav lean, keep one *primary* CTA dominant.
Confidence: 7/10 (reframed).

**3.4 Business info + contact visible** — HIGH — [COPY]
Business name, both locations, and phone are easily findable (header/footer).
Drives legitimacy.
Confidence: 9/10.

**3.5 Authentic, non-stock imagery** — HIGH — [STRUCT]
Photos are real cakes/team, not generic stock. The bakery has 500–1000 real
custom cake photos — there's no excuse for stock. Swapping images is structural.
Never show supplier names in imagery or copy.
Confidence: 9/10.

**3.6 Social proof near the CTA and hero** — HIGH — [STRUCT]
Reviews/ratings/testimonials sit close to the main CTA and hero, not only at the
bottom. Reassurance at the decision moment.
Confidence: 9/10.

**3.7 Enquiry path is short and essential-only** — HIGH — [COPY] or [STRUCT]
If a form exists, it asks only what's needed to reply (name, contact, date, basic
brief). If the path is WhatsApp/phone, even better — fewer steps. Trimming copy =
COPY; removing fields = STRUCT.
Confidence: 9/10 (Baymard form research).

**3.8 WhatsApp click-to-chat, prominent, prefilled** — CRITICAL — [STRUCT]
A prominent click-to-WhatsApp action opens a chat directly (no instruction-only
step), ideally with a prefilled message ("Hi, I'd like a quote for a 100% eggless
cake on [date]"). This IS the conversion mechanism — if it's weak, nothing else
matters. Number: +61 470 530 371.
Confidence: 7/10 (click-to-chat practitioner data).

**3.9 Mobile tap targets + responsive layout** — HIGH — [STRUCT]
CTAs/fields are easily tappable; no horizontal scroll or pinch-zoom needed. Most
local enquiries are mobile.
Confidence: 9/10.

**3.10 Page speed — LCP under ~2.5s on mobile** — HIGH — [OPS/STRUCT]
Hero/headline/CTA paint quickly; images compressed and in modern formats; no
render-blocking scripts. Measure with PageSpeed Insights — flag as something to
verify, since it's only partly visible from markup alone.
Confidence: 9/10.

**3.11 Low visual/cognitive clutter** — MEDIUM — [STRUCT]
Coherent palette, clear hierarchy, no dense text walls or distracting carousels.
Confidence: 8/10.

---

## Layer 4 — Persuasion & Trust

**4.1 Testimonials with identifiers** — HIGH — [COPY] or [STRUCT]
Reviews carry at least a first name + context ("Priya — daughter's 5th birthday")
and ideally a photo. Specific beats anonymous. Editing text = COPY; adding a
testimonial block = STRUCT.
Confidence: 9/10.

**4.2 Community / identity signalling** — HIGH — [COPY]
Copy and imagery respectfully acknowledge the target communities (South Asian,
Muslim, vegetarian families) — eggless is what lets everyone eat — without
stereotyping. Shared identity builds trust.
Confidence: 8/10 (Cialdini unity; emotional targeting).

**4.3 Authority / experience signals** — MEDIUM — [COPY]
Mentions trading since 2017, two Sydney stores, volume of celebrations served.
Reassures on reliability.
Confidence: 8/10.

**4.4 Honest scarcity (only if true)** — MEDIUM — [COPY]
If real, state capacity limits ("limited custom slots each week" — backed by the
genuine single-chef ceiling). Never fake countdowns; fabricated urgency erodes
trust.
Confidence: 8/10.

**4.5 Emotional resonance — occasion over product** — MEDIUM — [COPY]
Copy/visuals lead with the occasion and the person (inclusion, joy, relief from
worry), not just the cake. Matches the "emotion over product" principle.
Confidence: 7/10.

**4.6 Up-front policy disclosure** — MEDIUM — [COPY]
Lead time, deposit, and any cancellation terms stated plainly. Up-front honesty
builds trust and pre-empts anxiety.
Confidence: 9/10.

**4.7 Current content** — MEDIUM — [OPS]
Gallery reflects recent work; no stale promos or years-old events. Mostly an
upkeep check, not a one-time page property.
Confidence: 9/10.

**4.8 Connectedness to live profiles** — MEDIUM — [COPY/STRUCT]
Links to active Instagram and a live Google Business Profile with recent reviews.
Proves the business is real and active.
Confidence: 9/10.

---

## Layer 5 — Measurement (page-inspectable only)

**5.1 Enquiry events tracked** — MEDIUM — [STRUCT/OPS]
The page fires analytics on the things that matter: WhatsApp clicks, tap-to-call,
form submits. Partly visible in markup (event handlers / GTM), partly setup. Flag
WhatsApp-click tracking specifically — it's a known open item in GA4.
Confidence: 7/10.

---

## Ops hygiene appendix — report, do NOT grade as page checks

These came from the source report's testing layer but are **off-page** — a page
audit cannot see them. Mention them once as a reminder; never present a pass/fail
page verdict on them, because claiming to grade what you can't see is exactly the
analysis error to avoid.

- Heatmap / session-recording tool installed and reviewed (Microsoft Clarity /
  Hotjar) — reveals friction numbers miss.
- Lead log connecting enquiries → closed orders — protects against optimising for
  low-quality leads.
- ICE (Impact/Confidence/Ease) used to prioritise changes (heuristic, 6/10
  evidence — useful, not gospel).
- No underpowered A/B tests. This site's traffic is too low for statistically
  valid testing, so this whole audit is **heuristic by design**: apply known
  rules and prioritise by likely impact, don't claim test-proven wins from a
  handful of enquiries.
- Re-run this audit on a regular cadence (e.g. quarterly) as copy and gallery
  change.
