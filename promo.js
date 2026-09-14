/*
 * The offer popup: a newsletter signup, and nothing else.
 *
 * It takes a first name and an email, hands back a 10% code, and never asks
 * for a password or an account. Signing in is a separate decision made
 * somewhere else — this exists to grow the list and to put a code in someone's
 * hand on their first visit.
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
  var CAKE_IMG = '/brand_assets/popup-cake.webp';

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
      + '.btn-hover-interactive{display:none!important;}'
      + '#mobile-menu-btn.open .ham-bar:nth-child(1){transform:translateY(8px) rotate(45deg);}'
      + '#mobile-menu-btn.open .ham-bar:nth-child(2){opacity:0;transform:scaleX(0.4);}'
      + '#mobile-menu-btn.open .ham-bar:nth-child(3){transform:translateY(-8px) rotate(-45deg);}}';
    document.head.appendChild(st);
  }

  navBreakpointCss();

  /* ------------------------------------------------------ the cakes menu */

  /**
   * "Our Cakes" in the nav, with Signature Flavours and Custom Cakes behind it.
   *
   * The two ranges are one question with two answers — a cake we designed or a
   * cake you design — and sitting them as siblings in a flat nav made a visitor
   * compare them against Locations and Blog. Grouping them puts the choice
   * where it belongs, and takes two labels off a pill that already needed the
   * hamburger at 1024px.
   *
   * Injected here for the same reason as the account menu and the cart badge:
   * this is the only script on all ~243 static pages. The static markup keeps
   * both plain links, so with JS off the nav still reaches both pages — and
   * `verify-blog.mjs`'s shop-first gate still reads the shape it expects.
   *
   * The trigger is a BUTTON, not a link. A menu parent that navigates on click
   * fires the moment a mouse pauses on its way to the item below it, which
   * lands you on a page you never chose.
   *
   * It takes over the tubelight indicator for itself. The inline script in each
   * page captured its link list before this file runs, so the two <a>s it holds
   * are detached the moment they move in here — on /order that left the active
   * page with no indicator at all, because a removed node measures zero.
   */
  var CAKES_CSS = ''
    + '.nn-cakes{position:relative;display:inline-flex;align-items:center;}'
    + '.nn-cakes-btn{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;'
    + 'cursor:pointer;font-family:Jost,sans-serif;font-weight:500;font-size:0.875rem;letter-spacing:0.02em;}'
    + '.nn-cakes-btn svg{transition:transform .22s cubic-bezier(.34,1.3,.64,1);}'
    + '.nn-cakes-btn[aria-expanded="true"] svg{transform:rotate(180deg);}'
    // padding-top is the bridge: without it the pointer crosses a dead gap on
    // its way from the trigger to the first item and the menu shuts underneath.
    + '.nn-cakes-pop{position:absolute;top:100%;left:50%;z-index:120;padding-top:9px;'
    + 'opacity:0;visibility:hidden;transform:translateX(-50%) translateY(-5px);'
    + 'transition:opacity .18s ease,transform .24s cubic-bezier(.34,1.3,.64,1),visibility .18s;}'
    + '.nn-cakes-pop.nn-open{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0);}'
    + '.nn-cakes-card{width:17.5rem;max-width:calc(100vw - 24px);padding:6px;background:#FFF8F2;'
    + 'border:1px solid rgba(200,84,120,0.18);border-radius:0.7rem;text-align:left;'
    + 'box-shadow:0 2px 6px rgba(44,26,14,.06),0 18px 38px -14px rgba(44,26,14,.28);}'
    + '.nn-cakes-item{display:block;padding:10px 13px;border-radius:0.5rem;text-decoration:none;'
    + 'transition:background-color .16s ease;}'
    + '.nn-cakes-item+.nn-cakes-item{margin-top:2px;}'
    + '.nn-cakes-item:hover,.nn-cakes-item:focus-visible{background:rgba(200,84,120,0.08);outline:none;}'
    + '.nn-cakes-item:focus-visible{box-shadow:inset 0 0 0 2px #C85478;}'
    + '.nn-cakes-name{display:flex;align-items:center;gap:6px;font-family:Jost,sans-serif;'
    + 'font-size:0.9rem;font-weight:600;line-height:1.25;color:#2C1A0E;}'
    + '.nn-cakes-name svg{opacity:0;transform:translateX(-4px);transition:opacity .16s ease,transform .16s ease;}'
    + '.nn-cakes-item:hover .nn-cakes-name svg,.nn-cakes-item:focus-visible .nn-cakes-name svg'
    + '{opacity:1;transform:translateX(0);}'
    + '.nn-cakes-item[aria-current="page"] .nn-cakes-name{color:#C85478;}'
    + '.nn-cakes-desc{display:block;margin-top:3px;font-family:Jost,sans-serif;font-size:0.76rem;'
    + 'line-height:1.4;color:rgba(92,58,34,0.62);}'
    // The pill is hidden for the hamburger from 1024px down (see
    // navBreakpointCss), and a hover menu has no meaning on a touch screen
    // anyway — the mobile menu lists both, grouped, below.
    + '@media (max-width:1024px){.nn-cakes{display:none!important;}}'
    + '@media (prefers-reduced-motion:reduce){.nn-cakes-pop,.nn-cakes-btn svg,.nn-cakes-name svg'
    + '{transition-duration:.01ms!important;}}'
    + '.nn-m-group{margin:0;padding:18px 0 2px;font-family:Jost,sans-serif;font-size:0.68rem;'
    + 'font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(92,58,34,0.45);}'
    + '#mobile-menu > a.nn-m-sub{padding-left:14px;}';

  var CHEV = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
    + ' stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<polyline points="6 9 12 15 18 9"/></svg>';
  var ARROW = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C85478"'
    + ' stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  // What each range actually is. The difference between them is lead time and
  // who draws the cake, so that is what the two lines say — a menu of two
  // near-identical names with no subtitles makes the reader guess.
  var CAKES_ITEMS = [
    { href: '/shop', name: 'Signature Flavours',
      desc: '15 cakes, priced online. Ready tomorrow.' },
    { href: '/build-your-cake', name: 'Build Your Cake',
      desc: 'Design your own, step by step. 48 hours.' },
    { href: '/order', name: 'Custom Cakes',
      desc: 'Weddings, kids, baby showers — see our work.' }
  ];

  function mountCakesMenu() {
    if (document.querySelector('.nn-cakes')) return;
    // Found through the link rather than by container id. Most pages hold the
    // nav in #nav-pill, a handful of older posts use #nav-links — and on at
    // least one, #nav-pill is the sliding indicator div, so an id lookup finds
    // an empty box and the menu silently never mounts.
    var shopLink = document.querySelector('a.nav-link[href="/shop"]');
    if (!shopLink) return;
    var pill = shopLink.parentNode;
    var customLink = pill.querySelector('a.nav-link[href="/order"]');
    if (!customLink) return;

    var st = document.createElement('style');
    st.id = 'nn-cakes-css';
    st.textContent = CAKES_CSS;
    document.head.appendChild(st);

    var path = location.pathname.replace(/\/+$/, '') || '/';
    var here = path === '/shop' || path.indexOf('/shop/') === 0 ? '/shop'
             : path === '/build-your-cake' ? '/build-your-cake'
             : path === '/order' ? '/order' : null;

    var wrap = document.createElement('span');
    wrap.className = 'nn-cakes';
    wrap.innerHTML = '<button type="button" class="nav-link nn-cakes-btn" aria-expanded="false"'
      + ' aria-haspopup="true">Our Cakes' + CHEV + '</button>'
      + '<div class="nn-cakes-pop"><div class="nn-cakes-card" role="menu" aria-label="Our Cakes">'
      + CAKES_ITEMS.map(function (it) {
          return '<a class="nn-cakes-item" role="menuitem" href="' + it.href + '"'
            + (here === it.href ? ' aria-current="page"' : '') + '>'
            + '<span class="nn-cakes-name">' + it.name + ARROW + '</span>'
            + '<span class="nn-cakes-desc">' + it.desc + '</span></a>';
        }).join('')
      + '</div></div>';

    pill.insertBefore(wrap, shopLink);
    shopLink.parentNode.removeChild(shopLink);
    customLink.parentNode.removeChild(customLink);

    var btn = wrap.querySelector('.nn-cakes-btn');
    var pop = wrap.querySelector('.nn-cakes-pop');
    var items = Array.prototype.slice.call(wrap.querySelectorAll('.nn-cakes-item'));
    if (here) btn.classList.add('nav-active');

    /* -- the tubelight indicator, which the page's own script can no longer
          drive for these two pages because its link list is now detached -- */
    var ind = document.getElementById('nav-indicator');
    function place(el) {
      if (!ind) return;
      if (!el) { ind.style.width = '0'; return; }
      var p = pill.getBoundingClientRect(), r = el.getBoundingClientRect();
      ind.style.left = (r.left - p.left - 4) + 'px';
      ind.style.width = r.width + 'px';
    }
    var activeEl = pill.querySelector('.nav-active');
    if (here) requestAnimationFrame(function () { place(btn); });
    btn.addEventListener('mouseenter', function () { place(btn); });
    // Each remaining link's own mouseleave still returns the indicator to the
    // stale active node it captured, so the pill gets the last word.
    pill.addEventListener('mouseleave', function () { place(activeEl); });

    var shut;
    function show(on) {
      window.clearTimeout(shut);
      pop.classList.toggle('nn-open', on);
      btn.setAttribute('aria-expanded', String(on));
    }
    function delayedClose() {
      window.clearTimeout(shut);
      shut = window.setTimeout(function () { show(false); }, 160);
    }

    wrap.addEventListener('mouseenter', function () { show(true); });
    wrap.addEventListener('mouseleave', delayedClose);
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      show(btn.getAttribute('aria-expanded') !== 'true');
    });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Down') { e.preventDefault(); show(true); items[0].focus(); }
    });
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') { show(false); btn.focus(); return; }
      var i = items.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key === 'ArrowDown' || e.key === 'Down') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      if (e.key === 'ArrowUp' || e.key === 'Up') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    });
    // Tabbing past the last item, or clicking anywhere else, closes it.
    wrap.addEventListener('focusout', function (e) {
      if (!wrap.contains(e.relatedTarget)) show(false);
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) show(false);
    });

    /* -- the same grouping in the hamburger, where hover means nothing -- */
    var mob = document.getElementById('mobile-menu');
    if (!mob || mob.querySelector('.nn-m-group')) return;
    var mShop = mob.querySelector('a[href="/shop"]:not(#nav-cart-m)');
    var mCustom = mob.querySelector('a[href="/order"]');
    if (!mShop || !mCustom) return;
    var cap = document.createElement('p');
    cap.className = 'nn-m-group';
    cap.textContent = 'Our Cakes';
    mob.insertBefore(cap, mShop);

    // Rebuilt from CAKES_ITEMS rather than from the two links that happen to
    // be in the markup. /build-your-cake has no static counterpart — it is not
    // in the 243 files' navs — so a phone would otherwise be the one place the
    // builder is unreachable from the menu.
    var have = {};
    have[mShop.getAttribute('href')] = mShop;
    have[mCustom.getAttribute('href')] = mCustom;
    var prev = cap;
    CAKES_ITEMS.forEach(function (it) {
      var a = have[it.href];
      if (!a) {
        a = document.createElement('a');
        a.setAttribute('href', it.href);
      }
      a.className = 'nn-m-sub';
      a.textContent = it.name;
      mob.insertBefore(a, prev.nextSibling);
      prev = a;
    });
  }

  mountCakesMenu();

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
  // Injected rather than added to 242 inline <style> blocks, and only once
  // somebody actually has a cake in the cart.
  function mobileCartCss() {
    if (document.getElementById('nn-cart-css')) return;
    var st = document.createElement('style');
    st.id = 'nn-cart-css';
    st.textContent = '@media (max-width:1024px){'
      + '#nav-cart.nn-has-items{display:inline-flex!important;min-width:0!important;'
      + 'padding:7px 14px!important;font-size:0.75rem!important;'
      + 'background:#C85478!important;color:#fff!important;border-color:#C85478!important;}'
      + '#nav-cart.nn-has-items .bhi-bg,#nav-cart.nn-has-items .bhi-hover{display:none!important;}'
      + '#nav-cart.nn-has-items .bhi-text{transform:none!important;opacity:1!important;}}';
    document.head.appendChild(st);
  }

  function paintCart() {
    var pill = document.getElementById('nav-cart');
    var mob = document.getElementById('nav-cart-m');
    if (!pill && !mob) return;

    var n = 0;
    try {
      var cart = JSON.parse(safeGet('localStorage', 'nn_cart_v1') || '{}');
      if (cart && Array.isArray(cart.lines)) n = cart.lines.length;
    } catch (e) { /* a stale or half-written cart is simply no cart */ }

    // "Your order" is what the shop's own header calls it. One name for one
    // thing, the whole way through — and an empty cart still needs to be a
    // door into the shop, not a dead button.
    var label = n ? 'Your order (' + n + ')' : 'Order Now';
    var href = n ? '/shop/cart' : '/shop';

    if (pill) {
      pill.setAttribute('href', href);
      // The static nav hides this pill entirely under 640px, which is fine for
      // a CTA and wrong for a cart — most of this traffic is on a phone, and a
      // cart you cannot see is a cart you assume you lost. A non-empty one
      // comes back as a compact filled chip beside the hamburger.
      pill.classList.toggle('nn-has-items', n > 0);
      if (n > 0) mobileCartCss();
      var plain = pill.querySelector('.bhi-text');
      var hover = pill.querySelector('.bhi-hover');
      if (plain) plain.textContent = label;
      // The hover copy is the words followed by an arrow. Replace the words.
      if (hover && hover.firstChild) hover.firstChild.nodeValue = label + ' ';
      if (!plain && !hover) pill.textContent = label;
    }
    if (mob) { mob.setAttribute('href', href); mob.textContent = label; }
  }

  paintCart();
  // Another tab checking out, and the bfcache restoring this page on Back.
  window.addEventListener('storage', paintCart);
  window.addEventListener('pageshow', paintCart);

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

  if (safeGet('sessionStorage', SEEN_KEY)) return;
  if (signedIn()) return;                                 // already a member
  if (location.pathname.indexOf('/shop') === 0) return;   // already in the shop
  // The legal pages are where this very form SENDS people. Covering the
  // document someone stepped out to read, with the offer they stepped out of,
  // is hostile.
  if (/^\/(terms|privacy-policy)\/?$/.test(location.pathname)) return;

  var opened = false;
  var lastFocus = null;
  var root = null;
  var prevOverflow = '';

  function lockScroll(on) {
    if (on) {
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      if (window.__lenis && window.__lenis.stop) window.__lenis.stop();
    } else {
      document.body.style.overflow = prevOverflow;
      if (window.__lenis && window.__lenis.start) window.__lenis.start();
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
    '.nnp-left{display:flex;flex-direction:column;justify-content:center;padding:36px 28px}',
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
    '.nnp-note{margin:22px 0 0;font-size:.72rem;font-weight:300;line-height:1.6;color:#7A5A44;text-align:center}',
    '.nnp-note a{color:#7A5A44;text-decoration:underline}',
    '.nnp-note a:hover{color:#C85478}',
    '.nnp-err{margin:14px 0 0;font-size:.82rem;font-weight:500;color:#B3261E;text-align:center}',
    '.nnp-alt{margin:18px 0 0;text-align:center;font-size:.8rem;color:#7A5A44}',
    '.nnp-alt a{display:inline-flex;align-items:center;min-height:32px;margin:-8px;padding:8px;color:#C85478;font-weight:600;text-decoration:none}',
    '.nnp-alt a:hover{text-decoration:underline}',
    /* photo side */
    '.nnp-pic{position:relative;overflow:hidden;order:-1;height:150px;background:#F8EEE6}',
    '@media(min-width:768px){.nnp-pic{order:0;height:auto}}',
    '.nnp-pic img{display:block;width:100%;height:100%;object-fit:cover;transform:scale(1.28);transform-origin:center 46%}',
    '.nnp-x{position:absolute;top:12px;right:12px;z-index:3;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border:none;border-radius:9999px;background:rgba(255,255,255,.92);color:#2C1A0E;font-size:20px;line-height:1;cursor:pointer;box-shadow:0 2px 10px rgba(44,26,14,.18);transition:background .2s ease}',
    '.nnp-x:hover{background:#fff}',
    '.nnp-btn:focus-visible,.nnp-x:focus-visible,.nnp-alt a:focus-visible,.nnp-note a:focus-visible{outline:2px solid #C85478;outline-offset:3px}',
    /* success */
    '.nnp-code{display:block;margin:20px auto 0;padding:16px 20px;max-width:280px;border:2px dashed #C85478;border-radius:.75rem;background:#FDF3F6;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:1.5rem;font-weight:700;letter-spacing:.12em;color:#96355A;text-align:center;font-variant-numeric:lining-nums}',
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
      '<div class="nnp-card" data-lenis-prevent>' +
        '<div class="nnp-grid">' +
          '<div class="nnp-left">' +
            '<div class="nnp-form-wrap">' +
              '<h2 class="nnp-h" id="nnp-h">Receive 10% off your first order</h2>' +
              '<p class="nnp-sub">Join us for new flavours, seasonal specials and ' +
                'festival pre-order dates &mdash; plus 10% off your first order.</p>' +
              '<form novalidate>' +
                '<div class="nnp-field">' +
                  '<label class="nnp-sr" for="nnp-name" hidden>First name</label>' +
                  '<input class="nnp-input" id="nnp-name" type="text" autocomplete="given-name" placeholder="First name">' +
                '</div>' +
                '<div class="nnp-field">' +
                  '<label class="nnp-sr" for="nnp-email" hidden>Email</label>' +
                  '<input class="nnp-input" id="nnp-email" type="email" autocomplete="email" inputmode="email" placeholder="Email">' +
                '</div>' +
                '<p class="nnp-err" hidden></p>' +
                '<button type="submit" class="nnp-btn" disabled>Get my 10% off</button>' +
              '</form>' +
              '<p class="nnp-note">By submitting, you agree to receive marketing communications ' +
                'from Num Num’s Bakery via email and confirm that you’ve read and understood our ' +
                '<a href="/privacy-policy" target="_blank" rel="noopener">Privacy Policy</a>.</p>' +
              '<p class="nnp-alt">Already have an account? <a href="/shop/log-in">Log in</a></p>' +
            '</div>' +
          '</div>' +
          '<div class="nnp-pic">' +
            '<button type="button" class="nnp-x" aria-label="Close">&times;</button>' +
            '<img src="' + CAKE_IMG + '" alt="" aria-hidden="true">' +
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
    }).catch(function () { /* celebration is optional; the code still works */ });
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
      btn.disabled = !ok;
      return ok;
    }
    email.addEventListener('input', validate);

    function done(code) {
      root.querySelector('.nnp-form-wrap').innerHTML =
        '<h2 class="nnp-h">You’re on the list</h2>' +
        '<p class="nnp-sub">Here’s your 10% off. Use it at checkout on your next cake — ' +
          'it’s saved to your email address, so just enter the same one.</p>' +
        '<strong class="nnp-code">' + code.replace(/[<>&"]/g, '') + '</strong>' +
        '<button type="button" class="nnp-btn">Browse the cakes</button>';
      root.querySelector('.nnp-form-wrap .nnp-btn')
        .addEventListener('click', function () { location.href = '/shop'; });
      celebrate();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
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
        done(body.code);
      }).catch(function (e2) {
        err.textContent = (e2 && e2.message) || 'Could not sign you up just then. Try again.';
        err.hidden = false;
        btn.textContent = 'Get my 10% off';
        validate();
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
