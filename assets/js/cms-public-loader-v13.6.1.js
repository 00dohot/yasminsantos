(() => {
  "use strict";
  const config = window.YASMIN_APP_CONFIG;
  if (!config) return;

  function setImage(selector, url) {
    document.querySelectorAll(selector).forEach(element => {
      if (element.tagName === "IMG") element.src = url;
      const openAttr = element.hasAttribute("data-open-profile-image")
        ? "data-open-profile-image"
        : element.hasAttribute("data-open-instagram-image")
          ? "data-open-instagram-image"
          : "";
      if (openAttr) element.setAttribute(openAttr, url);
    });
  }

  async function load() {
    try {
      const response = await fetch(`${config.apiBase}/api/publico/conteudos`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(data.conteudos)) return;

      const contents = data.conteudos;
      const avatar = contents.find(item => item.section === "profile_avatar" && item.mime_type?.startsWith("image/"));
      const cover = contents.find(item => item.section === "profile_cover" && item.mime_type?.startsWith("image/"));
      const feed = contents.filter(item => item.section === "feed" && item.mime_type?.startsWith("image/"));

      if (avatar?.mediaUrl) setImage("[data-cms-avatar]", avatar.mediaUrl);
      if (cover?.mediaUrl) {
        setImage("[data-cms-cover]", cover.mediaUrl);
        document.documentElement.style.setProperty("--cms-cover-image", `url("${cover.mediaUrl.replaceAll('"', '%22')}")`);
      }

      document.querySelectorAll("[data-cms-public-feed]").forEach(target => {
        if (!feed.length) return;
        target.innerHTML = "";
        for (const item of feed.slice(0, 6)) {
          const link = document.createElement("a");
          link.href = "instagram/";
          const image = document.createElement("img");
          image.src = item.mediaUrl;
          image.alt = item.title || "Publicação";
          image.loading = "lazy";
          link.append(image);
          target.append(link);
        }
      });
    } catch (error) {
      console.warn("O conteúdo público administrável não pôde ser carregado.", error);
    }
  }

  document.addEventListener("DOMContentLoaded", load);
})();