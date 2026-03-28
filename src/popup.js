(function () {
  "use strict";

  var statusEl = document.getElementById("status");
  var previewArea = document.getElementById("preview-area");
  var previewList = document.getElementById("preview-list");
  var previewMeta = document.getElementById("preview-meta");
  var sessionStatusEl = document.getElementById("session-status");
  var sessionPreviewArea = document.getElementById("session-preview-area");
  var sessionWindowList = document.getElementById("session-window-list");
  var sessionPreviewMeta = document.getElementById("session-preview-meta");
  var workspaceStatusEl = document.getElementById("workspace-status");

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
        var wv =
          row.windowVisitCount != null
            ? ", visits in window " + String(row.windowVisitCount)
            : "";
        li.textContent =
          (row.title || row.domain || "") +
          " — " +
          (row.domain || "") +
          " (score " +
          String(row.score) +
          wv +
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
   * @param {string} text
   * @param {"ok"|"error"|"neutral"} kind
   */
  function setSessionStatus(text, kind) {
    sessionStatusEl.textContent = text;
    sessionStatusEl.className = "status session-status";
    if (kind === "error") {
      sessionStatusEl.classList.add("error");
    } else if (kind === "ok") {
      sessionStatusEl.classList.add("ok");
    }
  }

  /**
   * @param {Record<string, unknown>|null|undefined} preview
   */
  function renderSessionPreview(preview) {
    sessionWindowList.innerHTML = "";
    if (!preview || !Array.isArray(preview.windows)) {
      sessionPreviewArea.hidden = true;
      return;
    }
    var wins = preview.windows;
    if (wins.length === 0) {
      sessionPreviewMeta.textContent = "No recently closed windows found.";
      sessionPreviewArea.hidden = false;
      return;
    }
    for (var i = 0; i < wins.length; i++) {
      var w = wins[i];
      var li = document.createElement("li");
      var label = w.label != null ? String(w.label) : "Window " + String(i + 1);
      var tc = w.tabCount != null ? w.tabCount : 0;
      li.textContent = label + " — " + String(tc) + " tabs";
      sessionWindowList.appendChild(li);
    }
    var total =
      typeof preview.totalWindowSessions === "number"
        ? preview.totalWindowSessions
        : wins.length;
    sessionPreviewMeta.textContent =
      "Showing up to " +
      String(wins.length) +
      " window(s). Total closed windows in history: " +
      String(total) +
      ".";
    sessionPreviewArea.hidden = false;
  }

  /**
   * @param {number} n
   */
  /**
   * @param {string} text
   * @param {"ok"|"error"|"neutral"} kind
   */
  function setWorkspaceStatus(text, kind) {
    workspaceStatusEl.textContent = text;
    workspaceStatusEl.className = "status workspace-status";
    if (kind === "error") {
      workspaceStatusEl.classList.add("error");
    } else if (kind === "ok") {
      workspaceStatusEl.classList.add("ok");
    }
  }

  function restoreWindows(n) {
    setSessionStatus("Restoring windows…", "neutral");
    send("TBR_RESTORE_RECENT_WINDOWS", { count: n })
      .then(function (res) {
        if (res.ok) {
          if (res.partial) {
            if (res.restored === 1) {
              setSessionStatus("Only 1 recent window was available.", "ok");
            } else {
              setSessionStatus(
                "Only " + res.restored + " recent windows were available.",
                "ok"
              );
            }
          } else {
            setSessionStatus("Restored " + res.restored + " windows.", "ok");
          }
          return;
        }
        setSessionStatus(res.error || "Restore failed.", "error");
      })
      .catch(function (e) {
        setSessionStatus(errMsg(e), "error");
      });
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

  document.getElementById("btn-session-preview").addEventListener("click", function () {
    setSessionStatus("Loading…", "neutral");
    send("TBR_PREVIEW_RECENT_WINDOWS")
      .then(function (res) {
        if (!res.ok) {
          setSessionStatus(res.error || "Preview failed.", "error");
          sessionPreviewArea.hidden = true;
          return;
        }
        renderSessionPreview(res.preview);
        setSessionStatus("Preview updated.", "ok");
      })
      .catch(function (e) {
        setSessionStatus(errMsg(e), "error");
      });
  });

  document.getElementById("btn-restore-w3").addEventListener("click", function () {
    restoreWindows(3);
  });
  document.getElementById("btn-restore-w4").addEventListener("click", function () {
    restoreWindows(4);
  });
  document.getElementById("btn-restore-w5").addEventListener("click", function () {
    restoreWindows(5);
  });

  send("TBR_GET_WINDOWS_PREVIEW")
    .then(function (res) {
      if (res && res.ok && res.preview) {
        renderSessionPreview(res.preview);
      }
    })
    .catch(function () {});

  document.getElementById("btn-workspace-save").addEventListener("click", function () {
    setWorkspaceStatus("Saving workspace…", "neutral");
    send("TBR_WORKSPACE_SAVE")
      .then(function (res) {
        if (!res.ok) {
          setWorkspaceStatus(res.error || "Save failed.", "error");
          return;
        }
        setWorkspaceStatus(
          "Saved workspace (" +
            String(res.windowCount) +
            " windows, " +
            String(res.tabCount) +
            " tabs).",
          "ok"
        );
      })
      .catch(function (e) {
        setWorkspaceStatus(errMsg(e), "error");
      });
  });

  document.getElementById("btn-workspace-restore").addEventListener("click", function () {
    setWorkspaceStatus("Opening saved workspace…", "neutral");
    send("TBR_WORKSPACE_RESTORE")
      .then(function (res) {
        if (!res.ok) {
          setWorkspaceStatus(res.error || "Restore failed.", "error");
          return;
        }
        setWorkspaceStatus(
          "Opened " +
            String(res.windowsOpened) +
            " window(s) (" +
            String(res.tabsOpened) +
            " tabs).",
          "ok"
        );
      })
      .catch(function (e) {
        setWorkspaceStatus(errMsg(e), "error");
      });
  });
})();
