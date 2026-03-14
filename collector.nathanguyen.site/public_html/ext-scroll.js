const ScrollTracker = (() => {
  const scrolls = [];
  let t;
  function attach(payload) { payload.activity = payload.activity || {}; payload.activity.scrolls = scrolls; return payload; }
  return {
    init: () => window.addEventListener('scroll', () => { if (!t) t = setTimeout(() => { scrolls.push({ x: Math.round(window.scrollX), y: Math.round(window.scrollY) }); t = null; }, 100); }),
    beforeSend: attach, onExit: attach
  };
})();

window._cq = window._cq || [];
window._cq.push(['use', ScrollTracker]);