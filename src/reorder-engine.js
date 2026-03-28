/**
 * Backup bookmarks bar order, apply top-N reorder, restore from snapshot.
 */

(function (global) {
  "use strict";

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
   * @param {string} barId
   * @returns {Promise<{ id: string, index: number }[]>}
   */
  async function getBarOrderSnapshot(barId) {
    var children = await promisify(function (cb) {
      chrome.bookmarks.getChildren(barId, cb);
    });
    return children.map(function (c, index) {
      return { id: c.id, index: index };
    });
  }

  /**
   * @param {string} barId
   * @param {string[]} desiredOrder full sibling order on the bar
   * @returns {Promise<void>}
   */
  async function moveToOrder(barId, desiredOrder) {
    for (var i = 0; i < desiredOrder.length; i++) {
      var want = desiredOrder[i];
      var children = await promisify(function (cb) {
        chrome.bookmarks.getChildren(barId, cb);
      });
      var ids = children.map(function (c) {
        return c.id;
      });
      var curIdx = ids.indexOf(want);
      if (curIdx === i) {
        continue;
      }
      await promisify(function (cb) {
        chrome.bookmarks.move(want, { parentId: barId, index: i }, cb);
      });
    }
  }

  /**
   * @param {string[]} matchedIds ordered by priority
   * @param {Set<string>} locked
   * @param {number} topN
   * @returns {string[]}
   */
  function selectTopMovable(matchedIds, locked, topN) {
    var out = [];
    for (var i = 0; i < matchedIds.length && out.length < topN; i++) {
      if (!locked.has(matchedIds[i])) {
        out.push(matchedIds[i]);
      }
    }
    return out;
  }

  /**
   * @param {string} barId
   * @param {string[]} topIds
   * @returns {Promise<void>}
   */
  async function applyTopOrder(barId, topIds) {
    var children = await promisify(function (cb) {
      chrome.bookmarks.getChildren(barId, cb);
    });
    var currentIds = children.map(function (c) {
      return c.id;
    });
    var topSet = new Set(topIds);
    var rest = currentIds.filter(function (id) {
      return !topSet.has(id);
    });
    var desired = topIds.concat(rest);
    await moveToOrder(barId, desired);
  }

  /**
   * @param {string} barId
   * @param {{ id: string, index: number }[]} originalChildren
   * @returns {Promise<void>}
   */
  async function restoreFromSnapshot(barId, originalChildren) {
    var sorted = originalChildren.slice().sort(function (a, b) {
      return a.index - b.index;
    });
    var snapIds = sorted.map(function (x) {
      return x.id;
    });
    var children = await promisify(function (cb) {
      chrome.bookmarks.getChildren(barId, cb);
    });
    var currentIds = children.map(function (c) {
      return c.id;
    });
    var snapSet = new Set(snapIds);
    var tail = currentIds.filter(function (id) {
      return !snapSet.has(id);
    });
    var desired = snapIds.concat(tail);
    await moveToOrder(barId, desired);
  }

  global.TBRReorderEngine = {
    getBarOrderSnapshot: getBarOrderSnapshot,
    moveToOrder: moveToOrder,
    selectTopMovable: selectTopMovable,
    applyTopOrder: applyTopOrder,
    restoreFromSnapshot: restoreFromSnapshot,
  };
})(typeof self !== "undefined" ? self : this);
