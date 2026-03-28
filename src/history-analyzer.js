/**
 * Fetch history for the time window, count visits per domain within that window
 * (chrome.history.getVisits — not HistoryItem.visitCount, which is cumulative).
 */

(function (global) {
  "use strict";

  var U = global.TBRUtils;

  /** Visits in window contribute this many score points each (before recency). */
  var SCORE_PER_WINDOW_VISIT = 10;

  /** Cap URLs we call getVisits on (performance). */
  var MAX_URLS_TO_RESOLVE = 5000;

  /** Parallel getVisits calls per batch. */
  var GET_VISITS_BATCH = 40;

  function promisifySearch(query) {
    return new Promise(function (resolve, reject) {
      try {
        chrome.history.search(query, function (items) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(items || []);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * @param {string} url
   * @returns {Promise<chrome.history.VisitItem[]>}
   */
  function promisifyGetVisits(url) {
    return new Promise(function (resolve, reject) {
      try {
        chrome.history.getVisits({ url: url }, function (visits) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(visits || []);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * @param {chrome.history.VisitItem[]} visits
   * @param {number} startMs
   * @param {number} endMs
   * @returns {number}
   */
  function countVisitsInRange(visits, startMs, endMs) {
    var n = 0;
    for (var i = 0; i < visits.length; i++) {
      var t = visits[i].visitTime;
      if (t >= startMs && t <= endMs) {
        n++;
      }
    }
    return n;
  }

  /**
   * @param {chrome.history.HistoryItem} it
   * @param {number} startMs
   * @param {number} endMs
   * @returns {Promise<{ windowVisits: number, lifetimeRaw: number }>}
   */
  async function windowVisitsForUrl(it, startMs, endMs) {
    var lifetimeRaw = it.visitCount || 0;
    if (!it.url) {
      return { windowVisits: 0, lifetimeRaw: lifetimeRaw };
    }
    try {
      var visits = await promisifyGetVisits(it.url);
      var n = countVisitsInRange(visits, startMs, endMs);
      if (n < 1) {
        n = 1;
      }
      return { windowVisits: n, lifetimeRaw: lifetimeRaw };
    } catch {
      return { windowVisits: 1, lifetimeRaw: lifetimeRaw };
    }
  }

  /**
   * @param {{ historyDays: number, enableRecencyBonus: boolean, excludedDomains: string[], debugHistory?: boolean }} settings
   * @returns {Promise<{ domain: string, score: number, windowVisitCount: number, lifetimeVisitCountSum: number, lastVisitTime: number }[]>}
   */
  async function analyzeHistory(settings) {
    var now = Date.now();
    var start = now - settings.historyDays * 24 * 60 * 60 * 1000;
    var items = await promisifySearch({
      text: "",
      startTime: start,
      endTime: now,
      maxResults: 100000,
    });

    if (items.length > MAX_URLS_TO_RESOLVE) {
      items = items.slice(0, MAX_URLS_TO_RESOLVE);
    }

    var excluded = new Set(
      (settings.excludedDomains || []).map(function (d) {
        return U.normalizeDomainKey(d);
      })
    );

    /** @type {Map<string, { windowVisitCount: number, lifetimeVisitCountSum: number, lastVisitTime: number }>} */
    var byDomain = new Map();

    for (var offset = 0; offset < items.length; offset += GET_VISITS_BATCH) {
      var slice = items.slice(offset, offset + GET_VISITS_BATCH);
      var batchResults = await Promise.all(
        slice.map(function (it) {
          return windowVisitsForUrl(it, start, now);
        })
      );

      for (var si = 0; si < slice.length; si++) {
        var it = slice[si];
        var br = batchResults[si];
        if (!it.url) {
          continue;
        }
        var dom = U.domainKeyForRanking(it.url);
        if (!dom || excluded.has(dom)) {
          continue;
        }
        var lvt = it.lastVisitTime || 0;
        var agg = byDomain.get(dom);
        if (!agg) {
          byDomain.set(dom, {
            windowVisitCount: br.windowVisits,
            lifetimeVisitCountSum: br.lifetimeRaw,
            lastVisitTime: lvt,
          });
        } else {
          agg.windowVisitCount += br.windowVisits;
          agg.lifetimeVisitCountSum += br.lifetimeRaw;
          if (lvt > agg.lastVisitTime) {
            agg.lastVisitTime = lvt;
          }
        }
      }
    }

    var rows = [];
    byDomain.forEach(function (agg, domain) {
      var bonus = U.recencyBonus(
        agg.lastVisitTime,
        now,
        !!settings.enableRecencyBonus
      );
      var score = agg.windowVisitCount * SCORE_PER_WINDOW_VISIT + bonus;
      rows.push({
        domain: domain,
        score: score,
        windowVisitCount: agg.windowVisitCount,
        lifetimeVisitCountSum: agg.lifetimeVisitCountSum,
        lastVisitTime: agg.lastVisitTime,
      });
    });

    rows.sort(function (a, b) {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.lastVisitTime - a.lastVisitTime;
    });

    if (settings.debugHistory) {
      console.log(
        "[Top Bookmarks Reorder] history (top 25): domain | windowVisits | lifetimeRawSum | lastVisit | score"
      );
      for (var i = 0; i < Math.min(25, rows.length); i++) {
        var r = rows[i];
        console.log(
          r.domain,
          r.windowVisitCount,
          r.lifetimeVisitCountSum,
          r.lastVisitTime,
          r.score
        );
      }
    }

    return rows;
  }

  global.TBRHistoryAnalyzer = {
    analyzeHistory: analyzeHistory,
  };
})(typeof self !== "undefined" ? self : this);
