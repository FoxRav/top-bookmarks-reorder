# Privacy Policy – Top Bookmarks Reorder

**Chrome Web Store:** this file is the source of truth. For submission you must provide a **public HTTPS URL** where this policy is readable (for example GitHub raw, GitHub Pages, Notion, or your own site). A path inside a private repo or only a local file is **not** sufficient.

**Public copy (GitHub):** `https://raw.githubusercontent.com/FoxRav/top-bookmarks-reorder/main/PRIVACY.md`

---

This extension processes browsing history and bookmarks locally within the user's browser.

## Data usage

- Browsing history is accessed only to calculate usage frequency and recency.
- Bookmarks are accessed only to reorder them based on user action.
- The browser’s **recently closed sessions** API is used only so you can preview and reopen **closed windows** on demand. Nothing is sent to the extension developer; session data stays within Chrome.
- **Workspace snapshot** reads open window and tab URLs (http/https only in normal windows) only when you click **Save current workspace**, and stores that snapshot in **local browser storage** so you can reopen those pages later. Data is not sent to the extension developer.
- **Broad host access** (`<all_urls>` in the manifest) is used only so saved http/https URLs can be opened in new windows when you restore a workspace — not to read arbitrary sites in the background or send data externally.

## Data storage

- Settings, bookmark previews, session previews, and optional **workspace snapshots** (saved tab URLs) are stored using Chrome local storage.
- No personal data is transmitted, collected, or stored outside the browser.

## Data sharing

- This extension does not send any data to external servers.
- No analytics, tracking, or third-party services are used.

## User control

- All actions require explicit user interaction (Analyze / Apply, session preview / restore, workspace save / restore).
- Users can restore previous bookmark order at any time.

## Contact

CCGFAKTUM@gmail.com
