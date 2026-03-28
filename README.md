# Top Bookmarks Reorder

**Status:** Submitted for Chrome Web Store review  
**Version:** 1.2.0  
**Privacy:** Local-only processing

---

## Project overview

**Top Bookmarks Reorder** is a Chrome extension (Manifest V3) that reorders the bookmarks bar using **local** browsing history and bookmark data. It targets users who rely on the bookmarks bar daily and want the most relevant shortcuts on the left without constant manual dragging.

In practice, the extension: analyzes history over a configurable window, ranks domains by usage, matches them to existing bookmarks, and offers a **preview → apply** flow. The previous bar order can be **restored** after an apply. Separate tools help with **recently closed windows** (session restore) and saving **open http/https tabs** as a **workspace snapshot** for later reopening—all processed on the device.

**Intended audience:** People who want a **local-first** productivity helper for bookmark order and quick recovery of sessions/workspaces, without sending browsing data to external servers.

---

## Why this project exists

- **Bookmarks bar management is tedious.** Manual reordering does not scale when usage patterns change; the bar drifts out of sync with what you actually open.
- **Browser workflows break easily.** Closing windows or losing context is common; recovering **sessions** and **saved workspaces** reduces friction.
- **Session and workspace recovery matter.** Reopening recently closed windows and reopening a saved set of tabs addresses real day-to-day needs beyond bookmark sorting.
- **Local-first by design.** The goal was a small extension that uses Chrome APIs on-device only—no remote analytics or cloud dependency for core behavior.

---

## Core features

| Area | What it does |
|------|----------------|
| **Bookmark ranking** | Ranks candidates from browsing history (time window, visit/recency scoring; domain-level matching). |
| **Preview before apply** | Shows suggested order before changing the bar. |
| **Apply / restore** | Applies reorder; keeps a snapshot so you can **restore previous** bookmark bar order. |
| **Session restore** | Lists and reopens **recently closed windows** via `chrome.sessions` (preview + restore up to several windows). |
| **Workspace snapshot** | Saves **normal** windows’ **http/https** tab URLs to local storage; **restore** opens **new** windows (does not replace current windows). |
| **Local-first processing** | History, bookmarks, sessions, and storage are used **only inside the browser** for the features above. |

Configurable options include Top **N**, history span, recency weighting, excluded domains, and locked bookmark IDs (see **Usage**).

---

## How it works

1. **History analysis** — Queries history for a date range; scores domains (in-window visit behavior and recency; not raw cumulative `visitCount` alone). YouTube-style URLs can be grouped at domain level for ranking consistency.
2. **Bookmark matching** — Maps ranked domains to bookmarks on the bar (preferring bar entries and sensible URL matches).
3. **Apply order** — Backs up current bar order, then moves the top **N** non-locked matches to the left per settings.
4. **Restore** — Restores the bookmark bar to the snapshot saved before the last apply.
5. **Session restore** — Uses `chrome.sessions` to preview recently closed windows and reopen a chosen number, newest first.
6. **Workspace snapshot** — Reads open tabs in normal windows (`chrome.tabs` / `chrome.windows`), stores http/https URLs in `chrome.storage.local`, and on restore creates new windows/tabs. Incognito and non-http(s) URLs are skipped by design.

---

## Architecture

- **Manifest V3** — Service worker background, action popup, options page.
- **Service worker** (`src/service-worker.js`) — Message hub for analyze, preview, apply, restore, session, and workspace actions.
- **Popup** — Primary UI: analyze, preview, apply, restore, session restore, workspace save/restore.
- **Options** — Settings: Top N, history days, bonuses, exclusions, locks, optional debug.
- **Storage** — `chrome.storage.local` for settings, previews, restore snapshots, and workspace payload.
- **Permissions** — `bookmarks`, `history`, `storage`, `sessions`, `tabs`, `windows`; `host_permissions` `<all_urls>` so saved http/https URLs can be opened when restoring a workspace.
- **Processing** — All ranking and storage logic runs **locally** in the extension; no remote backend for these features.

---

## Privacy and design principles

- **No remote code** for core behavior (standard unpacked / store package layout).
- **No tracking** or third-party analytics in the extension.
- **No external transfer** of history, bookmarks, session data, or workspace payloads to the developer’s servers.
- **Local processing** — APIs read and write data **on the user’s device** as described in [PRIVACY.md](PRIVACY.md).

---

## Development process

The project was built **iteratively**: core bookmark reorder first, then UX and options, then store-readiness.

- **Design and logic** were refined step by step (preview/apply/restore, then session and workspace layers).
- **Ranking logic** was adjusted after observing that **raw cumulative `visitCount`** could misrepresent *recent* importance; scoring now emphasizes behavior inside the analysis window plus recency, with **domain grouping** (including YouTube-style handling) where it helps.
- **Session restore** and **workspace snapshot** were added as productivity extensions on top of the bookmark engine.
- **Store preparation** included listing copy ([STORE_LISTING.md](STORE_LISTING.md)), a public **privacy policy** ([PRIVACY.md](PRIVACY.md)), ZIP packaging (`manifest.json`, `src/`, `icons/` only), and Dashboard privacy answers aligned with actual permissions.

Workflow: implementation and documentation evolved together so the manifest, UI, and policy text stay consistent.

---

## Chrome Web Store release history

