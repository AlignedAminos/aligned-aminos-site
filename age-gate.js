/* =========================================================
   Aligned Aminos — 18+ age gate
   Self-contained. Add to any page with ONE line in <head>:
       <script src="age-gate.js"></script>
   (use ../age-gate.js from the /datasheets/ pages)

   Injects a full-screen overlay BEFORE the page paints, so
   there's no flash of content behind it. "Yes" is remembered
   in localStorage so returning visitors aren't re-asked.
   No backend required — this is a front-door confirmation,
   not a login. Portable: colors are hardcoded so it looks
   right on every page regardless of that page's own CSS.
   ========================================================= */
(function () {
  var KEY = 'aa_age_ok_v1';

  // Resolve logo.png relative to THIS script, so the same file works from the
  // site root (index/catalog) and from /datasheets/ (../age-gate.js).
  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || '';
  var LOGO = SCRIPT_SRC ? new URL('logo.png?v=2', SCRIPT_SRC).href : 'logo.png?v=2';

  // Already confirmed on this device? Do nothing — no flash, no gate.
  try { if (localStorage.getItem(KEY) === 'yes') return; } catch (e) {}

  var CSS =
    '#aa-age-gate{position:fixed;inset:0;z-index:2147483647;display:flex;' +
    'align-items:center;justify-content:center;padding:24px;' +
    'background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(255,90,31,0.18),transparent 60%),#07080A;' +
    'font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI","Helvetica Neue",Arial,sans-serif;' +
    '-webkit-font-smoothing:antialiased;}' +
    '#aa-age-gate *{box-sizing:border-box;}' +
    '.aa-age-card{max-width:440px;width:100%;text-align:center;background:#0D0F12;' +
    'border:1px solid rgba(255,255,255,0.10);border-radius:16px;padding:40px 32px;' +
    'box-shadow:0 30px 80px rgba(0,0,0,0.6),0 0 60px rgba(255,90,31,0.12);}' +
    '.aa-age-logo{width:96px;height:96px;display:block;margin:0 auto 24px;border-radius:12px;' +
    'object-fit:cover;box-shadow:0 0 0 1px rgba(255,90,31,0.45),0 0 32px rgba(255,90,31,0.22),' +
    '0 8px 22px rgba(0,0,0,0.55);}' +
    '.aa-age-card h2{margin:0 0 12px;font-size:26px;line-height:1.2;color:#F2F4F8;font-weight:800;}' +
    '.aa-age-card p.aa-age-lead{margin:0 0 28px;font-size:15px;line-height:1.6;color:#B5ADA0;}' +
    '.aa-age-actions{display:flex;flex-direction:column;gap:12px;}' +
    '.aa-age-btn{appearance:none;-webkit-appearance:none;border:1px solid transparent;border-radius:10px;' +
    'padding:15px 20px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;' +
    'transition:background .15s ease,box-shadow .15s ease,border-color .15s ease,color .15s ease;}' +
    '.aa-age-btn--yes{background:#FF5A1F;color:#07080A;}' +
    '.aa-age-btn--yes:hover{background:#FF8C42;box-shadow:0 0 28px rgba(255,90,31,0.45);}' +
    '.aa-age-btn--no{background:transparent;color:#B5ADA0;border-color:rgba(255,255,255,0.18);}' +
    '.aa-age-btn--no:hover{border-color:#FF5A1F;color:#F2F4F8;}' +
    '.aa-age-btn:disabled{opacity:.5;cursor:not-allowed;}' +
    '.aa-age-denied{margin:22px 0 0;font-size:14px;line-height:1.5;color:#FF8C42;font-weight:600;}' +
    '.aa-age-fine{margin:22px 0 0;font-size:11px;line-height:1.5;color:#7A6F5E;' +
    'letter-spacing:0.04em;text-transform:uppercase;}';

  var MARKUP =
    '<div class="aa-age-card" role="document">' +
      '<img class="aa-age-logo" src="' + LOGO + '" alt="Aligned Aminos" />' +
      '<h2>Are you 18 or older?</h2>' +
      '<p class="aa-age-lead">This site sells research-use-only compounds. ' +
      'You must be 18 or older to enter.</p>' +
      '<div class="aa-age-actions">' +
        '<button type="button" class="aa-age-btn aa-age-btn--yes" id="aa-age-yes">' +
        'Yes, I&rsquo;m 18 or older &mdash; Enter</button>' +
        '<button type="button" class="aa-age-btn aa-age-btn--no" id="aa-age-no">' +
        'No, I&rsquo;m under 18</button>' +
      '</div>' +
      '<p class="aa-age-denied" id="aa-age-denied" hidden>' +
      'You must be 18 or older to access this site. Redirecting&hellip;</p>' +
      '<p class="aa-age-fine">Research-use-only &middot; Not for human consumption</p>' +
    '</div>';

  // Inject the style now (head exists — this script runs inside <head>).
  var style = document.createElement('style');
  style.id = 'aa-age-gate-css';
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);

  // Build the overlay and attach to <html> immediately, before <body> paints.
  var gate = document.createElement('div');
  gate.id = 'aa-age-gate';
  gate.setAttribute('role', 'dialog');
  gate.setAttribute('aria-modal', 'true');
  gate.setAttribute('aria-label', 'Age verification');
  gate.innerHTML = MARKUP;
  (document.body || document.documentElement).appendChild(gate);

  // Lock scrolling behind the gate.
  var htmlEl = document.documentElement;
  var prevHtmlOverflow = htmlEl.style.overflow;
  htmlEl.style.overflow = 'hidden';
  function lockBody() { if (document.body) document.body.style.overflow = 'hidden'; }
  lockBody();
  document.addEventListener('DOMContentLoaded', lockBody);

  var yesBtn = gate.querySelector('#aa-age-yes');
  var noBtn = gate.querySelector('#aa-age-no');
  var denied = gate.querySelector('#aa-age-denied');

  yesBtn.addEventListener('click', function () {
    try { localStorage.setItem(KEY, 'yes'); } catch (e) {}
    htmlEl.style.overflow = prevHtmlOverflow;
    if (document.body) document.body.style.overflow = '';
    if (gate.parentNode) gate.parentNode.removeChild(gate);
  });

  noBtn.addEventListener('click', function () {
    denied.hidden = false;
    yesBtn.disabled = true;
    noBtn.disabled = true;
    setTimeout(function () { window.location.href = 'https://www.google.com'; }, 2500);
  });

  // Focus the affirmative button for keyboard users.
  try { yesBtn.focus(); } catch (e) {}
})();
