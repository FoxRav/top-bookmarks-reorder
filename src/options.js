(function () {
  "use strict";

  var SETTINGS_KEY = "tbr_settings";

  var form = document.getElementById("form-settings");
  var statusEl = document.getElementById("opt-status");

  /**
   * @param {string} text
   * @param {boolean} ok
   */
  function setStatus(text, ok) {
    statusEl.textContent = text;
    statusEl.className = "status " + (ok ? "ok" : "error");
  }

  /**
   * @param {string} text
   * @returns {string[]}
   */
  function linesToList(text) {
    return text
      .split(/\r?\n/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }

  /**
   * @param {string[]} list
   * @returns {string}
   */
  function listToLines(list) {
    return (list || []).join("\n");
  }

  function load() {
    chrome.storage.local.get([SETTINGS_KEY], function (data) {
      if (chrome.runtime.lastError) {
        setStatus(chrome.runtime.lastError.message, false);
        return;
      }
      var raw = data[SETTINGS_KEY];
      var topN = document.getElementById("topN");
      var historyDays = document.getElementById("historyDays");
      var rec = document.getElementById("enableRecencyBonus");
      var dbg = document.getElementById("debugHistory");
      var ex = document.getElementById("excludedDomains");
      var locked = document.getElementById("lockedBookmarkIds");
      if (!raw || typeof raw !== "object") {
        topN.value = "20";
        historyDays.value = "30";
        rec.checked = true;
        dbg.checked = false;
        ex.value = "";
        locked.value = "";
        return;
      }
      topN.value = String(raw.topN != null ? raw.topN : 20);
      historyDays.value = String(raw.historyDays != null ? raw.historyDays : 30);
      rec.checked = raw.enableRecencyBonus !== false;
      dbg.checked = raw.debugHistory === true;
      ex.value = listToLines(raw.excludedDomains);
      locked.value = listToLines(raw.lockedBookmarkIds);
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var topN = parseInt(document.getElementById("topN").value, 10);
    var historyDays = parseInt(document.getElementById("historyDays").value, 10);
    if (Number.isNaN(topN) || topN < 1 || topN > 100) {
      setStatus("Top N must be between 1 and 100.", false);
      return;
    }
    if (Number.isNaN(historyDays) || historyDays < 1 || historyDays > 365) {
      setStatus("History days must be between 1 and 365.", false);
      return;
    }
    var settings = {
      topN: topN,
      historyDays: historyDays,
      enableRecencyBonus: document.getElementById("enableRecencyBonus").checked,
      debugHistory: document.getElementById("debugHistory").checked,
      excludedDomains: linesToList(document.getElementById("excludedDomains").value).map(function (d) {
        return d.toLowerCase().replace(/^www\./, "");
      }),
      lockedBookmarkIds: linesToList(document.getElementById("lockedBookmarkIds").value),
    };
    var payload = {};
    payload[SETTINGS_KEY] = settings;
    chrome.storage.local.set(payload, function () {
      if (chrome.runtime.lastError) {
        setStatus(chrome.runtime.lastError.message, false);
        return;
      }
      setStatus("Saved.", true);
    });
  });

  load();
})();
