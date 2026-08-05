(() => {
  "use strict";
  const config = window.YASMIN_APP_CONFIG;
  const key = config.storageKeys.adminSession;
  const $ = selector => document.querySelector(selector);
  const getSession = () => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "null");
      return data?.token && Date.parse(data.expiresAt) > Date.now() ? data : null;
    } catch { return null; }
  };
  const show = (text, error = false) => {
    const box = $("#admin-message");
    box.textContent = text;
    box.style.borderColor = error ? "#ef4444" : "#22c55e";
    box.classList.add("show");
  };
  const api = async (path, options = {}) => {
    const headers = new Headers(options.headers || {});
    if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
    if (getSession()?.token) headers.set("Authorization", `Bearer ${getSession().token}`);
    const response = await fetch(`${config.apiBase}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.erro || "Falha na operação.");
    return data;
  };

  async function login(event) {
    event.preventDefault();
    try {
      const data = await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email: $("#admin-email").value, senha: $("#admin-password").value })
      });
      localStorage.setItem(key, JSON.stringify(data.sessao));
      renderLoggedIn();
    } catch (error) { show(error.message, true); }
  }

  async function renderLoggedIn() {
    if (!getSession()) return;
    $("#admin-login-card").classList.add("portal-hidden");
    $("#admin-dashboard").classList.remove("portal-hidden");
    await Promise.all([loadContent(), loadUsers()]);
  }

  async function publish(event) {
    event.preventDefault();
    const file = $("#content-file").files[0];
    if (!file) return show("Escolha uma foto ou vídeo.", true);
    const button = $("#publish-button");
    button.disabled = true;
    try {
      const form = new FormData();
      form.append("arquivo", file);
      const upload = await api("/api/admin/upload", { method: "POST", body: form });
      await api("/api/admin/conteudos", {
        method: "POST",
        body: JSON.stringify({
          secao: $("#content-section").value,
          titulo: $("#content-title").value,
          legenda: $("#content-caption").value,
          visibilidade: $("#content-visibility").value,
          ordem: Number($("#content-order").value || 0),
          publicado: true,
          mediaKey: upload.mediaKey,
          mimeType: upload.mimeType
        })
      });
      event.target.reset();
      show("Conteúdo publicado.");
      await loadContent();
    } catch (error) { show(error.message, true); }
    finally { button.disabled = false; }
  }

  async function loadContent() {
    const data = await api("/api/admin/conteudos");
    const tbody = $("#content-table-body");
    tbody.innerHTML = "";
    for (const item of data.conteudos) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(item.title || "Sem título")}</td>
        <td>${escapeHtml(item.section)}</td>
        <td><span class="portal-pill">${escapeHtml(item.visibility)}</span></td>
        <td>${item.published ? "Sim" : "Não"}</td>
        <td><button class="portal-button danger" data-delete="${item.content_id}">Excluir</button></td>`;
      tbody.append(row);
    }
    tbody.querySelectorAll("[data-delete]").forEach(button => button.addEventListener("click", async () => {
      if (!confirm("Excluir este conteúdo e o arquivo?")) return;
      try {
        await api(`/api/admin/conteudos/${encodeURIComponent(button.dataset.delete)}`, { method: "DELETE" });
        await loadContent();
      } catch (error) { show(error.message, true); }
    }));
  }

  async function loadUsers() {
    const data = await api("/api/admin/usuarios");
    const tbody = $("#users-table-body");
    tbody.innerHTML = "";
    for (const user of data.usuarios) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(user.nome)}<br><small>${escapeHtml(user.email)}</small></td>
        <td>${escapeHtml(user.cpf)}<br>${escapeHtml(user.telefone)}</td>
        <td>${escapeHtml(user.produto || "-")} / ${escapeHtml(user.plano || "-")}</td>
        <td>${user.expiraEm ? new Date(user.expiraEm).toLocaleString("pt-BR") : "Sem expiração"}</td>
        <td><button class="portal-button secondary" data-reset="${user.userId}">Redefinir senha</button></td>`;
      tbody.append(row);
    }
    tbody.querySelectorAll("[data-reset]").forEach(button => button.addEventListener("click", async () => {
      const novaSenha = prompt("Digite uma senha temporária forte. O usuário será obrigado a trocá-la:");
      if (!novaSenha) return;
      try {
        await api(`/api/admin/usuarios/${encodeURIComponent(button.dataset.reset)}/redefinir-senha`, {
          method: "POST",
          body: JSON.stringify({ novaSenha })
        });
        show("Senha temporária definida. A senha antiga não é exibida nem recuperada.");
      } catch (error) { show(error.message, true); }
    }));
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[char]));
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("#admin-login-form").addEventListener("submit", login);
    $("#content-form").addEventListener("submit", publish);
    $("#admin-logout").addEventListener("click", () => { localStorage.removeItem(key); location.reload(); });
    renderLoggedIn().catch(error => show(error.message, true));
  });
})();
