
(() => {
  const cfg = window.SITE_CONFIG || {};
  document.querySelectorAll("[data-link]").forEach(el => {
    const url = cfg.links?.[el.dataset.link];
    if (url) el.href = url;
  });
  document.querySelectorAll("[data-brand]").forEach(el => {
    const value = cfg.brand?.[el.dataset.brand];
    if (value) el.textContent = value;
  });
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

  const drawer = document.getElementById("drawer");
  const tab = document.getElementById("menuTab");
  const closeBtn = document.getElementById("drawerClose");
  const overlay = document.getElementById("drawerOverlay");
  const pin = document.getElementById("drawerPin");

  if (drawer && tab && overlay && pin) {
    let pinned = localStorage.getItem("yasmin-menu-pinned") === "true";
    let timer;

    const syncPin = () => {
      pin.setAttribute("aria-pressed", String(pinned));
      pin.querySelector(".pin-label").textContent = pinned ? "Desafixar" : "Fixar aberto";
    };
    const open = () => {
      clearTimeout(timer);
      drawer.classList.add("open");
      overlay.classList.add("show");
      drawer.setAttribute("aria-hidden","false");
      tab.setAttribute("aria-expanded","true");
      if (!pinned) timer = setTimeout(close, 4200);
    };
    const close = () => {
      if (pinned) return;
      clearTimeout(timer);
      drawer.classList.remove("open");
      overlay.classList.remove("show");
      drawer.setAttribute("aria-hidden","true");
      tab.setAttribute("aria-expanded","false");
    };

    syncPin();
    if (pinned) open();

    tab.addEventListener("click", () => drawer.classList.contains("open") ? close() : open());
    closeBtn?.addEventListener("click", () => { pinned = false; localStorage.setItem("yasmin-menu-pinned","false"); syncPin(); close(); });
    overlay.addEventListener("click", close);
    pin.addEventListener("click", () => {
      pinned = !pinned;
      localStorage.setItem("yasmin-menu-pinned", String(pinned));
      syncPin();
      if (pinned) open(); else close();
    });
    window.addEventListener("scroll", close, {passive:true});
  }

  // V17.7: publicações do Instagram vêm exclusivamente do R2/D1.

  const storyModal = document.getElementById("storyModal");
  if (storyModal) {
    let storyTimer;
    document.querySelectorAll("[data-story]").forEach(btn=>btn.addEventListener("click",()=>{
      document.getElementById("storyTitle").textContent=btn.dataset.story;
      storyModal.classList.add("open");
      storyModal.setAttribute("aria-hidden","false");
      clearTimeout(storyTimer); storyTimer=setTimeout(()=>storyModal.classList.remove("open"),5000);
    }));
    document.querySelectorAll("[data-close-story]").forEach(x=>x.addEventListener("click",()=>{clearTimeout(storyTimer);storyModal.classList.remove("open")}));
  }
})();

(() => {const modal=document.getElementById("instagramImageModal");const preview=document.getElementById("instagramImagePreview");if(!modal||!preview)return;const open=src=>{preview.src=src;modal.classList.add("open");modal.setAttribute("aria-hidden","false");document.body.style.overflow="hidden"};const close=()=>{modal.classList.remove("open");modal.setAttribute("aria-hidden","true");preview.src="";document.body.style.overflow=""};document.querySelectorAll("[data-open-instagram-image]").forEach(b=>b.addEventListener("click",()=>open(b.dataset.openInstagramImage)));modal.querySelectorAll("[data-close-instagram-image]").forEach(e=>e.addEventListener("click",close));})();


// Direct interno com ponto de integração para API de IA.
(() => {
  const panel = document.getElementById("directPanel");
  const messages = document.getElementById("directMessages");
  const form = document.getElementById("directForm");
  const input = document.getElementById("directInput");
  if (!panel || !messages || !form || !input) return;

  const cfg = window.SITE_CONFIG?.aiChat || {};
  const storageKey = "yasmin-instagram-direct-v11";

  function readConversation() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (saved.length) return saved;
    } catch {}
    return [{
      role: "model",
      text: cfg.welcomeMessage || "Oi, vi que você chegou por aqui 😊 Quer conhecer meu conteúdo exclusivo?"
    }];
  }

  function saveConversation(items) {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  let conversation = readConversation();

  function renderConversation() {
    messages.innerHTML = conversation.map(item =>
      `<div class="ig-message ${item.role}">${escapeHtml(item.text)}</div>`
    ).join("");
    messages.scrollTop = messages.scrollHeight;
  }

  function openDirect() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden","false");
    document.body.style.overflow = "hidden";
    renderConversation();
    setTimeout(() => input.focus(), 250);
  }

  function closeDirect() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden","true");
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-open-direct]").forEach(button => {
    button.addEventListener("click", openDirect);
  });
  panel.querySelectorAll("[data-close-direct]").forEach(element => {
    element.addEventListener("click", closeDirect);
  });

  async function requestAI(userText) {
    if (!cfg.enabled || !cfg.endpoint) {
      return cfg.fallbackReply ||
        "Adorei sua mensagem. Meu atendimento inteligente ainda está sendo configurado.";
    }

    const response = await fetch(cfg.endpoint, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        message: userText,
        history: conversation,
        profile: "@yasminsantos"
      })
    });

    if (!response.ok) throw new Error("Falha ao consultar a API.");
    const data = await response.json();
    return data.reply || data.message || cfg.fallbackReply;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    conversation.push({role:"user",text});
    saveConversation(conversation);
    input.value = "";
    renderConversation();

    const typing = document.createElement("div");
    typing.className = "ig-typing";
    typing.textContent = "Yasmin está digitando...";
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    try {
      const reply = await requestAI(text);
      typing.remove();
      conversation.push({role:"model",text:reply});
      saveConversation(conversation);
      renderConversation();
    } catch {
      typing.remove();
      conversation.push({
        role:"model",
        text: cfg.fallbackReply || "Não consegui responder agora. Tente novamente em instantes."
      });
      saveConversation(conversation);
      renderConversation();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && panel.classList.contains("open")) closeDirect();
  });
})();

