/**
 * MV3 service worker: message bridge for analyze / preview / apply / restore.
 */

importScripts(
  "utils.js",
  "storage-manager.js",
  "history-analyzer.js",
  "bookmark-matcher.js",
  "reorder-engine.js"
);

var S = self.TBRStorage;
var H = self.TBRHistoryAnalyzer;
var M = self.TBRBookmarkMatcher;
var R = self.TBRReorderEngine;

/**
 * @param {unknown} err
 * @returns {string}
 */
function errMsg(err) {
  if (err && typeof err === "object" && "message" in err) {
    return String(err.message);
  }
  return String(err);
}

/**
 * @returns {Promise<object>}
 */
async function buildPreview() {
  var settings = await S.getSettings();
  var ranked = await H.analyzeHistory(settings);
  var matchResult = await M.runMatch(ranked);
  var matchedRows = matchResult.matched;
  var seen = new Set();
  var uniqueMatched = [];
  for (var i = 0; i < matchedRows.length; i++) {
    var row = matchedRows[i];
    if (seen.has(row.bookmarkId)) {
      continue;
    }
    seen.add(row.bookmarkId);
    uniqueMatched.push(row);
  }
  var topDomains = ranked.slice(0, 50).map(function (r) {
    return { domain: r.domain, score: r.score, visitCount: r.visitCount };
  });
  var proposed = R.selectTopMovable(
    uniqueMatched.map(function (m) {
      return m.bookmarkId;
    }),
    new Set(settings.lockedBookmarkIds || []),
    settings.topN
  );
  var preview = {
    generatedAt: Date.now(),
    topDomains: topDomains,
    matchedBookmarks: uniqueMatched.slice(0, settings.topN + 10),
    unmatchedDomains: matchResult.unmatchedDomains.slice(0, 30),
    proposedOrder: proposed,
    barId: matchResult.barId,
  };
  await S.saveSessionPreview(preview);
  return preview;
}

/**
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
async function applyOrder() {
  var preview = await S.getSessionPreview();
  if (!preview || !preview.proposedOrder || !preview.proposedOrder.length) {
    return { ok: false, error: "No preview. Run Analyze first." };
  }
  var settings = await S.getSettings();
  var barId = preview.barId;
  if (!barId) {
    return { ok: false, error: "Missing bookmarks bar id." };
  }
  var snapshot = {
    timestamp: Date.now(),
    bookmarkBarId: barId,
    originalChildren: await R.getBarOrderSnapshot(barId),
  };
  await S.saveRestoreSnapshot(snapshot);
  var topIds = R.selectTopMovable(
    preview.proposedOrder,
    new Set(settings.lockedBookmarkIds || []),
    settings.topN
  );
  if (!topIds.length) {
    return { ok: false, error: "Nothing to reorder (all locked?)." };
  }
  await R.applyTopOrder(barId, topIds);
  return { ok: true };
}

/**
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
async function restoreOrder() {
  var snap = await S.getRestoreSnapshot();
  if (!snap || !snap.originalChildren || !snap.bookmarkBarId) {
    return { ok: false, error: "No saved order to restore. Apply an order first." };
  }
  await R.restoreFromSnapshot(snap.bookmarkBarId, snap.originalChildren);
  return { ok: true };
}

chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
  var type = message && message.type;
  if (!type) {
    sendResponse({ ok: false, error: "Missing message type." });
    return false;
  }
  if (type === "TBR_ANALYZE") {
    buildPreview()
      .then(function (preview) {
        sendResponse({ ok: true, preview: preview });
      })
      .catch(function (e) {
        sendResponse({ ok: false, error: errMsg(e) });
      });
    return true;
  }
  if (type === "TBR_GET_PREVIEW") {
    S.getSessionPreview()
      .then(function (p) {
        sendResponse({ ok: true, preview: p });
      })
      .catch(function (e) {
        sendResponse({ ok: false, error: errMsg(e) });
      });
    return true;
  }
  if (type === "TBR_APPLY") {
    applyOrder()
      .then(function (r) {
        sendResponse(r);
      })
      .catch(function (e) {
        sendResponse({ ok: false, error: errMsg(e) });
      });
    return true;
  }
  if (type === "TBR_RESTORE") {
    restoreOrder()
      .then(function (r) {
        sendResponse(r);
      })
      .catch(function (e) {
        sendResponse({ ok: false, error: errMsg(e) });
      });
    return true;
  }
  if (type === "TBR_GET_SETTINGS") {
    S.getSettings()
      .then(function (s) {
        sendResponse({ ok: true, settings: s });
      })
      .catch(function (e) {
        sendResponse({ ok: false, error: errMsg(e) });
      });
    return true;
  }
  sendResponse({ ok: false, error: "Unknown message type." });
  return false;
});
