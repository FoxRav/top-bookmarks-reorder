# Session restore & Workspace snapshot — Cursor master spec

**Implementation status (this repo):** Both phases are implemented.

- **Phase 1 (Quick Restore):** `src/session-restore.js`, `sessions` permission, popup **Session restore** section.
- **Phase 2 (Workspace snapshot):** `src/workspace-snapshot.js`, `tabs` / `windows` / `host_permissions`, popup **Workspace snapshot** section.

Use this document as a **repeatable master prompt** for Cursor or for onboarding; behavior matches Chrome APIs below.

---

## Goal

Extend **Top Bookmarks Reorder** so the user can quickly reopen **recently closed windows**. **Phase 1** implements **Quick Restore** with `chrome.sessions`. **Phase 2** adds a **Workspace snapshot** for saving and reopening the current window/tab layout via `chrome.windows` + tab URLs and `chrome.storage.local`.

### Constraints

- Manifest V3  
- No bundler  
- Plain JavaScript / HTML / CSS  
- Reuse existing popup + service worker architecture  
- Keep UI simple  
- Do not break existing bookmark reorder behavior  

### Required APIs

- `chrome.sessions` (phase 1)  
- `chrome.storage`  
- For phase 2: `chrome.windows` and tab access (`tabs` permission + URLs; often `host_permissions` for reopening pages)  

---

## Phase 1 — Features

- New popup section titled **Session restore**  
- Buttons:  
  - **Restore last 3 windows**  
  - **Restore last 4 windows**  
  - **Restore last 5 windows**  
  - **Preview recent windows**  
- Preview shows count of recently closed **windows** and tab count per window (e.g. last 5 windows)  
- Restore only **window** sessions, not standalone closed tabs  
- Status messages for success / error  

### Manifest

- Add permission: **`sessions`**

### Architecture

- **popup.html:** Session restore card below existing UI  
- **popup.js:** Wire preview/restore buttons; `runtime.sendMessage` to service worker  
- **service-worker.js:** Message types:  
  - `TBR_PREVIEW_RECENT_WINDOWS`  
  - `TBR_RESTORE_RECENT_WINDOWS`  
  - (optional) `TBR_GET_WINDOWS_PREVIEW` to reload last preview  
- **storage-manager.js:** Optional key for last session preview (local storage)  
- **styles.css:** Light styling for the new card  

### Quick Restore logic

1. `chrome.sessions.getRecentlyClosed()`  
2. Keep only entries with a **window** session (not tab-only)  
3. Order is newest → oldest (Chrome’s default for this API)  
4. Take the first **N** window sessions  
5. Restore each with `chrome.sessions.restore(sessionId)` one after another  
6. Surface result in popup status  

### Preview logic

- List e.g. **Window 1 — 12 tabs**, **Window 2 — 7 tabs**, …  
- Show at most ~5 windows in preview  

### Error handling

- If fewer than N closed windows exist: restore what exists; message e.g. **Only 2 recent windows were available.**  
- On restore failure: show error in popup; log detail in service worker console  

### UI strings (English)

- Session restore  
- Preview recent windows  
- Restore last 3 / 4 / 5 windows  
- No recently closed windows found.  
- Restored 3 windows.  
- Only 2 recent windows were available.  

### Testing checklist

- Popup opens without errors  
- Preview lists closed windows  
- Restore 3/4/5 behaves when enough sessions exist  
- Sensible UI when nothing is available  
- Bookmark reorder flow unchanged  

### Phase 1 boundary

- Restores **recently closed** windows only  
- No “yesterday’s workspace snapshot” yet — that is **phase 2**  

---

## Phase 2 — Plan (then implement lightly)

- Buttons: **Save current workspace**, **Restore saved workspace**  
- Read open windows/tabs (`chrome.windows` + `tabs`; store http/https URLs as needed)  
- Persist snapshot in **`chrome.storage.local`**  
- Restore by creating windows/tabs again  
- Keep **separate** from Quick Restore (sessions)  
- Clear status messages; avoid heavy settings in v1  

---

## Cursor prompts (copy-paste)

### Phase 1 only

```text
Lisää nykyiseen MV3-extensioniin uusi Session restore -ominaisuus.

Tee vain vaihe 1:
- lisää manifestiin sessions-permission
- lisää popupiin uusi osio otsikolla Session restore
- lisää napit:
  - Preview recent windows
  - Restore last 3 windows
  - Restore last 4 windows
  - Restore last 5 windows
- lisää popup.js:ään viestit service workerille
- lisää service-worker.js:ään viestityypit:
  - TBR_PREVIEW_RECENT_WINDOWS
  - TBR_RESTORE_RECENT_WINDOWS
- toteuta chrome.sessions.getRecentlyClosed() käyttö
- suodata mukaan vain window-sessionit
- preview näyttää viimeisimmät ikkunat tabimäärineen
- restore palauttaa pyydetyn määrän uusimmasta vanhimpaan
- lisää virheenkäsittely
- älä riko olemassa olevaa Top Bookmarks Reorder -toimintoa
- pidä UI yksinkertaisena ja nykyiseen tyyliin sopivana

Älä tee vielä workspace snapshot -ominaisuutta.
Näytä lopuksi mitä tiedostoja muutit ja miksi.
```

### Phase 2 (workspace snapshot)

```text
Suunnittele mutta toteuta kevyesti Workspace Snapshot -pohja nykyiseen extensioniin.

Lisää popupiin:
- Save current workspace
- Restore saved workspace

Toteuta:
- nykyisten ikkunoiden ja tabien luku chrome.windows + chrome.tabs APIlla
- snapshotin tallennus chrome.storage.localiin
- restore, joka avaa tallennetut ikkunat ja tabit takaisin
- pidä tämä erillään Quick Restore -toiminnosta
- lisää selkeä statusviesti
- älä tee monimutkaisia asetuksia vielä

Tärkeää:
- pidä olemassa oleva sessions-pohjainen Quick Restore ennallaan
- workspace snapshot on oma erillinen toiminto
```

### Cursor workflow (incremental)

- Do not do everything in one shot  
- First: manifest + popup shell + service worker message stubs  
- Then: preview  
- Then: restore  
- Finally: status copy + README / privacy notes  
- After each step: short diff-style summary  

---

## Recommended usage

- **Quick Restore:** fast continuation in the morning — uses **recently closed** sessions (`chrome.sessions`).  
- **Workspace snapshot:** when you want to **freeze** a specific working set — full control over saved windows/tabs structure via your own snapshot in storage.  

Technically: `chrome.sessions` restores **closed** session entries; a custom snapshot controls **saved open layout** independent of Chrome’s closed list.

---

## Later (not in first iteration)

- Domain-based workspace presets  
- Labels like “AI work / Social / Research”  
- **Tab groups** — Chrome has `chrome.tabGroups`; add only when you need group id/name/color restore ([tabGroups API](https://developer.chrome.com/docs/extensions/reference/api/tabGroups)).  

---

## References

- [chrome.sessions](https://developer.chrome.com/docs/extensions/reference/api/sessions) — query and restore recently closed tabs and windows; requires **`sessions`** permission.  
- [chrome.windows](https://developer.chrome.com/docs/extensions/reference/api/windows) — create and manage windows.  
- [chrome.tabGroups](https://developer.chrome.com/docs/extensions/reference/api/tabGroups) — optional future enhancement.  
