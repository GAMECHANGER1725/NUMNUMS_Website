/*
 * Session-scoped sign-up offer.
 *
 * Runs on every static page, including ~360 blog posts, so it is vanilla and
 * dependency-free. The Supabase SDK (~40KB) and canvas-confetti are imported
 * ONLY when someone actually submits — a dialog most visitors dismiss must not
 * tax every page load.
 *
 * It deliberately does NOT open on arrival. Google penalises interstitials that
 * block content immediately after a click from search, and this business runs on
 * local SEO. It opens after real engagement instead: 5s or half a page.
 */
(function () {
  'use strict';

  var SEEN_KEY = 'nn_promo_seen_v1';
  var AUTH_KEY = 'sb-stnmoxsojqbbtgjwkzrc-auth-token';
  var SUPABASE_URL = 'https://stnmoxsojqbbtgjwkzrc.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_5h1APV-FTtXzvF1kDL2uVg_BvE6FB9Y';
  var DELAY_MS = 5000;
  var SCROLL_FRACTION = 0.5;
  var MIN_PASSWORD = 8;
  var PREFS_KEY = 'nn_signup_prefs_v1';   // read back by shop-app/lib/prefs.ts
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var MOBILE_RE = /^(?:\+?61|0)4\d{8}$/;  // 0412 345 678, +61 412 345 678, 61412345678

  // Private mode throws on storage access, so never let it take the page down.
  function safeGet(store, key) {
    try { return window[store].getItem(key); } catch (e) { return null; }
  }
  function safeSet(store, key, value) {
    try { window[store].setItem(key, value); } catch (e) { /* no-op */ }
  }

  if (safeGet('sessionStorage', SEEN_KEY)) return;
  if (safeGet('localStorage', AUTH_KEY)) return;          // already has an account
  if (location.pathname.indexOf('/shop') === 0) return;   // already in the shop
  // The legal pages are where the sign-up form SENDS people. Covering them with
  // the very offer they stepped out of to read the terms is hostile, and it
  // would obscure the document they are being asked to agree to.
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
    '.nnp-card{position:relative;width:100%;max-width:880px;max-height:92dvh;overflow-y:auto;border-radius:1.5rem;background:#fff;box-shadow:0 24px 60px -12px rgba(44,26,14,.45);transform:translateY(10px) scale(.985);transition:transform .28s cubic-bezier(.34,1.56,.64,1);font-family:Jost,system-ui,sans-serif;color:#2C1A0E;line-height:1.7}',
    '.nnp-backdrop.nnp-in .nnp-card{transform:none}',
    '.nnp-grid{display:grid}',
    '@media(min-width:768px){.nnp-card{overflow:hidden}.nnp-grid{grid-template-columns:1.02fr 1fr;grid-template-rows:minmax(0,1fr);max-height:92dvh}.nnp-left{overflow:hidden}.nnp-right{overflow-y:auto;min-height:0}}',
    '.nnp-left{position:relative;display:flex;flex-direction:column;justify-content:center;overflow:hidden;padding:22px 22px;background:linear-gradient(135deg,#2C1A0E 0%,#5C3A22 60%,#2C1A0E 100%)}',
    '@media(min-width:768px){.nnp-left{padding:40px 36px}}',
    '.nnp-left::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 22% 42%,rgba(200,84,120,.30) 0%,transparent 62%),radial-gradient(ellipse at 82% 88%,rgba(227,182,100,.16) 0%,transparent 58%)}',
    '.nnp-left>*{position:relative;z-index:1}',
    '.nnp-eyebrow{font-size:.68rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#E8A4B5;margin:0}',
    '.nnp-h{font-family:"Cormorant Garamond",Georgia,serif;font-weight:300;font-size:1.7rem;line-height:1.06;letter-spacing:-.01em;color:#fff;margin:8px 0 0;max-width:15ch}',
    '@media(min-width:768px){.nnp-h{font-size:2.5rem}}',
    '.nnp-sub{font-size:.875rem;font-weight:300;color:rgba(255,255,255,.72);margin:8px 0 0;max-width:34ch}',
    '.nnp-foot{font-size:.72rem;font-weight:300;color:rgba(255,255,255,.55);margin:14px 0 0}',
    /* voucher — notches cut with a mask so they work over the gradient */
    '.nnp-coupon{position:relative;overflow:hidden;margin:16px 0 0;max-width:344px;border-radius:14px;color:#fff;background:linear-gradient(115deg,#96355A 0%,#C85478 34%,#DB5F7C 58%,#E89A72 84%,#E3B664 104%);box-shadow:inset 0 1px 0 rgba(255,255,255,.32);filter:drop-shadow(0 10px 22px rgba(44,26,14,.38));font-variant-numeric:lining-nums;transition:transform .22s cubic-bezier(.34,1.56,.64,1);-webkit-mask:radial-gradient(circle 13px at 0 50%,transparent 98%,#000 100%),radial-gradient(circle 13px at 100% 50%,transparent 98%,#000 100%);-webkit-mask-composite:source-in;mask:radial-gradient(circle 13px at 0 50%,transparent 98%,#000 100%),radial-gradient(circle 13px at 100% 50%,transparent 98%,#000 100%);mask-composite:intersect}',
    '.nnp-coupon-row{display:flex;align-items:stretch;gap:14px;padding:16px}',
    '@media(min-width:640px){.nnp-coupon-row{gap:20px;padding:20px 24px}}',
    '.nnp-amt{display:flex;flex-direction:column;justify-content:center;padding-right:14px}',
    '.nnp-amt b{font-family:"Cormorant Garamond",Georgia,serif;font-weight:300;font-size:2.9rem;line-height:.82;letter-spacing:-.02em}',
    '@media(min-width:640px){.nnp-amt b{font-size:3.75rem}}',
    '.nnp-amt span{margin-top:4px;font-size:.7rem;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:rgba(255,255,255,.9)}',
    '.nnp-perf{width:1px;flex:none;align-self:stretch;background:repeating-linear-gradient(to bottom,rgba(255,255,255,.9) 0 6px,transparent 6px 12px)}',
    '.nnp-for{display:flex;flex-direction:column;justify-content:center;gap:6px}',
    '.nnp-for i{font-style:normal;font-size:.66rem;font-weight:600;line-height:1.2;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.9)}',
    '.nnp-for code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.9rem;font-weight:600;letter-spacing:.16em}',
    '.nnp-sheen{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .3s ease}',
    /* form side */
    '.nnp-right{padding:24px 22px}',
    '@media(min-width:768px){.nnp-right{padding:28px 34px}}',
    '.nnp-title{font-family:"Cormorant Garamond",Georgia,serif;font-weight:300;font-size:1.9rem;line-height:1.15;letter-spacing:-.01em;margin:0}',
    '.nnp-lede{font-size:.875rem;color:#5C3A22;margin:4px 0 0}',
    '.nnp-label{display:block;margin:0 0 6px;font-size:.78rem;font-weight:500;color:#5C3A22}',
    '.nnp-input{width:100%;border:1px solid #EDE0D6;border-radius:.5rem;background:#fff;padding:10px 14px;font:inherit;font-size:.9rem;color:#2C1A0E;transition:border-color .15s ease,box-shadow .15s ease}',
    '.nnp-input::placeholder{color:#A89384}',
    '.nnp-input:focus{outline:none;border-color:#C85478;box-shadow:0 0 0 3px rgba(200,84,120,.15)}',
    '.nnp-field{margin:0 0 11px}',
    '.nnp-input[aria-invalid="true"]{border-color:#B3261E}',
    '.nnp-hint{margin:5px 0 0;font-size:.72rem;line-height:1.4;color:#5C3A22}',
    '.nnp-pill{margin-left:8px;border-radius:9999px;background:#F8EEE6;padding:2px 8px;font-size:.62rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#C85478}',
    /* consent: a named benefit and a stated frequency, never a pre-ticked box */
    '.nnp-consent{margin:2px 0 12px;border:1px solid #EDE0D6;border-radius:.75rem;background:#FBF4EE;padding:12px}',
    '.nnp-consent-h{margin:0;font-size:.84rem;font-weight:600;line-height:1.35;color:#2C1A0E}',
    '.nnp-consent-p{margin:4px 0 0;font-size:.76rem;line-height:1.45;color:#5C3A22}',
    '.nnp-consent-foot{margin:10px 0 0;font-size:.7rem;line-height:1.45;color:#7A5A44}',
    '.nnp-check{display:flex;align-items:flex-start;gap:10px;margin:10px 0 0;padding:4px 0;min-height:32px;font-size:.78rem;line-height:1.45;color:#5C3A22;cursor:pointer}',
    '.nnp-check b{color:#2C1A0E}',
    '.nnp-terms{margin:0 0 12px}',
    '.nnp-terms a{color:#C85478;font-weight:600}',
    '.nnp-check input{margin:3px 0 0;width:16px;height:16px;flex:none;accent-color:#C85478}',
    '.nnp-google{display:flex;width:100%;align-items:center;justify-content:center;gap:10px;margin:14px 0 0;padding:10px 16px;border:1px solid #EDE0D6;border-radius:9999px;background:#fff;font:inherit;font-weight:500;font-size:.875rem;color:#2C1A0E;cursor:pointer;transition:background .2s ease}',
    '.nnp-google:hover{background:#F8EEE6}',
    '.nnp-google:focus-visible{outline:2px solid #C85478;outline-offset:3px}',
    '.nnp-gnote{margin:8px 0 0;text-align:center;font-size:.7rem;line-height:1.45;color:#7A5A44}',
    '.nnp-gnote a{color:#C85478;font-weight:500}',
    '.nnp-or{display:flex;align-items:center;gap:12px;margin:12px 0}',
    '.nnp-or::before,.nnp-or::after{content:"";flex:1;height:1px;background:#EDE0D6}',
    '.nnp-or span{font-size:.68rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#5C3A22}',
    '.nnp-btn{display:inline-flex;width:100%;align-items:center;justify-content:center;gap:6px;padding:11px 22px;border:none;border-radius:9999px;font:inherit;font-weight:600;font-size:.875rem;color:#fff;background:#C85478;cursor:pointer;box-shadow:0 4px 14px rgba(200,84,120,.28);transition:background .2s cubic-bezier(.34,1.56,.64,1),transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s ease}',
    '.nnp-btn:hover:not(:disabled){background:#A03D5E;transform:translateY(-2px);box-shadow:0 8px 24px rgba(200,84,120,.35)}',
    '.nnp-btn:active:not(:disabled){transform:scale(.97)}',
    '.nnp-btn:disabled{background:#EADFD6;color:#A08E80;cursor:not-allowed;box-shadow:none;transform:none}',
    '.nnp-alt{margin:12px 0 0;text-align:center;font-size:.8rem;color:#5C3A22}',
    '.nnp-alt a{display:inline-flex;align-items:center;min-height:32px;margin:-8px;padding:8px;color:#C85478;font-weight:600}',
    '.nnp-err{margin:0 0 10px;font-size:.8rem;font-weight:500;color:#B3261E}',
    '.nnp-x{position:absolute;top:10px;right:10px;z-index:3;display:flex;align-items:center;justify-content:center;width:34px;height:34px;border:none;border-radius:9999px;background:rgba(255,255,255,.12);color:#fff;font-size:19px;line-height:1;cursor:pointer;transition:background .2s ease}',
    '.nnp-x:hover{background:rgba(255,255,255,.24)}',
    '.nnp-btn:focus-visible,.nnp-x:focus-visible,.nnp-alt a:focus-visible{outline:2px solid #C85478;outline-offset:3px}',
    '.nnp-done{display:flex;flex-direction:column;gap:10px;padding:12px 0}',
    '@media(prefers-reduced-motion:reduce){.nnp-backdrop,.nnp-card,.nnp-coupon,.nnp-btn{transition:none!important}.nnp-coupon{transform:none!important}}',
  ].join('');

  /* ---------------------------------------------------------------- markup */

  var GOOGLE_SVG =
    '<svg viewBox="0 0 64 64" width="18" height="18" aria-hidden="true"><g transform="translate(3,2)">' +
      '<path fill="#4285F4" d="M57.81,30.15c0-2.43-.2-4.19-.62-6.03H29.5v10.95h16.26c-.33,2.72-2.1,6.82-6.03,9.57l-.06.37,8.76,6.78.6.06c5.57-5.15,8.78-12.72,8.78-21.7"/>' +
      '<path fill="#34A853" d="M29.5,58.99c7.96,0,14.65-2.62,19.53-7.14l-9.31-7.21c-2.49,1.74-5.83,2.95-10.22,2.95-7.8,0-14.42-5.15-16.78-12.26l-.35.03-9.1,7.05-.12.33c4.85,9.64,14.81,16.26,26.35,16.26"/>' +
      '<path fill="#FBBC05" d="M12.72,35.33c-.62-1.84-.98-3.8-.98-5.83s.36-4,.95-5.84l-.02-.39L3.45,16.11l-.3.14C1.15,20.25,0,24.74,0,29.5s1.15,9.24,3.15,13.24l9.57-7.41"/>' +
      '<path fill="#EB4335" d="M29.5,11.41c5.54,0,9.27,2.39,11.4,4.39l8.32-8.13C44.11,2.92,37.46,0,29.5,0,17.96,0,8,6.62,3.15,16.26l9.54,7.41c2.39-7.11,9.01-12.26,16.81-12.26"/>' +
    '</g></svg>';

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
        '<button type="button" class="nnp-x" aria-label="Close">&times;</button>' +
        '<div class="nnp-grid">' +
          '<div class="nnp-left">' +
            '<p class="nnp-eyebrow">Members save</p>' +
            '<h2 class="nnp-h" id="nnp-h">Get 10% off your next order</h2>' +
            '<p class="nnp-sub">Create an account and we’ll email you a code to use on your next cake.</p>' +
            '<div class="nnp-coupon">' +
              '<div class="nnp-coupon-row">' +
                '<div class="nnp-amt"><b>10%</b><span>off</span></div>' +
                '<div class="nnp-perf"></div>' +
                '<div class="nnp-for"><i>Your next order</i><code>NN-••••••</code></div>' +
              '</div>' +
              '<span class="nnp-sheen" aria-hidden="true"></span>' +
            '</div>' +
            '<p class="nnp-foot">100% eggless · Collect from Harris Park or Riverstone</p>' +
          '</div>' +
          '<div class="nnp-right">' +
            '<div class="nnp-form-wrap">' +
              '<h3 class="nnp-title">Create your account</h3>' +
              '<p class="nnp-lede">Order online and collect in store.</p>' +
              '<button type="button" class="nnp-google">' + GOOGLE_SVG + 'Continue with Google</button>' +
              '<p class="nnp-gnote">By continuing with Google you agree to our ' +
                '<a href="/terms" target="_blank" rel="noopener">Terms &amp; Conditions</a> and ' +
                '<a href="/privacy-policy" target="_blank" rel="noopener">Privacy Policy</a>.</p>' +
              '<div class="nnp-or"><span>or</span></div>' +
              '<form novalidate>' +
                '<div class="nnp-field"><label class="nnp-label" for="nnp-email">Your email</label>' +
                  '<input class="nnp-input" id="nnp-email" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com"></div>' +
                '<div class="nnp-field"><label class="nnp-label" for="nnp-pw">Create a password</label>' +
                  '<input class="nnp-input" id="nnp-pw" type="password" autocomplete="new-password" placeholder="At least ' + MIN_PASSWORD + ' characters"></div>' +
                '<div class="nnp-field"><label class="nnp-label" for="nnp-phone">Mobile<span class="nnp-pill">Recommended</span></label>' +
                  '<input class="nnp-input" id="nnp-phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="0412 345 678" aria-describedby="nnp-phone-help">' +
                  '<p class="nnp-hint" id="nnp-phone-help">We text you the moment your cake is ready to collect — no ringing the shop.</p></div>' +
                // Unticked by default and freely given: ACMA prohibits pre-ticked
                // boxes, and consent cannot be inferred from an order or from a
                // phone number given for a receipt. The lift comes from naming
                // the benefit and the frequency, not from a default.
                // Unticked, and it stays that way: ACMA prohibits pre-checked
                // consent boxes outright. What lifts opt-in legitimately is
                // first-person affirmative phrasing and a named benefit, not a
                // default — "Email and text me" reads as an admin setting,
                // "Yes, keep me in the loop" reads as something you want.
                '<div class="nnp-consent">' +
                  '<p class="nnp-consent-h">Don\u2019t miss the good stuff</p>' +
                  '<p class="nnp-consent-p">Festival pre-orders fill fast \u2014 Diwali, Christmas, Eid. Ours go out before the shop floor knows.</p>' +
                  '<label class="nnp-check"><input type="checkbox" id="nnp-mkt">' +
                    '<span><b>Yes, keep me in the loop</b> \u2014 first pick of new flavours, seasonal specials and festival pre-orders.</span></label>' +
                  '<p class="nnp-consent-foot">By email and text. Unsubscribe any time.</p>' +
                '</div>' +
                '<label class="nnp-check nnp-terms"><input type="checkbox" id="nnp-terms">' +
                  '<span>I agree to the <a href="/terms" target="_blank" rel="noopener">Terms &amp; Conditions</a> and <a href="/privacy-policy" target="_blank" rel="noopener">Privacy Policy</a>.</span></label>' +
                '<p class="nnp-err" hidden></p>' +
                '<button type="submit" class="nnp-btn" style="margin-top:6px" disabled>Create account</button>' +
              '</form>' +
              '<p class="nnp-alt">Already have an account? <a href="/shop/log-in">Log in</a></p>' +
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

  function wireCoupon(coupon) {
    var sheen = coupon.querySelector('.nnp-sheen');
    coupon.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;   // no hover on touch
      var r = coupon.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      coupon.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * 16).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 16).toFixed(2) + 'deg)';
      sheen.style.background = 'radial-gradient(circle 180px at ' + (px * 100) + '% ' + (py * 100) + '%,rgba(255,255,255,.28) 0%,rgba(255,255,255,.10) 40%,transparent 70%)';
      sheen.style.opacity = '1';
    });
    coupon.addEventListener('pointerleave', function () {
      coupon.style.transform = '';
      sheen.style.opacity = '0';
    });
  }

  function celebrate() {
    import('https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/+esm').then(function (m) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var fire = m.default;
      var base = { startVelocity: 32, spread: 360, ticks: 70, zIndex: 99999,
                   colors: ['#C85478', '#E8A4B5', '#E3B664', '#A03D5E', '#FFF8F2'] };
      fire(Object.assign({}, base, { particleCount: 55, origin: { x: 0, y: 1 }, angle: 60 }));
      fire(Object.assign({}, base, { particleCount: 55, origin: { x: 1, y: 1 }, angle: 120 }));
    }).catch(function () { /* celebration is optional; the account still exists */ });
  }

  function open() {
    if (opened) return;
    opened = true;
    safeSet('sessionStorage', SEEN_KEY, '1');
    lastFocus = document.activeElement;
    root = build();
    lockScroll(true);

    var card = root.querySelector('.nnp-card');
    var form = root.querySelector('form');
    var email = root.querySelector('#nnp-email');
    var pw = root.querySelector('#nnp-pw');
    var phone = root.querySelector('#nnp-phone');
    var phoneHelp = root.querySelector('#nnp-phone-help');
    var btn = root.querySelector('.nnp-btn');
    var err = root.querySelector('.nnp-err');

    function cleanPhone() { return phone.value.replace(/[\s()-]/g, ''); }

    function prefs(source) {
      return {
        phone: phone.value.trim() ? cleanPhone() : '',
        // One tick, two channels — but kept as two fields so a later
        // "stop texting me" does not silently also stop the emails.
        marketing_email: root.querySelector('#nnp-mkt').checked,
        marketing_sms: root.querySelector('#nnp-mkt').checked,
        consent_at: new Date().toISOString(),
        consent_source: source,
        terms_accepted_at: new Date().toISOString(),
      };
    }

    function sdk() {
      // Loaded here, not on page load: most visitors never submit.
      return import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(function (m) {
        return m.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { flowType: 'pkce' } });
      });
    }

    // No blocking tick on Google. Pressing the button IS the agreement — it is
    // stated under it, the way every large site does it, and that is a far
    // lower-friction ask than a checkbox in front of a one-tap signup. The
    // acceptance is still recorded: prefs() stamps terms_accepted_at.
    root.querySelector('.nnp-google').addEventListener('click', function () {
      err.hidden = true;
      // The redirect leaves this page, so park the ticks for the shop app to write.
      safeSet('localStorage', PREFS_KEY, JSON.stringify(prefs('promo-dialog:google')));
      sdk().then(function (sb) {
        return sb.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: location.origin + '/shop/sign-up' },
        });
      }).then(function (res) {
        if (res && res.error) throw res.error;
      }).catch(function (e2) {
        // "Unsupported provider: provider is not enabled" is a setup problem on
        // our side, not something the customer can do anything about — so it
        // points them at the form below instead of printing our config error.
        var m = (e2 && e2.message) || '';
        err.textContent = /provider is not enabled|Unsupported provider/i.test(m)
          ? 'Google sign-in is not available right now — please use your email below.'
          : (m || 'Could not reach Google. Try again.');
        err.hidden = false;
      });
    });

    wireCoupon(root.querySelector('.nnp-coupon'));
    root.querySelector('.nnp-x').addEventListener('click', close);
    root.addEventListener('mousedown', function (e) { if (e.target === root) close(); });
    document.addEventListener('keydown', onKey);

    function validate() {
      // Phone is optional, so blank passes; typed-but-wrong does not.
      var phoneOk = phone.value.trim() === '' || MOBILE_RE.test(cleanPhone());
      phone.setAttribute('aria-invalid', phoneOk ? 'false' : 'true');
      phoneHelp.textContent = phoneOk
        ? 'We text you the moment your cake is ready to collect — no ringing the shop.'
        : "That doesn't look like an Australian mobile. Leave it blank if you'd rather not.";
      var ok = EMAIL_RE.test(email.value) && pw.value.length >= MIN_PASSWORD && phoneOk &&
               root.querySelector('#nnp-terms').checked;
      btn.disabled = !ok;
      return ok;
    }
    email.addEventListener('input', validate);
    pw.addEventListener('input', validate);
    phone.addEventListener('input', validate);
    root.querySelector('#nnp-terms').addEventListener('change', validate);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      btn.disabled = true;
      btn.textContent = 'Creating account';
      err.hidden = true;

      sdk().then(function (sb) {
        return sb.auth.signUp({
          email: email.value,
          password: pw.value,
          options: { data: prefs('promo-dialog') },
        });
      }).then(function (res) {
        if (res.error) throw res.error;
        root.querySelector('.nnp-form-wrap').innerHTML =
          '<div class="nnp-done">' +
            '<h3 class="nnp-title">Account created</h3>' +
            '<p class="nnp-lede">Check <strong>' + email.value.replace(/[<>&"]/g, '') +
              '</strong> to confirm your address. Your 10% code lands in the same inbox.</p>' +
            '<button type="button" class="nnp-btn" style="margin-top:8px">Keep browsing</button>' +
          '</div>';
        root.querySelector('.nnp-done .nnp-btn').addEventListener('click', close);
        celebrate();
      }).catch(function (e2) {
        err.textContent = (e2 && e2.message) || 'Something went wrong. Try again.';
        err.hidden = false;
        btn.textContent = 'Create account';
        validate();
      });
    });

    requestAnimationFrame(function () { root.classList.add('nnp-in'); });
    setTimeout(function () { if (card) email.focus(); }, 300);
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
