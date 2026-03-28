# Chrome Web Store — listing (copy-paste)

Use this file when creating or updating the **Chrome Web Store Developer Dashboard** listing.  
Keep [PRIVACY.md](PRIVACY.md) in sync; the Store requires a **public privacy policy URL** (e.g. GitHub, GitHub Pages, Notion — not a local file path).

---

## Name

**Top Bookmarks Reorder**

---

## Short description (max ~132 characters)

Use in the Store “short description” field and optionally align `manifest.json` → `description`.

```
Automatically move your most-used bookmarks to the left based on browsing history. Preview changes and restore anytime.
```

*(119 characters.)*

---

## Full description

Paste into the Store “detailed description” (plain text; the dashboard may accept line breaks).

```
Top Bookmarks Reorder helps you keep your bookmarks bar optimized automatically.

The extension analyzes your browsing history over a configurable time window, identifies the most frequently used domains, and matches them to your existing bookmarks.

With a simple preview → apply workflow, you can safely reorder your bookmarks bar so that your most-used sites are always on the left.

Key features:
- Automatic ranking based on usage (visit count + recency)
- Preview before applying changes
- Restore previous order instantly
- Configurable Top N bookmarks
- Exclude domains and lock specific bookmarks
- Fully local processing — no data leaves your browser

How it works:
1. Analyze your browsing history
2. Match domains to your bookmarks
3. Preview suggested order
4. Apply changes safely

This extension does NOT send any data externally. All processing is done locally in your browser.
```

---

## Privacy policy (required)

**Critical:** Chrome Web Store needs a **public HTTPS URL** — not “we have a file in the repo.” Reviewers must open the link without logging in.

1. **Source of truth:** [PRIVACY.md](PRIVACY.md) in this repo (keep the hosted copy in sync).
2. **Typical public URLs (pick one):**
   - **GitHub raw** (this project):  
     **`https://raw.githubusercontent.com/FoxRav/top-bookmarks-reorder/main/PRIVACY.md`**  
     Repo: [https://github.com/FoxRav/top-bookmarks-reorder](https://github.com/FoxRav/top-bookmarks-reorder.git)
   - **GitHub Pages** or **Notion public page** — same policy text, often nicer for humans than raw `.md`.
   - **Your own domain** — fine if HTTPS and publicly reachable.
3. Paste that URL into the Developer Dashboard **Privacy policy** field.
4. **`history` permission:** reviewers expect a clear local-only policy — [PRIVACY.md](PRIVACY.md) already states no external transmission and user control.

**In-app copy (already in the extension popup):**  
`All processing is local. No data is sent externally.` — helps trust and review for sensitive permissions.

---

## Screenshots (strongly recommended)

Capture at least **4** images (1280×800 or similar is common for Store assets):

| # | Suggested content |
|---|-------------------|
| 1 | Popup: Analyze + buttons visible |
| 2 | Popup: preview list visible after Analyze |
| 3 | Options / settings page |
| 4 | Bookmarks bar **before vs after** (two panels or annotated) |

Good screenshots help approval and installs more than code tweaks alone.

---

## Icons (already in repo)

| Size | Path |
|------|------|
| 128×128 | `icons/icon128.png` (Store listing / large icon) |
| 48×48 | `icons/icon48.png` |
| 16×16 | `icons/icon16.png` |

`manifest.json` references 16 / 32 / 48 / 128.

**Optional (not required for review):** the **16×16** toolbar icon can look soft if the design is busy. A simpler glyph (e.g. bookmark + arrow, high contrast, no fine detail) often reads clearer. Safe to ship as-is; refine later if you want a sharper toolbar look.

---

## ZIP package for upload

**Include only** what Chrome needs to load the extension:

```
manifest.json
src/
icons/
```

**Do not** zip: `.git/`, `.cursor/`, `node_modules/`, dev docs unless you intend them inside the package (they are unnecessary and increase size).

From the project root, build a zip that contains **only** `manifest.json`, `src/`, and `icons/` (no `.git` or dev files). Example:

```powershell
Compress-Archive -Path manifest.json,src,icons -DestinationPath dist/top-bookmarks-reorder-store.zip -Force
```

Upload that ZIP in the Developer Dashboard. (`dist/` and `*.zip` are gitignored.)

---

## Publish checklist

- [ ] Listing: name, short + full description
- [ ] Privacy policy **public HTTPS URL** (same content as [PRIVACY.md](PRIVACY.md); **not** repo-only)
- [ ] At least 1 screenshot (4+ recommended)
- [ ] ZIP built without junk folders (only `manifest.json`, `src/`, `icons/`)
- [ ] Visibility: **Public** (when ready)
- [ ] Submit for review

### Concrete order of operations

1. Host the privacy policy at a **public HTTPS URL** (see [Privacy policy](#privacy-policy-required) above).
2. Take **4 screenshots** (popup, preview, options, before/after bar).
3. Build the **ZIP** with the script; confirm it only contains `manifest.json`, `src/`, `icons/`.
4. **Upload** the package in Chrome Web Store Developer Dashboard.
5. Fill listing + privacy URL + screenshots → **Submit** for review.

### Publish readiness (at a glance)

| Area | Notes |
|------|--------|
| Code / MV3 | Ready |
| Manifest / permissions | `bookmarks`, `history`, `storage` — expected for this app |
| UI | Preview + restore + local-only line in popup |
| Privacy **content** | [PRIVACY.md](PRIVACY.md) |
| Privacy **URL** | **Must do:** public HTTPS before Store submit |
| Listing | Copy in this file |
| Icons | OK; optional 16×16 simplification later |

---

## Review notes (this extension)

| Topic | Status |
|--------|--------|
| `history` permission | Sensitive — policy + in-app “local only” copy help reviewers |
| Misleading behavior | OK: reorder only after user **Analyze** / **Apply** |
| UI clarity | OK: preview + restore |

---

## Optional next step (growth / CTR)

If you want a separate pass: **store title variants**, **thumbnail copy**, and **first-user acquisition** tactics — do that as a dedicated content iteration after the first approval.
