/* ==========================================================================
   Aligned Aminos — cart + checkout logic (extracted from catalog.html)
   Loaded via <script src="cart.js" defer> AFTER catalog.html's inline data
   script, so PRODUCTS and escapeHtml are already defined. Edit pricing, the
   sitewide sale (SALE_*), and referral/athlete codes here.
   ========================================================================== */

/* ═════════════════════════════════════════════════════════════════════════
   ORDER CART  —  client-side cart + order request
   ───────────────────────────────────────────────────────────────────────
   No backend, no payment. Cart lives in localStorage. On submit, the
   itemized order is emailed to Jordan via Web3Forms (same pipeline as the
   contact form, subject "WEB ORDER:"), and the customer gets an on-screen,
   printable confirmation. PRODUCTS (declared above) is the single source of
   truth for names + prices, so changing a price there updates the cart too.
   ═════════════════════════════════════════════════════════════════════════ */
(() => {
  const STORAGE_KEY = 'aa_order_v1';
  const ACCESS_KEY  = 'ab1d26f3-dc9b-4689-aef2-ada34594cb0a';
  const ENDPOINT    = 'https://api.web3forms.com/submit';
  const FALLBACK    = 'Alignedaminos@proton.me';

  // ----- Referral codes -----------------------------------------------------
  // Each approved referrer gets their OWN code (case-insensitive). A valid code
  // takes 10% off the order (20% during an active promo). EDIT THIS LIST with the
  // real codes from Kelley. Format:  'CODE': 'Referrer label (for your records)'.
  // Note: anything here is visible in the page source, so codes aren't secret.
  //
  // SITEWIDE SALE — automatic, no code needed.
  // Sitewide discount, applied on its own. Runs through the
  // end of Aug 19, 2026 Eastern. The cutoff is a fixed UTC instant (Aug 19
  // midnight ET = EDT, UTC-4 = 08-20 04:00Z) so it lands correctly no matter
  // what timezone the visitor is in. After the cutoff SALE_RATE drops to 0,
  // the sale row disappears and referral codes go back to being the only
  // discount — no second deploy needed.
  // TO END THE SALE EARLY: set SALE_RATE to 0. TO EXTEND IT: move SALE_CUTOFF.
  const SALE_NAME    = 'Labor Day';
  const SALE_CUTOFF  = new Date('2026-09-07T04:00:00Z');
  const SALE_ACTIVE  = new Date() < SALE_CUTOFF;
  const SALE_RATE    = SALE_ACTIVE ? 0.20 : 0;
  const SALE_PCT     = Math.round(SALE_RATE * 100);

  // REFERRAL CODES — 10%, and they STACK on top of the sitewide sale, so a
  // customer with a code pays 30% less while the sale is running. The two
  // rates are added and applied to the subtotal once (20 + 10 = 30 off), which
  // is what a customer expects "20% plus 10%" to mean.
  // EDIT THIS LIST to add or remove an affiliate. Format:
  //   'CODE': 'Referrer label (for your records)'
  // Note: anything here is visible in the page source, so codes aren't secret.
  const DISCOUNT_RATE  = 0.10;
  const DISCOUNT_PCT   = Math.round(DISCOUNT_RATE * 100); // whole-number % for UI copy
  const REFERRAL_CODES = {
  VETERAN: 'Veteran',
    'JORDAN': 'Jordan',
    'KELLEY': 'Kelley',
    'TIM': 'Tim',
    'DEREK': 'Derek',
    'WES': 'Wes Osborne',
    'NEIL': 'Neil',
    'HAYLEY': 'Hayley McIntosh',
    'ALIGNED': 'Aligned Strength site (brand code)',
    'MORTEN': 'Morten',
  };
  // Legacy aliases — the old NAME10 codes are already printed, posted and
  // shared, so they still redeem and resolve to the new short name. Delete an
  // entry here once you're confident that version is out of circulation.
  const LEGACY_ALIASES = {
    'JORDAN10': 'JORDAN',
    'KELLEY10': 'KELLEY',
    'TIM10': 'TIM',
    'DEREK10': 'DEREK',
    'WES10': 'WES',
    'NEIL10': 'NEIL',
    'HAYLEY10': 'HAYLEY',
    'ALIGNED10': 'ALIGNED',
  };
  const resolveCode = (raw) => (REFERRAL_CODES[raw] ? raw : (LEGACY_ALIASES[raw] || null));
  const VENMO_HANDLE = 'vagabondmuscle'; // holding company Venmo (Vagabond Muscle)
  const ZELLE_EMAIL  = 'alignedaminos@proton.me'; // Zelle recipient (enrolled under Jordan Schwartz's bank)
  const ZELLE_NAME   = 'Jordan Schwartz';
  // USDT (Tether) — dollar-pegged, so amount = USD total 1:1. EVM address; the
  // network is fixed to Ethereum (ERC-20) per Kelley. There is no on-chain memo,
  // so payments are matched by the exact amount + the order email below.
  const USDT_ADDRESS = '0x2a92023d91dda9698dfe80d942679537ad61368e';
  const USDT_NETWORK = 'Ethereum (ERC-20)';
  // Wise (money transfer) — customer sends manually to the recipient email in
  // USD; no deep-link. Reference carries the SAME order ref as the other
  // methods (the only key we match payments on). Recipient confirmed as
  // jordan.d.schwartz@gmail.com (with the r in Schwartz) per Kelley.
  const WISE_EMAIL = 'jordan.d.schwartz@gmail.com';
  const WISE_NAME  = 'Jordan Schwartz';
  let appliedCode = null;                 // matched code (uppercased) or null

  // Build a lookup of the current catalog keyed by slug|mass (mass disambiguates
  // products that share a slug, e.g. SS-31 10 mg vs 50 mg).
  // Supplier catalogue numbers (Cat.No on Jordan's wholesale sheet), keyed by
  // slug|mass. Surfaced on the order email so Kelley can place the supplier
  // order without cross-referencing the sheet. Codes are the supplier's, as-is.
  const CODES = {
    // Metabolic & GLP-1
    'tirzepatide|10 mg':'TR10','tirzepatide|15 mg':'TR15','tirzepatide|20 mg':'TR20','tirzepatide|30 mg':'TR30','tirzepatide|40 mg':'TR40','tirzepatide|50 mg':'TR50','tirzepatide|60 mg':'TR60','tirzepatide|100 mg':'TR100','tirzepatide|120 mg':'TR120',
    'retatrutide|10 mg':'RT10','retatrutide|20 mg':'RT20','retatrutide|30 mg':'RT30','retatrutide|40 mg':'RT40','retatrutide|50 mg':'RT50','retatrutide|60 mg':'RT60',
    'mots-c|10 mg':'MS10','mots-c|40 mg':'MS40',
    'aod-9604|5 mg':'5AD','aod-9604|10 mg':'10AD',
    '5-amino-1mq|5 mg':'5:00 AM','5-amino-1mq|10 mg':'10:00 AM','5-amino-1mq|50 mg':'50AM',
    'semaglutide|10 mg':'SM10','semaglutide|20 mg':'SM20','semaglutide|30 mg':'SM30',
    'liraglutide|5 mg':'LL5','liraglutide|10 mg':'LL10','liraglutide|30 mg':'LL30',
    'cagrilintide|5 mg':'CGL5','cagrilintide|10 mg':'CGL10','cagrilintide|20 mg':'CGL20',
    'cagrisema|10 mg':'CS10',
    'mazdutide|5 mg':'MDT5','mazdutide|10 mg':'MDT10',
    'survodutide|10 mg':'SUR10',
    // Recovery & Repair
    'bpc-157|5 mg':'BC5','bpc-157|10 mg':'BC10','bpc-157|20 mg':'BC20',
    'tb-500|5 mg':'BT5','tb-500|10 mg':'BT10','tb-500|20 mg':'BT20',
    'kpv|5 mg':'KP5','kpv|10 mg':'KP10',
    'bpc-157-tb-500-blend|10 mg':'BB10','bpc-157-tb-500-blend|20 mg':'BB20',
    'glow|70 mg':'BBG70',
    'klow|80 mg':'KLOW',
    'tb-500-frag|10 mg':'B10F',
    // Growth & GH Axis
    'igf-1-lr3|0.1 mg':'IG01','igf-1-lr3|1 mg':'IG1',
    'ipamorelin|5 mg':'IP5','ipamorelin|10 mg':'IP10',
    'cjc-1295-ipamorelin-blend|10 mg':'CP10','cjc-1295-ipamorelin-blend|20 mg':'CP20',
    'tesamorelin|5 mg':'TSM5','tesamorelin|10 mg':'TSM10','tesamorelin|20 mg':'TSM20',
    'sermorelin|5 mg':'SMO5','sermorelin|10 mg':'SMO10',
    'hcg|5,000 IU':'G5K','hcg|10,000 IU':'G10K',
    'cjc-1295-no-dac|5 mg':'CND5','cjc-1295-no-dac|10 mg':'CND10',
    'cjc-1295-dac|5 mg':'CD5','cjc-1295-dac|10 mg':'CD10',
    'tesamorelin-ipamorelin-blend|18 mg':'T118',
    'ghrp-6|5 mg':'G65','ghrp-6|10 mg':'G610',
    'hexarelin|2 mg':'HX2','hexarelin|5 mg':'HX5',
    'mgf|2 mg':'FM2',
    'peg-mgf|2 mg':'FMP2',
    'gonadorelin|2 mg':'GND2',
    // Longevity & Anti-Aging
    'ghk-cu|50 mg':'CU50','ghk-cu|100 mg':'CU100',
    'snap-8|10 mg':'NP810',
    'epithalon|10 mg':'ET10','epithalon|50 mg':'ET50',
    'pinealon|5 mg':'PIN5','pinealon|10 mg':'PIN10','pinealon|20 mg':'PIN20',
    'ss-31|10 mg':'2510','ss-31|50 mg':'2550',
    'ghk-basic|50 mg':'GH50',
    'ahk-cu|100 mg':'AU100',
    'nad-plus|500 mg':'NJ500','nad-plus|1000 mg':'NJ1000',
    'thymalin|10 mg':'TY10',
    'testagen|20 mg':'TG20',
    'n-acetyl-epitalon-amidate|5 mg':'NET5',
    // Cognition & Mood
    'semax|5 mg':'XA5','semax|10 mg':'XA10',
    'selank|5 mg':'SK5','selank|10 mg':'SK10',
    'dsip|5 mg':'DS5','dsip|10 mg':'DS10','dsip|15 mg':'DS15',
    'semax-selank-blend|20 mg':'XS20',
    'pe-22-28|10 mg':'PE10',
    'melatonin|10 mg':'MT10',
    'adamax|5 mg':'AD5',
    'p21|10 mg':'P210','p21-adamantane|10 mg':'PP10',
    // Hormones, Sexual Health & Misc
    'thymosin-alpha-1|5 mg':'TA5','thymosin-alpha-1|10 mg':'TA10',
    'pt-141|10 mg':'P41',
    'vip|5 mg':'VP5','vip|10 mg':'VP10',
    'pnc-27|5 mg':'PN5','pnc-27|10 mg':'PN10',
    'teriparatide|10 mg':'TER10',
    'melanotan-ii|10 mg':'ML10',
    'b12-methylcobalamin|10 ml':'B12',
    'kisspeptin-10|5 mg':'KS5','kisspeptin-10|10 mg':'KS10',
    'melanotan-1|5 mg':'MT1',
    // Aesthetics & Lipolytics
    'lemon-bottle|10 ml':'柠檬瓶',
    'lipo-c|10 ml':'LC120',
    'lipo-b|10 ml':'LC216',
    'l-carnitine|10 ml':'LC500',
    // Accessories
    'bac-water|10 ml':'WA10',
    'bac-water|3 ml':'WA3',
  };

  const BY_KEY = {};
  PRODUCTS.forEach(p => p.variants.forEach(v => {
    BY_KEY[p.slug + '|' + v.mass] = {
      name: p.name, slug: p.slug, sub: p.sub, cat: p.cat,
      needsCompanion: !!p.needsCompanion,
      mass: v.mass, vials: v.vials || 10, price: v.price,
      code: CODES[p.slug + '|' + v.mass] || '',
    };
  }));

  const $ = (id) => document.getElementById(id);
  const fmt = (n) => '$' + Number(n).toLocaleString('en-US');

  let cart = loadCart();

  function loadCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      // Drop anything no longer in the catalog; clamp qty 1..99.
      return raw
        .filter(l => l && BY_KEY[l.key] && parseInt(l.qty, 10) > 0)
        .map(l => ({ key: l.key, qty: Math.min(99, Math.max(1, parseInt(l.qty, 10) || 1)) }));
    } catch (e) { return []; }
  }
  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    updateBadge();
  }
  const count = () => cart.reduce((s, l) => s + l.qty, 0);
  const subtotal = () => cart.reduce((s, l) => s + (BY_KEY[l.key].price * l.qty), 0);

  // Money with cents only when needed ($415 stays clean; $373.50 shows cents).
  const fmtD = (n) => {
    const r = Math.round(Number(n) * 100) / 100;
    return '$' + r.toLocaleString('en-US', { minimumFractionDigits: r % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });
  };
  // Sale and referral are additive: both percentages come off the same
  // subtotal, so 20% + 10% is a straight 30% off rather than 20% then 10%
  // of the remainder.
  const saleAmt     = () => Math.round(subtotal() * SALE_RATE * 100) / 100;
  const referralRate = () => (appliedCode === 'VETERAN' ? 0.20 : DISCOUNT_RATE);
  const referralPct  = () => (appliedCode === 'VETERAN' ? 20 : DISCOUNT_PCT);
  const referralAmt = () => (appliedCode ? Math.round(subtotal() * referralRate() * 100) / 100 : 0);
  const discountAmt = () => (appliedCode === 'VETERAN' ? referralAmt() : saleAmt() + referralAmt());
  const grandTotal  = () => subtotal() - discountAmt();

  // Unique web-order reference: AA-YYMMDD-XXXX. No backend/shared counter exists
  // (static site), so this can't be the generator's sequential AA-NNNN — instead
  // it's date + 4 random chars (ambiguous chars omitted) so it's collision-proof
  // across browsers/devices. It rides the Venmo note, the order email subject,
  // and the payload, so the payment, the email, and the CRM row all share one ref.
  function makeOrderRef() {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
    let suf = '';
    for (let i = 0; i < 4; i++) suf += chars[Math.floor(Math.random() * chars.length)];
    return `AA-${yy}${mm}${dd}-${suf}`;
  }

  /* ----- Referral code apply ----- */
  function applyReferral() {
    const input = $('of-referral');
    const msg   = $('referral-msg');
    const raw   = (input.value || '').trim().toUpperCase();
    if (!raw) {
      appliedCode = null;
      msg.textContent = ''; msg.className = 'cart-referral__msg';
    } else if (resolveCode(raw)) {
      appliedCode = resolveCode(raw);
      msg.textContent = (SALE_ACTIVE && appliedCode !== 'VETERAN')
        ? `Code applied — ${DISCOUNT_PCT}% off on top of the ${SALE_PCT}% ${SALE_NAME} sale. ${SALE_PCT + DISCOUNT_PCT}% off total.`
        : `Code applied — ${referralPct()}% off your order.`;
      msg.className = 'cart-referral__msg is-ok';
    } else {
      appliedCode = null;
      msg.textContent = (SALE_ACTIVE && appliedCode !== 'VETERAN')
        ? `That code isn't valid. The ${SALE_PCT}% ${SALE_NAME} sale still applies.`
        : "That code isn't valid — your order stands at full price.";
      msg.className = 'cart-referral__msg is-err';
    }
    renderTotals();
  }

  /* ----- Totals (subtotals + optional discount/total rows) ----- */
  function renderTotals() {
    const sub = subtotal();
    $('cart-subtotal').textContent   = fmt(sub);
    $('cart-subtotal-2').textContent = fmt(sub);

    const saleRow  = $('cart-sale-row');
    const discRow  = $('cart-discount-row');
    const totalRow = $('cart-total-row');
    const saleNote = $('cart-sale-note');

    // Sitewide sale — shown whenever it's running and there's something in the cart.
    if (SALE_ACTIVE && sub > 0 && appliedCode !== 'VETERAN') {
      $('cart-sale-name').textContent = SALE_NAME;
      $('cart-sale-pct').textContent  = SALE_PCT;
      $('cart-sale-amt').textContent  = '-' + fmtD(saleAmt());
      saleRow.hidden = false;
    } else {
      saleRow.hidden = true;
    }

    // Referral code — stacks on top of the sale.
    if (appliedCode && sub > 0) {
      $('cart-discount-2').textContent    = '-' + fmtD(referralAmt());
      $('cart-discount-code').textContent = appliedCode;
      $('cart-discount-pct').textContent  = referralPct();
      discRow.hidden = false;
    } else {
      discRow.hidden = true;
    }

    const anyDiscount = sub > 0 && (SALE_ACTIVE || appliedCode);
    if (anyDiscount) {
      $('cart-total-2').textContent = fmtD(grandTotal());
      totalRow.hidden = false;
    } else {
      totalRow.hidden = true;
    }

    // Plain-language nudge on the first cart screen.
    if (saleNote) {
      if (SALE_ACTIVE && sub > 0 && appliedCode !== 'VETERAN') {
        saleNote.innerHTML = appliedCode
          ? `<strong>${SALE_PCT}% ${escapeHtml(SALE_NAME)} sale applied automatically</strong>, plus ${DISCOUNT_PCT}% for code ${escapeHtml(appliedCode)} &mdash; ${SALE_PCT + DISCOUNT_PCT}% off, shown at the next step.`
          : `<strong>${SALE_PCT}% ${escapeHtml(SALE_NAME)} sale applied automatically</strong> &mdash; shown at the next step. Have an affiliate code? Add it there for another ${DISCOUNT_PCT}% off.`;
        saleNote.hidden = false;
      } else {
        saleNote.hidden = true;
      }
    }
  }

  /* ----- Badge ----- */
  function updateBadge() {
    const el = $('cart-count');
    if (!el) return;
    const n = count();
    el.textContent = n;
    el.dataset.empty = n === 0 ? 'true' : 'false';
  }

  /* ----- Drawer open / close ----- */
  const overlay = $('cart-overlay');
  const drawer  = $('cart-drawer');
  let lastFocus = null;

  function openDrawer() {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    drawer.setAttribute('aria-hidden', 'false');
    // Force a reflow so the slide-in transition runs from the off-screen state.
    // (Don't rely on requestAnimationFrame here — it's throttled when the tab
    // isn't visible, which would leave the drawer stuck off-screen.)
    void drawer.offsetWidth;
    overlay.classList.add('is-open');
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    $('cart-close').focus();
  }
  function closeDrawer() {
    overlay.classList.remove('is-open');
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => { overlay.hidden = true; }, 280);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ----- View switching (list / details / success) ----- */
  function showView(name) {
    $('cart-view-list').hidden    = name !== 'list';
    $('cart-view-email').hidden   = name !== 'email';
    $('cart-view-details').hidden = name !== 'details';
    $('cart-view-success').hidden = name !== 'success';
    $('cart-drawer-title').textContent =
      name === 'email' ? 'Your email' : name === 'details' ? 'Order details' :
      name === 'success' ? 'Confirmed' : 'Your order';
  }

  /* ----- Render line items ----- */
  function renderLines() {
    const wrap   = $('cart-lines');
    const empty  = $('cart-empty');
    const hasItems = cart.length > 0;

    empty.style.display = hasItems ? 'none' : 'block';

    // Accessory gate: BAC water (and anything else flagged needsCompanion)
    // can sit in the cart on its own, but checkout stays shut until there's a
    // real product to ship it with.
    const gateNames = [...new Set(
      cart.filter(l => BY_KEY[l.key] && BY_KEY[l.key].needsCompanion)
          .map(l => BY_KEY[l.key].name)
    )];
    const hasCompanion = cart.some(l => BY_KEY[l.key] && !BY_KEY[l.key].needsCompanion);
    const blocked = hasItems && gateNames.length > 0 && !hasCompanion;

    $('cart-continue').disabled = !hasItems || blocked;

    const gateNote = $('cart-gate-note');
    if (gateNote) {
      if (blocked) {
        const label = gateNames.join(' and ');
        gateNote.textContent =
          `${label} must be added with other products. Add anything else to your order and it ships along with it.`;
        gateNote.hidden = false;
      } else {
        gateNote.hidden = true;
      }
    }

    wrap.innerHTML = cart.map(l => {
      const p = BY_KEY[l.key];
      const vials = p.vials || 10;
      return `
        <div class="cart-line" data-key="${escapeHtml(l.key)}">
          <div>
            <div class="cart-line__name">${escapeHtml(p.name)}</div>
            <div class="cart-line__meta">${escapeHtml(p.mass)} &middot; ${vials}-vial box &middot; ${fmt(p.price)}/box</div>
          </div>
          <div class="cart-line__line-total">${fmt(p.price * l.qty)}</div>
          <div class="cart-line__controls">
            <div class="cart-stepper">
              <button type="button" class="cart-dec" aria-label="Decrease quantity">&minus;</button>
              <span class="cart-stepper__qty">${l.qty}</span>
              <button type="button" class="cart-inc" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="cart-line__remove">Remove</button>
          </div>
        </div>
      `;
    }).join('');

    renderTotals();
  }

  /* ----- Cart mutations ----- */
  function addToCart(key) {
    if (!BY_KEY[key]) return;
    const line = cart.find(l => l.key === key);
    if (line) line.qty = Math.min(99, line.qty + 1);
    else cart.push({ key, qty: 1 });
    saveCart();
    renderLines();
    showView('list');
    openDrawer();
  }
  function setQty(key, qty) {
    qty = Math.max(0, Math.min(99, qty));
    if (qty === 0) { cart = cart.filter(l => l.key !== key); }
    else { const line = cart.find(l => l.key === key); if (line) line.qty = qty; }
    saveCart();
    renderLines();
  }

  /* ----- Add-to-order buttons (event delegation on the catalog) ----- */
  const catalogRoot = $('catalog-root');
  if (catalogRoot) {
    catalogRoot.addEventListener('click', (e) => {
      const btn = e.target.closest('.cart-add');
      if (!btn) return;
      addToCart(btn.dataset.key);
      const original = btn.textContent;
      btn.textContent = 'Added ✓';
      btn.classList.add('pc-btn--added');
      setTimeout(() => { btn.textContent = original; btn.classList.remove('pc-btn--added'); }, 1200);
    });
  }

  /* ----- Line item controls (delegation on the lines container) ----- */
  $('cart-lines').addEventListener('click', (e) => {
    const row = e.target.closest('.cart-line');
    if (!row) return;
    const key = row.dataset.key;
    const line = cart.find(l => l.key === key);
    if (!line) return;
    if (e.target.closest('.cart-inc'))         setQty(key, line.qty + 1);
    else if (e.target.closest('.cart-dec'))    setQty(key, line.qty - 1);
    else if (e.target.closest('.cart-line__remove')) setQty(key, 0);
  });

  /* ----- Email gate (required before the pay screen) -----------------------
     Captures the customer's email the moment they head to checkout — and fires
     it to the inbox right away, so an abandoned cart still leaves us the lead.
     Stored locally so returning buyers aren't re-asked. This is lead capture,
     not a login: a static site can't truly hold accounts, but it CAN make the
     email the price of admission to the payment step. */
  const EMAIL_KEY = 'aa_email_v1';
  const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function getSavedEmail() {
    try { return localStorage.getItem(EMAIL_KEY) || ''; } catch (e) { return ''; }
  }

  function sendCheckoutLead(email) {
    // Fire-and-forget — never block the customer if Web3Forms is slow/down.
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: `WEB CHECKOUT LEAD: ${email}`,
          from_name: 'Aligned Aminos Website',
          botcheck: '',
          email: email,
          note: 'Reached the checkout email step. May or may not have completed the order.',
          submitted_from: `${location.host}${location.pathname} on ${new Date().toISOString().slice(0,16).replace('T',' ')} UTC`,
        }),
      }).catch(() => {});
    } catch (e) {}
  }

  function goToDetails(email) {
    const ofEmail = $('of-email');
    if (ofEmail && email) ofEmail.value = email;   // prefill so they don't retype it
    showView('details');
  }

  /* ----- Navigation between views ----- */
  $('cart-continue').addEventListener('click', () => {
    if (!cart.length) return;
    const saved = getSavedEmail();
    if (EMAIL_RE.test(saved)) {
      goToDetails(saved);                  // already gave us an email — skip the gate
    } else {
      showView('email');
      const eg = $('eg-email');
      if (eg) setTimeout(() => eg.focus(), 60);
    }
  });

  $('email-gate-back').addEventListener('click', () => showView('list'));
  $('email-gate-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = $('email-gate-form');
    const email = (f.email.value || '').trim();
    const bot   = f.botcheck && f.botcheck.checked;
    const st    = $('email-gate-status');
    if (!EMAIL_RE.test(email)) {
      st.innerHTML = 'Please enter a valid email to continue.';
      return;
    }
    st.innerHTML = '';
    if (bot) { goToDetails(email); return; }   // bot caught: advance, don't capture
    try { localStorage.setItem(EMAIL_KEY, email); } catch (e) {}
    sendCheckoutLead(email);
    goToDetails(email);
  });

  $('order-back').addEventListener('click', () => showView('list'));
  $('referral-apply').addEventListener('click', applyReferral);
  $('of-referral').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); applyReferral(); } });
  $('order-done').addEventListener('click', closeDrawer);
  $('order-print').addEventListener('click', () => window.print());

  /* Copy buttons on the pay blocks (Zelle email/memo + USDT address). */
  const successWrap = $('cart-view-success');
  if (successWrap) {
    successWrap.addEventListener('click', (e) => {
      // Payment-method selector — reveal only the chosen method's details.
      const methodBtn = e.target.closest('.pay-method');
      if (methodBtn) { selectPayMethod(methodBtn.dataset.method); return; }
      const btn = e.target.closest('.zelle-copy');
      if (!btn) return;
      const src = $(btn.dataset.copy);
      const text = src ? src.textContent.trim() : '';
      if (!text || !navigator.clipboard) return;
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied';
        btn.classList.add('is-copied');
        setTimeout(() => { btn.textContent = orig; btn.classList.remove('is-copied'); }, 1400);
      }).catch(() => {});
    });
  }

  /* ----- Open / close wiring ----- */
  $('cart-toggle').addEventListener('click', () => { renderLines(); showView('list'); openDrawer(); });
  $('cart-close').addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
  });

  /* ----- Order text builders ----- */
  function orderLinesText() {
    return cart.map(l => {
      const p = BY_KEY[l.key];
      const vials = p.vials || 10;
      const codeTag = p.code ? `[${p.code}] ` : '';
      return `${codeTag}${l.qty} x ${p.name} (${p.mass}, ${vials}-vial box) @ ${fmt(p.price)}/box = ${fmt(p.price * l.qty)}`;
    }).join('\n');
  }
  function receiptHtml(orderRef) {
    const refRow = orderRef
      ? `<div class="ln" style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border-subtle);"><span>Order ref</span><span>${escapeHtml(orderRef)}</span></div>`
      : '';
    const rows = refRow + cart.map(l => {
      const p = BY_KEY[l.key];
      return `<div class="ln"><span>${l.qty}&times; ${escapeHtml(p.name)} (${escapeHtml(p.mass)})</span><span>${fmt(p.price * l.qty)}</span></div>`;
    }).join('');
    if (subtotal() > 0 && (SALE_ACTIVE || appliedCode)) {
      const saleLine = (SALE_ACTIVE && appliedCode !== 'VETERAN')
        ? `<div class="ln"><span>${escapeHtml(SALE_NAME)} sale (${SALE_PCT}% off)</span><span>-${fmtD(saleAmt())}</span></div>`
        : '';
      const refLine = appliedCode
        ? `<div class="ln"><span>Referral ${escapeHtml(appliedCode)} (${referralPct()}% off)</span><span>-${fmtD(referralAmt())}</span></div>`
        : '';
      return rows +
        `<div class="ln"><span>Subtotal (free shipping)</span><span>${fmt(subtotal())}</span></div>` +
        saleLine + refLine +
        `<div class="ln sub"><span>Order total</span><span>${fmtD(grandTotal())}</span></div>`;
    }
    return rows + `<div class="ln sub"><span>Order total (free shipping)</span><span>${fmt(subtotal())}</span></div>`;
  }

  /* ----- Payment-method selector (success screen) ----- */
  // Recipient details (Venmo holding co., Zelle email, USDT wallet) stay hidden
  // until the customer picks a method — nothing personal sits on the page by
  // default. Each setup* fn below just populates its block; this controls which
  // one is visible.
  const PAY_METHODS = ['venmo', 'zelle', 'usdt', 'wise'];
  function selectPayMethod(method) {
    PAY_METHODS.forEach((m) => {
      const block = $(`pay-block-${m}`);
      const btn = document.querySelector(`.pay-method[data-method="${m}"]`);
      const on = (m === method);
      if (block) block.hidden = !on;
      if (btn) {
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    });
  }
  function resetPaySelection() {
    PAY_METHODS.forEach((m) => {
      const block = $(`pay-block-${m}`);
      const btn = document.querySelector(`.pay-method[data-method="${m}"]`);
      if (block) block.hidden = true;
      if (btn) { btn.classList.remove('is-active'); btn.setAttribute('aria-pressed', 'false'); }
    });
  }

  /* ----- Venmo pay button (success screen) ----- */
  function setupVenmoButton(orderRef, amount) {
    const btn = $('venmo-pay');
    if (!btn) return;
    const amt  = (Math.round(Number(amount) * 100) / 100).toFixed(2);
    // DO NOT CHANGE: the Venmo memo must always carry the order/invoice ref
    // (AA-YYMMDD-XXXX). It is the ONLY key we use to match a payment to an
    // order. Never repurpose this note or drop the ref. (Per Kelley.)
    const note = `Aligned Aminos ${orderRef}`;
    btn.href =
      `https://venmo.com/?txn=pay&audience=private` +
      `&recipients=${encodeURIComponent(VENMO_HANDLE)}` +
      `&amount=${amt}` +
      `&note=${encodeURIComponent(note)}`;
    btn.textContent = `Pay ${fmtD(amount)} with Venmo`;
  }

  /* ----- Zelle pay (success screen) ----- */
  // Zelle has no payment deep-link — the customer sends manually in their bank
  // app. We just display the recipient, amount, and the SAME order-ref memo as
  // Venmo (DO NOT CHANGE: the memo is the only key we match payments on).
  function setupZelle(orderRef, amount) {
    const wrap = $('zelle-pay');
    if (!wrap) return;
    $('zelle-name').textContent   = ZELLE_NAME;
    $('zelle-email').textContent  = ZELLE_EMAIL;
    $('zelle-amount').textContent = fmtD(amount);
    $('zelle-memo').textContent   = `Aligned Aminos ${orderRef}`;
  }

  /* ----- USDT (Tether) pay (success screen) ----- */
  // USDT ≈ $1, so the amount is just the dollar total. We show the wallet,
  // the EXACT amount, and the network (sending on the wrong network can lose
  // the funds). No deep-link / memo — Jordan matches by amount.
  function setupUsdt(orderRef, amount) {
    const wrap = $('usdt-pay');
    if (!wrap) return;
    const amt = (Math.round(Number(amount) * 100) / 100).toFixed(2);
    $('usdt-amount').textContent  = `${amt} USDT`;
    $('usdt-address').textContent = USDT_ADDRESS;
  }

  /* ----- Wise pay (success screen) ----- */
  // Like Zelle, Wise has no per-recipient/amount deep-link — the customer sends
  // manually in the app. We display the recipient email, the USD amount, and the
  // SAME order-ref reference (DO NOT CHANGE: the memo is the only key we match
  // payments on).
  function setupWise(orderRef, amount) {
    const wrap = $('wise-pay');
    if (!wrap) return;
    $('wise-name').textContent   = WISE_NAME;
    $('wise-email').textContent  = WISE_EMAIL;
    $('wise-amount').textContent = fmtD(amount);
    $('wise-memo').textContent   = `Aligned Aminos ${orderRef}`;
  }

  /* ----- Submit the order ----- */
  const form = $('order-form');
  const status = $('order-status');
  const trim = (v) => (v || '').trim();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!cart.length) { showView('list'); return; }

    const f = form;
    const name    = trim(f.name.value);
    const email   = trim(f.email.value);
    const phone   = trim(f.phone.value);
    const address = trim(f.address.value);
    const address2= trim(f.address2.value);
    const city    = trim(f.city.value);
    const state   = trim(f.state.value);
    const zip     = trim(f.zip.value);
    const country = trim(f.country.value);
    const notes   = trim(f.notes.value);
    const ack     = f.ruo_ack.checked;
    const botcheck= f.botcheck && f.botcheck.checked;

    if (!name || !email || !phone || !address || !city || !state || !zip || !country) {
      status.innerHTML = 'Please fill in all required fields.';
      return;
    }
    if (!ack) { status.innerHTML = 'Please confirm the research-use-only acknowledgment to continue.'; return; }

    // Honeypot: silently fake success for bots.
    if (botcheck) { showView('success'); return; }

    // Re-validate the referral code from the field (covers typing without clicking
    // Apply). An invalid code just means no discount — it never blocks the order.
    applyReferral();
    const referralCode = appliedCode || '';
    const discount     = discountAmt();
    const total        = grandTotal();
    const orderRef     = makeOrderRef();

    const submitBtn = $('order-submit');
    const originalLabel = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending…';
    status.innerHTML = '';

    const shipBlock =
      `${name}\n${address}${address2 ? '\n' + address2 : ''}\n${city}, ${state} ${zip}\n${country}`;

    // Machine-readable order payload so the invoice generator can build the PDF
    // with one command (New-Invoice.ps1 -FromClipboard) — no retyping. Prices are
    // pulled live from the catalog here, so stale localStorage values can't sneak in.
    const invoicePayload = {
      type: 'aligned-aminos-order',
      v: 1,
      ref: orderRef,
      customer: { name, email, phone, address, address2, city, state, zip, country },
      items: cart.map(l => {
        const p = BY_KEY[l.key];
        return { name: p.name, code: p.code || '', mass: p.mass, vials: p.vials || 10, slug: p.slug, qty: l.qty, unit_price: p.price };
      }),
      referral_code: referralCode,
      sale_name: SALE_ACTIVE ? SALE_NAME : '',
      sale_rate: SALE_RATE,
      sale_discount: saleAmt(),
      referral_rate: referralCode ? DISCOUNT_RATE : 0,
      referral_discount: referralAmt(),
      discount: discount,
      notes: notes || ''
    };
    const payloadBlock =
      'BEGIN INVOICE PAYLOAD\n' +
      JSON.stringify(invoicePayload, null, 2) +
      '\nEND INVOICE PAYLOAD';

    const totalsText = (SALE_ACTIVE || referralCode)
      ? [
          `Subtotal (free shipping): ${fmt(subtotal())}`,
          SALE_ACTIVE ? `${SALE_NAME} sale (${SALE_PCT}% off): -${fmtD(saleAmt())}` : null,
          referralCode ? `Referral ${referralCode} (${DISCOUNT_PCT}% off): -${fmtD(referralAmt())}` : null,
          `Order total: ${fmtD(total)}`,
        ].filter(Boolean).join('\n')
      : `Order total (free shipping): ${fmt(subtotal())}`;

    const message =
