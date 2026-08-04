window.SITE_CONFIG = {
  siteVersion: "V15",

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
    createEndpoint: "https://yasmin-backend.novinhadize9.workers.dev/api/criar-pagamento?v=15",
    workerStatusEndpoint: "https://yasmin-backend.novinhadize9.workers.dev/api/status?v=15",
    contractVersion: "15",
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
   V15 — AJUSTES DA PÁGINA INICIAL
   - Sem menu separado de prévias
   - Card de prévias abaixo de Conteúdos exclusivos
   - Instagram como último card
   - Cinco fotos roláveis; 2ª e 4ª desfocadas
   - Espaçamento superior reduzido
   ===================================================== */
(() => {
  "use strict";

  const run = () => {
    if (!document.body.classList.contains("home-page")) return;

    const stack = document.getElementById("homeDefaultContent") || document.querySelector(".home-stack");
    const exclusiveCard = stack?.querySelector(".exclusive-card");
    const instagramCard = stack?.querySelector(".instagram-card");
    const rouletteCard = stack?.querySelector(".roulette-cta");

    /* Remove qualquer link ou botão de prévias dos menus. */
    document.querySelectorAll('a[href*="previas"], [data-link="previewsReal"], .telegram-preview-card').forEach((element) => {
      const card = element.closest(".telegram-preview-card") || element;
      card.remove();
    });

    /* Ordem pedida no menu lateral: Privacy, Telegram, Roleta e Instagram. */
    const drawerNav = document.querySelector(".drawer-nav");
    if (drawerNav) {
      const home = drawerNav.querySelector('a[href="./"]');
      const privacy = drawerNav.querySelector('a[href*="privacy"]');
      const telegram = drawerNav.querySelector('[data-open-home-telegram], a[href*="telegram"]');
      const roulette = drawerNav.querySelector('a[href*="roleta"]');
      const instagram = drawerNav.querySelector('a[href*="instagram"]');
      [home, privacy, telegram, roulette, instagram].filter(Boolean).forEach((item) => drawerNav.appendChild(item));
    }

    /* Ordem pedida nos atalhos do topo. */
    const heroLinks = document.querySelector(".hero-links");
    if (heroLinks) {
      const privacy = heroLinks.querySelector('a[href*="privacy"]');
      const telegram = heroLinks.querySelector('[data-open-home-telegram], a[href*="telegram"]');
      const roulette = heroLinks.querySelector('a[href*="roleta"]');
      const instagram = heroLinks.querySelector('a[href*="instagram"]');
      [privacy, telegram, roulette, instagram].filter(Boolean).forEach((item) => heroLinks.appendChild(item));
    }

    /* Cria o segundo card da página, abaixo de Conteúdos exclusivos. */
    if (stack && exclusiveCard && !document.querySelector(".v15-preview-card")) {
      const previewCard = document.createElement("article");
      previewCard.className = "glass-card v15-preview-card";
      previewCard.innerHTML = `
        <header class="v15-preview-header">
          <div>
            <span class="section-kicker">PRÉVIAS</span>
            <h2>Um pouco do que te espera</h2>
          </div>
          <span>Arraste para o lado</span>
        </header>
        <div class="v15-preview-track" aria-label="Carrossel de prévias">
          ${[1,2,3,4,5].map((number) => `
            <a href="instagram/" class="v15-preview-item ${number === 2 || number === 4 ? "is-blurred" : ""}" aria-label="Abrir prévia ${number} no Instagram">
              <img src="assets/images/modelo-piscina.png" alt="Prévia ${number}" loading="lazy">
              ${number === 2 || number === 4 ? '<span>Conteúdo exclusivo</span>' : ''}
            </a>
          `).join("")}
        </div>
      `;
      exclusiveCard.insertAdjacentElement("afterend", previewCard);
    }

    /* Instagram fica por último, abaixo da Roleta. */
    if (stack && instagramCard) {
      stack.appendChild(instagramCard);
    }

    /* Cada foto do card do Instagram abre a página do Instagram. */
    instagramCard?.querySelectorAll(".ig-grid-six a").forEach((link) => {
      link.href = "instagram/";
      link.removeAttribute("target");
      link.setAttribute("aria-label", "Abrir publicação no Instagram");
    });

    const style = document.createElement("style");
    style.id = "v15-home-styles";
    style.textContent = `
      body.home-page .hero-content{padding-bottom:28px!important}
      body.home-page .hero-links{margin-top:14px!important;gap:8px!important}
      body.home-page .home-stack{margin-top:18px!important;gap:16px!important}

      .v15-preview-card{padding:22px;overflow:hidden}
      .v15-preview-header{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:15px}
      .v15-preview-header h2{margin:5px 0 0;font-size:1.2rem}
      .v15-preview-header>span{color:var(--muted,#81797f);font-size:.72rem;white-space:nowrap}
      .v15-preview-track{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(150px,30%);gap:12px;overflow-x:auto;overscroll-behavior-inline:contain;scroll-snap-type:x mandatory;padding:2px 2px 10px;scrollbar-width:thin}
      .v15-preview-item{position:relative;display:block;aspect-ratio:4/5;border-radius:15px;overflow:hidden;scroll-snap-align:start;background:#1b1518;box-shadow:0 12px 28px rgba(25,14,20,.16)}
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

    document.getElementById("v15-home-styles")?.remove();
    document.head.appendChild(style);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();
