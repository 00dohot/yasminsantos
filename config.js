window.SITE_CONFIG = {
  siteVersion: "V15.1",

  brand: {
    name: "Yasmin Santos",
    handle: "@yasminsantos",
    botHandle: "@yasminsantos_bot",
    eyebrow: "CONTEÚDO • 18+",
    headline: "Seu acesso exclusivo começa aqui",
    description: "Conheça meu canal VIP, conteúdos e prévias em um só lugar."
  },

  links: {
    instagramReal: "https://instagram.com/SEU_USUARIO",
    telegramReal: "https://t.me/SEU_USUARIO",
    telegramBot: "https://paylume.fans/l/yasmimsantoss",
    support: "https://wa.me/55SEUNUMERO",
    rouletteExternal: "https://sharkbot.com.br/r/yasminsantos"
  },

  payment: {
    createEndpoint: "https://yasmin-backend.novinhadize9.workers.dev/api/criar-pagamento?v=15.1",
    workerStatusEndpoint: "https://yasmin-backend.novinhadize9.workers.dev/api/status?v=15.1",
    contractVersion: "15.1",
    statusEndpoint: "https://yasmin-backend.novinhadize9.workers.dev/api/status-pagamento",
    verifyEndpoint: "https://yasmin-backend.novinhadize9.workers.dev/api/verificar-acesso",
    pollIntervalMs: 5000,
    maxPollAttempts: 120
  },

  siteAccess: {
    plans: {
      daily: {
        code: "diario",
        name: "Acesso diário",
        period: "24 horas",
        price: "R$ 9,90"
      },
      monthly: {
        code: "mensal",
        name: "Acesso mensal",
        period: "30 dias",
        price: "R$ 34,90"
      },
      lifetime: {
        code: "vitalicio",
        name: "Acesso vitalício",
        period: "Sem expiração",
        price: "R$ 199,00"
      }
    }
  },

  privacyAccess: {
    mainOffer: {
      code: "mensal",
      name: "Plano mensal",
      period: "30 dias",
      originalPrice: "R$ 25,00",
      price: "R$ 20,00",
      discount: "20% OFF"
    },
    plans: {
      quarterly: {
        code: "trimestral",
        name: "Plano trimestral",
        period: "90 dias",
        price: "R$ 49,90"
      },
      lifetime: {
        code: "vitalicio",
        name: "Plano vitalício",
        period: "Sem expiração",
        price: "R$ 99,90"
      }
    }
  },

  instagram: {
    posts: "12",
    followers: "12,8 mil",
    following: "184"
  },

  /*
    V15.1 — FONTE ÚNICA DAS FOTOS DO INSTAGRAM.
    Troque os caminhos abaixo uma única vez. As mesmas fotos serão usadas
    automaticamente no card da página inicial e na página interna do Instagram.
  */
  instagramFeed: [
    { image: "assets/images/modelo-piscina.png", alt: "Publicação 1" },
    { image: "assets/images/modelo-piscina.png", alt: "Publicação 2" },
    { image: "assets/images/modelo-piscina.png", alt: "Publicação 3" },
    { image: "assets/images/modelo-piscina.png", alt: "Publicação 4" },
    { image: "assets/images/modelo-piscina.png", alt: "Publicação 5" },
    { image: "assets/images/modelo-piscina.png", alt: "Publicação 6" }
  ],

  privacy: {
    photos: "50",
    videos: "89",
    likes: "15,2 mil"
  },

  aiChat: {
    enabled: false,
    endpoint: "",
    welcomeMessage: "Oi, vi que você chegou por aqui 😊 Quer conhecer meu conteúdo exclusivo?",
    fallbackReply: "Adorei sua mensagem. Meu atendimento inteligente ainda está sendo configurado, mas você já pode conhecer as opções exclusivas no perfil."
  },

  instagramSuggestions: [
    {name:"Luna Martins",handle:"@lunamartins",image:"../assets/images/modelo-piscina.png",url:"https://SEU-SITE-LUNA.com"},
    {name:"Maya Costa",handle:"@mayacosta",image:"../assets/images/modelo-piscina.png",url:"https://SEU-SITE-MAYA.com"},
    {name:"Clara Alves",handle:"@claraalves",image:"../assets/images/modelo-piscina.png",url:"https://SEU-SITE-CLARA.com"}
  ],

  instagramReels: [
    {title:"Reel 1",thumbnail:"../assets/images/modelo-piscina.png",videoUrl:""},
    {title:"Reel 2",thumbnail:"../assets/images/modelo-piscina.png",videoUrl:""},
    {title:"Reel 3",thumbnail:"../assets/images/modelo-piscina.png",videoUrl:""}
  ]
};

