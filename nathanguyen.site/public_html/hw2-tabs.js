(function () {
  const root = document.querySelector("#hw2");
  if (!root) return;

  const tabs = Array.from(root.querySelectorAll(".hw2-tab"));
  const panes = Array.from(root.querySelectorAll(".hw2-pane"));

  function openPane(id) {
    tabs.forEach(t => {
      const active = t.dataset.target === id;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });

    panes.forEach(p => {
      p.classList.toggle("is-open", p.id === id);
    });
  }

  tabs.forEach(t => {
    t.addEventListener("click", () => openPane(t.dataset.target));
  });
})();
