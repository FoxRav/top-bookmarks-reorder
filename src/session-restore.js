/**
 * Recently closed window sessions via chrome.sessions (restore window groups only).
 */

(function (global) {
  "use strict";

  var PREVIEW_CAP = 5;

  function promisifyGetRecentlyClosed() {
    return new Promise(function (resolve, reject) {
      try {
        chrome.sessions.getRecentlyClosed(null, function (sessions) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(sessions || []);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * @param {string} sessionId
   * @returns {Promise<chrome.sessions.Session>}
   */
  function promisifyRestore(sessionId) {
    return new Promise(function (resolve, reject) {
      try {
        chrome.sessions.restore(sessionId, function (restored) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(restored);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Only sessions that represent a closed window (not a single closed tab).
   * @param {chrome.sessions.Session[]} sessions
   * @returns {chrome.sessions.Session[]}
   */
  function filterWindowSessions(sessions) {
    var out = [];
    for (var i = 0; i < sessions.length; i++) {
      var s = sessions[i];
      if (s && s.window) {
        out.push(s);
      }
    }
    return out;
  }

  /**
   * @param {chrome.sessions.Session} s
   * @returns {number}
   */
  function tabCountForWindowSession(s) {
    var w = s.window;
    if (!w || !w.tabs) {
      return 0;
    }
    return w.tabs.length;
  }

  /**
   * @returns {Promise<chrome.sessions.Session[]>}
   */
  async function getClosedWindowSessionsOrdered() {
    var all = await promisifyGetRecentlyClosed();
    return filterWindowSessions(all);
  }

  /**
   * @returns {Promise<{ generatedAt: number, windows: { label: string, tabCount: number }[], totalWindowSessions: number }>}
   */
  async function buildPreviewPayload() {
    var ordered = await getClosedWindowSessionsOrdered();
    var slice = ordered.slice(0, PREVIEW_CAP);
    var windows = [];
    for (var i = 0; i < slice.length; i++) {
      windows.push({
        label: "Window " + String(i + 1),
        tabCount: tabCountForWindowSession(slice[i]),
      });
    }
    return {
      generatedAt: Date.now(),
      windows: windows,
      totalWindowSessions: ordered.length,
    };
  }

  /**
   * @param {number} requestedCount
   * @returns {Promise<{ ok: boolean, error?: string, restored: number, requested: number, partial?: boolean }>}
   */
  async function restoreRecentWindows(requestedCount) {
    if (requestedCount < 1 || requestedCount > 25) {
      return {
        ok: false,
        error: "Invalid restore count.",
        restored: 0,
        requested: requestedCount,
      };
    }
    var ordered = await getClosedWindowSessionsOrdered();
    if (ordered.length === 0) {
      return {
        ok: false,
        error: "No recently closed windows found.",
        restored: 0,
        requested: requestedCount,
      };
    }
    var toRestore = ordered.slice(0, requestedCount);
    var restored = 0;
    for (var i = 0; i < toRestore.length; i++) {
      try {
        await promisifyRestore(toRestore[i].sessionId);
        restored++;
      } catch (e) {
        console.error("[Top Bookmarks Reorder] session restore failed:", e);
        return {
          ok: false,
          error: e && e.message ? String(e.message) : String(e),
          restored: restored,
          requested: requestedCount,
        };
      }
    }
    var partial = toRestore.length < requestedCount;
    return {
      ok: true,
      restored: restored,
      requested: requestedCount,
      partial: partial,
    };
  }

  global.TBRSessionRestore = {
    PREVIEW_CAP: PREVIEW_CAP,
    getClosedWindowSessionsOrdered: getClosedWindowSessionsOrdered,
    buildPreviewPayload: buildPreviewPayload,
    restoreRecentWindows: restoreRecentWindows,
  };
})(typeof self !== "undefined" ? self : this);
