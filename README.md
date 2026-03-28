# Top Bookmarks Reorder

**Top Bookmarks Reorder** helps you keep your bookmarks bar optimized automatically.

The extension analyzes your browsing history over a configurable time window, identifies the most frequently used domains, and matches them to your existing bookmarks.

With a simple **preview → apply** workflow, you can safely reorder your bookmarks bar so that your most-used sites are always on the left.

### Key features

- Automatic ranking based on usage (visit count + recency)
- Preview before applying changes
- Restore previous order instantly
- Configurable Top N bookmarks
- Exclude domains and lock specific bookmarks
- Fully local processing — no data leaves your browser

### How it works

1. Analyze your browsing history
2. Match domains to your bookmarks
3. Preview suggested order
4. Apply changes safely

This extension does **not** send any data externally. All processing is done locally in your browser.

### Chrome Web Store (publishing)

Store listing copy, screenshot checklist, ZIP instructions, and review notes: **[STORE_LISTING.md](STORE_LISTING.md)**.

- **Privacy policy:** [PRIVACY.md](PRIVACY.md) is the source text. **Chrome Web Store requires a public HTTPS URL** to that policy (e.g. `https://raw.githubusercontent.com/USER/REPO/branch/PRIVACY.md` for a public repo). A file only in a private folder or “we have PRIVACY.md in the zip” does **not** replace this.
- **In-app:** the popup includes *“All processing is local. No data is sent externally.”* to align with `history` review expectations.
- **Store ZIP:** create a zip that contains **only** `manifest.json`, `src/`, and `icons/` at the root (no `.git`, `dist`, or dev docs). Example (PowerShell from repo root):  
  `Compress-Archive -Path manifest.json,src,icons -DestinationPath dist/top-bookmarks-reorder-store.zip -Force`  
  (Use a `dist/` folder locally; it is gitignored.)

---

## Requirements

- Google Chrome (Manifest V3)
- No build step: load the folder as an unpacked extension

## Install (development)

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project folder (`74.Chrome-Extension-bookmark-order` — the folder that contains `manifest.json`).

## Usage

1. Click the extension icon to open the popup.
2. **Analyze** — loads history, matches domains to bookmarks, and stores a preview.
3. **Preview Top 20** — shows the last preview (or run Analyze first).
4. **Apply order** — saves the current bookmarks bar order, then moves the top **N** non-locked matches to the left.
5. **Restore previous** — restores the bar order from the snapshot taken before the last apply.
6. **Open settings** — configure Top **N**, history days, recency bonus, excluded domains, and locked bookmark IDs.

## Project layout

| Path | Role |
|------|------|
| `manifest.json` | MV3 manifest, permissions, popup, background, options |
| `src/service-worker.js` | Message handling: analyze, apply, restore |
| `src/utils.js` | Domain normalization, recency bonus |
| `src/storage-manager.js` | Settings, restore snapshot, preview cache (`chrome.storage.local`) |
| `src/history-analyzer.js` | History search and domain scoring |
| `src/bookmark-matcher.js` | Match domains to bookmarks (prefer bar, shorter URL) |
| `src/reorder-engine.js` | Backup bar order, reorder, restore |
| `src/popup.html` / `popup.js` | Popup UI |
| `src/options.html` / `options.js` | Settings page |
| `src/styles.css` | Shared styles |
| `icons/` | Toolbar / extension icons |
| `STORE_LISTING.md` | Chrome Web Store copy-paste listing + checklist |
| `PRIVACY.md` | Privacy policy (host publicly for the Store) |

## Testing checklist

- Manifest loads without errors.
- Popup opens; Analyze returns a preview when history has data.
- Options save and persist.
- Apply moves bookmarks; Restore returns the previous order.
- Locked IDs are skipped when selecting the top **N**.
- Bookmarks bar contains folders: folders keep relative order in the “rest” segment after top IDs.

## Privacy

This extension does not send any data externally. All processing is done locally in your browser; no network requests are made for ranking or storage.

**Full policy:** [PRIVACY.md](PRIVACY.md) (data usage, storage, sharing, user control, contact).
