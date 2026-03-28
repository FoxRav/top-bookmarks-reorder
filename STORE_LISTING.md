# Chrome Web Store — listing (copy-paste)

Use this file when creating or updating the **Chrome Web Store Developer Dashboard** listing.  
Keep [PRIVACY.md](PRIVACY.md) in sync; the Store requires a **public privacy policy URL** (e.g. GitHub, GitHub Pages, Notion — not a local file path).

---

## Quick submit (Chrome Web Store)

1. **Build the ZIP** — zip root must contain **only** `manifest.json`, `src/`, and `icons/`. Do **not** include `.git/`, `README.md`, `scripts/`, or other dev files.

   ```powershell
   Compress-Archive -Path manifest.json,src,icons -DestinationPath dist/top-bookmarks-reorder-store.zip -Force
   ```

   (`dist/` and `*.zip` are gitignored locally.)

2. **Open** the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) → **New item** → upload the ZIP.

3. **Listing:** copy **Name**, **Short description**, and **Full description** from the sections below in this file.

4. **Privacy policy URL:**

   `https://raw.githubusercontent.com/FoxRav/top-bookmarks-reorder/main/PRIVACY.md`

5. **Privacy practices:** Follow [Developer Dashboard: Privacy practices](#developer-dashboard-privacy-practices) — especially **Local use vs transmission**. Match `manifest.json` and [PRIVACY.md](PRIVACY.md); avoid a **privacy mismatch** (common rejection).

6. **Screenshots:** at least one asset is usually required; **four** are recommended — see [Screenshots](#screenshots-strongly-recommended).

7. **Distribution:** **Public** → **Submit for review**.

**Timing:** reviews are often hours to a few days; sensitive permissions such as `history` can take longer.

**GitHub:** seeing **“0 files” / indexing** in GitHub’s code search is a normal indexing delay, not a broken repository.

---

## Final verification before Submit (privacy form)

**Critical:** answers must match real behavior: **history**, **bookmarks**, **sessions**, plus **tabs** / **windows** / **host permissions** for workspace snapshot — all **local**; **no** off-device transmission.

### Typical Dashboard choices (logic)

| Question / area | Choose |
|-----------------|--------|
| Data used **on the device** (history, bookmarks, sessions, open tabs for workspace save) | **Yes** — APIs run locally |
| Data **transmitted** to the developer or external servers | **No** |
| Data **sale** | **No** |
| **Analytics / tracking** (third-party) | **No** |

Do **not** claim “does not use any data” if the form asks about **on-device** access — that would contradict `manifest.json` and [PRIVACY.md](PRIVACY.md).

### Disclosure / justification (copy-paste)

Use in any free-text “data usage” or “how the extension uses data” field:

```text
This extension reads browsing history, bookmarks, and recently closed sessions locally in the browser for bookmark reordering and reopening closed windows. If you use “Save current workspace”, open http/https tab URLs are read and stored only in Chrome local storage on your device for later reopening.

No data is transmitted to external servers. All processing is performed locally on the user's device.
```

### Privacy policy URL

`https://raw.githubusercontent.com/FoxRav/top-bookmarks-reorder/main/PRIVACY.md`

### After Submit

- Review often **hours to ~3 days**; `history` + broad host access can add scrutiny — aligning privacy answers as above keeps **privacy mismatch** risk low.
- If the item is **rejected**, copy the reviewer message and fix wording or listing, then resubmit.

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

**Raw GitHub URL vs GitHub Pages:** The **raw** `PRIVACY.md` link above is a valid public **HTTPS** policy URL and matches what many extensions use. If Google ever prefers a “normal” web page, publish the same text via **GitHub Pages** (or Notion) and point the Store field there — keep wording in sync with [PRIVACY.md](PRIVACY.md).

---

## Developer Dashboard: Privacy practices

**Largest practical risk before approval:** a **privacy mismatch** — Dashboard answers that contradict `manifest.json`, the extension’s real behavior, or [PRIVACY.md](PRIVACY.md). GitHub search “indexing” is not the issue here; **getting this tab wrong is.**

When you fill **Privacy practices** / data disclosure sections, keep them **consistent** with [PRIVACY.md](PRIVACY.md) and [README.md](README.md). Field labels change over time; use this as intent:

| Topic | How to describe this extension |
|--------|--------------------------------|
| **Purpose** | Reorder the bookmarks bar using **local** history + bookmarks; **sessions** for recently closed windows; optional **workspace snapshot** (save open http/https tabs to **local** storage and reopen). |
| **Browsing history** | Used **only on the device** for ranking — **not** uploaded to the developer’s servers. |
| **Bookmarks** | Read and reordered **locally** when the user applies changes. |
| **Sessions** | Used **locally** to list / restore recently **closed windows** — not sent externally. |
| **Tabs / windows / host permissions** | Used **locally** to read open tab URLs for workspace save and to open saved URLs on restore — **not** for sending data to external servers. |
| **Transmission / selling** | **No** personal data sent externally; **no** sale; **no** third-party analytics in the extension code. |
| **User control** | User-initiated: Analyze / Apply, session preview / restore, workspace save / restore. |

### Local use vs transmission (read carefully)

Many forms separate:

1. **Data used or processed on the user’s device** — **yes**: `history`, `bookmarks`, `sessions`, `storage`; plus `tabs` / `windows` / **`host_permissions`** only so tab URLs can be read and reopened **locally** (workspace snapshot).
2. **Data collected by or transmitted to the developer or third parties** — **no** (per [PRIVACY.md](PRIVACY.md)).

Do **not** pick answers that imply the extension **never accesses** history, bookmarks, sessions, or tab URLs if the question is about **on-device API use** — that would contradict `manifest.json`.  

Do **not** rely on a vague slogan like “does not collect data” if the form expects this **split**: answer **device-local use** and **no remote collection/transmission** in line with the table above, not marketing shorthand.

**Facts to keep aligned:**

- **Manifest permissions:** `bookmarks`, `history`, `storage`, `sessions`, `tabs`, `windows`, and **`host_permissions`** (`<all_urls>` for reopening saved http/https tabs) — see `manifest.json`.
- **Policy:** [PRIVACY.md](PRIVACY.md) — local processing; no external transmission; user-initiated actions.

**Before Submit:** re-read every privacy answer against **`manifest.json` + [PRIVACY.md](PRIVACY.md)**. If wording in the Dashboard is ambiguous, prefer answers that match those two sources, not generic store copy.

**Rule of thumb while filling the form:**

| | This extension |
|---|----------------|
| **Uses data on the device locally** (history, bookmarks, sessions, storage, tabs/windows for workspace) | **Yes** — matches `manifest.json` |
| **Sends that data to the developer or off-device servers** | **No** — matches [PRIVACY.md](PRIVACY.md) |

**Pre-submit alignment (all three must agree):**

1. `manifest.json` — declared permissions and behavior  
2. [PRIVACY.md](PRIVACY.md) — policy text at the public URL  
3. **Dashboard** — privacy / data disclosure answers  

If any one contradicts another, fix the Dashboard answers before **Submit** (biggest remaining risk is **privacy mismatch**, not GitHub indexing).

If a question asks about **remote code**: the extension does not execute remote code for core behavior. **`host_permissions`** are used so saved **http/https** URLs can be opened when restoring a workspace — not to exfiltrate data.

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
- [ ] **Privacy practices** form filled consistently — see [Developer Dashboard: Privacy practices](#developer-dashboard-privacy-practices)
- [ ] At least 1 screenshot (4+ recommended)
- [ ] ZIP built without junk folders (only `manifest.json`, `src/`, `icons/`)
- [ ] Visibility: **Public** (when ready)
- [ ] Submit for review

### Concrete order of operations

1. Use the **privacy policy URL** (see [Privacy policy](#privacy-policy-required) above) — e.g. raw GitHub or Pages.
2. Take **4 screenshots** (popup, preview, options, before/after bar).
3. Build the **ZIP** (`Compress-Archive` example in [ZIP package](#zip-package-for-upload)); confirm only `manifest.json`, `src/`, `icons/` at zip root.
4. **Upload** the package in Chrome Web Store Developer Dashboard.
5. Fill listing + **Privacy practices** + privacy URL + screenshots → **Submit** for review.

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
