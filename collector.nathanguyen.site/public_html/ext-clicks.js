const ClickTracker = (() => {
  const clicks = [];
  function attach(payload) { payload.activity = payload.activity || {}; payload.activity.clicks = clicks; return payload; }
  return {
    init: () => window.addEventListener('click', e => clicks.push({ x: e.clientX, y: e.clientY, button: e.button })),
    beforeSend: attach, onExit: attach
  };
})();

window._cq = window._cq || [];
window._cq.push(['use', ClickTracker]);