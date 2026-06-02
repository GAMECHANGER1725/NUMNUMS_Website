# How to Add a New Blog Post — Num Num's Bakery

## Overview
Every blog post = three updates:
1. A new HTML file in `blog/` (the post itself)
2. A new card entry at the **top** of `blog/index.html`
3. A new `<url>` entry in `sitemap.xml`

After writing, **always run `/blog-analyze`** on the finished post and fix every issue (Critical → High → Medium → Low) before considering the post done. Then update both this file and `SKILL.md` with any new patterns found so the same mistake never needs a second prompt.

---

## Dates — always use Sydney time (AEDT/AEST)

All dates on blog cards and inside post files must reflect the **Sydney date** at the time of publishing, not UTC.

- Sydney is **UTC+11** in summer (AEDT, Oct–Apr) and **UTC+10** in winter (AEST, Apr–Oct).
- If you publish at 11 pm UTC in winter, it's already the next day in Sydney — use tomorrow's date.
- Format on cards: `D Month YYYY` — e.g. `30 May 2026` (no leading zero on day).
- Format in schema / sitemap: `YYYY-MM-DD` — e.g. `2026-05-30`.

---

## Step 1 — Create the blog post HTML

Copy an existing post as a starting point (e.g. `blog/eggless-cakes-schofields.html`) and update:

| Field | Where |
|---|---|
| `<title>` | `<head>` tag |
| `<meta name="description">` | `<head>` tag |
| `<link rel="canonical">` | Full URL: `https://numnumsbakery.com.au/blog/your-slug.html` |
| `<h1>` | Hero section |
| Body content | All `<section>` blocks |
| Schema JSON-LD | `<script type="application/ld+json">` near bottom |
| `datePublished` / `dateModified` | Inside the schema block — use Sydney date in `YYYY-MM-DD` |

**Slug rules:** lowercase, hyphens only, no underscores. Example: `eggless-cakes-rouse-hill.html`

**Lenis smooth scroll:** Every post must include the Lenis snippet in the `<head>` and the init script before `</body>`. Copy it from any existing post — do not remove it.

**Pink progress bar:** Already included in the Lenis snippet. Keep it.

---

## Step 2 — Add a card to `blog/index.html`

Open `blog/index.html` and insert your card **at the very top of the `#blog-grid` div**, above all existing cards. Cards are ordered newest-first by Sydney publish date.

### Card template (gradient — no images)

All cards use CSS gradient backgrounds. **Do not use `<img>` tags inside cards** — no cake photos on blog card headers.

Pick a gradient that fits the post topic (see the colour palette table below), then use those same colours for the badge tint.

```html
<div class="reveal blog-card-wrap" data-topics="TOPIC1 TOPIC2">
  <a href="YOUR-SLUG.html" style="text-decoration:none;display:flex;flex-direction:column;background:#fff;border-radius:1.25rem;overflow:hidden;border:1px solid rgba(COLOR_R,COLOR_G,COLOR_B,0.14);box-shadow:0 2px 12px rgba(44,26,14,0.06);transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.25s ease;height:100%;" onmouseenter="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 32px rgba(COLOR_R,COLOR_G,COLOR_B,0.22)'" onmouseleave="this.style.transform='';this.style.boxShadow='0 2px 12px rgba(44,26,14,0.06)'">
    <div style="height:240px;position:relative;overflow:hidden;flex-shrink:0;background:linear-gradient(135deg,#DARK 0%,#MID 55%,#LIGHT 100%);">
      <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(DARK,0.90) 0%,rgba(MID,0.38) 50%,rgba(DARK,0.04) 100%);"></div>
      <div style="position:absolute;top:1rem;left:1rem;">
        <span style="background:rgba(COLOR_R,COLOR_G,COLOR_B,0.28);border:1px solid rgba(LIGHT_R,LIGHT_G,LIGHT_B,0.40);color:#LIGHT_HEX;font-family:'Jost',sans-serif;font-size:0.63rem;font-weight:600;letter-spacing:0.10em;text-transform:uppercase;padding:4px 12px;border-radius:9999px;backdrop-filter:blur(8px);">CATEGORY LABEL</span>
      </div>
      <div style="position:absolute;bottom:0;left:0;right:0;padding:1rem 1.5rem 1rem;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:0.4rem;">
          <span style="font-family:'Jost',sans-serif;font-size:0.68rem;color:rgba(255,255,255,0.55);">D Month YYYY</span>
          <span style="color:rgba(255,255,255,0.25);">·</span>
          <span style="font-family:'Jost',sans-serif;font-size:0.68rem;color:rgba(255,255,255,0.55);">X min read</span>
        </div>
        <h2 class="font-display" style="font-size:1.2rem;font-weight:600;letter-spacing:-0.02em;color:#fff;margin:0;line-height:1.2;">YOUR POST TITLE HERE</h2>
      </div>
    </div>
    <div style="padding:1.25rem 1.5rem 1.5rem;display:flex;flex-direction:column;flex:1;">
      <p style="font-family:'Jost',sans-serif;font-size:0.875rem;font-weight:300;color:rgba(44,26,14,0.65);line-height:1.75;margin:0 0 1.25rem;flex:1;">ONE OR TWO SENTENCE SUMMARY OF THE POST.</p>
      <div style="display:flex;align-items:center;gap:6px;font-family:'Jost',sans-serif;font-size:0.8rem;font-weight:600;color:#C85478;">Read article <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></div>
    </div>
  </a>
</div>
```

