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
- **Session restore:** reopen recently closed **windows** (Chrome `sessions` API) — preview tab counts, restore up to 5 windows
- **Workspace snapshot:** save open normal windows (http/https tabs) and reopen them later (`chrome.windows` / `chrome.tabs`; stored locally)

### How it works

1. Analyze your browsing history
2. Match domains to your bookmarks
3. Preview suggested order
4. Apply changes safely

This extension does **not** send any data externally. All processing is done locally in your browser.

### Session restore (Quick restore)

The popup’s **Session restore** section uses **`chrome.sessions`** to list and reopen **recently closed windows** (not single tabs). Use **Preview recent windows** to see up to five closed windows and tab counts; use **Restore last 3 / 4 / 5 windows** to reopen that many, newest first. If fewer closed windows exist than requested, only those are restored and the status explains it.

### Workspace snapshot

**Workspace snapshot** is separate from Session restore. **Save current workspace** reads **normal** (non-incognito) browser windows and **http/https** tabs only, then stores that structure in **`chrome.storage.local`**. **Restore saved workspace** opens **new** windows with those URLs (Chrome does not close your current windows). Incognito windows and non-http(s) tabs (e.g. `chrome://`) are skipped. The manifest includes **`tabs`**, **`windows`**, and **`host_permissions`** (`<all_urls>`) so tab URLs can be read and reopened.

### Chrome Web Store (publishing)

Store listing copy, screenshot checklist, ZIP instructions, and review notes: **[STORE_LISTING.md](STORE_LISTING.md)**.

- **Privacy policy:** [PRIVACY.md](PRIVACY.md) is the source text. **Chrome Web Store requires a public HTTPS URL** — for this repo you can use the raw file:  
  **`https://raw.githubusercontent.com/FoxRav/top-bookmarks-reorder/main/PRIVACY.md`**  
  Repo: [github.com/FoxRav/top-bookmarks-reorder](https://github.com/FoxRav/top-bookmarks-reorder.git). A path only in the zip does **not** replace this.
- **In-app:** the popup includes *“All processing is local. No data is sent externally.”* to align with `history` review expectations.
- **Store ZIP:** create a zip that contains **only** `manifest.json`, `src/`, and `icons/` at the root (no `.git`, `dist`, or dev docs). Example (PowerShell from repo root):  
  `Compress-Archive -Path manifest.json,src,icons -DestinationPath dist/top-bookmarks-reorder-store.zip -Force`  
  (Use a `dist/` folder locally; it is gitignored.)

---

## Requirements

- Google Chrome (Manifest V3)
- No build step: load the folder as an unpacked extension

## Developer documentation

- **[Session restore & Workspace snapshot — master spec](docs/SESSION_WORKSPACE_MASTER_SPEC.md)** — Cursor master spec, phase 1/2 prompts, API references, usage (Quick Restore vs snapshot), future ideas (e.g. tab groups).

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
| `src/session-restore.js` | Recently closed windows: preview + restore (`chrome.sessions`) |
| `src/workspace-snapshot.js` | Save/restore open workspace (`chrome.windows` + tab URLs in local storage) |
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
