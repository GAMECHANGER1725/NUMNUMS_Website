---
name: landing-page-audit
description: Audit a landing page or website for conversion, using evidence-based CRO frameworks (NN/g, Baymard, MECLABS, Copyhackers, Cialdini, Hormozi) tuned for an ENQUIRY funnel — where the goal is a WhatsApp/phone enquiry, not a checkout. Defaults to the Num Num's Bakery context (100% eggless custom cakes, Harris Park + Riverstone). Use this whenever the user wants a page reviewed, critiqued, "looked at," scored, or improved for conversions/CRO — including phrasings like "is this page good," "why isn't this converting," "audit my homepage," "review the website," "what should I fix on this page," or when they paste page copy, HTML, a URL, or a screenshot and ask for feedback. Use it even if they don't say the words "CRO" or "audit."
---

# Landing Page Audit (Enquiry Funnel)

## What this skill does

It runs a structured, heuristic audit of a landing/web page against a fixed
checklist of evidence-based conversion principles, then returns a **prioritised
fix-list** split into two buckets: copy swaps (safe text-only edits) and
structural fixes (layout/element changes). It does NOT rewrite the whole page or
invent a redesign — it diagnoses, prioritises, and hands the user precise,
actionable fixes.

## The one thing that makes this audit different

The conversion on these pages is an **enquiry** — a sent WhatsApp message or a
placed call that *starts* a custom order — **not a purchase**. There is no cart,
no checkout. Custom orders need ~48h notice and run through WhatsApp/phone; they
must never be routed through Uber Eats / Menulog / DoorDash (those carry
ready-made items only).

This changes what you grade for. Weight **trust, proof, and enquiry friction**
heavily. **Down-rank or ignore** anything from generic CRO that assumes a
checkout: "add a buy button," cart optimisation, payment-funnel advice. If you
catch yourself recommending an e-commerce checkout pattern, stop — it fights the
funnel.

Traffic is low, so this is a **heuristic audit by design**: apply known rules and
prioritise by likely impact. Do not recommend A/B tests as the path to truth —
the page can't generate statistically valid results, and treating a handful of
enquiries as a "win" is the exact analysis error to avoid.

## Business context (default lens — Num Num's Bakery)

Apply this automatically unless the user says they're auditing a different
business. These are also hard brand rules for any copy you suggest:

- **"100% eggless" is THE primary differentiator** — it must lead in the hero,
  copy, and CTAs. It's the reason the target customer (South Asian, Muslim,
  vegetarian families) is on the page.
- Two Sydney stores: **Harris Park** and **Riverstone**. WhatsApp: **+61 425 697 725** (0425 697 725).
- **Never** use the term "Adult Cakes" anywhere.
- **Teal #4EC4D8 is Riverstone-only** — flag it if used elsewhere.
- **Never** show supplier names in copy or imagery.
- **Avoid percentage-off discount language** — use value-add framing instead.
- Lead with the **occasion and the person**, not the cake (emotion over product).

If auditing a different business, ask once for its USP, conversion action, and
locations, then proceed with the same checklist.

## How to run the audit

1. **Get the page.** Work from whatever the user provides: a URL (fetch it),
   pasted HTML, pasted copy, or a screenshot. If you have only a screenshot you
   can still audit content/trust/hierarchy but say you can't verify markup-level
   items (speed, tracking, tap targets) and mark them "not verifiable from a
   screenshot."

2. **Read the checklist.** Open `references/checklist.md` — it's the audit
   engine. Every finding must map to a numbered check in it. Do not freestyle
   findings that aren't grounded in a check; if you spot something genuinely new,
   say so explicitly and reason from first principles rather than implying it's
   from the framework.

3. **Walk all five layers** (Offer & Value, Copywriting, Structure & UX,
   Persuasion & Trust, Measurement). For each check, decide pass / fail / not
   applicable / not verifiable. Be ruthless — a check only passes if the page
   clearly meets it. "Sort of" is a fail with a note.

4. **Classify every fail** into the right output bucket using the check's tag:
   - **[COPY]** → a node-level text swap. Safe for Claude Code to apply
     *text-only*, without touching HTML structure, classes, or attributes.
     For these you MUST give the exact drop-in replacement string.
   - **[STRUCT]** → a layout/element/ordering change. Higher-risk; the user
     handles it deliberately. Describe the change; do not pretend it's a safe
     text swap.
   - **[OPS]** → off-page (tracking setup, heatmaps, gallery upkeep). Mention in
     the ops note; never present as a graded page verdict.

5. **Prioritise.** Sort the whole fix-list by severity (CRITICAL → HIGH →
   MEDIUM), highest-leverage first, so line one is the most important fix.

## Output format — ALWAYS use this structure

```
## Verdict
[2–4 sentences: the single biggest thing helping or hurting enquiries, stated
plainly. No hedging.]

## Checks passed: X / Y per layer
Offer & Value: X/6   Copywriting: X/6   Structure & UX: X/11
Persuasion & Trust: X/8   Measurement: X/1
[Honest count of inspectable checks only. This is the only "score" — no /100,
because a heuristic audit can't support that precision.]

## Fix list — do these in order

### 🔴 CRITICAL
[Each finding:]
- **[check ref] Short title** — what's wrong and why it suppresses enquiries (1–2 sentences).
  - **Bucket:** COPY swap  /  STRUCTURAL  /  OPS
  - **For COPY swaps — exact replacement (text only, do not alter the element):**
    > "[exact drop-in string]"
  - **Why (brief for Claude Code):** [the one-line strategic reason]
  - **For STRUCTURAL — the change:** [what to move/add/reorder; flagged as needing deliberate handling, not a text swap]

### 🟠 HIGH
[same structure]

### 🟡 MEDIUM
[same structure]

## Ops note (not graded from the page)
[1–3 lines on tracking / measurement / upkeep items that can't be judged from the
page itself — e.g. WhatsApp-click tracking in GA4, page-speed check via PageSpeed
Insights, gallery freshness.]
```

## Rules for the copy you suggest

- Every COPY swap must be a **complete, drop-in string** the user can hand
  straight to Claude Code — not "make the headline punchier."
- Tell Claude Code, in effect: **target the individual text node only — never
  touch HTML structure, classes, or attributes.** That instruction protects the
  layout. Put it in the COPY block framing.
- Keep every suggested string on-brand: eggless leads, occasion over product, no
  "Adult Cakes," no supplier names, no %-off language, teal = Riverstone only.
- Never invent testimonials, review counts, awards, or specifics. If proof is
  missing, the fix is "add real proof of type X here," not fabricated proof.

## What NOT to do

- Don't redesign the page or output a full new page. Diagnose and prioritise.
- Don't recommend checkout/cart/buy-button patterns — wrong funnel.
- Don't bury a structural change inside a copy-swap (it'll break the layout when
  applied as text). Keep the buckets clean.
- Don't claim to grade off-page items (heatmaps, lead logs, real load speed) as
  if visible on the page.
- Don't present a /100 score. Use the per-layer passed/total count only.