| Milestone | Notes |
|-----------|--------|
| **First public submission** | Initial listing submitted for review with privacy URL and store ZIP. |
| **Current release version** | **1.2.0** (see `manifest.json`). |
| **Release tag** | **`v1.2.0-store-submission`** — marks the tree used for store packaging alignment. |
| **Review** | Submission was **sent for review**; approval status depends on Google’s review outcome. |

Listing checklist and copy: [STORE_LISTING.md](STORE_LISTING.md).

---

## Credits

- **Product direction and project ownership:** Marko / FoxRav  
- **Implementation and iterative development:** Marko using an AI-assisted development workflow  
- **Architecture support, documentation refinement, store submission support, UX copy, and review preparation:** AI-assisted collaboration  

---

## Repository structure

| Path | Role |
|------|------|
| `manifest.json` | MV3 manifest, permissions, popup, service worker, options |
| `src/service-worker.js` | Messaging: analyze, apply, restore, sessions, workspace |
| `src/history-analyzer.js` | History search and domain scoring |
| `src/utils.js` | Domain helpers, recency bonus, grouping for ranking |
| `src/bookmark-matcher.js` | Map domains to bookmarks |
| `src/reorder-engine.js` | Backup bar order, reorder, restore |
| `src/session-restore.js` | Recently closed windows (`chrome.sessions`) |
| `src/workspace-snapshot.js` | Save/restore workspace (`tabs` / `windows`, local storage) |
| `src/storage-manager.js` | `chrome.storage.local` access |
| `src/popup.*`, `options.*`, `styles.css` | UI |
| `icons/` | Extension icons |
| `PRIVACY.md` | Privacy policy (host at a public HTTPS URL for the Store) |
| `STORE_LISTING.md` | Store listing and submission notes |

---

## Developer documentation

- **[Session restore & workspace snapshot — master spec](docs/SESSION_WORKSPACE_MASTER_SPEC.md)** — Spec, phased notes, API usage, Quick restore vs snapshot, future ideas.  
- **[STORE_LISTING.md](STORE_LISTING.md)** — Store copy, ZIP instructions, privacy form guidance.  
- **[PRIVACY.md](PRIVACY.md)** — Authoritative privacy text for users and reviewers.

**Quick verification (manual):** Manifest loads; popup Analyze → preview → Apply → Restore; options persist; locked IDs respected; with folders on the bar, relative order in the “rest” segment remains sensible. Session restore and workspace save/restore behave as described in **Usage** (incognito / non-http(s) skipped for snapshot).

---

## Install (development)

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the project folder that contains `manifest.json`.

No bundler is required; the extension loads as plain HTML/JS/CSS.

**Store-style ZIP (optional):** from the repo root, include **only** `manifest.json`, `src/`, and `icons/` (e.g. PowerShell: `Compress-Archive -Path manifest.json,src,icons -DestinationPath dist/top-bookmarks-reorder-store.zip`). Do not embed README or policy files inside the extension ZIP unless you intentionally change the package layout.

---

## Usage

1. Click the extension icon to open the popup.
2. **Analyze** — Loads history, matches domains to bookmarks, stores a preview.
3. **Preview** — Shows the last preview (run Analyze if empty).
4. **Apply order** — Saves the current bookmarks bar order, then moves the top **N** non-locked matches to the left.
5. **Restore previous** — Restores the bar from the snapshot taken before the last apply.
6. **Session restore** — Preview recently closed windows; restore up to several windows (newest first), subject to what Chrome has in session history.
7. **Workspace snapshot** — **Save** stores http/https tabs from normal windows locally; **Restore** opens them in **new** windows.
8. **Open settings** — Top **N**, history days, recency weight, excluded domains, locked bookmark IDs, optional debug.

**Privacy policy URL (Store):**  
`https://raw.githubusercontent.com/FoxRav/top-bookmarks-reorder/main/PRIVACY.md`  
Repo: [github.com/FoxRav/top-bookmarks-reorder](https://github.com/FoxRav/top-bookmarks-reorder)

---

## Current status

- **Chrome Web Store:** Submission **sent for review** (outcome pending).
- **Local use:** Extension is **functional** when loaded unpacked from this repository.
- **Release package:** Store ZIP procedure documented; tag **`v1.2.0-store-submission`** tracks the submission-aligned tree.
- **Future:** Improvements below are optional and not required for core operation.

---

## Roadmap / future improvements

- Clearer **domain policies** (e.g. per-site rules) for ranking and matching.
- **Resume vs home URL** logic where it improves matching quality.
- **Stronger visual assets** (icons, screenshots) post-review if needed.
- Optional **thresholds** and **advanced workspace** handling (e.g. more control over what gets saved).
- General **polish** after store approval and real-world feedback.

---

## License

See [LICENSE](LICENSE) in the repository root.

---

## Summary of README changes

- Restructured into the sections above (overview, motivation, features, mechanics, architecture, privacy, dev process, store history, credits, repo map, docs links, install, usage, status, roadmap).
- Added a concise **status line** (review / version / privacy) at the top.
- Replaced promotional tone with **factual** descriptions aligned with **manifest 1.2.0** and current code behavior.
- Documented **iterative development**, ranking correction, **domain grouping**, **session/workspace** additions, and **store** preparation.
- Integrated **credits** and **Chrome Web Store** / **tag** notes without overclaiming approval.
- Preserved practical **install**, **usage**, and **ZIP** notes in a clearer order; pointed to **PRIVACY.md** / **STORE_LISTING.md** / **docs** spec.
