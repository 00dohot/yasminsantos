(() => {
  "use strict";

  const cfg = window.YASMIN_APP_CONFIG || {};
  const apiBase = String(cfg.apiBase || "https://yasmin-backend.novinhadize9.workers.dev").replace(/\/$/, "");
  const sessionKey = cfg.storageKeys?.adminSession || "yasmin_admin_session_v136";
  const slotPrefix = "editor_media_";
  let state = { configuracoes: {}, conteudos: [] };
  let posts = [];
  let currentPost = 0;
  let adminSession = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const normalizeSlot = value => String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "").slice(0, 58);

  function readAdminSession() {
    try {
      const value = JSON.parse(localStorage.getItem(sessionKey) || "null");
      return value?.token && Date.parse(value.expiresAt) > Date.now() ? value : null;
    } catch { return null; }
  }

  async function adminApi(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (adminSession?.token) headers.set("Authorization", `Bearer ${adminSession.token}`);
    if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
    const response = await fetch(`${apiBase}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.erro || `Falha HTTP ${response.status}.`);
    return data;
  }

  function mediaUrl(contentId) {
    const item = (state.conteudos || []).find(row => row.content_id === contentId);
    return item?.mediaUrl || `${apiBase}/api/media/public/${encodeURIComponent(contentId)}`;
  }

  function clearSlot(target) {
    if (!target) return;
    target.classList.add("yasmin-r2-empty");
    target.dataset.adminCurrentUrl = "";
    if (target.tagName === "IMG") {
      target.removeAttribute("src");
      const opener = target.closest("[data-open-instagram-image],[data-open-profile-image]");
      if (opener?.hasAttribute("data-open-instagram-image")) opener.dataset.openInstagramImage = "";
      if (opener?.hasAttribute("data-open-profile-image")) opener.dataset.openProfileImage = "";
    } else {
      target.style.backgroundImage = "none";
    }
    if (target.dataset.adminSlot === "home_cover") {
      document.body.style.setProperty("--yasmin-home-cover", "none");
    }
  }

  function applySlot(target, url) {
    if (!target || !url) return clearSlot(target);
    target.classList.remove("yasmin-r2-empty");
    target.dataset.adminCurrentUrl = url;
    const kind = target.dataset.adminKind || (target.tagName === "IMG" ? "image" : "background");
    if (kind === "background") {
      target.style.backgroundImage = `url("${String(url).replace(/"/g, "%22")}")`;
    } else if (target.tagName === "IMG") {
      target.src = url;
      const opener = target.closest("[data-open-instagram-image],[data-open-profile-image]");
      if (opener?.hasAttribute("data-open-instagram-image")) opener.dataset.openInstagramImage = url;
      if (opener?.hasAttribute("data-open-profile-image")) opener.dataset.openProfileImage = url;
    }
    if (target.dataset.adminSlot === "home_cover") {
      document.body.style.setProperty("--yasmin-home-cover", `url("${String(url).replace(/"/g, "%22")}")`);
    }
  }

  function applySlots() {
    $$("[data-admin-slot]").forEach(target => {
      if (target.dataset.adminIgnore === "true") return;
      const slot = normalizeSlot(target.dataset.adminSlot);
      const setting = state.configuracoes?.[`${slotPrefix}${slot}`];
      if (setting?.contentId) applySlot(target, mediaUrl(setting.contentId));
      else clearSlot(target);
    });
  }

  function actualInstagramPosts() {
    const normal = (state.conteudos || [])
      .filter(item => item.section === "instagram_posts" && String(item.mime_type || "").startsWith("image/"))
      .sort((a, b) => {
        const order = Number(a.sort_order || 0) - Number(b.sort_order || 0);
        return order || String(b.created_at || "").localeCompare(String(a.created_at || ""));
      });

    // Preserva fotos da versão anterior que já estavam salvas no R2 como slots.
    const used = new Set(normal.map(item => item.content_id));
    const legacy = [];
    for (let index = 1; index <= 24; index += 1) {
      const setting = state.configuracoes?.[`${slotPrefix}instagram_publicacao_${index}`];
      if (!setting?.contentId || used.has(setting.contentId)) continue;
      const item = (state.conteudos || []).find(row => row.content_id === setting.contentId);
      if (item) legacy.push({ ...item, section: "instagram_posts", caption: item.caption || "", legacy: true });
    }
    return [...normal, ...legacy];
  }

  function updateInstagramCounts(total) {
    $$("[data-instagram-post-count]").forEach(el => el.textContent = String(total));
    $$("[data-instagram-home-count]").forEach(el => el.textContent = `${total} publicações • 12,8 mil seguidores`);
  }

  function renderHomeInstagram() {
    const grid = $("#homeInstagramPosts");
    if (!grid) return;
    grid.replaceChildren();
    const visible = posts.slice(0, 6);
    visible.forEach((post, index) => {
      const link = document.createElement("a");
      link.href = "instagram/";
      const img = document.createElement("img");
      img.src = post.mediaUrl;
      img.alt = `Publicação ${index + 1}`;
      img.loading = "lazy";
      img.dataset.adminIgnore = "true";
      link.append(img);
      grid.append(link);
    });
    for (let index = visible.length; index < 6; index += 1) {
      const empty = document.createElement("span");
      empty.className = "ig-empty-post";
      empty.setAttribute("aria-hidden", "true");
      grid.append(empty);
    }
  }

  const postKey = id => `yasmin-post-${id}`;
  function readPostState(id) {
    try { return JSON.parse(localStorage.getItem(postKey(id)) || '{"liked":false,"saved":false,"likes":0,"comments":[]}'); }
    catch { return { liked:false, saved:false, likes:0, comments:[] }; }
  }
  function savePostState(id, data) { localStorage.setItem(postKey(id), JSON.stringify(data)); }

  function renderPostModal() {
    const post = posts[currentPost];
    if (!post) return;
    const img = $("#postImage");
    const comments = $("#postComments");
    const likeBtn = $("#likePost");
    const saveBtn = $("#savePost");
    const likeCount = $("#likeCount");
    if (!img || !comments || !likeBtn || !saveBtn || !likeCount) return;

    img.src = post.mediaUrl;
    const local = readPostState(post.content_id);
    likeBtn.classList.toggle("active", local.liked);
    likeBtn.textContent = local.liked ? "♥" : "♡";
    saveBtn.classList.toggle("active", local.saved);
    saveBtn.textContent = local.saved ? "◆" : "◇";
    likeCount.textContent = String(184 + currentPost * 13 + Number(local.likes || 0));
    comments.replaceChildren();

    const appendComment = (handle, text) => {
      const row = document.createElement("div");
      row.className = "comment-row";
      const strong = document.createElement("strong");
      strong.textContent = handle;
      row.append(strong, document.createTextNode(` ${String(text || "")}`));
      comments.append(row);
    };
    appendComment("@yasminsantos", post.caption || "Nova publicação");
    (local.comments || []).forEach(comment => appendComment(comment.handle, comment.text));
  }

  function openPost(index) {
    if (!posts.length) return;
    currentPost = Math.max(0, Math.min(index, posts.length - 1));
    renderPostModal();
    const modal = $("#postModal");
    modal?.classList.add("open");
    modal?.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closePost() {
    const modal = $("#postModal");
    modal?.classList.remove("open");
    modal?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function bindPostModalOnce() {
    const modal = $("#postModal");
    if (!modal || modal.dataset.r2Bound === "1") return;
    modal.dataset.r2Bound = "1";
    $$("[data-close-post]").forEach(el => el.addEventListener("click", closePost));
    $("#postPrev")?.addEventListener("click", () => {
      if (!posts.length) return;
      currentPost = (currentPost - 1 + posts.length) % posts.length;
      renderPostModal();
    });
    $("#postNext")?.addEventListener("click", () => {
      if (!posts.length) return;
      currentPost = (currentPost + 1) % posts.length;
      renderPostModal();
    });
    $("#likePost")?.addEventListener("click", () => {
      const post = posts[currentPost]; if (!post) return;
      const data = readPostState(post.content_id);
      data.liked = !data.liked;
      data.likes = Number(data.likes || 0) + (data.liked ? 1 : -1);
      savePostState(post.content_id, data); renderPostModal();
    });
    $("#savePost")?.addEventListener("click", () => {
      const post = posts[currentPost]; if (!post) return;
      const data = readPostState(post.content_id);
      data.saved = !data.saved;
      savePostState(post.content_id, data); renderPostModal();
    });
    $("#focusComment")?.addEventListener("click", () => $("#commentHandle")?.focus());
    $("#sharePost")?.addEventListener("click", async () => {
      try {
        if (navigator.share) await navigator.share({ title: document.title, url: location.href });
        else { await navigator.clipboard.writeText(location.href); alert("Link copiado."); }
      } catch {}
    });
    $("#postCommentForm")?.addEventListener("submit", event => {
      event.preventDefault();
      const post = posts[currentPost]; if (!post) return;
      let handle = String($("#commentHandle")?.value || "").trim();
      const text = String($("#commentText")?.value || "").trim();
      if (!handle.startsWith("@")) handle = `@${handle}`;
      const data = readPostState(post.content_id);
      data.comments = Array.isArray(data.comments) ? data.comments : [];
      data.comments.push({ handle, text });
      savePostState(post.content_id, data);
      event.currentTarget.reset();
      renderPostModal();
    });
  }

  function renderInstagramProfile() {
    const grid = $("#igPublications");
    if (!grid) return;
    bindPostModalOnce();
    grid.replaceChildren();

    posts.forEach((post, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.postIndex = String(index);
      const img = document.createElement("img");
      img.src = post.mediaUrl;
      img.alt = `Publicação ${index + 1}`;
      img.loading = "lazy";
      img.dataset.adminIgnore = "true";
      button.append(img);
      button.addEventListener("click", () => openPost(index));
      grid.append(button);
    });

    if (!posts.length) {
      const empty = document.createElement("div");
      empty.className = "ig-empty-profile";
      empty.textContent = "Nenhuma publicação ainda.";
      grid.append(empty);
    }
  }

  function bindPreviewPaywall() {
    $$("[data-preview-paywall]").forEach(slide => {
      if (slide.dataset.paywallBound === "1") return;
      slide.dataset.paywallBound = "1";
      slide.tabIndex = 0;
      slide.setAttribute("role", "button");
      slide.setAttribute("aria-label", "Ver planos para desbloquear o conteúdo");
      const open = () => document.querySelector("[data-payment-open-plans]")?.click();
      slide.addEventListener("click", open);
      slide.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); }
      });
    });
  }

  function bindPreviewArrows() {
    const carousel = $("[data-preview-carousel]");
    if (!carousel) return;
    const move = direction => carousel.scrollBy({ left: direction * carousel.clientWidth, behavior: "smooth" });
    $("[data-carousel-prev]")?.addEventListener("click", () => move(-1));
    $("[data-carousel-next]")?.addEventListener("click", () => move(1));
  }

  function ensureAdminPostModal() {
    if ($("#yasmin-instagram-publish-modal")) return;
    const modal = document.createElement("div");
    modal.id = "yasmin-instagram-publish-modal";
    modal.className = "ig-admin-publish-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="ig-admin-publish-bg" data-ig-admin-close></div>
      <section class="ig-admin-publish-card" role="dialog" aria-modal="true">
        <h2>Nova publicação</h2>
        <p>A imagem será salva no R2 e aparecerá no Instagram e no card da página inicial.</p>
        <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif" data-ig-admin-file>
        <textarea maxlength="2000" placeholder="Legenda (opcional)" data-ig-admin-caption></textarea>
        <div class="ig-admin-publish-message" data-ig-admin-message></div>
        <div class="ig-admin-publish-actions">
          <button type="button" data-ig-admin-close>Cancelar</button>
          <button type="button" class="primary" data-ig-admin-save>Publicar</button>
        </div>
      </section>`;
    document.body.append(modal);
    $$("[data-ig-admin-close]", modal).forEach(button => button.addEventListener("click", () => modal.hidden = true));
    $("[data-ig-admin-save]", modal)?.addEventListener("click", publishInstagramFromModal);
  }

  function openAdminPostModal() {
    ensureAdminPostModal();
    const modal = $("#yasmin-instagram-publish-modal");
    const file = $("[data-ig-admin-file]", modal);
    const caption = $("[data-ig-admin-caption]", modal);
    const message = $("[data-ig-admin-message]", modal);
    if (file) file.value = "";
    if (caption) caption.value = "";
    if (message) message.textContent = "";
    modal.hidden = false;
  }

  async function publishInstagramFromModal() {
    const modal = $("#yasmin-instagram-publish-modal");
    const file = $("[data-ig-admin-file]", modal)?.files?.[0];
    const caption = String($("[data-ig-admin-caption]", modal)?.value || "").trim();
    const message = $("[data-ig-admin-message]", modal);
    const button = $("[data-ig-admin-save]", modal);
    if (!file) { if (message) message.textContent = "Selecione uma imagem."; return; }
    button.disabled = true;
    button.textContent = "Enviando…";
    try {
      const payload = new FormData();
      payload.append("arquivo", file);
      const upload = await adminApi("/api/admin/upload", { method: "POST", body: payload });
      await adminApi("/api/admin/conteudos", {
        method: "POST",
        body: JSON.stringify({
          secao: "instagram_posts",
          visibilidade: "public",
          titulo: "Publicação Instagram",
          legenda: caption,
          ordem: 0,
          mediaKey: upload.mediaKey,
          publicado: true
        })
      });
      if (message) message.textContent = "Publicação adicionada.";
      await load();
      setTimeout(() => { modal.hidden = true; }, 450);
    } catch (error) {
      if (message) message.textContent = error.message;
    } finally {
      button.disabled = false;
      button.textContent = "Publicar";
    }
  }

  async function enableAdminInstagramButtons() {
    adminSession = readAdminSession();
    if (!adminSession) return;
    try { await adminApi("/api/admin/me"); } catch { adminSession = null; return; }
    $$("[data-instagram-admin-add]").forEach(button => {
      button.hidden = false;
      if (button.dataset.bound === "1") return;
      button.dataset.bound = "1";
      button.addEventListener("click", openAdminPostModal);
    });
  }

  function renderAll() {
    applySlots();
    posts = actualInstagramPosts().map(item => ({ ...item, mediaUrl: item.mediaUrl || mediaUrl(item.content_id) }));
    updateInstagramCounts(posts.length);
    renderHomeInstagram();
    renderInstagramProfile();
    bindPreviewPaywall();
  }

  async function load() {
    try {
      const response = await fetch(`${apiBase}/api/publico/conteudos`, {
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.ok) state = data;
    } catch (error) {
      console.warn("Mídias R2 indisponíveis", error);
    }
    renderAll();
    document.dispatchEvent(new CustomEvent("yasmin:r2-media-loaded", { detail: state }));
  }

  window.YasminR2Media = Object.freeze({ reload: load, state: () => state });

  document.addEventListener("DOMContentLoaded", async () => {
    bindPreviewArrows();
    await load();
    await enableAdminInstagramButtons();
  });
})();