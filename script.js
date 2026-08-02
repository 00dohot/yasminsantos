
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

  const pubs = document.getElementById("igPublications");
  if (pubs) {
    const captions = ["Noite perfeita ✨","Bastidores","Só para quem sabe","Hoje","Nova prévia","Exclusivo","Fim de tarde","Meu olhar favorito","Obrigada pelo carinho","Mais uma","Segredo","Última do dia"];
    pubs.innerHTML = captions.map((c,i)=>`<button data-post-index="${i}" data-caption="${c}"><img src="../assets/images/modelo-piscina.png" alt="Publicação ${i+1}"></button>`).join("");

    const postModal = document.getElementById("postModal");
    const img = document.getElementById("postImage");
    const comments = document.getElementById("postComments");
    const likeBtn = document.getElementById("likePost");
    const saveBtn = document.getElementById("savePost");
    const likeCount = document.getElementById("likeCount");
    let current = 0;

    const postKey = i => `yasmin-post-${i}`;
    const readPost = i => {
      try { return JSON.parse(localStorage.getItem(postKey(i)) || '{"liked":false,"saved":false,"likes":0,"comments":[]}'); }
      catch { return {liked:false,saved:false,likes:0,comments:[]}; }
    };
    const savePost = (i,d) => localStorage.setItem(postKey(i), JSON.stringify(d));
    const renderPost = () => {
      const d = readPost(current);
      img.src = "../assets/images/modelo-piscina.png";
      likeBtn.classList.toggle("active", d.liked);
      likeBtn.textContent = d.liked ? "♥" : "♡";
      saveBtn.classList.toggle("active", d.saved);
      saveBtn.textContent = d.saved ? "◆" : "◇";
      likeCount.textContent = 184 + current * 13 + d.likes;
      comments.innerHTML = `<div class="comment-row"><strong>@yasminsantos</strong> ${captions[current]}</div>` +
        d.comments.map(c=>`<div class="comment-row"><strong>${c.handle}</strong> ${c.text}</div>`).join("");
    };
    const openPost = i => {
      current=i; renderPost(); postModal.classList.add("open"); postModal.setAttribute("aria-hidden","false"); document.body.style.overflow="hidden";
    };
    const closePost = () => { postModal.classList.remove("open"); postModal.setAttribute("aria-hidden","true"); document.body.style.overflow=""; };
    pubs.querySelectorAll("[data-post-index]").forEach(b=>b.addEventListener("click",()=>openPost(Number(b.dataset.postIndex))));
    document.querySelectorAll("[data-close-post]").forEach(x=>x.addEventListener("click",closePost));
    document.getElementById("postPrev").addEventListener("click",()=>{current=(current+11)%12;renderPost()});
    document.getElementById("postNext").addEventListener("click",()=>{current=(current+1)%12;renderPost()});
    likeBtn.addEventListener("click",()=>{const d=readPost(current);d.liked=!d.liked;d.likes+=d.liked?1:-1;savePost(current,d);renderPost()});
    saveBtn.addEventListener("click",()=>{const d=readPost(current);d.saved=!d.saved;savePost(current,d);renderPost()});
    document.getElementById("focusComment").addEventListener("click",()=>document.getElementById("commentHandle").focus());
    document.getElementById("sharePost").addEventListener("click",async()=>{try{if(navigator.share)await navigator.share({title:document.title,url:location.href});else{await navigator.clipboard.writeText(location.href);alert("Link copiado.")}}catch{}});
    document.getElementById("postCommentForm").addEventListener("submit",e=>{e.preventDefault();let h=document.getElementById("commentHandle").value.trim();const t=document.getElementById("commentText").value.trim();if(!h.startsWith("@"))h="@"+h;const d=readPost(current);d.comments.push({handle:h,text:t});savePost(current,d);e.target.reset();renderPost()});
  }

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
// HOME — TELAS INTERNAS DE PLANOS E TELEGRAM
// ============================================================
(() => {
  const body = document.body;
  const normalContent = document.getElementById("homeDefaultContent");
  const plansPanel = document.getElementById("sitePlansPanel");
  const telegramPanel = document.getElementById("homeTelegramPanel");

  if (!body.classList.contains("home-page") || !normalContent || !plansPanel || !telegramPanel) return;

  const panels = {
    home: normalContent,
    planos: plansPanel,
    telegram: telegramPanel
  };

  function closeDrawer() {
    document.getElementById("drawer")?.classList.remove("open");
    document.getElementById("drawerOverlay")?.classList.remove("show");
    document.getElementById("drawer")?.setAttribute("aria-hidden", "true");
    document.getElementById("menuTab")?.setAttribute("aria-expanded", "false");
  }

  function showView(view, options = {}) {
    const nextView = panels[view] ? view : "home";

    Object.entries(panels).forEach(([name, panel]) => {
      const visible = name === nextView;
      panel.hidden = !visible;
      panel.setAttribute("aria-hidden", String(!visible));
    });

    body.classList.toggle("site-plans-mode", nextView === "planos");
    body.classList.toggle("telegram-mode", nextView === "telegram");
    closeDrawer();

    if (options.updateHistory !== false) {
      const nextHash = nextView === "home" ? location.pathname : `#${nextView}`;
      history.pushState({homeView: nextView}, "", nextHash);
    }

    const target = panels[nextView];
    if (options.scroll !== false) {
      requestAnimationFrame(() => target.scrollIntoView({behavior:"smooth", block:"start"}));
    }
  }

  document.querySelectorAll("[data-open-site-plans]").forEach(button => {
    button.addEventListener("click", () => showView("planos"));
  });

  document.querySelectorAll("[data-open-home-telegram]").forEach(button => {
    button.addEventListener("click", () => showView("telegram"));
  });

  document.querySelectorAll("[data-close-home-panel]").forEach(button => {
    button.addEventListener("click", () => showView("home"));
  });

  window.addEventListener("popstate", () => {
    const requested = location.hash.replace("#", "");
    showView(requested === "planos" || requested === "telegram" ? requested : "home", {
      updateHistory: false
    });
  });

  const initial = location.hash.replace("#", "");
  showView(initial === "planos" || initial === "telegram" ? initial : "home", {
    updateHistory: false,
    scroll: false
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
        <img src="${item.thumbnail}" alt="${item.title}">
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
