const MouseTracker = (() => {
  const mousemoves = [];
  let t;
  function attach(payload) { payload.activity = payload.activity || {}; payload.activity.mousemoves = mousemoves; return payload; }
  return {
    init: () => window.addEventListener('mousemove', e => { if (!t) t = setTimeout(() => { mousemoves.push({ x: e.clientX, y: e.clientY }); t = null; }, 100); }),
    beforeSend: attach, onExit: attach
  };
})();

window._cq = window._cq || [];
window._cq.push(['use', MouseTracker]);