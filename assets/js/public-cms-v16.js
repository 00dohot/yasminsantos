
(() => {
  "use strict";
  const config = window.YASMIN_APP_CONFIG;
  if (!config?.apiBase) return;
  const escapeAttr = value => String(value || "").replace(/["&<>]/g, char => ({'"':'&quot;','&':'&amp;','<':'&lt;','>':'&gt;'}[char]));
  const bySection = (items, section) => items.filter(item => item.section === section);
  async function load() {
    try {
      const response = await fetch(`${config.apiBase}/api/publico/conteudos`, { headers: { Accept: "application/json" } });
      const data = await response.json();
      if (!response.ok || !data.ok) return;
      const items = Array.isArray(data.conteudos) ? data.conteudos : [];
      const avatar = bySection(items, "profile_avatar")[0];
      if (avatar) document.querySelectorAll("[data-cms-avatar]").forEach(img => { img.src = avatar.mediaUrl; });
      const cover = bySection(items, "profile_cover")[0];
      if (cover) {
        document.querySelectorAll("[data-cms-cover]").forEach(el => { el.style.backgroundImage = `url("${cover.mediaUrl}")`; });
        document.querySelectorAll("[data-cms-cover-img]").forEach(img => { img.src = cover.mediaUrl; });
      }
      const carouselItems = bySection(items, "preview_carousel");
      const carousel = document.querySelector("[data-cms-carousel]");
      if (carousel && carouselItems.length) {
        carousel.innerHTML = carouselItems.map((item, index) => `<figure class="v16-preview-slide"><img src="${escapeAttr(item.mediaUrl)}" alt="${escapeAttr(item.title || `Prévia ${index + 1}`)}"></figure>`).join("");
      }
      const feed = bySection(items, "feed");
      const feedGrid = document.querySelector("[data-cms-feed]");
      if (feedGrid && feed.length) {
        feedGrid.innerHTML = feed.slice(0, 6).map(item => `<a href="instagram/"><img src="${escapeAttr(item.mediaUrl)}" alt="${escapeAttr(item.title || "Publicação")}"></a>`).join("");
      }
    } catch (error) { console.warn("CMS público indisponível", error); }
  }
  document.addEventListener("DOMContentLoaded", load);
})();