### Ready-to-use gradient palettes

Pick one that fits the post topic. Copy the exact values — consistency across cards matters.

| Theme | Outer gradient | Badge tint colour |
|---|---|---|
| Pink / Eggless (default) | `#8B1A4A → #C85478 → #E8A4B5` | `rgba(200,84,120,0.28)` / `#FFB0D0` |
| Orange / Location | `#7C3A1E → #B35A2C → #D97C45` | `rgba(179,90,44,0.28)` / `#FFD0A0` |
| Blue / Northwest | `#1A3A5C → #2D5A8E → #4A7DB5` | `rgba(45,90,142,0.28)` / `#B0D4FF` |
| Green / Nature | `#2A4A1E → #4A7A2E → #6BA040` | `rgba(74,122,46,0.28)` / `#C8F0A0` |
| Burgundy / Birthday | `#5A1A1A → #8B2E2E → #C05050` | `rgba(139,46,46,0.28)` / `#FFB0B0` |
| Teal / Custom Cakes | `#0F3D36 → #1A6B5E → #2D9B8A` | `rgba(26,107,94,0.28)` / `#A0FFE8` |
| Purple / Dietary | `#2E1A5C → #5C3A8E → #8B6AB5` | `rgba(92,58,142,0.28)` / `#D0B0FF` |
| Gold / Indian Sweets | `#6B3A00 → #A05C14 → #D4882A` | `rgba(160,92,20,0.28)` / `#FFD080` |

For the dark overlay `<div>`, use the darkest colour from the outer gradient at `0.90` opacity for the bottom stop.

---

### Available `data-topics` values

| Value | Label shown |
|---|---|
| `birthday` | Birthday |
| `custom-cakes` | Custom Cakes |
| `eggless-cakes` | Eggless Cakes |
| `location` | Location |
| `mothers-day` | Mother's Day |
| `religious` | Religious |
| `dietary` | Dietary |
| `ingredients` | Ingredients |
| `festivals` | Festivals |
| `weddings` | Weddings |
| `indian-sweets` | Indian Sweets |

Use up to 2–3 topics per card. Separate with spaces, no commas.

---

## Step 3 — Update `sitemap.xml`

Add a `<url>` block **before** the closing `</urlset>` tag:

```xml
<url>
  <loc>https://numnumsbakery.com.au/blog/YOUR-SLUG.html</loc>
  <lastmod>YYYY-MM-DD</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

> **Important:** Missing sitemap entries = Google may not index the post for weeks. Always do this.

---

## Step 4 — Test locally

```bash
node serve.mjs   # starts at http://localhost:4000
```

Check:
- Post loads at `http://localhost:4000/blog/your-slug.html`
- Card appears at the **top** of `http://localhost:4000/blog/`
- Card link goes to the right post
- No `<img>` in the card header — gradient only
- Mobile: card shows up in the first batch or after tapping "Show more"

---

## Step 5 — Commit and push

```bash
git add blog/your-slug.html blog/index.html sitemap.xml
git commit -m "Add blog post: YOUR POST TITLE"
git push
```

GitHub push → Netlify auto-deploys to production (numnumsbakery.com.au) in ~1–2 minutes.

---

## Notes & Gotchas

- **No cake photos on cards** — all card headers use CSS gradients only. This keeps load times fast and the grid visually consistent.
- **Dates are Sydney time** — always check you're using the Sydney date (AEDT/AEST), not UTC.
- **Netlify HTML minification** can break single-quoted inline `style` and `on*` attributes. Use CSS classes for anything complex rather than inline styles.
- **CSP in `netlify.toml`** must include `https://unpkg.com` in `script-src` or Lenis breaks silently in production.
- **Blog card colours** — the unique gradient colour is for the index card only. The post interior always uses the standard espresso/cream/pink palette.
- **Lenis scroll** — desktop only. Mobile uses native scroll.

---

