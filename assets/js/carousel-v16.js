
(() => {
  "use strict";
  document.querySelectorAll("[data-preview-card]").forEach(card => {
    const track = card.querySelector("[data-preview-carousel]");
    if (!track) return;
    const step = () => Math.max(240, track.clientWidth * 0.82);
    card.querySelector("[data-carousel-prev]")?.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
    card.querySelector("[data-carousel-next]")?.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
    let down = false, startX = 0, startScroll = 0;
    track.addEventListener("pointerdown", event => {
      down = true; startX = event.clientX; startScroll = track.scrollLeft;
      track.classList.add("dragging"); track.setPointerCapture(event.pointerId);
    });
    track.addEventListener("pointermove", event => { if (down) track.scrollLeft = startScroll - (event.clientX - startX); });
    const stop = () => { down = false; track.classList.remove("dragging"); };
    track.addEventListener("pointerup", stop); track.addEventListener("pointercancel", stop); track.addEventListener("pointerleave", stop);
  });
})();
