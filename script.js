
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
