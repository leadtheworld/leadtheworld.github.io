/* Small progressive enhancements; every page remains readable without JavaScript. */
(() => {
  "use strict";
  const portrait = document.getElementById("hero-reveal");
  if (portrait) {
    let pinned = false;
    let hovered = false;
    const updatePortrait = () => {
      const visible = pinned || hovered;
      portrait.classList.toggle("is-revealed", visible);
      portrait.setAttribute("aria-pressed", String(visible));
      portrait.setAttribute("aria-label", visible ? "Show the headline" : "Show Nahyun Lee’s portrait");
    };
    portrait.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch") return;
      hovered = true;
      updatePortrait();
    });
    portrait.addEventListener("pointerleave", () => {
      hovered = false;
      updatePortrait();
    });
    portrait.addEventListener("click", (event) => {
      // Mouse use stays temporary; touch and keyboard can toggle the portrait.
      if (event.pointerType === "mouse" || (event.detail > 0 && hovered)) return;
      hovered = false;
      pinned = !pinned;
      updatePortrait();
    });
    portrait.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      pinned = false;
      hovered = false;
      updatePortrait();
    });
  }
  const search = document.getElementById("publication-search");
  if (!search) return;
  const rows = Array.from(document.querySelectorAll(".publication-entry"));
  const filters = Array.from(document.querySelectorAll("[data-pub-filter]"));
  const count = document.getElementById("publication-count");
  const empty = document.getElementById("publication-empty");
  let filter = "all";
  const update = () => {
    const term = search.value.toLocaleLowerCase().trim();
    let visible = 0;
    for (const row of rows) {
      row.hidden = !((filter === "all" || row.dataset.status === filter) && row.textContent.toLocaleLowerCase().includes(term));
      if (!row.hidden) visible++;
    }
    count.textContent = `${visible} ${visible === 1 ? "work" : "works"}`;
    empty.hidden = visible !== 0;
    filters.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.pubFilter === filter)));
  };
  filters.forEach((button) =>
    button.addEventListener("click", () => {
      filter = button.dataset.pubFilter;
      update();
    })
  );
  search.addEventListener("input", update);
  // An in-page publication link always reveals its target, even after filtering.
  window.addEventListener("hashchange", () => {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && target.classList.contains("publication-entry")) {
      filter = "all";
      search.value = "";
      update();
      target.scrollIntoView({ block: "center" });
    }
  });
})();
