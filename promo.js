/*
 * The offer popup: a newsletter signup, and nothing else.
 *
 * It takes a first name and an email and never asks for a password or an
 * account. Signing in is a separate decision made somewhere else — this exists
 * to grow the list. There is no discount attached (Vaidik, 2026-10-06): the 10%
 * code it used to promise was dropped, so nothing here may offer one.
 *
 * Consent is express: the heading, the button and the notice under the form
 * all say the purpose is marketing email. That is what makes it lawful without
 * a tickbox — ACMA prohibits a PRE-TICKED box sitting beside some other
 * primary action, which is the opposite shape to a form whose only job is
 * subscribing. The wording shown is stored alongside the consent by
 * netlify/functions/subscribe.mjs, so there is a record of what was agreed.
 *
 * Runs on every static page, including ~234 blog posts, so it is vanilla and
 * dependency-free. canvas-confetti is imported ONLY on success — a dialog most
 * visitors dismiss must not tax every page load.
 *
 * It deliberately does NOT open on arrival. Google penalises interstitials that
 * block content immediately after a click from search, and this business runs on
 * local SEO. It opens after real engagement instead: 5s or half a page.
 */
(function () {
  'use strict';

  var SEEN_KEY = 'nn_promo_seen_v1';
  var AUTH_KEY_RE = /^sb-.+-auth-token$/;
  var DELAY_MS = 5000;
  var SCROLL_FRACTION = 0.5;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Private mode throws on storage access, so never let it take the page down.
  function safeGet(store, key) {
    try { return window[store].getItem(key); } catch (e) { return null; }
  }
  function safeSet(store, key, value) {
    try { window[store].setItem(key, value); } catch (e) { /* no-op */ }
  }

  /**
   * The nav collapses to the hamburger below 1024px, not 640px.
   *
   * Each page's own stylesheet collapses it at 640, which was already tight
   * and stopped fitting the day "Shop" became "Signature Cakes": the pill
   * needs ~950px and a tablet at 768 pushed the page into a horizontal
   * scroll. Injected here rather than edited into 243 inline <style> blocks,
   * and deliberately a SEPARATE query — widening the existing one would drag
   * the trust-bar and hero rules along with it.
   */
  function navBreakpointCss() {
    if (document.getElementById('nn-nav-css')) return;
    var st = document.createElement('style');
    st.id = 'nn-nav-css';
    st.textContent = '@media (min-width:641px) and (max-width:1024px){'
      + '.nav-link{display:none!important;}'
      + '#nav-indicator{display:none!important;}'
      + '#nav-pill{background:transparent!important;border:none!important;'
      + 'backdrop-filter:none!important;-webkit-backdrop-filter:none!important;padding:0!important;}'
      + '#mobile-menu-btn{display:flex!important;}'
      // The legal pages build their own button into this root; without it
      // they had no navigation at all between 641 and 1024px.
      + '#mobile-hamburger-root{display:flex!important;}'
      + '.btn-hover-interactive{display:none!important;}'
      + '#mobile-menu-btn.open .ham-bar:nth-child(1){transform:translateY(8px) rotate(45deg);}'
      + '#mobile-menu-btn.open .ham-bar:nth-child(2){opacity:0;transform:scaleX(0.4);}'
      + '#mobile-menu-btn.open .ham-bar:nth-child(3){transform:translateY(-8px) rotate(-45deg);}}'
      // Hiding the nav's pill by CLASS hid every page button sharing it —
      // /about's "Order a Cake" vanished below 1025px. Content buttons come
      // back; :not(#nav-cart) outranks this rule and each page's own <=640 one.
      + '@media (max-width:1024px){a.btn-hover-interactive:not(#nav-cart){display:inline-flex!important;}}';
    document.head.appendChild(st);
  }

  navBreakpointCss();

  /* ---------------------------------------------------- the account menu */

  /**
   * The person icon in the nav, and the little panel behind it.
   *
   * Injected rather than written into 243 static files, for the same reason
   * the cart badge is painted here: this is the only script already on all of
   * them. It mirrors the shop's own AccountMenu — two states, the same two
   * doors signed out, the address you are signed in as and the way out signed
   * in. Deliberately no "My orders": there is no order-history page, and a
   * menu item that opens nothing is worse than an absent one.
   *
   * Signed-in detection is the same `sb-*-auth-token` match used to suppress
   * the popup — derived from the project ref, so it survives a project change.
   * Reading the email out of it is best effort: a shape we do not recognise
   * just means the menu says "Signed in" without naming the address.
   */
  var ACCOUNT_CSS = ''
    + '.nn-acct{position:relative;display:inline-flex;align-items:center;}'
    + '.nn-acct-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;'
    + 'height:38px;width:38px;margin-left:4px;border:0;background:transparent;border-radius:9999px;'
    + 'color:inherit;cursor:pointer;padding:0;transition:background-color .16s ease,color .16s ease;}'
    // Over the homepage's video the links and the hamburger are white; the account icon stayed espresso (2.8:1).
    + 'body:has(.hero-video) #navbar:not(.scrolled) .nn-acct-btn{color:#fff;}'
    + '.nn-acct-btn:hover{background:rgba(200,84,120,0.12);color:#C85478;}'
    + '.nn-acct-btn:focus-visible{outline:2px solid #C85478;outline-offset:2px;}'
    + '.nn-acct-btn[aria-expanded="true"]{background:rgba(200,84,120,0.15);color:#C85478;}'
    + '.nn-acct-dot{position:absolute;right:6px;top:6px;height:8px;width:8px;border-radius:9999px;'
    + 'background:#C85478;box-shadow:0 0 0 2px #FFF8F2;}'
    + '.nn-acct-pop{position:absolute;top:calc(100% + 8px);right:0;z-index:120;width:15rem;'
    + 'max-width:calc(100vw - 24px);padding:8px;background:#FFF8F2;border:1px solid rgba(200,84,120,0.18);'
    + 'border-radius:0.7rem;box-shadow:0 2px 6px rgba(44,26,14,.06),0 18px 38px -14px rgba(44,26,14,.28);'
    + 'font-family:Jost,sans-serif;text-align:left;}'
    + '.nn-acct-pop h4{margin:4px 8px 8px;font-size:0.7rem;font-weight:600;letter-spacing:0.1em;'
    + 'text-transform:uppercase;color:rgba(92,58,34,0.55);}'
    + '.nn-acct-who{margin:0 8px 10px;padding-bottom:10px;font-size:0.84rem;font-weight:500;color:#2C1A0E;'
    + 'border-bottom:1px solid rgba(200,84,120,0.15);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    + '.nn-acct-pop a,.nn-acct-pop button.nn-acct-item{display:block;width:100%;margin:6px 0 0;padding:10px 12px;'
    + 'border-radius:9999px;font-size:0.85rem;font-weight:600;text-align:center;text-decoration:none;cursor:pointer;}'
    + '.nn-acct-primary{background:#C85478;color:#FFF8F2;border:2px solid #C85478;}'
    + '.nn-acct-primary:hover{background:#A03D5E;border-color:#A03D5E;}'
    + '.nn-acct-ghost{background:transparent;color:#C85478;border:2px solid #C85478;}'
    + '.nn-acct-ghost:hover{background:rgba(200,84,120,0.08);}';

  function accountEmail() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!AUTH_KEY_RE.test(k)) continue;
        var raw = localStorage.getItem(k);
        // Newer supabase-js stores a base64- prefixed JSON blob.
        if (raw && raw.indexOf('base64-') === 0) raw = atob(raw.slice(7));
        var v = JSON.parse(raw);
        var u = (v && v.user) || (v && v.currentSession && v.currentSession.user);
        if (u && u.email) return u.email;
        return '';   // signed in, address not readable from this shape
      }
    } catch (e) { /* private mode, or a shape we do not know */ }
    return null;    // signed out
  }

  function mountAccount() {
    var pill = document.getElementById('nav-cart');
    if (!pill || document.querySelector('.nn-acct')) return;

    var st = document.createElement('style');
    st.textContent = ACCOUNT_CSS;
    document.head.appendChild(st);

    var who = accountEmail();
    var wrap = document.createElement('span');
    wrap.className = 'nn-acct';
    wrap.innerHTML =
      '<button type="button" class="nn-acct-btn" aria-expanded="false" aria-haspopup="dialog" aria-label="'
      + (who === null ? 'Account' : 'Account menu') + '">'
      + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"'
      + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
      + (who === null ? '' : '<span class="nn-acct-dot"></span>')
      + '</button>';

    var pop = document.createElement('div');
    pop.className = 'nn-acct-pop';
    pop.hidden = true;
    pop.innerHTML = '<h4>My account</h4>' + (who === null
      ? '<a class="nn-acct-primary" href="/shop/log-in">Sign in</a>'
        + '<a class="nn-acct-ghost" href="/shop/sign-up">Create an account</a>'
      : '<p class="nn-acct-who">' + (who ? who.replace(/[<>&]/g, '') : 'Signed in') + '</p>'
        + '<a class="nn-acct-ghost" href="/shop/cart">Your order</a>'
        + '<button type="button" class="nn-acct-item nn-acct-primary" data-signout>Sign out</button>');
    wrap.appendChild(pop);
    pill.parentNode.insertBefore(wrap, pill.nextSibling);

    var btn = wrap.querySelector('.nn-acct-btn');
    function show(on) {
      pop.hidden = !on;
      btn.setAttribute('aria-expanded', String(on));
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); show(pop.hidden); });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) show(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !pop.hidden) { show(false); btn.focus(); }
    });
    var out = pop.querySelector('[data-signout]');
    if (out) out.addEventListener('click', function () {
      // No Supabase client on a static page, so the session is cleared the
      // only way available here: drop its key and reload.
      try {
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var k = localStorage.key(i);
          if (AUTH_KEY_RE.test(k)) localStorage.removeItem(k);
        }
      } catch (e) { /* no-op */ }
      location.reload();
    });
  }

  mountAccount();

  /* ------------------------------------------------------- the header cart */

  /**
   * The cart badge on the static site's nav pill.
   *
   * It lives in this file because this is the only script already loaded on
   * all ~242 static pages, and a cart that disappears the moment you leave
   * /shop reads as a cart that emptied itself. It runs ABOVE the suppression
   * guards below — those stop the popup, not the cart — but never on /shop,
   * which has its own header.
   *
   * Same origin, so the key the Next app writes is the key read here. See
   * shop-app/lib/cart.ts.
   */
  /*
   * The cart pill must be the SAME BUTTON as the shop's, on every page.
   *
   * It was not. The shop renders `.nn-cta` / `.nn-cta-full` and fills solid
   * rose the moment the cart has something in it, at every width. The static
   * pages render `.btn-hover-interactive`, whose resting state is an outline
   * with a small rose dot that expands on hover — and the filled state was
   * scoped to a `max-width:1024px` media query, so on a laptop the same cart
   * was a filled pill on /shop and an outlined one with a dot everywhere
   * else. Same cart, same words, two buttons.
   *
   * So `#nav-cart` opts out of the slide-swap and matches `.nn-cta` exactly:
   * label plus arrow at rest, solid when it holds something, darkening on
   * hover. Scoped to the id, so every other `.btn-hover-interactive` on the
   * static pages keeps its animation.
   *
   * Injected rather than written into 242 inline <style> blocks, which is
   * also what stops the two drifting apart again — there is one rule to edit.
   */
  function cartCss() {
    if (document.getElementById('nn-cart-css')) return;
    var st = document.createElement('style');
    st.id = 'nn-cart-css';
    st.textContent =
      // Resting state: no dot, no slide, label and arrow just sit there.
      '#nav-cart .bhi-bg,#nav-cart .bhi-hover{display:none!important;}'
      + '#nav-cart .bhi-text{transform:none!important;opacity:1!important;'
      + 'display:inline-flex;align-items:center;gap:6px;}'
      + '#nav-cart{transition:background-color .3s ease,color .3s ease,border-color .3s ease;}'
      + '#nav-cart:hover{background:#C85478!important;color:#FFF8F2!important;}'
      // Holding something: solid, at EVERY width — this is the bit that was
      // hidden behind a media query. Cream, not #fff, because that is what
      // `.nn-cta-full` uses and "almost the same white" is still a difference.
      + '#nav-cart.nn-has-items{background:#C85478!important;color:#FFF8F2!important;'
      + 'border-color:#C85478!important;}'
      + '#nav-cart.nn-has-items:hover{background:#A03D5E!important;border-color:#A03D5E!important;}'
      // Over a dark hero the nav is transparent and its links are white; a
      // rose outline there measured 1.32:1 against the brown — the main CTA
      // in the bar was the hardest thing in it to read. Cream until scrolled.
      // Only the homepage has that transparent state (it alone toggles
      // .scrolled; every other nav is light from the top), hence :has().
      // (The shop has no transparent state, so there is nothing to mirror.)
      + 'body:has(.hero-video) #navbar:not(.scrolled) #nav-cart:not(.nn-has-items){color:#FFF8F2!important;'
      + 'border-color:rgba(255,248,242,.75)!important;}'
      + 'body:has(.hero-video) #navbar:not(.scrolled) #nav-cart:not(.nn-has-items):hover{border-color:#C85478!important;}'
      // The phone menu's CTA pill, one spec on both surfaces (the shop's
      // #nn-mobile-menu rule carries the same numbers). Cream text like the
      // header pill, and weight 500: Jost never goes above it.
      + '#mobile-menu>div>a{color:#FFF8F2;font-weight:500;}'
      // A press, as the shop's pill and icon button now have. Transform only.
      + '#nav-cart:active,.nn-acct-btn:active{transform:scale(.97);}'
      + '@media (prefers-reduced-motion:reduce){#nav-cart:active,.nn-acct-btn:active{transform:none;}}'
      // Keyboard focus on the logo, the hamburger and the menu links was the
      // browser's default ring (blue, or a faint 1px one) while everything
      // else in the bar draws the 2px rose one. Same rule as the shop's.
      + '#navbar a[aria-label*="home"]:focus-visible,#mobile-menu-btn:focus-visible,#ham-btn:focus-visible,'
      + '#mobile-menu a:focus-visible{outline:2px solid #C85478;outline-offset:2px;border-radius:9999px;}'
      + '#mobile-menu>a:hover{color:#C85478;}'
      // The static nav hides this pill entirely under 640px, which is fine
      // for a CTA and wrong for a cart — most of this traffic is on a phone,
      // and a cart you cannot see is a cart you assume you lost.
      + '@media (max-width:1024px){#nav-cart.nn-has-items{display:inline-flex!important;'
      + 'min-width:0!important;padding:7px 14px!important;font-size:0.75rem!important;}}';
    document.head.appendChild(st);
  }

  /** The shop's pill carries an arrow at rest; this is the same one. */
  function cartArrow() {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '13'); svg.setAttribute('height', '13');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2.5');
    svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    var line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', '5'); line.setAttribute('y1', '12');
    line.setAttribute('x2', '19'); line.setAttribute('y2', '12');
    var poly = document.createElementNS(NS, 'polyline');
    poly.setAttribute('points', '12 5 19 12 12 19');
    svg.appendChild(line); svg.appendChild(poly);
    return svg;
  }

  function paintCart() {
    var pill = document.getElementById('nav-cart');
    var mob = document.getElementById('nav-cart-m');
    if (!pill && !mob) return;

    // Cakes, as the shop counts them: one line of three read "(1)" here and
    // "(3)" the moment the customer crossed into /shop.
    var n = cartCakes();

    // "Your order" is what the shop's own header calls it. One name for one
    // thing, the whole way through — and an empty cart still needs to be a
    // door into the shop, not a dead button.
    var label = n ? 'Your order (' + n + ')' : 'Order Now';
    // An empty cart is a door into the shop everywhere EXCEPT /order, where the
    // page you are already on is the custom-cake order form. Sending the most
    // prominent button on that page off to the Signature shop was the loudest
    // of five links that routed people away from the thing they came to do.
    var onOrderPage = location.pathname.replace(/\/+$/, '') === '/order';
    var href = n ? '/shop/cart' : (onOrderPage ? '#custom-form' : '/shop');

    if (pill) {
      pill.setAttribute('href', href);
      pill.classList.toggle('nn-has-items', n > 0);
      cartCss();
      var plain = pill.querySelector('.bhi-text');
      var target = plain || pill;
      // Rebuilt rather than patched, so repainting on a storage event cannot
      // leave two arrows behind.
      target.textContent = label;
      target.appendChild(cartArrow());
      // The slide-swap layer is permanently hidden for this pill now, but its
      // leftover copy still lands in textContent — so the button reads
      // "Your order (1) Order Now" to anything parsing the DOM. Empty it.
      var hover = pill.querySelector('.bhi-hover');
      if (hover) hover.textContent = '';
    }
    if (mob) { mob.setAttribute('href', href); mob.textContent = label; }
  }

  paintCart();
  // Another tab checking out, and the bfcache restoring this page on Back.
  window.addEventListener('storage', paintCart);
  window.addEventListener('pageshow', paintCart);

  // The phone menu, on every static page. Back from the next page restores
  // this one from the bfcache exactly as it was left — menu open, scrolling
  // locked — and a menu link that stays on the page (/order's #custom-form)
  // scrolled behind a menu that never closed. The page's own button closes
  // it, so its scroll-lock bookkeeping stays in one place.
  function closeMobileMenu() {
    var b = document.getElementById('mobile-menu-btn');
    if (b && b.classList.contains('open')) b.click();
  }
  window.addEventListener('pageshow', function (e) { if (e.persisted) closeMobileMenu(); });
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('#mobile-menu a[href^="#"]')) closeMobileMenu();
  });

  // Supabase derives its session key from the project ref, so matching any
  // sb-*-auth-token survives a project or auth-domain change. Hardcoding the
  // ref means signed-in customers silently start seeing the offer again.
  function signedIn() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        if (AUTH_KEY_RE.test(localStorage.key(i))) return true;
      }
    } catch (e) { /* private mode throws; treat as signed out */ }
    return false;
  }

  // Cakes, not rows — the shop's cartCount sums quantities, and so does this.
  function cartCakes() {
    try {
      var c = JSON.parse(safeGet('localStorage', 'nn_cart_v1') || '{}');
      if (!c || !Array.isArray(c.lines)) return 0;
      return c.lines.reduce(function (n, l) { return n + (Number(l && l.qty) || 1); }, 0);
    } catch (e) { return 0; }                           // a half-written cart is no cart
  }

  if (safeGet('sessionStorage', SEEN_KEY)) return;
  if (signedIn()) return;                                 // already a member
  // A cake already in the cart means somebody is mid-order — the same reason
  // /order is excluded below.
  if (cartCakes() > 0) return;
  if (location.pathname.indexOf('/shop') === 0) return;   // already in the shop
  // The legal pages are where this very form SENDS people. Covering the
  // document someone stepped out to read, with the offer they stepped out of,
  // is hostile.
  //
  // /order is here for the same reason, one step further on: it is the custom
  // cake form. This popup locks body scroll and can fire on a 50% scroll depth
  // that a half-filled form reaches easily, so it covers somebody mid-order to
  // sell them a newsletter. The shop is already excluded above;
  // the other page that takes an order deserves the same.
  if (/^\/(terms|privacy-policy|order)\/?$/.test(location.pathname)) return;

  var opened = false;
  var lastFocus = null;
  var root = null;
  var prevOverflow = '';

  function lockScroll(on) {
    if (on) {
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prevOverflow;
    }
  }

  /* ---------------------------------------------------------------- styles */

  var CSS = [
    '.nnp-backdrop{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(24,12,5,.62);opacity:0;transition:opacity .25s ease}',
    '.nnp-backdrop.nnp-in{opacity:1}',
    '.nnp-card{position:relative;width:100%;max-width:860px;max-height:92dvh;overflow-y:auto;border-radius:1.25rem;background:#fff;box-shadow:0 24px 60px -12px rgba(44,26,14,.45);transform:translateY(10px) scale(.985);transition:transform .28s cubic-bezier(.34,1.56,.64,1);font-family:Jost,system-ui,sans-serif;color:#2C1A0E;line-height:1.7}',
    '.nnp-backdrop.nnp-in .nnp-card{transform:none}',
    '.nnp-grid{display:grid}',
    '@media(min-width:768px){.nnp-grid{grid-template-columns:1fr 1fr;grid-template-rows:minmax(0,1fr);max-height:92dvh}.nnp-card{overflow:hidden}.nnp-left{overflow-y:auto;min-height:0}}',
    /* form side */
    '.nnp-left{display:flex;flex-direction:column;padding:36px 28px}',
    '.nnp-form-wrap{margin:auto 0}',
    '@media(min-width:768px){.nnp-left{padding:52px 44px}}',
    '.nnp-h{font-family:"Cormorant Garamond",Georgia,serif;font-weight:600;font-size:1.9rem;line-height:1.15;letter-spacing:-.02em;text-align:center;text-wrap:balance;margin:0}',
    '@media(min-width:768px){.nnp-h{font-size:2.2rem}}',
    '.nnp-sub{font-size:.92rem;font-weight:300;line-height:1.6;color:#5C3A22;text-align:center;margin:14px 0 0}',
    '.nnp-field{margin:22px 0 0}',
    '.nnp-input{width:100%;border:1px solid #D9C7BA;border-radius:.5rem;background:#fff;padding:13px 16px;font:inherit;font-size:.95rem;color:#2C1A0E;transition:border-color .15s ease,box-shadow .15s ease}',
    '.nnp-input::placeholder{color:#A89384}',
    '.nnp-input:focus{outline:none;border-color:#C85478;box-shadow:0 0 0 3px rgba(200,84,120,.15)}',
    '.nnp-input[aria-invalid="true"]{border-color:#B3261E}',
    '.nnp-btn{display:inline-flex;width:100%;align-items:center;justify-content:center;gap:8px;margin:22px 0 0;padding:14px 22px;border:none;border-radius:9999px;font:inherit;font-weight:600;font-size:.95rem;color:#fff;background:#C85478;cursor:pointer;box-shadow:0 4px 14px rgba(200,84,120,.28);transition:background .2s cubic-bezier(.34,1.56,.64,1),transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s ease}',
    '.nnp-btn:hover:not(:disabled){background:#A03D5E;transform:translateY(-2px);box-shadow:0 8px 24px rgba(200,84,120,.35)}',
    '.nnp-btn:active:not(:disabled){transform:scale(.98)}',
    '.nnp-btn:disabled{background:#EADFD6;color:#A08E80;cursor:not-allowed;box-shadow:none;transform:none}',
    '.nnp-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    '.nnp-btn{text-decoration:none;text-align:center;box-sizing:border-box}',
    '.nnp-note{margin:22px 0 0;font-size:.72rem;font-weight:300;line-height:1.6;color:#7A5A44;text-align:center}',
    '.nnp-note+.nnp-note{margin-top:8px}',
    '.nnp-note a{color:#7A5A44;text-decoration:underline;display:inline-block;padding:7px 2px;margin:-7px 0}',
    '.nnp-note a:hover{color:#C85478}',
    '.nnp-err{margin:14px 0 0;font-size:.82rem;font-weight:500;color:#B3261E;text-align:center}',
    '.nnp-alt{margin:18px 0 0;text-align:center;font-size:.8rem;color:#7A5A44}',
    '.nnp-alt a{display:inline-flex;align-items:center;min-height:32px;margin:-8px;padding:8px;color:#C85478;font-weight:600;text-decoration:none}',
    '.nnp-alt a:hover{text-decoration:underline}',
    /* Brand side: a dark panel carrying one line, so the popup is still
       recognisably ours without promising anything. */
    '.nnp-pic{position:relative;overflow:hidden;order:-1;min-height:164px;display:flex;align-items:center;justify-content:center;padding:22px 18px;background:linear-gradient(135deg,#2C1A0E 0%,#5C3A22 60%,#2C1A0E 100%)}',
    '@media(min-width:768px){.nnp-pic{order:0;height:auto;padding:36px 28px}}',
    // A short phone (320x568) held 852px of popup in a 523px card: the email field sat under the fold and the button under an inner scroll.
    "@media(max-width:767px) and (max-height:620px){.nnp-pic{min-height:0;padding:12px 16px}.nnp-left{padding:22px 22px}.nnp-h{font-size:1.5rem}.nnp-sub{margin-top:8px;font-size:.86rem}.nnp-field{margin-top:14px}.nnp-note{margin-top:14px}.nnp-pic .nnp-line{font-size:.95rem;padding:0 34px}}",
    '.nnp-pic::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 22% 42%,rgba(200,84,120,.30) 0%,transparent 62%),radial-gradient(ellipse at 82% 88%,rgba(227,182,100,.16) 0%,transparent 58%)}',
    '.nnp-pic::before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(90deg,rgba(255,248,242,.085) 0 1px,transparent 1px 34px);-webkit-mask-image:linear-gradient(105deg,#000 0%,rgba(0,0,0,.35) 45%,transparent 78%);mask-image:linear-gradient(105deg,#000 0%,rgba(0,0,0,.35) 45%,transparent 78%)}',
    '.nnp-offer{position:relative;z-index:1;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center}',
    '.nnp-line{margin:0;max-width:300px;font-family:Jost,system-ui,sans-serif;font-weight:300;font-size:1.45rem;line-height:1.25;letter-spacing:-.02em;color:#FFF8F2;text-align:center;text-wrap:balance}',
    '@media(min-width:768px){.nnp-offer{width:min(330px,100%);align-items:flex-start}.nnp-line{font-size:2rem;text-align:left}}',
    /* Eyebrow and perks are DESKTOP ONLY. On mobile the panel is a ~164px band
       stacked above the form, and anything more than the line pushes the
       email field off the first screen. */
    '.nnp-eyebrow,.nnp-perks{display:none}',
    '@media(min-width:768px){',
      '.nnp-eyebrow{display:block;margin:0 0 20px;font-size:.62rem;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:#E8A4B5}',
      '.nnp-perks{display:block;margin:26px 0 0;padding:0;list-style:none;width:min(330px,100%)}',
      '.nnp-perks li{position:relative;margin:0 0 9px;padding-left:22px;font-size:.8rem;font-weight:300;line-height:1.5;color:rgba(255,248,242,.78)}',
      '.nnp-perks li:last-child{margin-bottom:0}',
      '.nnp-perks li::before{content:"";position:absolute;left:0;top:.42em;width:11px;height:6px;border-left:1.5px solid #E8A4B5;border-bottom:1.5px solid #E8A4B5;transform:rotate(-45deg)}',
    '}',
    /* A 40px opaque white disc was the heaviest thing on a dark panel and
       outweighed everything beside it. Translucent and smaller: still a
       32px tap target with a hairline to hold its edge. */
    '.nnp-x{position:absolute;top:14px;right:14px;z-index:3;display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:1px solid rgba(255,248,242,.28);border-radius:9999px;background:rgba(255,248,242,.14);color:#FFF8F2;font-size:16px;line-height:1;cursor:pointer;transition:background .2s ease,border-color .2s ease}',
    '.nnp-x:hover{background:rgba(255,248,242,.26);border-color:rgba(255,248,242,.45)}',
    '.nnp-btn:focus-visible,.nnp-x:focus-visible,.nnp-alt a:focus-visible,.nnp-note a:focus-visible{outline:2px solid #C85478;outline-offset:3px}',
    '@media(prefers-reduced-motion:reduce){.nnp-backdrop,.nnp-card,.nnp-btn{transition:none!important}}',
  ].join('');

  /* ---------------------------------------------------------------- markup */

  function build() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var back = document.createElement('div');
    back.className = 'nnp-backdrop';
    back.setAttribute('role', 'dialog');
    back.setAttribute('aria-modal', 'true');
    back.setAttribute('aria-labelledby', 'nnp-h');
    back.innerHTML =
      '<div class="nnp-card">' +
        '<div class="nnp-grid">' +
          '<div class="nnp-left">' +
            '<div class="nnp-form-wrap">' +
              '<h2 class="nnp-h" id="nnp-h">Join the Num Num&rsquo;s newsletter</h2>' +
              '<p class="nnp-sub">New flavours, seasonal specials and festival ' +
                'pre-order dates, straight to your inbox.</p>' +
              '<form novalidate>' +
                '<div class="nnp-field">' +
                  '<label class="nnp-sr" for="nnp-name">First name</label>' +
                  '<input class="nnp-input" id="nnp-name" type="text" autocomplete="given-name" placeholder="First name">' +
                '</div>' +
                '<div class="nnp-field">' +
                  '<label class="nnp-sr" for="nnp-email">Email</label>' +
                  '<input class="nnp-input" id="nnp-email" type="email" autocomplete="email" inputmode="email" placeholder="Email">' +
                '</div>' +
                '<p class="nnp-err" role="alert" hidden></p>' +
                '<button type="submit" class="nnp-btn">Subscribe</button>' +
              '</form>' +
              '<p class="nnp-note">By submitting, you agree to receive marketing communications ' +
                'from Num Num’s Bakery via email and confirm that you’ve read and understood our ' +
                '<a href="/privacy-policy" target="_blank" rel="noopener">Privacy Policy</a>.</p>' +
              '<p class="nnp-alt">Already have an account? <a href="/shop/log-in">Log in</a></p>' +
            '</div>' +
          '</div>' +
          '<div class="nnp-pic">' +
            '<button type="button" class="nnp-x" aria-label="Close">&times;</button>' +
            '<div class="nnp-offer">' +
              '<span class="nnp-eyebrow">From our kitchen</span>' +
              '<p class="nnp-line">Sweet news, once in a while.</p>' +
              '<ul class="nnp-perks">' +
                '<li>100% eggless &mdash; every cake, every time</li>' +
                '<li>Collect from Harris Park or Riverstone</li>' +
                '<li>Rated 4.6 on Google</li>' +
              '</ul>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(back);
    return back;
  }

  /* ------------------------------------------------------------- behaviour */

  function trapFocus(e) {
    if (!root || e.key !== 'Tab') return;
    var items = root.querySelectorAll('button,input,a[href]');
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
    else trapFocus(e);
  }

  function close() {
    if (!root) return;
    root.classList.remove('nnp-in');
    lockScroll(false);
    document.removeEventListener('keydown', onKey);
    var node = root;
    root = null;
    setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 260);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function celebrate() {
    import('https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/+esm').then(function (m) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var fire = m.default;
      var base = { startVelocity: 32, spread: 360, ticks: 70, zIndex: 2147483001,
                   colors: ['#C85478', '#E8A4B5', '#E3B664', '#A03D5E', '#FFF8F2'] };
      fire(Object.assign({}, base, { particleCount: 55, origin: { x: 0, y: 1 }, angle: 60 }));
      fire(Object.assign({}, base, { particleCount: 55, origin: { x: 1, y: 1 }, angle: 120 }));
    }).catch(function () { /* celebration is optional */ });
  }

  function open() {
    if (opened) return;
    opened = true;
    safeSet('sessionStorage', SEEN_KEY, '1');
    lastFocus = document.activeElement;
    root = build();
    lockScroll(true);

    var form = root.querySelector('form');
    var name = root.querySelector('#nnp-name');
    var email = root.querySelector('#nnp-email');
    var btn = root.querySelector('.nnp-btn');
    var err = root.querySelector('.nnp-err');

    root.querySelector('.nnp-x').addEventListener('click', close);
    root.addEventListener('mousedown', function (e) { if (e.target === root) close(); });
    document.addEventListener('keydown', onKey);

    // Only the email is required. A name is worth asking for and not worth
    // losing a subscriber over, so a blank one just means a less personal email.
    function validate() {
      var ok = EMAIL_RE.test(email.value.trim());
      email.setAttribute('aria-invalid', email.value === '' || ok ? 'false' : 'true');
      return ok;
    }
    email.addEventListener('input', function () { validate(); err.hidden = true; });

    function done() {
      root.querySelector('.nnp-form-wrap').innerHTML =
        '<h2 class="nnp-h" id="nnp-h">You&rsquo;re on the list</h2>' +
        '<p class="nnp-sub">Thanks for joining us. We&rsquo;ll be in touch with ' +
          'new flavours and festival pre-order dates.</p>' +
        '<a class="nnp-btn" href="/shop">Browse the cakes</a>';
      celebrate();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // The button is never greyed out for a missing answer: a dead button
      // explains nothing. Say what is wrong and put the cursor there.
      if (!validate()) {
        email.setAttribute('aria-invalid', 'true');
        err.textContent = 'Enter your email to subscribe.';
        err.hidden = false;
        email.focus();
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Signing you up…';
      err.hidden = true;

      fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.value.trim(), email: email.value.trim() }),
      }).then(function (res) {
        return res.json().then(function (body) {
          if (!res.ok) throw new Error(body && body.error);
          return body;
        });
      }).then(function (body) {
        done();
      }).catch(function (e2) {
        err.textContent = (e2 && e2.message) || 'Could not sign you up just then. Try again.';
        err.hidden = false;
        btn.textContent = 'Subscribe';
        btn.disabled = false;
      });
    });

    requestAnimationFrame(function () { root.classList.add('nnp-in'); });
    setTimeout(function () { if (root) name.focus(); }, 300);
  }

  /* ---------------------------------------------------------------- trigger */

  // Never on arrival — see the note at the top of this file.
  var timer = setTimeout(open, DELAY_MS);
  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    if (max > 0 && window.scrollY / max >= SCROLL_FRACTION) {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      open();
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();
