# How to Update the Catalog

The catalog (`catalog.html`) is driven by a single product list inside the file. No build step. Edit the file, save, refresh the browser. Done.

---

## How to change a price

**Important: prices are per BOX, not per vial.** Customers buy by the box. Default box size is 10 vials. The price shown on the card is the total for that box.

1. Open `catalog.html` in any text editor (Notepad, VS Code, whatever)
2. Find the section near the bottom that starts with `const PRODUCTS = [`
3. Find the line for the product you want to update — they're grouped by category with comment headers
4. Change the `price` number (whole dollars, no $ sign, no commas)
5. Save the file
6. Refresh the browser

**Example — change BPC-157 from $240/box to $280/box:**

Find this line:
```javascript
{ cat: 'recovery',  name: 'BPC-157',         sub: 'Body Protection Compound',          mass: '10 mg', vials: 10, price: 240 },
```

Change `price: 240` to `price: 280`:
```javascript
{ cat: 'recovery',  name: 'BPC-157',         sub: 'Body Protection Compound',          mass: '10 mg', vials: 10, price: 280 },
```

Save, refresh. The card updates. Prices over $999 auto-format with a comma (e.g. `1010` displays as `$1,010`).

---

## How to add a new product

Copy any existing line, paste it on a new line, edit the fields. Order in the file = order on the page.

**Each product needs six things:**

| Field    | What it is                                      | Example                               |
|----------|-------------------------------------------------|---------------------------------------|
| `cat`    | Which category section it appears under         | `'recovery'`                          |
| `name`   | The big bold name shown on the card             | `'BPC-157'`                           |
| `sub`    | Small descriptive text under the name           | `'Body Protection Compound'`          |
| `mass`   | Mass per single vial                            | `'10 mg'`                             |
| `vials`  | Number of vials in the box (usually 10)         | `10`                                  |
| `price`  | Total customer price per box in dollars (number)| `240`                                 |

Valid `cat` values (must match exactly, lowercase):
- `'metabolic'` &mdash; Metabolic & GLP-1
- `'recovery'` &mdash; Recovery & Repair
- `'gh-axis'` &mdash; Growth & GH Axis
- `'longevity'` &mdash; Longevity & Anti-Aging
- `'cognition'` &mdash; Cognition & Mood
- `'misc'` &mdash; Hormones, Sexual Health & Misc
- `'accessory'` &mdash; Accessories

**Important:** keep the comma at the end of the line. The format is fussy about that.

---

## How to remove a product

Find its line in `PRODUCTS`, delete the entire line, save, refresh.

---

## How to add a new category

1. Find the section near the bottom that starts with `const CATEGORIES = [`
2. Add a new line like:
   ```javascript
   { id: 'newcat', name: 'My New Category' },
   ```
3. Use `'newcat'` as the `cat` value on any products you want in that section

Order in the `CATEGORIES` array = order of sections on the page.

---

## How to change a data sheet link

Right now every "Data sheet" button goes to `#` (nowhere). When you have real PDFs:

1. Find the `renderCard` function in the file
2. Find the line: `<a class="product-card__cta" href="#">Data sheet`
3. We'll wire each product to its own URL &mdash; ping me when you have the PDFs and I'll add a `dataSheet` field to each product

---

## What NOT to do

- **Don't change** the names of fields (`cat`, `name`, `sub`, `mass`, `price`). The render code expects those exact names.
- **Don't delete** the commas at the end of each line.
- **Don't remove** the comment dividers (`// ─── Recovery & Repair ───`). They're just for human readability but losing them makes the file hard to scan.
- **Don't edit** anything inside `renderCard()`, `renderCatalog()`, or the contact form section unless you know HTML/JS. Ping me for any structural changes.

---

## Sanity check after editing

Open `catalog.html` in a browser. If you see:
- **The full catalog with your changes:** Good.
- **A blank page where the products should be:** You probably broke the JavaScript &mdash; missing a comma or quote somewhere. Open DevTools (F12), click Console, look for the red error. Or undo your last edit and try again.

---

## Files in this folder

- `index.html` &mdash; The home page
- `catalog.html` &mdash; The product catalog (this file)
- `logo.png` &mdash; The ember-crystal logo used in the nav
- `Aligned Aminos Logo.pdf` / `.png` &mdash; Original saved logo files (reference copies)
- `HOW_TO_UPDATE.md` &mdash; This file