`WEB ORDER ${orderRef}

ITEMS
${orderLinesText()}

${totalsText}
Total boxes: ${count()}

SHIP TO
${shipBlock}

CONTACT
Email: ${email}
Phone: ${phone}

NOTES
${notes || '(none)'}

RUO acknowledged: Yes

PAYMENT (customer pays online at checkout)
The customer was shown four options for ${fmtD(total)}:
  - Venmo: @${VENMO_HANDLE} (Vagabond Muscle) - memo "Aligned Aminos ${orderRef}"
  - Zelle: ${ZELLE_EMAIL} (${ZELLE_NAME}) - memo "Aligned Aminos ${orderRef}"
  - USDT (Tether) on ${USDT_NETWORK}: ${USDT_ADDRESS}
    expected ${(Math.round(Number(total) * 100) / 100).toFixed(2)} USDT (no on-chain memo - match by amount)
  - Wise: ${WISE_EMAIL} (${WISE_NAME}) in USD - reference "Aligned Aminos ${orderRef}"
Check ALL FOUR for an incoming payment, then confirm stock and ship.
No invoice needs to be generated for an order paid online.

------------------------------------------------------------
ONLY IF THEY DID NOT PAY ONLINE - generate an invoice:
Copy everything between the two markers below, then run:
  .\\New-Invoice.ps1 -FromClipboard
The invoice reuses ref ${orderRef} (no new number) and includes the
Venmo button. Forward that PDF to the customer.
------------------------------------------------------------

${payloadBlock}`;

    const payload = {
      access_key: ACCESS_KEY,
      subject: `WEB ORDER ${orderRef}: ${name} (${count()} boxes, ${fmtD(total)})`,
      from_name: 'Aligned Aminos Website',
      botcheck: '',
      order_ref: orderRef,
      name: name,
      email: email,
      phone: phone,
      ship_to: shipBlock,
      order_items: orderLinesText(),
      subtotal_free_shipping: fmt(subtotal()),
      referral_code: referralCode || '(none)',
      discount_amount: referralCode ? '-' + fmtD(discount) : '$0',
      order_total: fmtD(total),
      total_boxes: count(),
      notes: notes || '(none)',
      ruo_acknowledged: 'Yes',
      message: message,
      submitted_from: `${window.location.host}${window.location.pathname} on ${new Date().toISOString().slice(0,16).replace('T',' ')} UTC`,
    };

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        // Build the success UI from the live order BEFORE clearing the cart.
        $('order-receipt').innerHTML = receiptHtml(orderRef);
        setupVenmoButton(orderRef, total);
        setupZelle(orderRef, total);
        setupUsdt(orderRef, total);
        setupWise(orderRef, total);
        resetPaySelection();
        showView('success');
        cart = [];
        appliedCode = null;
        saveCart();
        renderLines();
        form.reset();
        f.country.value = 'United States';
        $('of-referral').value = '';
        $('referral-msg').textContent = '';
        $('referral-msg').className = 'cart-referral__msg';
      } else {
        status.innerHTML =
          "Hm, that didn't go through. Please try again, or email " +
          `<a href="mailto:${FALLBACK}">${FALLBACK}</a> with your order.`;
      }
    } catch (err) {
      status.innerHTML =
        "Couldn't reach the server. Check your connection and try again, " +
        `or email <a href="mailto:${FALLBACK}">${FALLBACK}</a> with your order.`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
    }
  });

  /* ----- Init ----- */
  updateBadge();
  renderLines();
  // Allow other pages to deep-link the cart open: catalog.html#cart
  if (window.location.hash === '#cart') {
    showView('list');
    openDrawer();
  }
})();
