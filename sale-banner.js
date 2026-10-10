/* ==========================================================================
   Aligned Aminos — top banner + catalog "Ready to Ship"
   1) Columbus Day BOGO banner — renders ONLY inside the window below.
   2) Catalog-only Ready-to-Ship badge + filter.
   CUTOFF MUST match SALE_CUTOFF in cart.js
   (2026-10-14T04:00:00Z = end of Tue Oct 13, midnight ET).
   ========================================================================== */

(function () {
  'use strict';

  // Columbus Day BOGO window (CUTOFF must match cart.js SALE_CUTOFF).
  var START  = new Date('2026-10-10T00:00:00Z'); // already open at deploy
  var CUTOFF = new Date('2026-10-14T04:00:00Z'); // end of Tue Oct 13, midnight ET
  var now = new Date();
  if (now < START || now >= CUTOFF) return;   // outside the window: render nothing

  var SEGMENTS = [
    '<strong>COLUMBUS DAY SALE</strong>',
    '<strong>Buy one, get one 40% off</strong>',
    'Add an athlete code &mdash; 2nd box 50% off',
    'Equal or lesser value &middot; Ends Tue Oct 13',
    'Research use only'
  ];

  var CSS = [
    '.aa-ticker{position:relative;z-index:11;display:block;width:100%;',
      'background:linear-gradient(90deg,#8B2010 0%,#FF5A1F 50%,#8B2010 100%);',
      'border-bottom:1px solid rgba(0,0,0,0.35);overflow:hidden;text-decoration:none;color:#07080A;}',
    '.aa-ticker__track{display:flex;width:max-content;animation:aa-ticker-scroll 34s linear infinite;}',
    '.aa-ticker:hover .aa-ticker__track{animation-play-state:paused;}',
    '.aa-ticker__group{display:flex;flex:none;}',
    '.aa-ticker__item{flex:none;display:inline-flex;align-items:center;padding:11px 0;',
      'font-family:var(--font-mono,ui-monospace,Menlo,Consolas,monospace);font-size:13px;line-height:1;',
      'letter-spacing:0.18em;text-transform:uppercase;color:#07080A;white-space:nowrap;font-weight:600;}',
    '.aa-ticker__item strong{font-weight:800;}',
    '.aa-ticker__sep{flex:none;display:inline-flex;align-items:center;padding:11px 22px;color:rgba(7,8,10,0.55);font-size:13px;}',
    '@keyframes aa-ticker-scroll{from{transform:translate3d(0,0,0);}to{transform:translate3d(-50%,0,0);}}',
    '@media (prefers-reduced-motion: reduce){.aa-ticker__track{animation:none;width:100%;justify-content:center;}.aa-ticker__group:nth-child(2){display:none;}.aa-ticker__item{white-space:normal;text-align:center;}}',
    '@media (max-width:620px){.aa-ticker__item,.aa-ticker__sep{font-size:12px;letter-spacing:0.12em;}.aa-ticker__sep{padding-left:16px;padding-right:16px;}}'
  ].join('');

  function groupHTML() {
    var out = '';
    for (var i = 0; i < SEGMENTS.length; i++) {
      out += '<span class="aa-ticker__item">' + SEGMENTS[i] + '</span>';
      out += '<span class="aa-ticker__sep" aria-hidden="true">&#9670;</span>';
    }
    return '<span class="aa-ticker__group">' + out + '</span>';
  }

  function build() {
    if (document.querySelector('.aa-ticker')) return;
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    var bar = document.createElement('a');
    bar.className = 'aa-ticker';
    bar.href = 'catalog.html';
    bar.setAttribute('aria-label',
      'Columbus Day sale: buy one, get one of equal or lesser value 40% off, or 50% off with an athlete code. Ends Tuesday October 13. Research use only. Shop the catalog.');
    var track = document.createElement('span');
    track.className = 'aa-ticker__track';
    track.setAttribute('aria-hidden', 'true');
    track.innerHTML = groupHTML() + groupHTML();
    bar.appendChild(track);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', build); }
  else { build(); }
})();

/* ==========================================================================
   Ready-to-Ship filter toggle  —  CATALOG PAGE ONLY
   --------------------------------------------------------------------------
   Self-contained and unrelated to the sale banner above. It lives in this file
   only because catalog.html already loads sale-banner.js; on any page without
   #catalog-root it does nothing.

   AVAILABILITY IS NO LONGER LISTED HERE. Stock is data, not a name list: a
   variant in catalog.html's PRODUCTS carrying `us: true` is in the US
   warehouse, and renderCard() puts .is-domestic on that card and draws its
   badge. This block only builds the "Ready to ship only" filter button that
   hides everything without that class. To change what's in stock, edit the
   `us: true` flags in catalog.html — never this file.
   ========================================================================== */
(function () {
  var RTS_CSS = [
    '.rts-toggle{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;cursor:pointer;',
    'white-space:nowrap;font-family:var(--font-sans);font-size:13px;font-weight:500;color:var(--text-1,#fff);',
    'background:var(--bg-base,rgba(0,0,0,.3));border:1px solid var(--border-default);border-radius:6px;',
    'transition:border-color 160ms ease,background 160ms ease,color 160ms ease;}',
    '.rts-toggle:hover{border-color:var(--color-ember,#FF5A1F);}',
    '.rts-toggle[aria-pressed="true"]{color:#eafff0;background:rgba(38,122,68,.22);border-color:rgba(66,176,106,.75);}',
    '.rts-toggle__dot{width:8px;height:8px;border-radius:50%;background:currentColor;opacity:.45;}',
    '.rts-toggle[aria-pressed="true"] .rts-toggle__dot{opacity:1;background:#46c877;}',
    '#catalog-root.rts-only .product-card:not(.is-domestic){display:none;}',
    '#catalog-root.rts-only .catalog-section.rts-empty{display:none;}',
    '.rts-emptymsg{display:none;margin:20px 0 0;font-family:var(--font-sans);font-size:15px;color:var(--text-muted,#9a978f);}',
    '@media (max-width:560px){.rts-toggle{width:100%;justify-content:center;}}'
  ].join('');

  var FLAG = '<svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">'
    + '<rect width="18" height="12" fill="#b22234"/>'
    + '<rect y="1.85" width="18" height="1.85" fill="#fff"/>'
    + '<rect y="5.54" width="18" height="1.85" fill="#fff"/>'
    + '<rect y="9.23" width="18" height="1.85" fill="#fff"/>'
    + '<rect width="8" height="6.46" fill="#3c3b6e"/></svg>';

  function run() {
    var root = document.getElementById('catalog-root');
    if (!root) { return; }
    if (!document.getElementById('rts-style')) {
      var st = document.createElement('style');
      st.id = 'rts-style';
      st.textContent = RTS_CSS;
      document.head.appendChild(st);
    }
    var tries = 0;
    (function init() {
      var jump = document.querySelector('.catalog__jump');
      var cards = document.querySelectorAll('.product-card');
      if (!jump || !cards.length) { if (tries++ < 80) { setTimeout(init, 80); } return; }
      if (document.getElementById('rts-toggle')) { return; }

      var count = document.querySelectorAll('.product-card.is-domestic').length;

      document.querySelectorAll('.catalog-section').forEach(function (sec) {
        if (!sec.querySelector('.product-card.is-domestic')) { sec.classList.add('rts-empty'); }
      });

      var msg = document.createElement('p');
      msg.className = 'rts-emptymsg';
      msg.id = 'rts-emptymsg';
      msg.textContent = 'Nothing is flagged ready to ship right now.';
      root.parentNode.insertBefore(msg, root.nextSibling);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rts-toggle';
      btn.id = 'rts-toggle';
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = '<span class="rts-toggle__dot" aria-hidden="true"></span>' + FLAG
        + '<span class="rts-toggle__txt">Ready to ship only</span>';
      jump.appendChild(btn);

      function apply(on) {
        root.classList.toggle('rts-only', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        msg.style.display = (on && count === 0) ? 'block' : 'none';
        try { localStorage.setItem('aa_rts_only', on ? '1' : '0'); } catch (e) {}
      }
      btn.addEventListener('click', function () { apply(btn.getAttribute('aria-pressed') !== 'true'); });

      var saved = null;
      try { saved = localStorage.getItem('aa_rts_only'); } catch (e) {}
      if (saved === '1') { apply(true); }
    })();
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', run); }
  else { run(); }
})();
