/**
 * Settings and restore snapshot in chrome.storage.local.
 */

(function (global) {
  "use strict";

  var SETTINGS_KEY = "tbr_settings";
  var RESTORE_KEY = "tbr_restore_snapshot";
  var PREVIEW_SESSION_KEY = "tbr_preview_session";

  var DEFAULT_SETTINGS = {
    topN: 20,
    historyDays: 30,
    enableRecencyBonus: true,
    lockedBookmarkIds: [],
    excludedDomains: [],
  };

  function promisify(fn) {
    return new Promise(function (resolve, reject) {
      try {
        fn(function (result) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(result);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * @returns {Promise<typeof DEFAULT_SETTINGS>}
   */
  async function getSettings() {
    var data = await promisify(function (cb) {
      chrome.storage.local.get([SETTINGS_KEY], cb);
    });
    var raw = data[SETTINGS_KEY];
    if (!raw || typeof raw !== "object") {
      return Object.assign({}, DEFAULT_SETTINGS);
    }
    return Object.assign({}, DEFAULT_SETTINGS, raw, {
      lockedBookmarkIds: Array.isArray(raw.lockedBookmarkIds)
        ? raw.lockedBookmarkIds.slice()
        : [],
      excludedDomains: Array.isArray(raw.excludedDomains)
        ? raw.excludedDomains.slice()
        : [],
    });
  }

  /**
   * @param {Record<string, unknown>} partial
   * @returns {Promise<void>}
   */
  async function saveSettings(partial) {
    var current = await getSettings();
    var next = Object.assign({}, current, partial, {
      lockedBookmarkIds:
        partial.lockedBookmarkIds != null
          ? partial.lockedBookmarkIds.slice()
          : current.lockedBookmarkIds,
      excludedDomains:
        partial.excludedDomains != null
          ? partial.excludedDomains.slice()
          : current.excludedDomains,
    });
    await promisify(function (cb) {
      chrome.storage.local.set(
        (function () {
          var o = {};
          o[SETTINGS_KEY] = next;
          return o;
        })(),
        cb
      );
    });
  }

  /**
   * @param {Record<string, unknown>|null} snapshot
   * @returns {Promise<void>}
   */
  async function saveRestoreSnapshot(snapshot) {
    await promisify(function (cb) {
      var o = {};
      o[RESTORE_KEY] = snapshot;
      chrome.storage.local.set(o, cb);
    });
  }

  /**
   * @returns {Promise<Record<string, unknown>|null>}
   */
  async function getRestoreSnapshot() {
    var data = await promisify(function (cb) {
      chrome.storage.local.get([RESTORE_KEY], cb);
    });
    return data[RESTORE_KEY] || null;
  }

  /**
   * Preview cache uses local storage so it works across service worker restarts
   * without relying on chrome.storage.session (added in Chrome 102+).
   * @param {Record<string, unknown>|null} preview
   * @returns {Promise<void>}
   */
  async function saveSessionPreview(preview) {
    await promisify(function (cb) {
      var o = {};
      o[PREVIEW_SESSION_KEY] = preview;
      chrome.storage.local.set(o, cb);
    });
  }

  /**
   * @returns {Promise<Record<string, unknown>|null>}
   */
  async function getSessionPreview() {
    var data = await promisify(function (cb) {
      chrome.storage.local.get([PREVIEW_SESSION_KEY], cb);
    });
    return data[PREVIEW_SESSION_KEY] || null;
  }

  global.TBRStorage = {
    SETTINGS_KEY: SETTINGS_KEY,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    getSettings: getSettings,
    saveSettings: saveSettings,
    saveRestoreSnapshot: saveRestoreSnapshot,
    getRestoreSnapshot: getRestoreSnapshot,
    saveSessionPreview: saveSessionPreview,
    getSessionPreview: getSessionPreview,
  };
})(typeof self !== "undefined" ? self : this);
