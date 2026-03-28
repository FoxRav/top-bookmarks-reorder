(function () {
  "use strict";

  var statusEl = document.getElementById("status");
  var previewArea = document.getElementById("preview-area");
  var previewList = document.getElementById("preview-list");
  var previewMeta = document.getElementById("preview-meta");

  /**
   * @param {string} text
   * @param {"ok"|"error"|"neutral"} kind
   */
  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = "status";
    if (kind === "error") {
      statusEl.classList.add("error");
    } else if (kind === "ok") {
      statusEl.classList.add("ok");
    }
  }

  /**
   * @param {unknown} err
   * @returns {string}
   */
  function errMsg(err) {
    if (err && typeof err === "object" && err !== null && "message" in err) {
      return String(err.message);
    }
    return String(err);
  }

  /**
   * @param {Record<string, unknown>|null|undefined} preview
   */
  function renderPreview(preview) {
    previewList.innerHTML = "";
    if (!preview || !preview.proposedOrder) {
      previewArea.hidden = true;
      return;
    }
    var order = preview.proposedOrder;
    if (!Array.isArray(order) || order.length === 0) {
      previewArea.hidden = true;
      return;
    }
    var matched = Array.isArray(preview.matchedBookmarks)
      ? preview.matchedBookmarks
      : [];
    var byId = new Map();
    for (var i = 0; i < matched.length; i++) {
      var m = matched[i];
      if (m && m.bookmarkId) {
        byId.set(m.bookmarkId, m);
      }
    }
    for (var j = 0; j < order.length; j++) {
      var id = order[j];
      var row = byId.get(id);
      var li = document.createElement("li");
      if (row) {
        li.textContent =
          (row.title || row.domain || "") +
          " — " +
          (row.domain || "") +
          " (score " +
          String(row.score) +
          ")";
      } else {
        li.textContent = "id " + id;
      }
      previewList.appendChild(li);
    }
    var unmatched = Array.isArray(preview.unmatchedDomains)
      ? preview.unmatchedDomains.length
      : 0;
    previewMeta.textContent =
      order.length +
      " bookmark(s) will move to the left. Domains in history without a bookmark: " +
      String(unmatched) +
      " (sample).";
    previewArea.hidden = false;
  }

  /**
   * @param {string} type
   * @param {Record<string, unknown>} [payload]
   * @returns {Promise<Record<string, unknown>>}
   */
  function send(type, payload) {
    return new Promise(function (resolve, reject) {
      var msg = Object.assign({ type: type }, payload || {});
      chrome.runtime.sendMessage(msg, function (response) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response || {});
      });
    });
  }

  document.getElementById("btn-analyze").addEventListener("click", function () {
    setStatus("Analyzing…", "neutral");
    send("TBR_ANALYZE")
      .then(function (res) {
        if (!res.ok) {
          setStatus(res.error || "Analyze failed.", "error");
          return;
        }
        renderPreview(res.preview);
        setStatus("Analysis ready. Review the list, then Apply.", "ok");
      })
      .catch(function (e) {
        setStatus(errMsg(e), "error");
      });
  });

  document.getElementById("btn-preview").addEventListener("click", function () {
    setStatus("Loading preview…", "neutral");
    send("TBR_GET_PREVIEW")
      .then(function (res) {
        if (!res.ok) {
          setStatus(res.error || "No preview.", "error");
          return;
        }
        if (!res.preview) {
          setStatus('No preview yet. Click "Analyze" first.', "error");
          previewArea.hidden = true;
          return;
        }
        renderPreview(res.preview);
        setStatus("Preview loaded.", "ok");
      })
      .catch(function (e) {
        setStatus(errMsg(e), "error");
      });
  });

  document.getElementById("btn-apply").addEventListener("click", function () {
    setStatus("Applying order…", "neutral");
    send("TBR_APPLY")
      .then(function (res) {
        if (!res.ok) {
          setStatus(res.error || "Apply failed.", "error");
          return;
        }
        setStatus("Order updated. You can restore the previous order if needed.", "ok");
      })
      .catch(function (e) {
        setStatus(errMsg(e), "error");
      });
  });

  document.getElementById("btn-restore").addEventListener("click", function () {
    setStatus("Restoring…", "neutral");
    send("TBR_RESTORE")
      .then(function (res) {
        if (!res.ok) {
          setStatus(res.error || "Restore failed.", "error");
          return;
        }
        setStatus("Previous bar order restored.", "ok");
      })
      .catch(function (e) {
        setStatus(errMsg(e), "error");
      });
  });

  document.getElementById("open-settings").addEventListener("click", function (e) {
    e.preventDefault();
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  });

  send("TBR_GET_PREVIEW")
    .then(function (res) {
      if (res && res.ok && res.preview) {
        renderPreview(res.preview);
      }
    })
    .catch(function () {});
})();
