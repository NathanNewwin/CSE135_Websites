const IdleTracker = (() => {
  const idleTimes = [];
  let lastActivity = Date.now(), timer, isIdle = false, idleStart = 0;
  
  function reset() {
    const now = Date.now();
    if (isIdle) { idleTimes.push({ ended: now, duration: now - idleStart }); isIdle = false; }
    lastActivity = now;
    clearTimeout(timer);
    timer = setTimeout(() => { isIdle = true; idleStart = lastActivity; }, 2000);
  }
  
  function attach(payload) { payload.activity = payload.activity || {}; payload.activity.idleTimes = idleTimes; return payload; }
  
  return {
    init: () => {
      ['click','mousemove','scroll','keydown','keyup'].forEach(e => window.addEventListener(e, reset));
      reset();
    },
    beforeSend: attach, onExit: attach
  };
})();

window._cq = window._cq || [];
window._cq.push(['use', IdleTracker]);