// Imagem ampliada do perfil do Instagram.
(() => {
  const modal = document.getElementById("instagramImageModal");
  const preview = document.getElementById("instagramImagePreview");
  if (!modal || !preview) return;

  function open(src) {
    preview.src = src;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
    document.body.style.overflow = "hidden";
  }

  function close() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden","true");
    preview.src = "";
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-open-instagram-image]").forEach(button => {
    button.addEventListener("click", () => open(button.dataset.openInstagramImage));
  });

  modal.querySelectorAll("[data-close-instagram-image]").forEach(element => {
    element.addEventListener("click", close);
  });
})();



// ============================================================
// V12 CORRIGIDA — TELEGRAM SUBSTITUI O CONTEÚDO
// ============================================================
(() => {
  const body = document.body;
  const normalContent = document.getElementById("homeDefaultContent");
  const telegramPanel = document.getElementById("homeTelegramPanel");
  if (!body.classList.contains("home-page") || !normalContent || !telegramPanel) return;

  function openTelegram() {
    body.classList.add("telegram-mode");
    normalContent.hidden = true;
    normalContent.setAttribute("aria-hidden", "true");
    telegramPanel.hidden = false;
    telegramPanel.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      telegramPanel.scrollIntoView({behavior:"smooth", block:"start"});
    });
  }

  function closeTelegram() {
    body.classList.remove("telegram-mode");
    telegramPanel.hidden = true;
    telegramPanel.setAttribute("aria-hidden", "true");
    normalContent.hidden = false;
    normalContent.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      normalContent.scrollIntoView({behavior:"smooth", block:"start"});
    });
  }

  document.querySelectorAll("[data-open-home-telegram]").forEach(button => {
    button.addEventListener("click", openTelegram);
  });

  document.querySelectorAll("[data-close-home-telegram]").forEach(button => {
    button.addEventListener("click", closeTelegram);
  });
})();

// ============================================================
// V12 CORRIGIDA — INSTAGRAM COM TELAS INDEPENDENTES
// ============================================================
(() => {
  const body = document.body;
  const profileView = document.getElementById("igProfileView");
  const reelsView = document.getElementById("igReelsView");
  const searchView = document.getElementById("igSearchView");
  const reelsGrid = document.getElementById("igReelsGrid");
  const suggestions = document.getElementById("igSuggestions");
  const searchInput = document.getElementById("igSearchInput");

  if (!body.classList.contains("instagram-reference") ||
      !profileView || !reelsView || !searchView ||
      !reelsGrid || !suggestions || !searchInput) return;

  const cfg = window.SITE_CONFIG || {};
  const profiles = Array.isArray(cfg.instagramSuggestions) ? cfg.instagramSuggestions : [];
  const reels = Array.isArray(cfg.instagramReels) ? cfg.instagramReels.slice(0, 3) : [];

  function renderReels() {
    reelsGrid.innerHTML = reels.map((item, index) => `
      <button class="ig-reel-card" type="button" data-reel-index="${index}">
        ${item.thumbnail ? `<img src="${item.thumbnail}" alt="${item.title}">` : `<span class="ig-empty-thumbnail" aria-hidden="true"></span>`}
        <span>${item.title}</span>
      </button>
    `).join("");
  }

  function renderSuggestions(query = "") {
    const term = query.trim().toLowerCase();
    const filtered = profiles.filter(profile =>
      `${profile.name} ${profile.handle}`.toLowerCase().includes(term)
    );

    suggestions.innerHTML = filtered.map(profile => `
      <article class="ig-suggestion-card">
        <img src="${profile.image}" alt="">
        <div>
          <strong>${profile.handle}</strong>
          <small>${profile.name}</small>
        </div>
        <a href="${profile.url}" target="_blank" rel="noopener">Ver perfil</a>
      </article>
    `).join("");
  }

  function showView(view) {
    body.classList.remove("is-posts-view", "is-search-view", "is-reels-view");
    body.classList.add(`is-${view}-view`);

    profileView.hidden = view !== "posts";
    profileView.setAttribute("aria-hidden", String(view !== "posts"));

    reelsView.hidden = view !== "reels";
    reelsView.setAttribute("aria-hidden", String(view !== "reels"));

    searchView.hidden = view !== "search";
    searchView.setAttribute("aria-hidden", String(view !== "search"));

    document.querySelectorAll("[data-instagram-view]").forEach(button => {
      button.classList.toggle("active", button.dataset.instagramView === view);
    });

    window.scrollTo({top:0, behavior:"smooth"});
    if (view === "search") setTimeout(() => searchInput.focus(), 180);
  }

  document.querySelectorAll("[data-instagram-view]").forEach(button => {
    button.addEventListener("click", () => showView(button.dataset.instagramView));
  });

  searchInput.addEventListener("input", () => renderSuggestions(searchInput.value));

  renderReels();
  renderSuggestions();
  showView("posts");
})();
