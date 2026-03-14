const KeyTracker = (() => {
  const keys = [];
  function attach(payload) { payload.activity = payload.activity || {}; payload.activity.keys = keys; return payload; }
  return {
    init: () => {
      window.addEventListener('keydown', e => keys.push({ type: 'down', key: e.key }));
      window.addEventListener('keyup', e => keys.push({ type: 'up', key: e.key }));
    },
    beforeSend: attach, onExit: attach
  };
})();

window._cq = window._cq || [];
window._cq.push(['use', KeyTracker]);