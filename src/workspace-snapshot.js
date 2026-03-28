/**
 * Save / restore open windows + http(s) tabs (separate from chrome.sessions Quick Restore).
 */

(function (global) {
  "use strict";

  var SNAPSHOT_VERSION = 1;

  function promisifyGetAllWindows() {
    return new Promise(function (resolve, reject) {
      try {
        chrome.windows.getAll({ populate: true, windowTypes: ["normal"] }, function (wins) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(wins || []);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * @param {chrome.windows.CreateData} data
   * @returns {Promise<chrome.windows.Window>}
   */
  function promisifyWindowsCreate(data) {
    return new Promise(function (resolve, reject) {
      try {
        chrome.windows.create(data, function (win) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(win);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * @param {string} u
   * @returns {boolean}
   */
  function isRestorableUrl(u) {
    if (!u || typeof u !== "string") {
      return false;
    }
    try {
      var parsed = new URL(u);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  /**
   * @param {chrome.windows.Window} win
   * @returns {{ url: string, title: string }[]}
   */
  function captureTabsForWindow(win) {
    var tabs = win.tabs || [];
    var sorted = tabs.slice().sort(function (a, b) {
      return (a.index || 0) - (b.index || 0);
    });
    var out = [];
    for (var i = 0; i < sorted.length; i++) {
      var t = sorted[i];
      if (t.url && isRestorableUrl(t.url)) {
        out.push({ url: t.url, title: t.title || "" });
      }
    }
    return out;
  }

  /**
   * @returns {Promise<{ version: number, savedAt: number, windows: { tabs: { url: string, title: string }[] }[] }>}
   */
  async function captureSnapshot() {
    var wins = await promisifyGetAllWindows();
    var windows = [];
    for (var i = 0; i < wins.length; i++) {
      var w = wins[i];
      if (w.incognito) {
        continue;
      }
      var tabs = captureTabsForWindow(w);
      if (tabs.length > 0) {
        windows.push({ tabs: tabs });
      }
    }
    return {
      version: SNAPSHOT_VERSION,
      savedAt: Date.now(),
      windows: windows,
    };
  }

  /**
   * @param {{ version: number, savedAt: number, windows: { tabs: { url: string }[] }[] }} snapshot
   * @returns {Promise<{ ok: boolean, error?: string, windowsOpened?: number, tabsOpened?: number }>}
   */
  async function restoreFromSnapshot(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.windows) || snapshot.windows.length === 0) {
      return { ok: false, error: "No workspace data to restore." };
    }
    var windowsOpened = 0;
    var tabsOpened = 0;
    for (var i = 0; i < snapshot.windows.length; i++) {
      var win = snapshot.windows[i];
      var urls = [];
      for (var j = 0; j < win.tabs.length; j++) {
        var u = win.tabs[j].url;
        if (isRestorableUrl(u)) {
          urls.push(u);
        }
      }
      if (urls.length === 0) {
        continue;
      }
      try {
        await promisifyWindowsCreate({
          url: urls.length === 1 ? urls[0] : urls,
          focused: windowsOpened === 0,
        });
        windowsOpened++;
        tabsOpened += urls.length;
      } catch (e) {
        console.error("[Top Bookmarks Reorder] workspace window create failed:", e);
        return {
          ok: false,
          error: e && e.message ? String(e.message) : String(e),
          windowsOpened: windowsOpened,
          tabsOpened: tabsOpened,
        };
      }
    }
    if (windowsOpened === 0) {
      return {
        ok: false,
        error: "No valid http(s) tabs in saved workspace.",
      };
    }
    return {
      ok: true,
      windowsOpened: windowsOpened,
      tabsOpened: tabsOpened,
    };
  }

  /**
   * @returns {Promise<{ ok: boolean, error?: string, windowCount?: number, tabCount?: number }>}
   */
  async function captureAndSave() {
    var S = global.TBRStorage;
    var snap = await captureSnapshot();
    if (!snap.windows.length) {
      return {
        ok: false,
        error:
          "No restorable tabs found. Only http/https tabs in normal windows are saved (not incognito).",
      };
    }
    var tabCount = 0;
    for (var i = 0; i < snap.windows.length; i++) {
      tabCount += snap.windows[i].tabs.length;
    }
    await S.saveWorkspaceSnapshot(snap);
    return {
      ok: true,
      windowCount: snap.windows.length,
      tabCount: tabCount,
    };
  }

  /**
   * @returns {Promise<{ ok: boolean, error?: string, windowsOpened?: number, tabsOpened?: number }>}
   */
  async function restoreSaved() {
    var S = global.TBRStorage;
    var snap = await S.getWorkspaceSnapshot();
    if (!snap || !snap.windows || !snap.windows.length) {
      return {
        ok: false,
        error: "No saved workspace. Click Save current workspace first.",
      };
    }
    return restoreFromSnapshot(snap);
  }

  global.TBRWorkspaceSnapshot = {
    SNAPSHOT_VERSION: SNAPSHOT_VERSION,
    captureSnapshot: captureSnapshot,
    restoreFromSnapshot: restoreFromSnapshot,
    captureAndSave: captureAndSave,
    restoreSaved: restoreSaved,
  };
})(typeof self !== "undefined" ? self : this);
