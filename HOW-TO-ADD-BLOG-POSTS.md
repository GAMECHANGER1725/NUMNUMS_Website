# How to Add a New Blog Post — Num Num's Bakery

## Overview
Every blog post = three updates:
1. A new HTML file in `blog/` (the post itself)
2. A new card entry at the **top** of `blog/index.html`
3. A new `<url>` entry in `sitemap.xml`

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
