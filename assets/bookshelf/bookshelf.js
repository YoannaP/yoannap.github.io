// Shows the cover-and-note card for the book under the pointer (or tapped / focused).
(() => {
  "use strict";
  const card = document.getElementById("bs-card");
  if (!card) return;
  const $ = id => document.getElementById(id);
  const books = document.querySelectorAll(".bs-book");
  let open = null;

  // Fade out spine titles too long to fit, rather than cutting them mid-letter.
  const range = document.createRange();
  const markClipped = () => document.querySelectorAll(".bs-title").forEach(t => {
    range.selectNodeContents(t);
    const text = range.getBoundingClientRect(), box = t.getBoundingClientRect();
    t.classList.toggle("clipped", text.height > box.height + .5 || text.width > box.width + .5);
  });
  markClipped();
  if (document.fonts) document.fonts.ready.then(markClipped);
  addEventListener("load", markClipped);
  addEventListener("resize", markClipped);

  // Warm the cache so the card opens with its cover.
  books.forEach(b => { if (b.dataset.cover) new Image().src = b.dataset.cover; });

  function place() {
    if (!open) return;
    const r = open.getBoundingClientRect();
    const cw = card.offsetWidth, ch = card.offsetHeight, m = 12;
    const left = Math.max(m, Math.min(r.left + r.width / 2 - cw / 2, innerWidth - cw - m));
    let top = r.top - ch - 12;
    if (top < m) top = Math.min(r.bottom + 12, innerHeight - ch - m);
    card.style.left = left + "px";
    card.style.top = Math.max(m, top) + "px";
  }

  function fillCover(b) {
    const cv = $("bs-cover");
    const d = b.dataset;
    cv.replaceChildren();
    cv.className = "bs-cover" + (d.cover ? "" : " made");
    // Books without a published cover get one made from their spine's cloth.
    const s = getComputedStyle(b);
    cv.style.background = d.cover ? "" : s.getPropertyValue("--c");
    cv.style.color = d.cover ? "" : s.getPropertyValue("--t");
    if (d.cover) {
      const img = new Image();
      img.src = d.cover;
      img.alt = "Cover of " + d.title;
      img.addEventListener("load", place);
      cv.append(img);
    } else {
      const title = document.createElement("b"); title.textContent = d.title;
      const author = document.createElement("i"); author.textContent = d.author;
      const top = document.createElement("div"); top.append(title, document.createElement("hr"));
      cv.append(top, author);
    }
  }

  function show(b) {
    if (open === b) return;
    if (open) open.classList.remove("is-open");
    open = b;
    const d = b.dataset;
    $("bs-card-shelf").textContent = d.shelf;
    $("bs-card-title").textContent = d.title;
    $("bs-card-author").textContent = d.author;
    const note = $("bs-card-note");
    note.textContent = d.note || "No note on this one yet.";
    note.classList.toggle("empty", !d.note);
    fillCover(b);
    b.classList.add("is-open");
    card.hidden = false;
    card.style.animation = "none"; card.offsetHeight; card.style.animation = "";
    place();
  }

  function hide() {
    if (!open) return;
    open.classList.remove("is-open");
    open = null;
    card.hidden = true;
  }

  books.forEach(b => {
    b.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") show(b); });
    b.addEventListener("pointerleave", e => { if (e.pointerType === "mouse" && document.activeElement !== b) hide(); });
    b.addEventListener("click", e => { if (open === b && e.pointerType && e.pointerType !== "mouse") hide(); else show(b); });
    b.addEventListener("focus", () => show(b));
    b.addEventListener("blur", () => { if (open === b && !b.matches(":hover")) hide(); });
  });
  document.addEventListener("click", e => { if (!e.target.closest(".bs-book")) hide(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { hide(); document.activeElement?.blur?.(); } });
  addEventListener("scroll", place, { passive: true });
  addEventListener("resize", place);
})();
