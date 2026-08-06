(() => {
  "use strict";
  const config = window.YASMIN_APP_CONFIG;
  if (!config) throw new Error("app-config-v13.6.js não foi carregado.");
  const key = config.storageKeys.subscriberSession;
  const $ = selector => document.querySelector(selector);
  const message = (text, isError = false) => {
    const box = $("#portal-message");
    if (!box) return;
    box.textContent = text;
    box.style.borderColor = isError ? "#ef4444" : "#22c55e";
    box.classList.add("show");
  };
  const session = () => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "null");
      if (!data?.token || Date.parse(data.expiresAt) <= Date.now()) return null;
      return data;
    } catch { return null; }
  };
  const saveSession = data => localStorage.setItem(key, JSON.stringify(data));
  const clearSession = () => localStorage.removeItem(key);
  const api = async (path, options = {}) => {
    const current = session();
    const headers = new Headers(options.headers || {});
    if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
    if (current?.token) headers.set("Authorization", `Bearer ${current.token}`);
    const response = await fetch(`${config.apiBase}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.erro || "Não foi possível concluir.");
    return data;
  };

  async function login(event) {
    event.preventDefault();
    const button = $("#login-submit");
    button.disabled = true;
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identificador: $("#login-identifier").value,
          senha: $("#login-password").value
        })
      });
      saveSession(data.sessao);
      location.href = `${config.siteBase.replace(/\/$/, "")}/area-assinante/`;
    } catch (error) {
      message(error.message, true);
    } finally { button.disabled = false; }
  }

  async function loadAccount() {
    const current = session();
    if (!current) {
      location.href = `${config.siteBase.replace(/\/$/, "")}/login/`;
      return;
    }
    try {
      const data = await api("/api/conta/me");
      $("#member-name").textContent = data.usuario.nome;
      const subscriptions = Array.isArray(data.assinaturas) && data.assinaturas.length
        ? data.assinaturas
        : [data.assinatura];
      const siteAccess = subscriptions.find(item => item.produto === "site");
      const privacyAccess = subscriptions.find(item => item.produto === "privacy");
      const main = siteAccess || privacyAccess || data.assinatura;
      $("#member-plan").textContent = subscriptions.map(item => `${item.produto} — ${item.plano}`).join(" + ");
      $("#member-expiration").textContent = main.vitalicio
        ? "Sem expiração"
        : new Date(main.expiraEm).toLocaleString("pt-BR");
      $("#member-email").textContent = data.usuario.email;
      const telegramButton = $("#telegram-button");
      if (telegramButton) telegramButton.hidden = !privacyAccess;
      const contentSection = $("#site-content-section");
      if (contentSection) contentSection.hidden = !siteAccess;
      if (siteAccess) await loadContent();
    } catch (error) {
      clearSession();
      message(error.message, true);
      setTimeout(() => location.href = `${config.siteBase.replace(/\/$/, "")}/login/`, 1200);
    }
  }

  async function loadContent() {
    const data = await api("/api/assinante/conteudos");
    const grid = $("#member-content");
    grid.innerHTML = "";
    for (const item of data.conteudos) {
      const card = document.createElement("article");
      card.className = "portal-post";
      const mediaResponse = await fetch(item.mediaUrl, {
        headers: { "Authorization": `Bearer ${session().token}` }
      });
      if (!mediaResponse.ok) continue;
      const blobUrl = URL.createObjectURL(await mediaResponse.blob());
      const media = item.mime_type.startsWith("video/")
        ? Object.assign(document.createElement("video"), { src: blobUrl, controls: true, playsInline: true })
        : Object.assign(document.createElement("img"), { src: blobUrl, alt: item.title || "Conteúdo exclusivo", loading: "lazy" });
      const body = document.createElement("div");
      body.className = "portal-post-body";
      const title = document.createElement("h3");
      title.textContent = item.title || "Conteúdo exclusivo";
      const caption = document.createElement("p");
      caption.textContent = item.caption || "";
      body.append(title, caption);
      card.append(media, body);
      grid.append(card);
    }
    if (!grid.children.length) grid.innerHTML = '<div class="portal-card portal-note">Ainda não há conteúdos publicados.</div>';
  }

  async function openTelegram() {
    try {
      const data = await api("/api/conta/telegram");
      location.href = data.telegramUrl;
    } catch (error) { message(error.message, true); }
  }

  async function logout() {
    try { await api("/api/auth/logout", { method: "POST" }); } catch {}
    clearSession();
    location.href = `${config.siteBase.replace(/\/$/, "")}/login/`;
  }

  async function changePassword(event) {
    event.preventDefault();
    try {
      await api("/api/conta/trocar-senha", {
        method: "POST",
        body: JSON.stringify({
          senhaAtual: $("#current-password").value,
          novaSenha: $("#new-password").value
        })
      });
      event.target.reset();
      message("Senha alterada com sucesso.");
    } catch (error) { message(error.message, true); }
  }

  window.YasminSubscriber = { session, saveSession, clearSession, api };
  document.addEventListener("DOMContentLoaded", () => {
    $("#login-form")?.addEventListener("submit", login);
    $("#logout-button")?.addEventListener("click", logout);
    $("#telegram-button")?.addEventListener("click", openTelegram);
    $("#change-password-form")?.addEventListener("submit", changePassword);
    if (document.body.dataset.page === "member") loadAccount();
  });
})();
