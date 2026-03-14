// consent.js -- Consent management for the collector

const ConsentManager = (function () {

  const COOKIE_NAME = "analytics_consent";
  const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

  function setCookie(value) {
    const expires = new Date(Date.now() + ONE_YEAR).toUTCString();
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
      `${COOKIE_NAME}=${value}; expires=${expires}; Path=/; SameSite=Lax${secure}`;
  }

  function getCookie() {
    const cookies = document.cookie.split(";");
    for (const c of cookies) {
      const cookie = c.trim();
      if (cookie.indexOf(COOKIE_NAME + "=") === 0) {
        return cookie.split("=")[1];
      }
    }
    return null;
  }

  return {

    check: function () {
      const value = getCookie();
      if (value === "true") return true;
      if (value === "false") return false;

      return false;
    },

    grant: function () {
      setCookie("true");
      return true;
    },

    revoke: function () {
      setCookie("false");
      try {
        sessionStorage.clear();
      } catch (e) {}
      return false;
    },

    showBanner: function (options = {}) {

      const existing = getCookie();
      const gpcOn = !!navigator.globalPrivacyControl;

      if (!options.force && (existing === "true" || existing === "false")) return;
      if (document.getElementById("analytics-consent-modal")) return;

      const overlay = document.createElement("div");
      overlay.id = "analytics-consent-overlay";
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.right = "0";
      overlay.style.bottom = "0";
      overlay.style.background = "rgba(0,0,0,0.55)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = "100000";

      const modal = document.createElement("div");
      modal.id = "analytics-consent-modal";
      modal.style.background = "#fff";
      modal.style.color = "#222";
      modal.style.padding = "24px";
      modal.style.borderRadius = "12px";
      modal.style.width = "min(420px, 90%)";
      modal.style.boxShadow = "0 20px 60px rgba(0,0,0,0.3)";
      modal.style.fontFamily = "system-ui, sans-serif";
      modal.style.textAlign = "center";

      const title = document.createElement("h3");
      title.textContent = options.title || "Privacy Preferences";
      title.style.marginTop = "0";

      const message = document.createElement("p");
      message.style.marginBottom = "20px";
      message.textContent =
        options.message ||
        (gpcOn
          ? "Global Privacy Control is enabled in your browser. Analytics is currently disabled."
          : "We use analytics cookies to improve your experience.");

      const buttons = document.createElement("div");
      buttons.style.display = "flex";
      buttons.style.justifyContent = "center";
      buttons.style.gap = "10px";

      const accept = document.createElement("button");
      accept.textContent = options.acceptText || "Accept";
      accept.style.padding = "10px 16px";
      accept.style.borderRadius = "6px";
      accept.style.border = "none";
      accept.style.cursor = "pointer";
      accept.style.background = "#111";
      accept.style.color = "#fff";

      const decline = document.createElement("button");
      decline.textContent = options.declineText || "Decline";
      decline.style.padding = "10px 16px";
      decline.style.borderRadius = "6px";
      decline.style.border = "1px solid #ccc";
      decline.style.cursor = "pointer";
      decline.style.background = "#f5f5f5";

      accept.onclick = function () {
        ConsentManager.grant();
        if (typeof options.onAccept === 'function') {
            options.onAccept();
        }
        close();
      };

      decline.onclick = function () {
        ConsentManager.revoke();
        close();
      };

      function close() {
        document.body.style.overflow = "";
        overlay.remove();
      }

      buttons.appendChild(accept);
      buttons.appendChild(decline);

      modal.appendChild(title);
      modal.appendChild(message);
      modal.appendChild(buttons);

      overlay.appendChild(modal);

      document.body.appendChild(overlay);
      document.body.style.overflow = "hidden";
    }
  };

})();