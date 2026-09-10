/* ==========================================================================
   Aligned Aminos — top banner + catalog "Ready to Ship"
   1) Show-Day Flash banner — renders ONLY inside the flash window below.
   2) Catalog-only Ready-to-Ship badge + filter.
   The window MUST match the JORDAN flash window in cart.js
   (2026-09-12T23:00:00Z = Sun Sep 13 6am ICT  ->  2026-09-14T04:00:00Z = midnight ET).
   ========================================================================== */

(function () {
  'use strict';

  // Show-Day Flash window (match cart.js FLASH_START / FLASH_END).
  var START  = new Date('2026-09-12T23:00:00Z'); // Sun Sep 13, 6:00am ICT
  var CUTOFF = new Date('2026-09-14T04:00:00Z'); // Sun Sep 13, midnight ET
  var now = new Date();
  if (now < START || now >= CUTOFF) return;   // outside the window: render nothing

  var SEGMENTS = [
    '<strong>ON STAGE &middot; SHOW-DAY FLASH</strong>',
    "Jordan's on stage in Thailand",
    '<strong>20% OFF WITH CODE JORDAN</strong>',
    'Show day only &mdash; Sun Sep 13'
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
      "Show-Day Flash supporting Jordan's bodybuilding show: 20% off with code JORDAN. Show day only, Sunday September 13. Shop the catalog.");
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
   Ready-to-Ship domestic badge + filter  —  CATALOG PAGE ONLY
   --------------------------------------------------------------------------
   Self-contained and unrelated to the sale banner above. It lives in this file
   only because catalog.html already loads sale-banner.js; on any page without
   #catalog-root it does nothing.

   TO FLAG PRODUCTS: add exact card names to RTS_DOMESTIC below (empty = none,
   so no false shipping claims go out). Example:
     var RTS_DOMESTIC = ['BPC-157', 'TB-500', 'GHK-Cu'];
   ========================================================================== */
(function () {
  var RTS_DOMESTIC = [];

  var RTS_CSS = [
    '.rts-badge{display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:3px 9px;',
    'font-family:var(--font-mono,monospace);font-size:10px;font-weight:500;letter-spacing:.14em;',
    'text-transform:uppercase;color:#dcefe1;line-height:1;white-space:nowrap;',
    'background:rgba(38,122,68,.16);border:1px solid rgba(66,176,106,.5);border-radius:999px;}',
    '.rts-badge svg{display:block;border-radius:1px;}',
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

  function norm(s) { return s.toLowerCase().replace(/\s+/g, ' ').trim(); }

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

      var set = {};
      RTS_DOMESTIC.forEach(function (n) { set[norm(n)] = true; });

      var count = 0;
      cards.forEach(function (card) {
        var t = card.querySelector('.product-card__title');
        if (!t || !set[norm(t.textContent)]) { return; }
        card.classList.add('is-domestic');
        count++;
        if (!card.querySelector('.rts-badge')) {
          var b = document.createElement('span');
          b.className = 'rts-badge';
          b.innerHTML = FLAG + '<span class="rts-badge__txt">Ready to ship</span>';
          t.insertAdjacentElement('afterend', b);
        }
      });

      document.querySelectorAll('.catalog-section').forEach(function (sec) {
        if (!sec.querySelector('.product-card.is-domestic')) { sec.classList.add('rts-empty'); }
      });

      var msg = document.createElement('p');
      msg.className = 'rts-emptymsg';
      msg.id = 'rts-emptymsg';
      msg.textContent = 'No Ready-to-Ship items are flagged yet.';
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
