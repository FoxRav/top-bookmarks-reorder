/**
 * Map history domains to bookmark nodes; pick one bookmark per domain.
 */

(function (global) {
  "use strict";

  var U = global.TBRUtils;

  function promisifyGetTree() {
    return new Promise(function (resolve, reject) {
      try {
        chrome.bookmarks.getTree(function (tree) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(tree || []);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * @param {chrome.bookmarks.BookmarkTreeNode[]} tree
   * @param {string} barId
   * @returns {Set<string>}
   */
  function collectBarBookmarkIds(tree, barId) {
    var ids = new Set();
    function findBarNode(nodes) {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.id === barId) {
          return n;
        }
        if (n.children) {
          var f = findBarNode(n.children);
          if (f) {
            return f;
          }
        }
      }
      return null;
    }
    var barNode = findBarNode(tree);
    if (!barNode || !barNode.children) {
      return ids;
    }
    function walk(node) {
      if (node.url) {
        ids.add(node.id);
      }
      if (node.children) {
        for (var j = 0; j < node.children.length; j++) {
          walk(node.children[j]);
        }
      }
    }
    for (var k = 0; k < barNode.children.length; k++) {
      walk(barNode.children[k]);
    }
    return ids;
  }

  /**
   * @param {chrome.bookmarks.BookmarkTreeNode[]} tree
   * @returns {{ links: { id: string, url: string, title: string, onBar: boolean }[], barId: string }}
   */
  async function flattenBookmarks(tree) {
    var barId = await findBookmarkBarId(tree);
    var onBarSet = collectBarBookmarkIds(tree, barId);
    var links = [];

    function walk(node) {
      if (node.url) {
        var dom = U.domainKeyForRanking(node.url);
        if (dom) {
          links.push({
            id: node.id,
            url: node.url,
            title: node.title || "",
            onBar: onBarSet.has(node.id),
          });
        }
      }
      if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
          walk(node.children[i]);
        }
      }
    }
    for (var r = 0; r < tree.length; r++) {
      walk(tree[r]);
    }
    return { links: links, barId: barId };
  }

  /**
   * @param {chrome.bookmarks.BookmarkTreeNode[]} tree
   * @returns {Promise<string>}
   */
  async function findBookmarkBarId(tree) {
    function walk(nodes) {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.id === "1") {
          return "1";
        }
        if (
          n.title === "Bookmarks bar" ||
          n.title === "Bookmarks Bar" ||
          n.title === "Kirjanmerkkien palkki"
        ) {
          return n.id;
        }
        if (n.children) {
          var inner = walk(n.children);
          if (inner) {
            return inner;
          }
        }
      }
      return null;
    }
    var found = walk(tree);
    if (found) {
      return Promise.resolve(found);
    }
    return new Promise(function (resolve, reject) {
      chrome.bookmarks.get("1", function (node) {
        if (chrome.runtime.lastError || !node || !node.length) {
          reject(new Error("Could not find bookmarks bar folder."));
          return;
        }
        resolve(node[0].id);
      });
    });
  }

  /**
   * Prefer bar bookmark, then shortest URL.
   * @param {{ id: string, url: string, title: string, onBar: boolean }[]} candidates
   * @returns {{ id: string, url: string, title: string, onBar: boolean }}
   */
  function pickBest(candidates) {
    var sorted = candidates.slice().sort(function (a, b) {
      if (a.onBar !== b.onBar) {
        return a.onBar ? -1 : 1;
      }
      return a.url.length - b.url.length;
    });
    return sorted[0];
  }

  /**
   * @param {{ domain: string, score: number, windowVisitCount?: number, lastVisitTime: number }[]} rankedDomains
   * @param {{ links: { id: string, url: string, title: string, onBar: boolean }[], barId: string }} flat
   * @returns {{ matched: { domain: string, bookmarkId: string, url: string, title: string, score: number }[], unmatchedDomains: string[], domainToBookmarks: Map<string, { id: string, url: string, title: string, onBar: boolean }[]> }}
   */
  function matchDomainsToBookmarks(rankedDomains, flat) {
    /** @type {Map<string, { id: string, url: string, title: string, onBar: boolean }[]>} */
    var byDomain = new Map();
    for (var i = 0; i < flat.links.length; i++) {
      var L = flat.links[i];
      var dom = U.domainKeyForRanking(L.url);
      if (!dom) {
        continue;
      }
      var arr = byDomain.get(dom);
      if (!arr) {
        arr = [];
        byDomain.set(dom, arr);
      }
      arr.push(L);
    }

    var matched = [];
    var unmatchedDomains = [];

    for (var d = 0; d < rankedDomains.length; d++) {
      var row = rankedDomains[d];
      var cands = byDomain.get(row.domain);
      if (!cands || !cands.length) {
        unmatchedDomains.push(row.domain);
        continue;
      }
      var best = pickBest(cands);
      matched.push({
        domain: row.domain,
        bookmarkId: best.id,
        url: best.url,
        title: best.title,
        score: row.score,
        windowVisitCount: row.windowVisitCount,
      });
    }

    return {
      matched: matched,
      unmatchedDomains: unmatchedDomains,
      domainToBookmarks: byDomain,
    };
  }

  /**
   * @param {{ domain: string, score: number, windowVisitCount?: number, lastVisitTime: number }[]} rankedDomains
   * @returns {Promise<{ matched: ReturnType<typeof matchDomainsToBookmarks>['matched'], unmatchedDomains: string[], barId: string }>}
   */
  async function runMatch(rankedDomains) {
    var tree = await promisifyGetTree();
    var flat = await flattenBookmarks(tree);
    var result = matchDomainsToBookmarks(rankedDomains, flat);
    return {
      matched: result.matched,
      unmatchedDomains: result.unmatchedDomains,
      barId: flat.barId,
    };
  }

  global.TBRBookmarkMatcher = {
    findBookmarkBarIdFromTree: findBookmarkBarId,
    flattenBookmarks: flattenBookmarks,
    matchDomainsToBookmarks: matchDomainsToBookmarks,
    runMatch: runMatch,
  };
})(typeof self !== "undefined" ? self : this);
