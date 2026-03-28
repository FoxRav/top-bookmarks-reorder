/**
 * Fetch history, aggregate by domain, score (visitCount + recency bonus).
 */

(function (global) {
  "use strict";

  var U = global.TBRUtils;

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
   * @param {{ historyDays: number, enableRecencyBonus: boolean, excludedDomains: string[] }} settings
   * @returns {Promise<{ domain: string, score: number, visitCount: number, lastVisitTime: number }[]>}
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

    var excluded = new Set(
      (settings.excludedDomains || []).map(function (d) {
        return U.normalizeDomainKey(d);
      })
    );

    /** @type {Map<string, { visitCount: number, lastVisitTime: number }>} */
    var byDomain = new Map();

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it.url) {
        continue;
      }
      var dom = U.normalizeDomainFromUrl(it.url);
      if (!dom || excluded.has(dom)) {
        continue;
      }
      var v = byDomain.get(dom);
      var vc = it.visitCount || 0;
      var lvt = it.lastVisitTime || 0;
      if (!v) {
        byDomain.set(dom, { visitCount: vc, lastVisitTime: lvt });
      } else {
        v.visitCount += vc;
        if (lvt > v.lastVisitTime) {
          v.lastVisitTime = lvt;
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
      var score = agg.visitCount + bonus;
      rows.push({
        domain: domain,
        score: score,
        visitCount: agg.visitCount,
        lastVisitTime: agg.lastVisitTime,
      });
    });

    rows.sort(function (a, b) {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.lastVisitTime - a.lastVisitTime;
    });

    return rows;
  }

  global.TBRHistoryAnalyzer = {
    analyzeHistory: analyzeHistory,
  };
})(typeof self !== "undefined" ? self : this);
