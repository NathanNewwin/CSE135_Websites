(function () {
  'use strict';

  // ---------------- Config ----------------
  const config = {
    endpoint: '',
    debug: false,
    respectConsent: true,
    showConsentBanner: false,
    consentBannerOptions: {},
    detectBots: true,
    sampleRate: 1.0,
    enableVitals: true,
    enableErrors: true,

    retryKey: '_collector_retry',
    retryCap: 50,

    maxErrors: 10,
  };

  // ---------------- State ----------------
  let initialized = false;
  let blocked = false;
  let sentExit = false;
  const customData = {};
  let userId = null;

  let imagesAllowed = null;
  let cssAllowed = null;

  let pageShowTime = Date.now();
  let totalVisibleTime = 0;

  const reportedErrors = new Set();
  let errorCount = 0;

  const vitals = { lcp: null, cls: 0, inp: null };

  // ---------------- Helpers ----------------
  function safeNowISO() {
    return new Date().toISOString();
  }

  function merge(dst, src) {
    if (!src) return dst;
    for (const k of Object.keys(src)) dst[k] = src[k];
    return dst;
  }

  function round(n) {
    return Math.round(n * 100) / 100;
  }

  // ---------------- Consent ----------------
  function hasConsent() {
    try {
      if (window.ConsentManager && typeof window.ConsentManager.check === 'function') {
        return !!window.ConsentManager.check();
      }
    } catch (_) {}

    const match = document.cookie.match(/(?:^|;)\s*analytics_consent=([^;]*)/);
    if (match) return match[1] === 'true';

    return false;
  }

  function maybeShowBanner() {
    try {
      if (config.showConsentBanner && window.ConsentManager && typeof window.ConsentManager.showBanner === 'function') {
        window.ConsentManager.showBanner(config.consentBannerOptions || {});
      }
    } catch (_) {}
  }

  // ---------------- Bot Detection ----------------
  function isBot() {
    try {
      if (navigator.webdriver) return true;
      const ua = navigator.userAgent || '';
      if (/HeadlessChrome|PhantomJS|Lighthouse/i.test(ua)) return true;
      if (/Chrome/.test(ua) && !window.chrome) return true;
      if (window._phantom || window.__nightmare || window.callPhantom) return true;
      return false;
    } catch (_) {
      return false;
    }
  }

  // ---------------- Sampling ----------------
  function isSampled() {
    const r = Number(config.sampleRate);
    if (!Number.isFinite(r)) return true;
    if (r >= 1) return true;
    if (r <= 0) return false;

    const key = '_collector_sample';
    let val = null;

    try { val = sessionStorage.getItem(key); } catch (_) {}
    if (val === null) {
      val = String(Math.random());
      try { sessionStorage.setItem(key, val); } catch (_) {}
    }
    const num = parseFloat(val);
    return Number.isFinite(num) ? (num < r) : true;
  }

  // ---------------- Sessioning ----------------
  function getSessionId() {
    if (config.respectConsent && !hasConsent()) return null;
    const match = document.cookie.match(/(?:^|;)\s*_collector_sid=([^;]*)/);
    if (match) return match[1];
    const sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `_collector_sid=${sid}; Path=/; Max-Age=86400; SameSite=Lax${secure}`;
    return sid;
  }

  // ---------------- Static Checks ----------------
  function checkCapabilities() {
    try {
      const img = new Image();
      img.onload = () => { imagesAllowed = true; };
      img.onerror = () => { imagesAllowed = false; };
      img.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
    } catch (_) { imagesAllowed = null; }

    try {
      const testDiv = document.createElement('div');
      testDiv.style.display = 'none';
      document.documentElement.appendChild(testDiv);
      cssAllowed = getComputedStyle(testDiv).display === 'none';
      testDiv.remove();
    } catch (_) { cssAllowed = null; }
  }

  function getStaticData() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      acceptsCookies: navigator.cookieEnabled,
      allowsJs: true,
      allowsImages: imagesAllowed,
      allowsCss: cssAllowed,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      networkConnection: navigator.connection ? navigator.connection.effectiveType : 'unknown'
    };
  }

  // ---------------- Performance Data ----------------
  function initWebVitals() {
    // 1. Largest Contentful Paint (LCP)
    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length) {
          const t = entries[entries.length - 1].startTime;
          // Guard against 0 (e.g. prerendered pages) to avoid reporting a misleading value
          if (t > 0) vitals.lcp = Math.round(t);
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (_) {}

    // 2. Cumulative Layout Shift (CLS)
    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            vitals.cls += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (_) {}

    // 3. Interaction to Next Paint (INP)
    // 'interaction' is not a valid entry type — use 'event' with a low durationThreshold
    // so all interactions are captured; INP is the worst-case (max) duration.
    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (vitals.inp === null || entry.duration > vitals.inp) {
            vitals.inp = Math.round(entry.duration);
          }
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
    } catch (_) {}
  }

  function getPerformanceData() {
    const entries = performance.getEntriesByType('navigation');
    const n = entries.length ? entries[0] : null;

    // TTFB: responseStart is relative to the navigation start (startTime is always 0
    // for navigation entries), so no subtraction needed. Guard against null/undefined
    // rather than > 0, since 0 is technically valid for instant cache hits.
    const ttfb = (n && n.responseStart != null) ? Math.round(n.responseStart) : null;

    return {
      load_time_ms: n ? Math.round(n.loadEventEnd - n.startTime) : null,
      ttfb_ms: ttfb,
      lcp_ms: vitals.lcp !== null ? vitals.lcp : null,
      cls: Math.round(vitals.cls * 10000) / 10000,  // 4 decimal places, no redundant parseFloat
      inp_ms: vitals.inp !== null ? vitals.inp : null,

      // Keep the full object for debugging in the payload column if needed
      timing_raw: n ? n.toJSON() : {}
    };
  }

  // ---------------- Send ----------------
  function send(payload, opts) {
    const options = opts || {};
    if (blocked) return;
    if (config.respectConsent && !hasConsent()) return;
    if (!config.endpoint) return;

    const json = JSON.stringify(payload);
    let sent = false;

    try {
      if (navigator.sendBeacon) {
        sent = navigator.sendBeacon(config.endpoint, new Blob([json], { type: 'application/json' }));
      }
    } catch (_) {}

    if (!sent) {
      fetch(config.endpoint, {
        method: 'POST',
        body: json,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      }).catch(() => { /* handle retry if needed */ });
    }
  }

  // ---------------- Errors ----------------
  function reportError(kind, errorObj) {
    if (blocked || (config.respectConsent && !hasConsent()) || errorCount >= config.maxErrors) return;
    const key = `${kind}:${errorObj.message || ''}:${errorObj.source || ''}:${errorObj.line || ''}`;
    if (reportedErrors.has(key)) return;
    reportedErrors.add(key);
    errorCount++;

    send({
      type: 'error',
      kind,
      error: errorObj,
      timestamp: safeNowISO(),
      url: window.location.href,
      session: getSessionId(),
      userId: userId || undefined,
      customData
    });
  }

  function initErrorTracking() {
    window.addEventListener('error', (event) => {
      const isResource = event && event.target && event.target !== window && !(event instanceof ErrorEvent);
      if (isResource) return;
      const ev = event;
      reportError('runtime', {
        message: ev.message || 'Script error',
        source: ev.filename || null,
        line: ev.lineno || null,
        col: ev.colno || null,
        stack: ev.error && ev.error.stack ? String(ev.error.stack) : null
      });
    }, true);
  }

  // ---------------- Collect ----------------
  function collect(type) {
    if (blocked || (config.respectConsent && !hasConsent())) return;

    let payload = {
      event_type: type,
      url: window.location.href,
      referrer: document.referrer,
      session_id: getSessionId(),
      timestamp: safeNowISO(),
      entryTime: pageShowTime,
      static: getStaticData(),
      performance: getPerformanceData(),
      userId: userId || undefined,
      customData,
      errorCount
    };

    send(payload);
  }

  // ---------------- Page Exit ----------------
  function sendExitOnce(reason) {
    if (sentExit) return;
    sentExit = true;

    totalVisibleTime += Date.now() - pageShowTime;

    let exitPayload = {
      event_type: 'page_exit',
      url: window.location.href,
      referrer: document.referrer,
      session_id: getSessionId(),
      timestamp: safeNowISO(),
      timeOnPage: totalVisibleTime,
      leaveTime: Date.now(),
      static: getStaticData(),
      reason: reason || 'hidden',
      performance: getPerformanceData(),
      userId: userId || undefined,
      customData,
      errorCount
    };

    send(exitPayload);
  }

  function initTimeOnPage() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        sendExitOnce('visibilitychange:hidden');
      } else {
        pageShowTime = Date.now();
        sentExit = false;
      }
    });
    window.addEventListener('pagehide', () => sendExitOnce('pagehide'));
  }

  // ---------------- Public API ----------------
  const publicAPI = {
    init: function (options) {
      if (initialized) return;
      merge(config, options || {});
      if (config.respectConsent && !hasConsent()) { blocked = true; return; }
      if (config.detectBots && isBot()) { blocked = true; return; }
      if (!isSampled()) { blocked = true; return; }

      initialized = true;
      checkCapabilities();
      if (config.enableVitals) initWebVitals();
      if (config.enableErrors) initErrorTracking();
      initTimeOnPage();

      if (document.readyState === 'complete') {
        setTimeout(() => collect('pageview'), 0);
      } else {
        window.addEventListener('load', () => setTimeout(() => collect('pageview'), 0));
      }
    },
    track: function (eventName, eventData) {
      if (!initialized || blocked) return;
      send({
        type: 'event',
        event: String(eventName || 'event'),
        data: eventData || {},
        url: window.location.href,
        session: getSessionId(),
        timestamp: safeNowISO()
      });
    },
    identify: function (id) { userId = String(id); },
    grantConsent: function() {
      blocked = false;
      this.init();
    }
  };

  window.collector = publicAPI;

  // ---------------- Process Queue ----------------
  const queue = window._cq || [];
  
  window._cq = {
    push: function(cmd) {
      const action = cmd[0];
      const payload = cmd[1];
      const extra = cmd[2];

      if (action === 'init') publicAPI.init(payload);
      else if (action === 'track') publicAPI.track(payload, extra);
      else if (action === 'identify') publicAPI.identify(payload);
      else if (action === 'grantConsent') publicAPI.grantConsent();
    }
  };

  queue.forEach(cmd => window._cq.push(cmd));
})();