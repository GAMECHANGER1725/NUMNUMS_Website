# UI conversion audit — 2026-09

Polish-and-convert pass over the three purchase paths. Generated from `plans/ui-graph-state.json`
(the graph's only memory); the walker that measured it is `plans/ui-measure.mjs`.

- **P1** normal cake: / → /shop → /shop/cakes/[slug] → /shop/cart → Stripe
- **P2** custom cake: / → /order → form submitted (WhatsApp)
- **P3** shared chrome: nav (static + shop), offer popup, cart pill

## Baseline (N1)

| Path @ viewport | Taps | Scroll px | First CTA (screens below fold) | Blockers |
|---|---|---|---|---|
| P1@m390 | 9 | 556 | 0 | — |
| P2@m390 | 11 | 1811 | 0 | — |
| P3@m390 | 2 | 0 | 0 | offer popup covers the homepage after 5.3s |
| P1@d1440 | 8 | 158 | 0 | — |
| P2@d1440 | 11 | 1767 | 0 | — |
| P3@d1440 | 2 | 0 | 0 | offer popup covers the homepage after 6.1s |

Walker notes: console `net::ERR_FAILED` lines are the walker aborting GTM/Meta requests. P1 ends at the
pay tap locally because `/api/create-checkout` is a Netlify function `serve.mjs` cannot run.

## Findings, ranked (N3/N4)

119 raw findings from the three audit branches, merged to
104. Ranked by impact (1–5, effect on purchases) ÷ effort (S=1, M=2, L=3).
Route: `auto` = fixed in this pass; `needs_vaidik` = touches a price, policy, lead time, product claim,
checkout/payment logic, a Netlify function, the SEO title/H1, or a decision CLAUDE.md records.

| ID | Raw | Type | Page | Fix | Impact | Effort | Route | Status |
|---|---|---|---|---|---|---|---|---|
| F01 | P1-04 | trust | /shop/cart | terms.html §1-4: lead time 'next day for shop cakes; 2 days for custom cakes', 'a 50% deposit online, balance on collection', and 'more than 24 hours before collection: deposit refunded in … | 5 | S | needs_vaidik | queued |
| F02 | P1-12, P1-13, P2-02 | friction | / · / and /order | Decide how a normal-cake shopper gets from / to /shop. Options: (a) one text link under the hero CTAs, "Or pick one of our 15 flavours — ready tomorrow →" /shop; (b) deep-link the hero CTAs… | 5 | S | needs_vaidik | queued |
| F03 | P1-02 | bug | /shop/cart | when-field.tsx:113 — `<div id={id} className="nn-when-card">`. It is one attribute. go() then centres the calendar and the existing nudge becomes visible. | 4 | S | auto | open |
| F04 | P2-01 | bug | /order | In the submit handler in order.html, after the chk() calls, find the first invalid control (location label, then the first enabled .nd-cal-day or the open time list, then #cake-name, then t… | 4 | S | auto | open |
| F05 | P1-05, P2-09 | trust | /shop, /shop/cakes/[slug], / · /order | Vaidik reads each shop's real rating and count from the GBP dashboard. Put the one true figure in a single constant (e.g. shop-app/lib/badges.ts REVIEWS {rating,count,countedOn}), use it on… | 4 | S | needs_vaidik | queued |
| F06 | P3-03, P3-13 | doubt | all static pages with the popup · popup (all static) | Copy only, in promo.js, with no layout change. Heading: 'Subscribe for 10% off your second order'. Sub-line or footnote 1: 'Your code works from your second online order and is valid for 90… | 4 | S | needs_vaidik | queued |
| F07 | P3-04, P1-15 | friction | /, /locations, /indian-sweet, /about · / | promo.js: raise DELAY_MS from 5000 to about 25000, or drop the timer and keep only the 50% scroll trigger. Add locations and indian-sweet to the suppression regex at promo.js:333, for the s… | 4 | S | needs_vaidik | queued |
| F08 | P3-16 | friction | static (all 7) vs shop | promo.js cartCss: change the <=1024 rule to `#nav-cart{display:inline-flex!important;min-width:0!important;padding:7px 14px!important;font-size:0.75rem!important}`, without the .nn-has-item… | 4 | S | needs_vaidik | queued |
| F09 | P2-13 | doubt | /order | Under the submit in order.html, add a three-line 'What happens next': we reply on WhatsApp with your quote, you confirm and pay [how, per Vaidik], you collect on the date you picked. Get th… | 4 | S | needs_vaidik | queued |
| F10 | P1-01, P3-31 | bug | /shop/cart | In shop-app/app/cart/page.tsx, render nothing date- or cart-dependent until `loaded` is true: `if (!loaded) return <><ShopHeader/><main …>{/* quiet skeleton: title + steps only */}</main></… | 3 | S | auto | open |
| F11 | P2-05 | friction | /order | Make the three in-page links fragment-only (#flavour-size-guide, #cake-order-form, #cake-order-form) in order.html so they scroll instead of reloading. Their labels stay (the "30 Seconds" l… | 3 | S | auto | open |
| F12 | P1-03 | bug | /shop/cart | cart/page.tsx: pass `date={dateStale ? '' : cart.dueDate}` and `time={dateStale ? 0 : cart.dueMin}` to NnWhenField, and gate `busyDay` on `!dateStale`. The stale booking then reads as unset… | 3 | S | auto | open |
| F13 | P1-22 | doubt | /shop/cart | cart/page.tsx sticky bar: under the amount, add one 0.72rem muted line, '+ {money(total - deposit)} at pickup · refundable to 24h before'. Wording must match terms after P1-04. | 3 | S | auto | open |
| F14 | P1-21 | doubt | /shop/cakes/[slug] | product-page.tsx:207 — 'Pay 50% online, the rest at pickup · Harris Park or Riverstone · ready tomorrow' (DEPOSIT_RATE from lib/cart.ts, so the text follows the rule). | 3 | S | auto | open |
| F15 | P3-05 | friction | all static pages with the popup | promo.js: hoist the cart count out of paintCart and add `if (cartCount() > 0) return;` beside the signedIn() guard at promo.js:322. | 3 | S | auto | open |
| F16 | P3-14 | bug | / | promo.js cartCss: `#navbar:not(.scrolled) #nav-cart:not(.nn-has-items){color:#FFF8F2!important;border-color:rgba(255,248,242,.75)!important}`. Hover keeps the existing rose fill. The shop h… | 3 | S | auto | open |
| F17 | P3-02, P1-18 | bug | static (all) vs shop · static pages (cart pill) -> /shop | promo.js paintCart: `n = cart.lines.reduce(function(s,l){return s+(Number(l.qty)\|\|1);},0);`. That brings the static pill and #nav-cart-m into line with cartCount. No shop change. | 3 | S | auto | open |
| F18 | P3-21 | bug | /order (hash link); all static + shop (Back) | promo.js, which covers every static page: add `window.addEventListener('pageshow',function(e){var b=document.getElementById('mobile-menu-btn');if(e.persisted&&b&&b.classList.contains('open'… | 3 | S | auto | open |
| F19 | P2-25 | bug | /order | `@media(max-width:640px){#cake-order-form input,#cake-order-form textarea{font-size:16px}}` in order.html. | 3 | S | auto | open |
| F20 | P2-23 | bug | /order | In order.html, `@media(max-width:640px){#cake-order-form.order-card{padding:1.5rem 1.1rem}}`. That gives about 308px of content at 390, days about 36px wide, and stops the location label wr… | 3 | S | auto | open |
| F21 | P2-04 | doubt | /order | order.html: make the calendar summary name the real first bookable day from minDate() ("Earliest custom pickup: Thursday 1 October") and show the existing, never-displayed "In a hurry? Call… | 3 | S | auto | open |
| F22 | P2-12 | doubt | /order | order.html: append the starting price to each size option note at enhance time, computed from the page's existing BASE table (no new copy of the price list): "20-22 guests · from $74.99". M… | 3 | S | auto | open |
| F23 | P1-06, P2-10 | trust | / | index.html:1904-1909: replace each line with a verbatim excerpt from the matching reviewBody (e.g. 'the best part was how closely it matched the picture we shared' — Ankit A.) and correct t… | 3 | S | needs_vaidik | queued |
| F24 | P1-08 | trust | /shop/cart, / | Add the weekday share with its sample and date to ORDER_BOOK in shop-app/lib/badges.ts and render the banner from it ('Most of our cakes are collected Friday to Saturday'), or drop the 'boo… | 3 | S | needs_vaidik | queued |
| F25 | P2-08, P1-35 | trust | /order · / | Ask Vaidik what the remedy actually is. Write it into terms.html (one line under section 8) and link the chip to it. If there is no set remedy, drop the chip. | 3 | S | needs_vaidik | queued |
| F26 | P2-06, P1-11 | trust | /order · / | Remove popular:true from 10", the ✦ 'Most popular size' note, and the 'Most 20-guest parties' sentence. Replace it with the serving fact ('A 10″ serves 20-22'). If Vaidik confirms ORDER_BOO… | 3 | S | needs_vaidik | queued |
| F27 | P1-14 | friction | / | Needs Vaidik's call because of the single-fork rule: point .ps-order-btn to /shop (the listed prices are shop prices). Within the rule: relabel it 'See the 15 flavours' and route to /order#… | 3 | S | needs_vaidik | queued |
| F28 | P2-16 | friction | /order | Remove the modal and open WhatsApp straight from the submit. The existing #price-hint above the button carries the pricing note. If Vaidik wants to keep it, see P2-17 for the fixes it needs. | 3 | S | needs_vaidik | queued |
| F29 | P2-35 | trust | /order | Change the root-page footers to 'Daily 9 am – 6:30 pm' (blog is a separate pass) and put both shops' hours in the phone card line. | 3 | S | needs_vaidik | queued |
| F30 | P2-36 | trust | /order | Have Vaidik confirm the kitchen and stock position. Until then, say 'no eggs in any of our recipes' and drop the egg-allergy suitability sentence. Fix the ready-made line if croissants are … | 3 | S | needs_vaidik | queued |
| F31 | P1-10 | trust | /shop/cakes/[slug] | Vaidik reviews flavour-copy.ts. Drop the popularity/anecdote notes that lack a source, and confirm or remove 'praline'. No layout change. | 3 | S | needs_vaidik | queued |
| F32 | P1-19 | friction | /shop/cakes/[slug] | product-page.tsx: on <lg, render a fixed bottom bar with the existing `nn-frost` + btn-cta pattern ('Add to order — $49.99'). It hides via IntersectionObserver when the real button is in vi… | 4 | M | auto | open |
| F33 | P3-17 | bug | /about (+2 blog posts, out of scope) | promo.js:61: scope the rule to `#nav-pill .btn-hover-interactive`. To undo the per-page <=640 rule without editing 240 files, have promo.js inject `a.btn-hover-interactive:not(#nav-cart){di… | 2 | S | auto | open |
| F34 | P3-01 | bug | /privacy-policy, /terms | Join the broken string onto one line in privacy-policy.html:337 and terms.html:372. In promo.js navBreakpointCss add '#mobile-hamburger-root{display:flex!important;}' inside the 641-1024 qu… | 2 | S | auto | open |
| F35 | P2-40 | friction | /order | Remove the 'reveal' class from #cake-order-form (order.html:636). The card should never be invisible. | 2 | S | auto | open |
| F36 | P2-03 | bug | /order | Add scroll-margin-top:80px to #cake-order-form and #flavour-size-guide in order.html (the same value #custom-form already uses). | 2 | S | auto | open |
| F37 | P1-24 | bug | /shop/cart, / | cart/page.tsx:307 add `min-h-[40px] items-center`. Wrap each line checkbox in a `<label className="-m-2 p-2.5">` (≥36px). Give 'Select all' `min-h-[36px]`. | 2 | S | auto | open |
| F38 | P1-28 | doubt | /shop/cart | cart/page.tsx:265 — replace `truncate` with `break-words` (or `line-clamp-2`). | 2 | S | auto | open |
| F39 | P1-34 | doubt | /shop/cart | cart/page.tsx: append `, {st.locality}` to the address line, plus a small 'Map ↗' link beside the fieldset legend or under the chosen card (outside the <label>). | 2 | S | auto | open |
| F40 | P1-33 | doubt | /shop/cart | cart/page.tsx:119 fallback — `Could not start checkout. Try again, or call us on ${SHOP_PHONE.display}.` (SHOP_PHONE already in lib/cart.ts). | 2 | S | auto | open |
| F41 | P1-29 | friction | /shop/cart | coupon-field.tsx: render `children` (the email) above the form. Use Jost with tracking-wider instead of font-mono, and the placeholder 'Coupon code'. The coupon logic is unchanged. | 2 | S | auto | open |
| F42 | P1-27 | bug | /shop/cakes/[slug], /shop/cart, /shop | product-page.tsx:143,150 — serves to 0.72rem, 'Most ordered' to 0.62rem in #A03D5E (already the hover rose). globals.css .nn-time-list-head colour #8A6B55 (already used by .nn-when-summary,… | 2 | S | auto | open |
| F43 | P2-20 | bug | /order | In sync(), show the bar only while the form is on screen: scrolledPast && form.getBoundingClientRect().bottom > 119. | 2 | S | auto | open |
| F44 | P2-21 | bug | /order | In order.html's style block: `.loc-btn:has(input:focus-visible){outline:2px solid #C85478;outline-offset:2px}`, plus a hover border rgba(200,84,120,.42) and `:active{transform:scale(.97)}` … | 2 | S | auto | open |
| F45 | P2-26 | bug | /order | In fit(), subtract the fixed chrome: `var above = r.top - GAP - (document.getElementById('order-progress-sticky').classList.contains('visible') ? 127 : 76);`. | 2 | S | auto | open |
| F46 | P2-28 | friction | /order | Change the stack breakpoint in order.html from `@media (max-width: 768px){#order-cards-grid{...1fr}}` to 1023px so tablets get a full-width form with the phone card below it. | 2 | S | auto | open |
| F47 | P2-29 | friction | /order | order.html: drop the card's duplicate h3 "Order a Custom Cake" (the section H2 above says it) and the duplicate attach-a-photo line; keep one photo instruction above the submit. The "Most 2… | 2 | S | auto | open |
| F48 | P2-30 | friction | /order | Remove the uppercase pickup line (keep the pill, which is the deliberate qualifier). Remove the inline span rule. Hide .hp-sep at 640px and below so the two proof lines stack cleanly. | 2 | S | auto | open |
| F49 | P2-31 | friction | /order | On click, set #cake-size to the slider's tier value and dispatch 'change' (the .nd button repaints itself). Drop the WhatsApp icon from that button. | 2 | S | auto | open |
| F50 | P2-32 | friction | /order | Remember the last pickup location in localStorage (nn_pickup_store_v1, wrapped in try/catch like the name) and check that radio on load instead of Harris Park. Leave flavour and size blank. | 2 | S | auto | open |
| F51 | P2-33 | doubt | /order | Rewrite the two closing lines in first person ('I'll attach a reference photo.' / 'I understand the final price is confirmed once you've seen the design.') and skip the starting-price line … | 2 | S | auto | open |
| F52 | P2-34 | bug | /order | On touch devices, use `location.href = url` instead of window.open (keep window.open on desktop). Test on a real phone inside the Instagram app before shipping. | 2 | S | auto | open |
| F53 | P2-42, P1-39 | doubt | / | Drop the WhatsApp icon from .hero-cta-wa (or keep it and the label, and only after P2-02 deep-link the form so the promise is one screen away). | 2 | S | auto | open |
| F54 | P2-44 | doubt | /order | Add the canonical street (FACTS.addresses: 'Shop 1, 96-98 Wigram Street' / 'Shop 8, Riverstone Shopping Centre') under the selected location button or in the summary line. | 2 | S | auto | open |
| F55 | P2-17 | bug | /order | In order.html: add role='dialog' aria-modal='true' aria-labelledby on the h3, move focus to #pricing-confirm-continue on open, close on Escape and return focus to the submit, set overflow:h… | 2 | S | auto | open |
| F56 | P2-18 | bug | /order | order.html: guard the order_form_submit / fbq Lead block so it fires once per page, ending the double count on Go back + resubmit. Moving the event to the Continue tap changes what Meta opt… | 2 | S | auto | open |
| F57 | P1-17, P2-24, P3-30 | bug | / · /order and / · /, /order | index.html stat grid: `grid-template-columns:repeat(2,minmax(0,1fr))` and font-size `clamp(2rem,9vw,3rem)` on the four stat numbers. | 2 | S | auto | open |
| F58 | P3-06 | friction | all static pages with the popup | promo.js: keep the seen flag in localStorage with a timestamp (safeGet/safeSet already exist) and skip for about 30 days after a dismissal. Set a permanent 'subscribed' flag in done(). | 2 | S | needs_vaidik | queued |
| F59 | P3-19 | bug | shop | shop-app/components/ui/shop-header.tsx: while open, add a document pointerdown listener that calls setOpen(false) when the target is outside #nn-mobile-menu and .nn-ham, and set document.bo… | 2 | S | auto | open |
| F60 | P2-14 | doubt | /order | Make order.html:852 match the calendar ('Order today, collect the day after tomorrow') and add to the summary 'we quote for the date you pick'. Do not change the rule itself. | 2 | S | needs_vaidik | queued |
| F61 | P2-15 | doubt | / | Change the index.html:1279 H3 to 'Fresh to Order, Ready in 2 Days'. | 2 | S | needs_vaidik | queued |
| F62 | P2-07 | trust | /order | Replace the three lines with the one sourced fact ('Chocolate - about 4 in 10 of the cakes we sell'), or relabel the block 'Our suggestions', an opinion clearly marked as ours. | 2 | S | needs_vaidik | queued |
| F63 | P1-09 | trust | /shop | Confirm with Vaidik that staff text every web order when it is ready. If not, reword to what is true ('We’ll call or text if anything changes'). No code needed if it is confirmed. | 2 | S | needs_vaidik | queued |
| F64 | P1-20 | friction | /shop/cakes/[slug] | shop-header.tsx: hide the empty-cart pill on /cakes/* as well, e.g. `showCart = n > 0 \|\| (path !== '/' && !path.startsWith('/cakes/'))`. This is the same reasoning as the board exception. A… | 2 | S | needs_vaidik | queued |
| F65 | P1-23 | friction | /shop | Keep the three rows and swap the last two: Premium → Classics → Specialty in ROWS (shop-app/app/page.tsx:81-102). Classics is where the most-ordered cake lives, and membership stays derived… | 2 | S | needs_vaidik | queued |
| F66 | P3-12 | trust | popup (all static) | promo.js: on mobile only, add one live-text line under .nnp-sub: '100% eggless · Rated 4.6 on Google'. Hide that line again under `@media (max-height:700px)` so 320x568 keeps its room. | 2 | S | needs_vaidik | queued |
| F67 | P1-31 | friction | /shop, /shop/cakes/[slug], /shop/cart | account-menu.tsx: import the Supabase client lazily (on mount/open) so the /shop board and product pages drop the gotrue/realtime chunk from first load. The cart keeps its import: its email… | 3 | M | auto | open |
| F68 | P2-11 | trust | /order | In the existing phone card (order.html:796), below the Call button, add two verbatim review snippets and three small real-cake thumbnails linking to #gallery. On phones, add one verbatim li… | 3 | M | needs_vaidik | queued |
| F69 | P1-07 | trust | /shop/cakes/[slug] | product-page.tsx: under the rating line, show one short verbatim quote + first name + initial when the flavour has one (Butterscotch, Mango, Cookies & Cream, Pineapple). Keep them as a smal… | 3 | M | needs_vaidik | queued |
| F70 | P1-16, P2-37 | bug | /, popup, /order · /order and / | Set page/section headings on / and /order in Jost 300, tracking -0.02em (one .font-display rule in order.html; the index.html H1 inline style). Heading TEXT unchanged. The popup heading is … | 2 | M | auto | open |
| F71 | P2-43 | bug | /order | Add a check to verify-blog.mjs that parses order.html's BASE and FLAVOUR objects and CAKE_DATA and diffs them against FACTS.sizes and FACTS.surcharge. | 2 | M | auto | open |
| F72 | P3-27 | doubt | all static + shop | Smallest option that keeps the layout: at >=1025 only, add a live-text wordmark 'Num Num's Bakery' using the existing .nav-wordmark class beside the logo, on both surfaces (static markup vi… | 2 | M | needs_vaidik | queued |
| F73 | P2-19 | bug | /order | Add an 'input' listener on #cake-name that calls updateOrderProgress (order.html, beside line 1972). | 1 | S | auto | open |
| F74 | P2-27 | bug | /order | Relabel it 'Wording (optional)' and set `#form-row-2{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}` in order.html. | 1 | S | auto | open |
| F75 | P2-38 | bug | /order | In order.html's style block, add a hover border-color rgba(200,84,120,.42) (as .nd-btn has) to the inputs and .loc-btn, underline on hover for the text links, and `:active{transform:scale(.… | 1 | S | auto | open |
| F76 | P2-39 | bug | /order | Give the two links padding:6px 0 (display:inline-block), and make .ps-info-btn 32x32, in order.html. | 1 | S | auto | open |
| F77 | P2-46 | bug | /order | Optional: reserve the .hero-proof line height (min-height) so the font swap doesn't move it. | 1 | S | auto | open |
| F78 | P1-25 | bug | /shop, /shop/cakes/[slug], /shop/cart | globals.css: add `:active:not(:disabled){transform:scale(.97)}` to .cake-card, .size-chip, .nd-cal-day, .nn-time-row, .rail-arrow, .nn-cta (transform only, `transition:none/transform:none` … | 1 | S | auto | open |
| F79 | P1-26 | bug | /shop/cart | cart/page.tsx:252 alt={`${l.flavour} cake`} (or aria-label on the Link). | 1 | S | auto | open |
| F80 | P1-32 | doubt | /shop/cakes/[slug] | terms.html:245 add id="allergens"; product-page.tsx:224 href="/terms#allergens". | 1 | S | auto | open |
| F81 | P1-37 | doubt | /shop/cart | cart/page.tsx:528 — 'These are our designs, 100% eggless and baked for tomorrow.' | 1 | S | auto | open |
| F82 | P1-38 | friction | /shop/cart | cart/page.tsx: on lg, render the coupon block after the summary card (order-last on the coupon wrapper) so the pay button stays in the first screen. | 1 | S | auto | open |
| F83 | P3-07, P3-08 | bug | popup (all static) | promo.js:362-363: `.nnp-h{font-family:Jost,system-ui,sans-serif;font-weight:300;letter-spacing:-.02em}`. Keep Cormorant only on the decorative '10%' numeral on the coupon (.nnp-c-big), whic… | 1 | S | auto | open |
| F84 | P3-09 | bug | popup (all static) | promo.js: remove `hidden` from the two labels and define `.nnp-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}` in the CSS array. There is n… | 1 | S | auto | open |
| F85 | P3-10 | friction | popup (all static) | promo.js CSS: `@media (max-height:620px){.nnp-pic{min-height:0;padding:12px 16px}.nnp-left{padding:22px 22px}.nnp-h{font-size:1.5rem}.nnp-field{margin-top:14px}}`. That keeps the email fiel… | 1 | S | auto | open |
| F86 | P3-11 | friction | popup (all static) | promo.js: leave the button enabled. On submit, when validate() fails, set aria-invalid, focus the email field and show .nnp-err with 'Enter your email so we can send your code.' | 1 | S | auto | open |
| F87 | P3-15 | bug | / | promo.js ACCOUNT_CSS: add `#navbar:not(.scrolled) .nn-acct-btn{color:#fff}`. The shop needs no change because it has no hero state. | 1 | S | auto | open |
| F88 | P3-20 | bug | /indian-sweet | Replace indian-sweet.html:1756-1772 with the standard mobile-nav script used on about.html:711ff. The promo.js Escape/pageshow handlers from P3-18 and P3-21 would also cover it, because the… | 1 | S | auto | open |
| F89 | P3-22 | bug | all static + shop | Static, via promo.js injected CSS: `#navbar a[aria-label*="home"]:focus-visible,#mobile-menu-btn:focus-visible,#ham-btn:focus-visible,#mobile-menu a:focus-visible{outline:2px solid #C85478;… | 1 | S | auto | open |
| F90 | P3-23 | bug | all static + shop | Add `transform:scale(.97)` on :active for #nav-cart, .nn-acct-btn (promo.js cartCss/ACCOUNT_CSS) and .nn-cta, .nn-icon-btn (globals.css), disabled under prefers-reduced-motion. Change both … | 1 | S | auto | open |
| F91 | P3-24 | bug | static vs shop | globals.css:847: `.nn-cta:hover{color:#FFF8F2}`. Set .nn-icon-btn hover and [data-popup-open] to .12 and .15 to match promo.js, or the reverse. Change both surfaces in the same commit and m… | 1 | S | auto | open |
| F92 | P3-25 | bug | static vs shop | Pick one spec and apply it to both surfaces. For example, set globals.css `#nn-mobile-menu > div > a{font-size:1rem;padding:14px 34px;letter-spacing:.02em;box-shadow:0 4px 18px rgba(200,84,… | 1 | S | auto | open |
| F93 | P3-26 | bug | all static + shop | promo.js, once for all static pages: set aria-current='page' on `.nav-link.nav-active` and on `#mobile-menu a[href=location.pathname]`, and colour it #C85478. shop-header.tsx: add aria-curr… | 1 | S | auto | open |
| F94 | P3-28 | bug | popup (all static) | promo.js: `.nnp-note a{display:inline-block;padding:7px 2px;margin:-7px 0}`. | 1 | S | auto | open |
| F95 | P3-29 | bug | static vs shop (account menu) | promo.js mountAccount: role="dialog", aria-label and focus the first item on open. Aligning the signed-in contents across surfaces touches the recorded two-state design and is left as a not… | 1 | S | auto | open |
| F96 | P3-33 | bug | popup (all static) | promo.js:627: give the new h2 id="nnp-h" and render 'Browse the cakes' as <a class="nnp-btn" href="/shop">. | 1 | S | auto | open |
| F97 | P2-41 | doubt | /order | Relabel it 'Start your quote' and point it at #cake-order-form. | 1 | S | needs_vaidik | queued |
| F98 | P2-45 | trust | /order | Use the existing .nd-opt-tag slot to tag Chocolate 'Most ordered' in the custom flavour menu, with the same wording and source as the shop card. | 1 | S | needs_vaidik | queued |
| F99 | P1-30 | friction | /shop/cart | Low priority and deliberate. If anything: when the popover opens on a day with no time chosen, start the list scrolled to the band the shop is busiest in, taken from data, not guessed. Othe… | 1 | S | needs_vaidik | queued |
| F100 | P1-36 | trust | /shop/cakes/[slug] | product-page.tsx:151 label 'Most ordered size'. Alternatively, show it only on the page of the flavour it describes. | 1 | S | needs_vaidik | queued |
| F101 | P3-32 | doubt | static (all) + shop | Label the empty state for the action it takes, e.g. 'Order online', in promo.js paintCart (label) and shop-header.tsx cartLabel, on both surfaces. Leave 'Your order (n)' unchanged. | 1 | S | needs_vaidik | queued |
| F102 | P3-34 | bug | popup / subscribe function | Export one CONSENT_WORDING string and have promo.js render that exact string, or make the characters identical. If P3-03 changes the offer copy, store it alongside the consent so the record… | 1 | S | needs_vaidik | queued |
| F103 | P2-22 | friction | /order | Use a roving tabindex in renderCalendar(): the selected (or first enabled) day gets tabindex=0 and the rest -1, with ArrowLeft/Right/Up/Down/Home/End moving between days. | 1 | M | auto | open |
| F104 | P3-18 | bug | all static + shop | Static, in one place for every page: in promo.js, add a keydown listener. On Escape, if #mobile-menu-btn has .open, click it and focus it. On Tab, wrap focus within #mobile-menu. Also toggl… | 1 | M | auto | open |

## Needs Vaidik

These never blocked anything else. Each needs a decision or a fact only the business has.

### F01 — trust, impact 5
- **Why it's yours:** policy — terms.html is the legal document
- **What we found:** [P1-04] Right under the pay button, the cart says 'Paying confirms you accept our Terms & Conditions' and links /terms (cart/page.tsx:483-488). terms.html contradicts the cart and Stripe's page on three points. (1) terms.html:194 'We need a minimum of 48 hours between your order and your collection time', but the shop sells next day (LEAD_DAYS=1, shared.mjs:39) and the cart offers 30 Sep on 29 Sep. (2) terms.html:210 'Online orders are paid in full at the time of ordering', but the cart charges a 50% deposit. (3) terms.html:223-225 says full refund only 'More than 48 hours before your collection time' and 'Within 48 hours… we cannot offer a change-of-mind refund', but the cart (cart/page.ts…
- **Suggested:** terms.html §1-4: lead time 'next day for shop cakes; 2 days for custom cakes', 'a 50% deposit online, balance on collection', and 'more than 24 hours before collection: deposit refunded in full'. Vaidik must confirm the wording, since it is the legal document.

### F02 — friction, impact 5
- **Why it's yours:** deliberate — CLAUDE.md "/order is the single fork… do not add a second entry point to the shop"
- **What we found:** [P1-12] The homepage body has 0 links to /shop and 9 to /order ('Order Your Cake', 'Get a Quote', 'Start Your Order', 3x 'View Collection', 'Order Now', pricing 'Order Now', 'Start Your Order') (p1sweep.json home-390). At 390 the hero offers only 'Get a Quote' (WhatsApp glyph, goes to /order) and 'Explore Our Cakes' (scrolls to 4 custom collections, all /order). The nav 'Shop Cakes' is behind the hamburger (nav links hidden ≤1024px), and the empty-cart pill is hidden <640px. The designed route (hero -> /order -> fork 'A normal cake… ready tomorrow — from $39.99 · Shop Cakes →') puts the fork button at y=1333 at 390 (1.6 screens down) and y=1183 at 1440 (below the 900 fold) (ui-audit-P1-orde…
- **Suggested:** Decide how a normal-cake shopper gets from / to /shop. Options: (a) one text link under the hero CTAs, "Or pick one of our 15 flavours — ready tomorrow →" /shop; (b) deep-link the hero CTAs to /order#cake-order-form and rely on the nav; (c) move the /order fork into the first screen after the hero click. Also covers P2-04's "Need it sooner? Shop Cakes are ready tomorrow" link at the /order calendar.

### F05 — trust, impact 4
- **Why it's yours:** product claim — the rating/count
- **What we found:** [P1-05] The path shows '4.6 · 50+ Google reviews' on /shop (shop-app/app/page.tsx:127), '4.6 · 50+ reviews' on all 15 product pages (product-page.tsx:121), and 4.6 four more times on / (index.html:1019, 1032, 1347 '4.6 · 50+ Sydney families', 1366). The repo's own audit contradicts it. seo-baseline/2026-09-02/gbp-audit-harris-park.md:146-149 reads 'Schema aggregateRating (4.6 / 50) does not match any observed rating (4.1)', and three independent scrapes show 4.1 with 358–609 reviews. gbp-audit-riverstone.md:141-144 reads 'Both locations publish the same fabricated-looking rating (4.6 / 50)'. No source file for 4.6 exists. The rating is not linked anywhere on the shop path, and a parent comp…
- **Suggested:** Vaidik reads each shop's real rating and count from the GBP dashboard. Put the one true figure in a single constant (e.g. shop-app/lib/badges.ts REVIEWS {rating,count,countedOn}), use it on /shop and product-page.tsx, and link it to the Google profile. Until then, remove the number and keep '100% eggless'. Apply the same edit to index.html.

### F06 — doubt, impact 4
- **Why it's yours:** policy — the offer terms
- **What we found:** [P3-03] The popup says 'Subscribe and save 10%1 on your next order' (promo.js:452). The code does NOT work on the order the visitor is about to place, and nothing says so until after they have submitted: the success screen reads 'It applies to your next order, so it unlocks once you've ordered with us' (promo.js:628-630), and the email says 'First, order a cake at the usual price. Then your 10% comes off the next one' (coupon-email.mjs:89-95). The email template's own comment calls this 'This email's one genuinely confusing fact is that the code does not work yet'. The code also expires after 90 days (subscribe.mjs:24 EXPIRES_DAYS = 90), and the popup never mentions that. To a first-timer f…
- **Suggested:** Copy only, in promo.js, with no layout change. Heading: 'Subscribe for 10% off your second order'. Sub-line or footnote 1: 'Your code works from your second online order and is valid for 90 days.' Keep the same wording in the success screen and coupon-card.tsx ('Your next order' label) so the shop and the popup agree.

### F07 — friction, impact 4
- **Why it's yours:** deliberate — promo.js:20-22 "opens after real engagement: 5s or half a page" (local-SEO interstitial rule)
- **What we found:** [P3-04] Fresh visitor at 390x844: the popup opened 5.1s after navigation on / (4.4s /locations, 5.0s /indian-sweet, 5.0s /about). It is a 358x756 card over a 390x844 screen with body scroll locked. On / it covers the hero and both CTAs a visitor is still reading (ui-audit-P3-popup-before-390.png vs ui-audit-P3-popup-390.png). On /locations it covers the store address and hours that are the reason for the visit (ui-audit-P3-popup-on_locations-390.png). On /indian-sweet it sells a Signature-Cakes-only coupon to someone shopping for sweets (ui-audit-P3-popup-on_indian-sweet-390.png). Five seconds is dwell time, not engagement. Google's intrusive-interstitial guidance names popups that cover th…
- **Suggested:** promo.js: raise DELAY_MS from 5000 to about 25000, or drop the timer and keep only the 50% scroll trigger. Add locations and indian-sweet to the suppression regex at promo.js:333, for the same reason /order is already there: it covers the thing the visitor came to that page to do.

### F08 — friction, impact 4
- **Why it's yours:** deliberate — CLAUDE.md "The static nav hides that pill entirely under 640px, which is right for a CTA"
- **What we found:** [P3-16] With an empty cart, the static header at 320-1024 shows only the logo, the account icon and the hamburger. There is no way to buy a cake without opening the menu (2 taps), and the page gives no sign that an online shop exists. The shop header at the same widths shows an 'Order Now' pill (115x38, fits at 320) (ui-audit-P3-nav-_locations-390-cart0.png vs ui-audit-P3-nav-_shop_cakes_chocolate-390-cart0.png). Measured on all 7 static pages at 320/390/820/1024: pill hidden. On /shop/cart and product pages: shown. This difference is not in CLAUDE.md's list of deliberate differences. Two rules cause it: each page's own <=640 `.btn-hover-interactive{display:none}` (index.html:349) and promo…
- **Suggested:** promo.js cartCss: change the <=1024 rule to `#nav-cart{display:inline-flex!important;min-width:0!important;padding:7px 14px!important;font-size:0.75rem!important}`, without the .nn-has-items qualifier. The id beats both class rules. This matches the shop's `.nn-cta` at <=1024. Both surfaces then agree, and no shop change is needed.

### F09 — doubt, impact 4
- **Why it's yours:** policy — custom-cake payment, deposit and cancellation terms
- **What we found:** [P2-13] Nothing tells the customer what happens after WhatsApp: no reply time, no payment method or timing, no deposit or cancellation rule for custom cakes. The copy only says 'We quote you back before anything is made - nothing is charged on this page' and '...confirmed here on WhatsApp before payment'. terms.html section 1 sends custom cakes to /order with no payment terms. Sections 2-4 ('48 hours', 'paid in full', 48h refund) describe the shop and are stale against CLAUDE.md (next day, 50% deposit, 24h refund). I searched order.html, index.html and locations.html for 'reply within' / 'within 24' / 'respond' and found nothing.
- **Suggested:** Under the submit in order.html, add a three-line 'What happens next': we reply on WhatsApp with your quote, you confirm and pay [how, per Vaidik], you collect on the date you picked. Get the payment and cancellation facts from Vaidik first; do not invent them. Update terms.html in the same pass.

### F23 — trust, impact 3
- **Why it's yours:** product claim — review quotes
- **What we found:** [P1-06] The hero rotating 'quotes' (index.html:1904-1909) put quotation marks around words that are not in the reviews they are attributed to (the review text is in index.html schema, lines 647-737). Examples: '“Best cake we’ve ever had. Soft, flavourful, and 100% eggless.” — Nilesh P.' against Nilesh Patel's review 'Excellent Mango flavour cake, great customer service, and value for money.'; '— Surbhi G.' where the reviewer is 'Surbhi Sharma'; '“Custom design done perfectly. Everyone loved it.” — Vijit D.', whose review contains neither phrase; '“Amazing quality and super fresh.”' against Varuni's 'always fresh and juicy'. This is the first social proof an Instagram first-timer sees (ui-au…
- **Suggested:** index.html:1904-1909: replace each line with a verbatim excerpt from the matching reviewBody (e.g. 'the best part was how closely it matched the picture we shared' — Ankit A.) and correct the initials. Vaidik to confirm the schema texts are verbatim from Google.

### F24 — trust, impact 3
- **Why it's yours:** product claim — weekday share / "book out first"
- **What we found:** [P1-08] The cart banner says 'Heads up — four in five of our cakes go out Friday to Sunday. Weekends book out first, so it’s worth locking this in.' (cart/page.tsx:377-382). Its only source is the code comment 'Fri–Sun is 81% of every order placed' (line 162), and git 80d6aadb changed that comment from 'Sat/Sun is 81%' to 'Fri–Sun is 81%' with no new data. The only order-book figure in the repo is 'plans/Five-Year Direction — 2026-2031.md:89/303: 74% of your cakes due Friday or Saturday' (19 orders). badges.ts ORDER_BOOK has no weekday share. 'Book out' implies a capacity limit, but MAX_WEB_ORDERS_PER_DAY is an optional env var (create-checkout.mjs:69). The urgency gate in verify-blog.mjs:5…
- **Suggested:** Add the weekday share with its sample and date to ORDER_BOOK in shop-app/lib/badges.ts and render the banner from it ('Most of our cakes are collected Friday to Saturday'), or drop the 'book out / locking this in' sentence. Soften index.html:1352 the same way unless a real cap exists.

### F25 — trust, impact 3
- **Why it's yours:** policy — a remedy promise
- **What we found:** [P2-08] The 'Love it or we'll make it right' chip under the submit (order.html:791; also index.html hero) promises a remedy that is written down nowhere. terms.html covers only shop refunds and ACL rights (sections 4 and 8), with no make-it-right policy. Searching 'make it right' finds only index.html, order.html and a plans doc that lists it as trust-row copy. \|\| [P1-35] The hero risk-reversal badge 'Love it or we'll make it right' (index.html:1013) is a promise with no basis in terms.html. grep for 'make it right\|remake\|satisf' finds only the ACL statutory-rights section 8 (terms.html:261-265). It appears directly under the CTAs on the path's first page.
- **Suggested:** Ask Vaidik what the remedy actually is. Write it into terms.html (one line under section 8) and link the chip to it. If there is no set remedy, drop the chip.

### F26 — trust, impact 3
- **Why it's yours:** product claim — "most popular size"
- **What we found:** [P2-06] Three '10" is the popular size' claims contradict the order book. 'Most 20-guest parties choose the 10″ size.' (order.html:658), the guest slider's 'Most Popular' badge on 10" (CAKE_DATA popular:true, order.html:1604), and the tooltip's '✦ Most popular size' (order.html:1139). shop-app/lib/badges.ts ORDER_BOOK (32 orders, 2026-09-13) says topSize is '8 inch' at 47% of orders. I searched the repo, excluding blog/, for '20-guest', 'Most popular' and 'most-ordered' and found no source for the 10" claims. \|\| [P1-11] The homepage pricing slider tags 10-inch 'Most Popular' (index.html:1800 `popular:true` on 10"). The shop tags 8-inch 'Most ordered' (badges.ts ORDER_BOOK.topSize '8 inch', …
- **Suggested:** Remove popular:true from 10", the ✦ 'Most popular size' note, and the 'Most 20-guest parties' sentence. Replace it with the serving fact ('A 10″ serves 20-22'). If Vaidik confirms ORDER_BOOK covers custom orders too, state the real fact instead: '8″ is our most-ordered size'.

### F27 — friction, impact 3
- **Why it's yours:** deliberate — single fork
- **What we found:** [P1-14] The homepage 'How Many Guests?' slider (index.html:1320-1350) shows the shop's exact list prices ($39.99 6", $49.99 8", … $134.99 16"). Its only CTA, 'Order Now' with a chat glyph (index.html:1343), goes to /order, the custom quote form whose pitch is 'Price quoted per cake'. A parent who has just found their size and price is sent to a form that quotes instead of a page that sells that cake.
- **Suggested:** Needs Vaidik's call because of the single-fork rule: point .ps-order-btn to /shop (the listed prices are shop prices). Within the rule: relabel it 'See the 15 flavours' and route to /order#… fork. Either way, drop the chat glyph from a button that opens no chat.

### F28 — friction, impact 3
- **Why it's yours:** price — the starting-price disclosure step (added on purpose in b7e2364d)
- **What we found:** [P2-16] The #pricing-confirm-modal step is an extra tap that repeats what is already on screen. Its text ('The amount shown on this page is the starting price for your size - we'll confirm your final quote ... before you pay anything') duplicates #price-hint right above the button ('This is a starting price. We confirm the exact cost once we've seen your design, before you pay anything.'), the hero's bold line, and the last line of the WhatsApp message. It adds 1 of the 11 taps. Commit b7e2364d added it because 'people weren't reading the pricing disclaimer buried in the pre-filled WhatsApp message'. That problem is already solved by the in-form hint, which the customer reads before tapping.
- **Suggested:** Remove the modal and open WhatsApp straight from the submit. The existing #price-hint above the button carries the pricing note. If Vaidik wants to keep it, see P2-17 for the fixes it needs.

### F29 — trust, impact 3
- **Why it's yours:** policy — store trading hours
- **What we found:** [P2-35] The /order footer lists stale Riverstone hours, 'Mon–Fri 6 am – 8 pm · Sat–Sun 7 am – 7 pm' (order.html:1518). The form offers Riverstone slots only from 9:00 AM to 6:30 PM (WINDOWS, and COLLECTION in ops/catalog.mjs), and commit ac295c34 set the canonical hours to 'daily 9am-6:30pm'. The same stale string is in index.html, about.html, terms.html, privacy-policy.html, indian-sweet.html, 190 blog posts, and locations.html's own 'Opening Hours' box. The 'Prefer to Call?' card says only 'During store hours'.
- **Suggested:** Change the root-page footers to 'Daily 9 am – 6:30 pm' (blog is a separate pass) and put both shops' hours in the phone card line.

### F30 — trust, impact 3
- **Why it's yours:** product claim — allergy suitability
- **What we found:** [P2-36] The page makes an allergy-safety claim with nothing in the repo behind it: 'perfect for ... anyone with an egg allergy or intolerance' and 'not in our recipes, not in our kitchen' (order.html:1400-1412). The same page says the stores carry 'sweets, pastries and croissants' (order.html:1452); croissants are usually egg-washed, and the recorded business scope is eggless cakes plus Indian sweets only. There is no allergen or cross-contact statement anywhere in the repo. A parent with an egg-allergic child will rely on exactly this line.
- **Suggested:** Have Vaidik confirm the kitchen and stock position. Until then, say 'no eggs in any of our recipes' and drop the egg-allergy suitability sentence. Fix the ready-made line if croissants are not stocked.

### F31 — trust, impact 3
- **Why it's yours:** product claim — flavour copy flagged NEEDS VAIDIK in flavour-copy.ts
- **What we found:** [P1-10] flavour-copy.ts:1-12 is headed '⚠️ NEEDS VAIDIK'S REVIEW… Nobody has confirmed a single recipe', yet the copy ships in all 15 shop/cakes/*.html. Claims with no evidence in the repo: Rasmalai 'the one people travel for'; Pineapple 'A favourite for warm afternoons and older guests'; Lychee 'Lighter than it looks'. Butterscotch says 'a crunch of praline around the sides', and praline is normally nut-based: an allergen implication on a page whose only nut warning is on Ferrero. badges.ts 'Our pick' Lychee is also still marked NEEDS VAIDIK'S REVIEW.
- **Suggested:** Vaidik reviews flavour-copy.ts. Drop the popularity/anecdote notes that lack a source, and confirm or remove 'praline'. No layout change.

### F58 — friction, impact 2
- **Why it's yours:** policy — popup frequency trades against list growth ("put a code in someone's hand on their first visit")
- **What we found:** [P3-06] Dismissal is remembered in sessionStorage (promo.js:27,321,598), so it lasts only for that tab. After dismissing on / and continuing in the same tab, it did not return. A new tab in the same browser opened it again at 5.0s (reopenedNewTab 5015ms@320, 5027ms@390, 5012ms@1440). Instagram and Facebook in-app browsers start a fresh tab for each ad tap, so a repeat ad visitor meets the popup on every visit. The same applies to someone who has already subscribed: done() sets no flag.
- **Suggested:** promo.js: keep the seen flag in localStorage with a timestamp (safeGet/safeSet already exist) and skip for about 30 days after a dismissal. Set a permanent 'subscribed' flag in done().

### F60 — doubt, impact 2
- **Why it's yours:** lead time — how the 2-day rule is described
- **What we found:** [P2-14] The lead time is told three ways. 'Ready: 2 days from the go-ahead' (Two ways to order, order.html:852) implies the clock starts only after the quote is accepted. The fork (order.html:626) and the calendar summary say 'order today, collect in 2 days', and the calendar lets them book day+2 from today. The customer cannot tell whether the date they picked holds if the quote comes back tomorrow.
- **Suggested:** Make order.html:852 match the calendar ('Order today, collect the day after tomorrow') and add to the summary 'we quote for the date you pick'. Do not change the rule itself.

### F61 — doubt, impact 2
- **Why it's yours:** lead time — CLAUDE.md left "48 hours" copy "for a separate pass"
- **What we found:** [P2-15] The homepage contradicts itself on lead time. 'Fresh to Order, Ready in 48 Hours' (index.html:1279) sits below a hero that says 'made fresh in 2 days' and 'Fresh, made in 2 days', and /order says '2 days' (calendar days, not hours).
- **Suggested:** Change the index.html:1279 H3 to 'Fresh to Order, Ready in 2 Days'.

### F62 — trust, impact 2
- **Why it's yours:** product claim — "what people order most"
- **What we found:** [P2-07] The 'What people order most' block (#flavour-size-guide, order.html ~1361-1363) makes three unsourced claims: 'Chocolate + Ferrero Rocher - our most-ordered combination', 'Rasmalai and Butterscotch - favourites for Diwali & Eid', 'Red Velvet - the top pick for weddings & anniversaries'. The only order-book fact is Chocolate at 41% (badges.ts). verify-blog.mjs's own comments record invented detail of this kind ('top sellers for Eid') being removed before.
- **Suggested:** Replace the three lines with the one sourced fact ('Chocolate - about 4 in 10 of the cakes we sell'), or relabel the block 'Our suggestions', an opinion clearly marked as ours.

### F63 — trust, impact 2
- **Why it's yours:** product claim — "we text you"
- **What we found:** [P1-09] /shop says 'Collect in store — Harris Park or Riverstone. We text you the moment it's ready.' (shop-app/app/page.tsx:239). Stripe's after_submit repeats 'We'll text you the moment it's ready.' (create-checkout.mjs:225). The repo has no sending mechanism: ops/app.mjs has no SMS, wa.me or 'ready' action, and grep for sms/twilio/'text you' in netlify/ and ops/ finds only copy. CLAUDE.md does say the mobile 'is how the shop says a cake is ready', so it is a manual practice with nothing enforcing it.
- **Suggested:** Confirm with Vaidik that staff text every web order when it is ready. If not, reword to what is true ('We’ll call or text if anything changes'). No code needed if it is confirmed.

### F64 — friction, impact 2
- **Why it's yours:** deliberate — CLAUDE.md "The one deliberate difference: /shop hides the pill… showCart"
- **What we found:** [P1-20] With an empty cart, the product page header shows a rose 'Order Now →' pill linking to /shop, the board (productPill in p1flow.json; ui-audit-P1-chocolate-390.png). It is the most prominent button in the first screen, and it takes the customer away from the cake they are looking at, while the real 'Add to order' is 1.46 screens down.
- **Suggested:** shop-header.tsx: hide the empty-cart pill on /cakes/* as well, e.g. `showCart = n > 0 \|\| (path !== '/' && !path.startsWith('/cakes/'))`. This is the same reasoning as the board exception. Apply the same rule in promo.js only if the static pages ever gain product pages.

### F65 — friction, impact 2
- **Why it's yours:** deliberate — CLAUDE.md board row order (2026-09-21)
- **What we found:** [P1-23] At 390 the first two cards on the board are the two most expensive, Rasmalai 'from $49.99' and Ferrero Rocher 'from $44.99' (y 523–732). Chocolate, 41% of orders (badges.ts) and 'the safe choice' (flavour-copy.ts), first appears at y=1216–1426, the third row, 1.4 screens down (ui-audit-P1-shop-390.png; p1sweep.json shop-390).
- **Suggested:** Keep the three rows and swap the last two: Premium → Classics → Specialty in ROWS (shop-app/app/page.tsx:81-102). Classics is where the most-ordered cake lives, and membership stays derived. Needs Vaidik's call since the order was decided on 2026-09-21.

### F66 — trust, impact 2
- **Why it's yours:** product claim — rating in the popup
- **What we found:** [P3-12] The popup's proof list ('100% eggless — every cake, every time', 'Collect from Harris Park or Riverstone', 'Rated 4.6 on Google'; promo.js:497-501) is display:none below 768px (promo.js:399), which covers most of this traffic. The mobile popup therefore never says 100% eggless. The rating is backed by the repo: index.html:583-588 aggregateRating 4.6 / 50 reviews, and order.html:595 '4.6 · 50+ Google reviews'. At 390x844 there is 44px to spare below the card (card bottom 800).
- **Suggested:** promo.js: on mobile only, add one live-text line under .nnp-sub: '100% eggless · Rated 4.6 on Google'. Hide that line again under `@media (max-height:700px)` so 320x568 keeps its room.

### F68 — trust, impact 3
- **Why it's yours:** product claim — review snippets
- **What we found:** [P2-11] Real proof is missing at the moment of commitment. Under the submit, the 'We match your photo' chip has nothing behind it. At 820/1440 the right column is the 'Prefer to Call?' card, stretched to 1559px / 1523px, and about 75% of it is empty white (ui-audit-P2-1440-cards.png, ui-audit-P2-820-form-top.png). The proof exists in the repo: verbatim reviews in index.html/locations.html JSON-LD (Ankit: 'how closely it matched the picture we shared'; Surbhi: 'jungle theme cake ... praised the customization'), and 12 real custom-cake photos in cake_photos/ that this page shows 3,000+px below the form.
- **Suggested:** In the existing phone card (order.html:796), below the Call button, add two verbatim review snippets and three small real-cake thumbnails linking to #gallery. On phones, add one verbatim line under .cta-badges. Keep the card, palette and type.

### F69 — trust, impact 3
- **Why it's yours:** product claim — review snippets
- **What we found:** [P1-07] Real reviews about Signature flavours already exist in the repo: Karunesh Singh 'I ordered a 14" Butterscotch Cake and pickup was perfectly on time' (index.html:668), Nilesh Patel 'Excellent Mango flavour cake… value for money' (723), Patel Hirendra 'cookies and cream cake for my son's 5th birthday… Exactly what we wanted' (695), Varuni Bottu 'favourites are pineapple and mango flavours' (737). None appears on /shop, the product pages or the cart. The only proof there is the unverified '4.6 · 50+ reviews' line (P1-05).
- **Suggested:** product-page.tsx: under the rating line, show one short verbatim quote + first name + initial when the flavour has one (Butterscotch, Mango, Cookies & Cream, Pineapple). Keep them as a small map in shop-app/lib/flavour-copy.ts with the source line. Verify the wording against Google first.

### F72 — doubt, impact 2
- **Why it's yours:** deliberate — CLAUDE.md "THE NAVBAR IS ONE NAVBAR" fixes the bar's shape
- **What we found:** [P3-27] The chrome never names the business in text or says 'eggless'. The logo is the chef mascot only; the name lives in alt and aria-label. The labels (Shop Cakes · Indian Sweets · Custom Cakes · Locations · Blog) are generic, and pickup-only is not stated. A parent comparing with The Cheesecake Shop who lands on /locations, /about or a product page sees no '100% eggless' in the header. The .nav-wordmark CSS exists (index.html:119-127) but no page has ever used it (git log -S finds nothing).
- **Suggested:** Smallest option that keeps the layout: at >=1025 only, add a live-text wordmark 'Num Num's Bakery' using the existing .nav-wordmark class beside the logo, on both surfaces (static markup via promo.js injection, and shop-header.tsx). Or accept this as deliberate, since the hero and product pages carry '100% eggless'. Flagged for a decision, not a clear defect.

### F97 — doubt, impact 1
- **Why it's yours:** product claim — "in 30 Seconds"
- **What we found:** [P2-41] The 'Get a Quote in 30 Seconds' CTA (order.html:1365) makes a time claim nothing supports. The measured form is 10-11 taps plus typing, and the link reloads the page (see P2-05).
- **Suggested:** Relabel it 'Start your quote' and point it at #cake-order-form.

### F98 — trust, impact 1
- **Why it's yours:** product claim — "Most ordered" on custom flavours
- **What we found:** [P2-45] The flavour menu offers 15 options with no help choosing, even though a real fact exists: Chocolate is 41% of cakes sold (badges.ts ORDER_BOOK) and already carries 'Most ordered' on /shop.
- **Suggested:** Use the existing .nd-opt-tag slot to tag Chocolate 'Most ordered' in the custom flavour menu, with the same wording and source as the shop card.

### F99 — friction, impact 1
- **Why it's yours:** deliberate — CLAUDE.md "The times are a scrolling list in a box"
- **What we found:** [P1-30] The cart is 2.4 screens at 390 with 1 line and 2.9 with 2 lines + coupon open. At 320 it is 3.7 / 4.8. The summary pay button sits at y=1594 (390, 1 line), and the sticky bar covers it. Tapping a day opens the time popover with 4 of 23 Harris Park slots visible at 390 and 3 of 23 at 320. The 11 evening slots (5–10pm) need a scroll inside a scroll (ui-audit-P1-cart-time-popover-390.png / -320.png).
- **Suggested:** Low priority and deliberate. If anything: when the popover opens on a day with no time chosen, start the list scrolled to the band the shop is busiest in, taken from data, not guessed. Otherwise leave it.

### F100 — trust, impact 1
- **Why it's yours:** product claim — "Most ordered" wording
- **What we found:** [P1-36] The 8" chip carries 'Most ordered' on every flavour, including Rasmalai and Ferrero Rocher (ORDER_BOOK.topSize applied in product-page.tsx:149-153). The fact is 47% of all orders, not of that flavour, and on a premium page it reads as 'most people buy the 8-inch Rasmalai'.
- **Suggested:** product-page.tsx:151 label 'Most ordered size'. Alternatively, show it only on the page of the flavour it describes.

### F101 — doubt, impact 1
- **Why it's yours:** deliberate — CLAUDE.md "Empty it reads 'Order Now'"
- **What we found:** [P3-32] 'Order' points at two different doors. The empty pill 'Order Now' opens /shop, but 'Custom Cakes' opens /order, and in the phone menu 'Order Now' repeats 'Shop Cakes', which sits two rows above it with the same destination. On /about, 'Order a Cake' and 'Browse Our Cakes' both go to /order. A first-timer cannot tell whether 'Order Now' means the shop or the quote form.
- **Suggested:** Label the empty state for the action it takes, e.g. 'Order online', in promo.js paintCart (label) and shop-header.tsx cartLabel, on both surfaces. Leave 'Your order (n)' unchanged.

### F102 — bug, impact 1
- **Why it's yours:** Netlify function — subscribe.mjs
- **What we found:** [P3-34] The consent record is not quite the wording shown. subscribe.mjs:27-30 stores the text with straight apostrophes (Num Num's, you've), while the popup shows curly ones (promo.js:470). The stored record also omits the offer terms the visitor actually agreed next to: the heading and footnote 1 (Signature Cakes only), and the unlock and 90-day rules from P3-03. This is cosmetic today, but the claim in the code is 'the exact words'.
- **Suggested:** Export one CONSENT_WORDING string and have promo.js render that exact string, or make the characters identical. If P3-03 changes the offer copy, store it alongside the consent so the record shows what was offered.


## Before / after (N8, 2026-09-29)

| Path @ width | Taps | Scroll px | CTA fold screens | Max CLS | Blockers |
|---|---|---|---|---|---|
| P1@m390 | 9 → 9 | 556 → 655 | 0 → 0 | 0 → 0 | 0 → 0 |
| P2@m390 | 11 → 11 | 1811 → 1703 | 0 → 0 | 0 → 0 | 0 → 0 |
| P3@m390 | 2 → 2 | 0 → 0 | 0 → 0 | 0 → 0 | 1 → 1 |
| P1@d1440 | 8 → 8 | 158 → 234 | 0 → 0 | 0.016 → 0.012 | 0 → 0 |
| P2@d1440 | 11 → 11 | 1767 → 1700 | 0 → 0 | 0.018 → 0.004 | 0 → 0 |
| P3@d1440 | 2 → 2 | 0 → 0 | 0 → 0 | 0.048 → 0.049 | 1 → 1 |

The walker follows a fixed script, so it can't show fewer taps unless a step is removed. Most of the fixes answer a doubt in place, fix a tap target or pressed state, or remove a dead end. None of that changes a step count.
- Scroll went up on P1 phone (556 → 655px), because the cart has more content above the pay controls (deposit line, refund window, directions link). The sticky pay bar still keeps pay at 0 fold screens.
- P2 at 390 now ends with a same-tab navigation to WhatsApp (F52), which is why the walker loses its page context at the last step. That's the intended behaviour.
- Checkout returns 404 locally because Netlify Functions don't run under serve.mjs. Same as baseline.
- The offer popup still opens on the homepage after about 5s. It's a deliberate newsletter trigger and is listed under Needs Vaidik.

Fixed and pushed: 66 findings. Skipped: F77 (CLS 0.011–0.017 at desktop only). Still open (auto, not reached): F93, F95, F103, F104. Needs Vaidik: 33.