## Quality Gate — Pre-publish Checklist

Run `/blog-analyze` on every post before marking it done. Fix all issues found (Critical → High → Medium → Low). The items below are the recurring failure patterns discovered during live audits — check them manually before even running the analyzer.

### Meta & SEO

- [ ] **Meta description contains ≥ 2 concrete numbers** (distances, times, flavour counts, etc.). "Order in 48 hrs" alone is not enough. Target pattern: `"100% eggless [product] near [suburb] — [N] flavours, [distance] min from [location]. Order with [timeframe] notice."` — 150–160 chars.
- [ ] **Meta description is ≤ 160 characters.** Count it explicitly — don't estimate. Anything over 160 gets truncated in SERPs, usually cutting the phone number or CTA. Trim from the middle if needed; keep the numbers and CTA intact at the end.
- [ ] **Title tag** includes primary keyword + location, max 60 chars.
- [ ] **Canonical URL** matches the slug exactly (no `.html` suffix in canonical — just `/blog/your-slug`).

### LCP / Image Performance

- [ ] **First `<img>` in the article body** (the LCP element) has `fetchpriority="high"` and does **NOT** have `loading="lazy"`. Copy this exactly: `<img src="..." alt="..." class="cake-img" fetchpriority="high" width="800" height="530">`
- [ ] All subsequent images use `loading="lazy"`.
- [ ] All images are `.webp` format. Alt text is a full descriptive sentence (product + location).
- [ ] **Unsplash CDN URLs must use `?fm=webp`**, not `?fm=jpg`. The researcher returns `fm=jpg` by default — always swap before pasting into the HTML. Correct pattern: `https://images.unsplash.com/photo-<id>?fm=webp&q=80&w=1200&auto=format&fit=crop`

### External Links — mandatory (minimum 2 per post)

Every post must link out to at least 2 authoritative external sources placed naturally in the body copy (not a "Sources" section at the end). Approved sources:

| Source | URL pattern | Use for |
|---|---|---|
| ABS | abs.gov.au/statistics/people/population | Suburb growth, demographics |
| NSW Education | education.nsw.gov.au/schooling/term-dates | School holiday dates |
| Food Standards Australia | foodstandards.gov.au | Dietary/allergen context |
| NSW Health | health.nsw.gov.au | Food safety |
| Google Maps | maps.google.com | Travel time reference |

### Answer-First H2 openers — every section, no exceptions

- [ ] Every H2 opens with a paragraph that **directly answers the heading question** AND includes a specific number or sourced fact. "The most common question we get…" is NOT answer-first. Correct pattern: `[Direct answer with a specific claim + source/provenance]. [1–2 sentences expanding the point.]`
- [ ] First-party claims are fine when provenance is explicit: "From our [N] years of orders in [area]…" or "From our internal order data, 2025–26…"
- [ ] Do not open any H2 with a rhetorical question, a scene-setting sentence, or a statement about what you're going to explain.
- [ ] **Sections that use personal/internal experience markers (`[PERSONAL EXPERIENCE]`, `[ORIGINAL DATA]`) must still open with a sourced stat first.** Move the internal data paragraph to second position. The experience/observation adds colour after the fact is established — it never replaces it.

### Chart / SVG data integrity

- [ ] Charts using exact percentages or numbers must state in the figcaption that the data is internal/first-party.
- [ ] Figcaption format: `"Approximate [metric] — Num Num's Bakery internal [order/sales] data, [year range]. Figures represent relative popularity ranking, not a formal survey."`
- [ ] Never use survey-methodology language ("Multiple themes could be selected") unless an actual survey was run.

### Internal linking — body text

- [ ] Every reference to another page on the site ("our cakes", "the order page", "locations", "Our Cakes page") must be a working `<a href>` hyperlink — never plain text.
- [ ] Minimum 5 internal links in body text only (sidebar and related-posts section do not count toward this minimum).

### Sidebar related-post links

- [ ] Every URL in the sidebar "Related Posts" block must point to a **file that already exists** in `blog/`. Run `ls blog/*.html` before writing the sidebar — if the target post doesn't exist yet, use the nearest existing post on the same topic instead. A dead 404 link in the sidebar harms crawlability and user trust.

### Nearest-location accuracy (suburb posts)