/* =====================================================
   V15.1 — PÁGINA INICIAL + SINCRONIZAÇÃO DO INSTAGRAM
   - Imagens borradas abrem exclusivamente os planos do site
   - Fotos do card do Instagram abrem a publicação correspondente
   - Uma única lista de imagens alimenta o card e a página Instagram
   ===================================================== */
(() => {
  "use strict";

  const cfg = window.SITE_CONFIG || {};
  const configScript = document.currentScript;
  const siteRoot = configScript?.src
    ? new URL(".", configScript.src)
    : new URL("./", window.location.href);

  const feed = Array.isArray(cfg.instagramFeed) && cfg.instagramFeed.length
    ? cfg.instagramFeed
    : Array.from({ length: 6 }, (_, index) => ({
        image: "assets/images/modelo-piscina.png",
        alt: `Publicação ${index + 1}`
      }));

  const resolveAsset = (path) => {
    try {
      return new URL(String(path || ""), siteRoot).href;
    } catch {
      return String(path || "");
    }
  };

  const instagramPageUrl = (index) => {
    const url = new URL("instagram/", siteRoot);
    if (Number.isInteger(index)) url.searchParams.set("post", String(index + 1));
    return url.href;
  };

  function openSitePlans() {
    const trigger = document.querySelector(
      "[data-payment-open-plans], [data-open-site-plans], [data-payment-open-site-plans]"
    );

    if (trigger) {
      trigger.click();
      return;
    }

    const plansPanel = document.getElementById("sitePlansPanel");
    if (plansPanel) {
      document.getElementById("homeDefaultContent")?.setAttribute("hidden", "");
      plansPanel.hidden = false;
      plansPanel.setAttribute("aria-hidden", "false");
      plansPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const siteModal = document.querySelector(
      '[data-payment-modal][data-default-product="site"], .site-payment-modal'
    );
    if (siteModal) {
      siteModal.classList.add("open", "is-open");
      siteModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    }
  }

  function updateImage(image, item, index) {
    if (!image || !item) return;
    image.src = resolveAsset(item.image);
    image.alt = item.alt || `Publicação ${index + 1}`;
    image.loading = image.loading || "lazy";
    image.dataset.instagramFeedIndex = String(index + 1);
  }

  function removePreviewMenuEntries() {
    document
      .querySelectorAll('a[href*="previas"], [data-link="previewsReal"], .telegram-preview-card')
      .forEach((element) => {
        (element.closest(".telegram-preview-card") || element).remove();
      });
  }

  function reorderHomeMenus() {
    const drawerNav = document.querySelector(".drawer-nav");
    if (drawerNav) {
      const home = drawerNav.querySelector('a[href="./"]');
      const privacy = drawerNav.querySelector('a[href*="privacy"]');
      const telegram = drawerNav.querySelector('[data-open-home-telegram], a[href*="telegram"]');
      const roulette = drawerNav.querySelector('a[href*="roleta"]');
      const instagram = drawerNav.querySelector('a[href*="instagram"]');
      [home, privacy, telegram, roulette, instagram]
        .filter(Boolean)
        .forEach((item) => drawerNav.appendChild(item));
    }

    const heroLinks = document.querySelector(".hero-links");
    if (heroLinks) {
      const privacy = heroLinks.querySelector('a[href*="privacy"]');
      const telegram = heroLinks.querySelector('[data-open-home-telegram], a[href*="telegram"]');
      const roulette = heroLinks.querySelector('a[href*="roleta"]');
      const instagram = heroLinks.querySelector('a[href*="instagram"]');
      [privacy, telegram, roulette, instagram]
        .filter(Boolean)
        .forEach((item) => heroLinks.appendChild(item));
    }
  }

  function buildPreviewCard(stack, exclusiveCard) {
    document.querySelector(".v15-preview-card")?.remove();

    const previewCard = document.createElement("article");
    previewCard.className = "glass-card v15-preview-card";

    const items = feed.slice(0, 5).map((item, index) => {
      const blurred = index === 1 || index === 3;
      const image = `<img src="${resolveAsset(item.image)}" alt="${item.alt || `Prévia ${index + 1}`}" loading="lazy">`;

      if (blurred) {
        return `
          <button type="button" class="v15-preview-item is-blurred" data-v151-open-site-plans aria-label="Ver planos dos conteúdos exclusivos do site">
            ${image}
            <span>Conteúdo exclusivo</span>
          </button>
        `;
      }

      return `
        <a href="${instagramPageUrl(index)}" class="v15-preview-item" aria-label="Abrir publicação ${index + 1}">
          ${image}
        </a>
      `;
    }).join("");

    previewCard.innerHTML = `
      <header class="v15-preview-header">
        <div>
          <span class="section-kicker">PRÉVIAS</span>
          <h2>Um pouco do que te espera</h2>
        </div>
        <span>Arraste para o lado</span>
      </header>
      <div class="v15-preview-track" aria-label="Carrossel de prévias">
        ${items}
      </div>
    `;

    previewCard.querySelectorAll("[data-v151-open-site-plans]").forEach((button) => {
      button.addEventListener("click", openSitePlans);
    });

    exclusiveCard.insertAdjacentElement("afterend", previewCard);
  }

  function syncHomeInstagramCard(instagramCard) {
    if (!instagramCard) return;

    const links = [...instagramCard.querySelectorAll(".ig-grid-six a")];
    links.forEach((link, index) => {
      const item = feed[index % feed.length];
      const image = link.querySelector("img");
      updateImage(image, item, index);
      link.href = instagramPageUrl(index);
      link.removeAttribute("target");
      link.dataset.instagramFeedIndex = String(index + 1);
      link.setAttribute("aria-label", `Abrir publicação ${index + 1} na página do Instagram`);
    });
  }

  function setupHomePage() {
    if (!document.body.classList.contains("home-page")) return;

    removePreviewMenuEntries();
    reorderHomeMenus();

    const stack = document.getElementById("homeDefaultContent") || document.querySelector(".home-stack");
    const exclusiveCard = stack?.querySelector(".exclusive-card");
    const instagramCard = stack?.querySelector(".instagram-card");

    if (stack && exclusiveCard) buildPreviewCard(stack, exclusiveCard);
    if (stack && instagramCard) stack.appendChild(instagramCard);
    syncHomeInstagramCard(instagramCard);
  }

  function collectInstagramGridImages() {
    const selectors = [
      ".ig-profile-grid img",
      ".ig-post-grid img",
      ".instagram-grid img",
      ".instagram-posts img",
      ".profile-posts img",
      ".posts-grid img",
      ".post-grid img",
      ".gallery img",
      "[data-instagram-grid] img",
      "[data-instagram-feed] img"
    ];

    for (const selector of selectors) {
      const images = [...document.querySelectorAll(selector)];
      if (images.length >= 3) return images;
    }

    const containers = [...document.querySelectorAll("main div, main section, main article")]
      .map((element) => {
        const identity = `${element.id || ""} ${element.className || ""}`.toLowerCase();
        const images = [...element.querySelectorAll("img")].filter((image) => {
          return !image.closest(
            ".drawer, .topbar, header, .profile-header, .profile-avatar, .avatar, .suggestions, .modal, dialog"
          );
        });
        const keywordScore = /(grid|gallery|posts|feed|media)/.test(identity) ? 20 : 0;
        const compactScore = images.length >= 3 && images.length <= 18 ? 10 : 0;
        return { element, images, score: keywordScore + compactScore + images.length };
      })
      .filter((candidate) => candidate.images.length >= 3)
      .sort((a, b) => b.score - a.score || a.images.length - b.images.length);

    return containers[0]?.images || [];
  }

  function syncInstagramPage() {
    const isInstagramPage = /\/instagram\/?$/i.test(window.location.pathname)
      || document.body.classList.contains("instagram-page");
    if (!isInstagramPage) return;

    const images = collectInstagramGridImages();
    images.slice(0, feed.length).forEach((image, index) => {
      updateImage(image, feed[index], index);
      const clickable = image.closest("a, button, [role='button']");
      clickable?.setAttribute("data-instagram-feed-index", String(index + 1));
    });

    const requested = Number(new URLSearchParams(window.location.search).get("post"));
    if (!Number.isInteger(requested) || requested < 1) return;

    const targetImage = images[requested - 1];
    const target = targetImage?.closest("a, button, [role='button']") || targetImage;
    if (!target) return;

    window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.click();

      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("post");
      window.history.replaceState({}, "", cleanUrl);
    }, 250);
  }

  function installStyles() {
    document.getElementById("v151-home-styles")?.remove();

    const style = document.createElement("style");
    style.id = "v151-home-styles";
    style.textContent = `
      body.home-page .hero-content{padding-bottom:28px!important}
      body.home-page .hero-links{margin-top:14px!important;gap:8px!important}
      body.home-page .home-stack{margin-top:18px!important;gap:16px!important}

      .v15-preview-card{padding:22px;overflow:hidden}
      .v15-preview-header{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:15px}
      .v15-preview-header h2{margin:5px 0 0;font-size:1.2rem}
      .v15-preview-header>span{color:var(--muted,#81797f);font-size:.72rem;white-space:nowrap}
      .v15-preview-track{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(150px,30%);gap:12px;overflow-x:auto;overscroll-behavior-inline:contain;scroll-snap-type:x mandatory;padding:2px 2px 10px;scrollbar-width:thin}
      .v15-preview-item{position:relative;display:block;aspect-ratio:4/5;width:100%;padding:0;border:0;border-radius:15px;overflow:hidden;scroll-snap-align:start;background:#1b1518;box-shadow:0 12px 28px rgba(25,14,20,.16);cursor:pointer;text-align:inherit}
      .v15-preview-item img{width:100%;height:100%;object-fit:cover;transition:transform .25s ease,filter .25s ease}
      .v15-preview-item:hover img{transform:scale(1.035)}
      .v15-preview-item.is-blurred img{filter:blur(10px) brightness(.62);transform:scale(1.12)}
      .v15-preview-item.is-blurred span{position:absolute;inset:auto 10px 11px;z-index:2;padding:7px 8px;border:1px solid rgba(255,255,255,.28);border-radius:9px;color:#fff;background:rgba(15,9,12,.45);backdrop-filter:blur(8px);font-size:.68rem;font-weight:700;text-align:center}

      @media(max-width:620px){
        body.home-page .hero-content{padding-bottom:20px!important}
        body.home-page .home-stack{margin-top:12px!important;gap:13px!important}
        .v15-preview-card{padding:17px}
        .v15-preview-header{align-items:flex-start}
        .v15-preview-header>span{font-size:.64rem}
        .v15-preview-track{grid-auto-columns:72%;gap:10px}
      }
    `;
    document.head.appendChild(style);
  }

  function run() {
    installStyles();
    setupHomePage();
    syncInstagramPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();
