/* =========================================================================
   Sitewide sale banner — scrolling ticker pinned above the nav.

   Self-contained: injects its own styles and markup, so each page only needs
   <script src="sale-banner.js" defer></script> in the head.

   It shares the cutoff with the cart logic in catalog.html. AFTER THE CUTOFF
   THE BANNER SIMPLY DOESN'T RENDER — no redeploy, no dead promo on the site.

   TO CHANGE THE SALE, edit the CONFIG block below and nothing else.
   TO END IT EARLY, set CUTOFF to a past date (or delete the script tags).
   ========================================================================= */
(function () {
  'use strict';

  // ── CONFIG ──────────────────────────────────────────────────────────────
  // Cutoff is a fixed UTC instant so it lands correctly in every timezone.
  // End of Aug 19 2026 Eastern = Aug 19 midnight EDT (UTC-4) = 08-20 04:00Z.
  // This MUST match SALE_CUTOFF in catalog.html or the banner and the cart
  // will disagree about whether the sale is on.
  var CUTOFF   = new Date('2026-08-20T04:00:00Z');
  var SALE_PCT = 20;   // sitewide, automatic
  var CODE_PCT = 10;   // extra, with an affiliate code
  var DATES    = 'Aug 11 — 19';
  var SHOP_URL = 'catalog.html';

  if (new Date() >= CUTOFF) return;   // sale is over: render nothing

  var TOTAL = SALE_PCT + CODE_PCT;

  // The segments that scroll past, in order.
  var SEGMENTS = [
    '<strong>' + SALE_PCT + '% OFF SITEWIDE</strong>',
    'Applied automatically — no code needed',
    'Stack an affiliate code for ' + CODE_PCT + '% more',
    '<strong>' + TOTAL + '% off total</strong>',
    'Back to School · ' + DATES,
  ];

  var CSS = [
    '.aa-ticker{position:relative;z-index:11;display:block;width:100%;',
      'background:linear-gradient(90deg,#8B2010 0%,#FF5A1F 50%,#8B2010 100%);',
      'border-bottom:1px solid rgba(0,0,0,0.35);overflow:hidden;',
      'text-decoration:none;color:#07080A;}',
    '.aa-ticker__track{display:flex;width:max-content;',
      'animation:aa-ticker-scroll 38s linear infinite;}',
    '.aa-ticker:hover .aa-ticker__track{animation-play-state:paused;}',
    '.aa-ticker__group{display:flex;flex:none;}',
    '.aa-ticker__item{flex:none;display:inline-flex;align-items:center;',
      'padding:9px 0;font-family:var(--font-mono,ui-monospace,Menlo,Consolas,monospace);',
      'font-size:12px;line-height:1;letter-spacing:0.16em;text-transform:uppercase;',
      'color:#07080A;white-space:nowrap;}',
    '.aa-ticker__item strong{font-weight:700;}',
    '.aa-ticker__sep{flex:none;display:inline-flex;align-items:center;',
      'padding:9px 22px;color:rgba(7,8,10,0.55);font-size:12px;}',
    '@keyframes aa-ticker-scroll{from{transform:translate3d(0,0,0);}',
      'to{transform:translate3d(-50%,0,0);}}',
    /* Motion-sensitive users get a static, centred line instead of a crawl. */
    '@media (prefers-reduced-motion: reduce){',
      '.aa-ticker__track{animation:none;width:100%;justify-content:center;}',
      '.aa-ticker__group:nth-child(2){display:none;}',
      '.aa-ticker__item{white-space:normal;text-align:center;}',
      '}',
    '@media (max-width:620px){',
      '.aa-ticker__item,.aa-ticker__sep{font-size:11px;letter-spacing:0.12em;}',
      '.aa-ticker__sep{padding-left:16px;padding-right:16px;}',
      '}',
  ].join('');

  function groupHTML() {
    var out = '';
    for (var i = 0; i < SEGMENTS.length; i++) {
      out += '<span class="aa-ticker__item">' + SEGMENTS[i] + '</span>';
      out += '<span class="aa-ticker__sep" aria-hidden="true">◆</span>';
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
    bar.href = SHOP_URL;
    bar.setAttribute('aria-label',
      SALE_PCT + '% off sitewide, applied automatically. Stack an affiliate code for ' +
      CODE_PCT + '% more, ' + TOTAL + '% off total. Back to School, ' + DATES + '. Shop the catalog.');

    // Two identical groups: the track scrolls exactly -50%, so the second
    // group lands where the first started and the loop is seamless.
    var track = document.createElement('span');
    track.className = 'aa-ticker__track';
    track.setAttribute('aria-hidden', 'true');
    track.innerHTML = groupHTML() + groupHTML();

    bar.appendChild(track);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