- [ ] Num Num's has TWO shops: **Harris Park** (96/96 Wigram Street, NSW 2150, open daily 11 am–10 pm) and **Riverstone** (Shop 8, Riverstone Shopping Centre, NSW 2765, Mon–Fri 6 am–8 pm / Sat–Sun 7 am–7 pm). A suburb post must lead with the genuinely **closest** shop — do not default every suburb to Riverstone. Parramatta-LGA / western suburbs (Parramatta, Harris Park, Rosehill, Camellia, Granville, Clyde, Rydalmere, Westmead, Merrylands, Holroyd) lead with **Harris Park**; north-west suburbs (Quakers Hill, Schofields, The Ponds, Marsden Park, Box Hill, Riverstone, Tallawong) lead with **Riverstone**. Mention the other shop second as the alternate. The LocalBusiness schema `@id`, address, hours and `areaServed` must match the lead shop.

### Suburb reality check (do this during research, before writing)

- [ ] Before writing a suburb post, verify the suburb's **actual postcode** and whether it has a meaningful **residential population** via ABS QuickStats / Community Profile. Some "suburbs" on a priority list (e.g. **Clyde 2142**, Camellia) are tiny industrial/rail localities with near-zero usual residents and a postcode that differs from the nearest shop's. Do NOT assume a suburb shares Harris Park's 2150 postcode, and do NOT fabricate suburb-level demographic stats for a suburb that has almost no residents.
- [ ] For low-population/industrial suburbs, frame honestly ("one of Sydney's smallest, most industrial pockets") and lean on **LGA-level data** (City of Parramatta, Cumberland City Council) described as "the surrounding area / suburbs that ring [suburb]", citing profile.id / forecast.id. State the tiny resident count plainly rather than inventing families.

### H2 heading style

- [ ] ≥ 60% of H2s end with `?` (question format). Count before delivery.
- [ ] No H2 ends mid-thought without punctuation.

### Lenis smooth scroll

- [ ] The Lenis block appears immediately before `</body>`. Never omit it. Copy from `feedback_lenis_smooth_scroll.md` memory file or any existing post.

### Word count & depth

- [ ] Every post must contain **at least 2,000 words of body prose** (the `article-body` text, excluding SVG chart labels, nav, sidebar and footer). Count it explicitly — don't estimate. If a draft lands under 2,000, expand it with an extra question-format H2 section or deeper detail before publishing. **Re-count after EVERY edit pass, not just once** — top-up paragraphs frequently still leave a post 10–50 words short, so verify the final number is ≥ 2,000 immediately before `git add`. **City-wide and comparison posts (no single suburb anchor, e.g. "eggless cake vs regular cake", "best cake Sydney") consistently land shortest** — budget an extra question-format H2 from the outset rather than topping up at the end.
- [ ] Target **3–5 inline body images** (first = LCP with `fetchpriority="high"`, rest `loading="lazy"`) and **2–4 SVG charts**, spaced evenly through the post.

### Location accuracy — Harris Park vs Riverstone (two shops)

- [ ] Num Num's has **two** locations. **Harris Park:** 96/96 Wigram Street, Harris Park NSW 2150 — open daily 11 am–10 pm. **Riverstone:** Shop 8, Riverstone Shopping Centre, Riverstone NSW 2765 — Mon–Fri 6 am–8 pm, Sat–Sun 7 am–7 pm.
- [ ] For a suburb post, choose the genuinely nearest shop as the primary "nearest location": **Harris Park** for Parramatta and central/western suburbs (Harris Park, Westmead, Granville, Merrylands, North Parramatta, Auburn, Rosehill, Rydalmere); **Riverstone** for the north-west (Quakers Hill, Schofields, The Ponds, Box Hill, Marsden Park, Rouse Hill, Tallawong).
- [ ] The LocalBusiness schema (address, geo, opening hours), the sidebar "Nearest Location" card, the footer address block, and every stated drive time/distance must all match the chosen nearest shop. Never claim a short drive time while pointing the schema or address at the farther shop. Harris Park ≈ 5 min from Parramatta CBD; Riverstone ≈ 25–30 min from Parramatta.

---

## After Every Post — Update the MD Files (Always, No Exceptions)

This step is **unconditional** — it runs after every post regardless of whether new issues were found.

After fixing all `/blog-analyze` findings:

1. Go through every finding at every severity level (Critical → Low).
2. For each finding, check whether it is already covered verbatim in:
   - The **Quality Gate** section of this file (`HOW-TO-ADD-BLOG-POSTS.md`)
   - The **Num Nums Bakery HTML Project — Non-negotiable Pre-publish Checklist** section in `SKILL.md` at `/Users/vaidikpatel/.claude/plugins/cache/agricidaniel-blog/claude-blog/1.9.1/skills/blog-write/SKILL.md`
3. If either file is missing the pattern, add it to **both files** — same wording, same section, kept in sync.
4. If no new patterns were found, confirm explicitly in the delivery summary: "Checklist files reviewed — no new patterns to add."

**Never silently skip this step.** Every finding that surfaces once becomes a pre-check forever. The checklists grow; they never shrink.
