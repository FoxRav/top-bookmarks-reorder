/**
 * Shared helpers: domain normalization and time utilities.
 * Service worker loads this file via importScripts (no ES modules).
 */

(function (global) {
  "use strict";

  /**
   * @param {string} urlStr
   * @returns {string|null} hostname or null if invalid
   */
  function hostnameFromUrl(urlStr) {
    if (!urlStr || typeof urlStr !== "string") {
      return null;
    }
    try {
      const u = new URL(urlStr);
      if (u.protocol === "chrome:" || u.protocol === "chrome-extension:") {
        return null;
      }
      return u.hostname.toLowerCase();
    } catch {
      return null;
    }
  }

  /**
   * Normalize URL to comparable domain key (hostname, strip leading www.).
   * @param {string} urlStr
   * @returns {string|null}
   */
  function normalizeDomainFromUrl(urlStr) {
    const host = hostnameFromUrl(urlStr);
    if (!host) {
      return null;
    }
    return host.replace(/^www\./, "");
  }

  /**
   * @param {string} domain
   * @returns {string}
   */
  function normalizeDomainKey(domain) {
    if (!domain || typeof domain !== "string") {
      return "";
    }
    return domain.trim().toLowerCase().replace(/^www\./, "");
  }

  /**
   * Group related hosts into one ranking key (e.g. all YouTube hosts → youtube.com).
   * @param {string} normalizedDomain from normalizeDomainFromUrl
   * @returns {string|null}
   */
  function groupDomainForRanking(normalizedDomain) {
    if (!normalizedDomain) {
      return null;
    }
    var d = normalizedDomain.toLowerCase().replace(/^www\./, "");
    if (d === "youtu.be") {
      return "youtube.com";
    }
    if (d === "youtube.com" || d.endsWith(".youtube.com")) {
      return "youtube.com";
    }
    return d;
  }

  /**
   * Same domain key as history ranking uses, for bookmark matching.
   * @param {string} urlStr
   * @returns {string|null}
   */
  function domainKeyForRanking(urlStr) {
    var n = normalizeDomainFromUrl(urlStr);
    if (!n) {
      return null;
    }
    return groupDomainForRanking(n);
  }

  /**
   * Recency bonus tiers (milliseconds ago from `now`).
   * @param {number} lastVisitTimeMs Chrome history timestamp (ms)
   * @param {number} nowMs
   * @param {boolean} enabled
   * @returns {number}
   */
  function recencyBonus(lastVisitTimeMs, nowMs, enabled) {
    if (!enabled) {
      return 0;
    }
    const age = nowMs - lastVisitTimeMs;
    const day = 24 * 60 * 60 * 1000;
    if (age <= day) {
      return 10;
    }
    if (age <= 7 * day) {
      return 5;
    }
    if (age <= 30 * day) {
      return 2;
    }
    return 0;
  }

  global.TBRUtils = {
    hostnameFromUrl,
    normalizeDomainFromUrl,
    normalizeDomainKey,
    groupDomainForRanking,
    domainKeyForRanking,
    recencyBonus,
  };
})(typeof self !== "undefined" ? self : this);
