(() => {
  "use strict";
  const cfg = window.YASMIN_APP_CONFIG || {};
  const apiBase = String(cfg.apiBase || "https://yasmin-backend.novinhadize9.workers.dev").replace(/\/$/, "");
  const sessionKey = cfg.storageKeys?.adminSession || "yasmin_admin_session_v136";
  let session = null;
  let leads = [];
  let subscriptions = [];
  let contents = [];
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const money = cents => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents || 0) / 100);
  const date = value => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
  const dateOnly = value => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value)) : "Vitalício";
  const readSession = () => { try { const s = JSON.parse(localStorage.getItem(sessionKey) || "null"); return s?.token && Date.parse(s.expiresAt) > Date.now() ? s : null; } catch { return null; } };
  const saveSession = value => localStorage.setItem(sessionKey, JSON.stringify(value));
  const clearSession = () => localStorage.removeItem(sessionKey);
  const completed = status => ["completed","paid","approved","confirmed"].includes(String(status || "").toLowerCase());

  function notice(text, error = false, selector = "#admin-dashboard-message") {
    const el = $(selector); if (!el) return;
    el.textContent = text; el.hidden = !text; el.classList.toggle("error", error);
  }

  async function api(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);
    if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
    const response = await fetch(`${apiBase}${path}`, { ...options, headers, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && path !== "/api/admin/login") {
      clearSession(); session = null; renderAuth();
    }
    if (!response.ok) throw new Error(data.erro || `Falha HTTP ${response.status}.`);
    return data;
  }

  function renderAuth() {
    const logged = Boolean(session);
    $("#admin-login-panel").hidden = logged;
    $("#admin-dashboard").hidden = !logged;
  }

  async function login(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("button[type=submit]");
    button.disabled = true; button.textContent = "Entrando…";
    try {
      const data = await api("/api/admin/login", { method: "POST", body: JSON.stringify({ email: form.elements.email.value, senha: form.elements.senha.value }) });
      session = data.sessao; saveSession(session); renderAuth(); await loadAll();
    } catch (error) { notice(error.message, true, "#admin-message"); }
    finally { button.disabled = false; button.textContent = "Entrar"; }
  }

  function openTab(name) {
    $$("[data-tab]").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === name));
    $$("[data-panel]").forEach(panel => panel.classList.toggle("active", panel.dataset.panel === name));
  }

  function summaryCards(summary) {
    const cards = [
      ["Leads", summary.leads, "Formulários com Pix gerado"],
      ["Pagamentos aprovados", summary.pagamentosAprovados, `${summary.conversaoPercentual}% de conversão`],
      ["Faturamento", money(summary.faturamentoCentavos), "Somente pagamentos aprovados"],
      ["Pix pendentes", summary.pagamentosPendentes, "Aguardando confirmação"],
      ["Contas criadas", summary.contasCriadas, "Usuários cadastrados"],
      ["Assinaturas ativas", summary.assinaturasAtivas, "Com acesso válido"],
      ["Vencendo em 7 dias", summary.vencendoEmSeteDias, "Atenção para renovação"],
      ["Pix gerados", summary.pixGerados, "Total de cobranças"],
    ];
    $("#summary-cards").innerHTML = cards.map(([label, value, hint]) => `<article class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(hint)}</small></article>`).join("");
  }

  function statusBadge(status) {
    const raw = String(status || "pending").toLowerCase();
    if (completed(raw)) return '<span class="badge paid">Pago</span>';
    if (["pending","created","waiting"].includes(raw)) return '<span class="badge pending">Pendente</span>';
    return `<span class="badge failed">${escapeHtml(raw || "Falhou")}</span>`;
  }

  function subscriptionState(item) {
    if (item.statusAssinatura === "suspended" || item.status === "suspended") return "suspended";
    if (!item.ativo) return "expired";
    return "active";
  }

  function subscriptionBadge(item) {
    const state = subscriptionState(item);
    return `<span class="badge ${state}">${state === "active" ? "Ativa" : state === "suspended" ? "Suspensa" : "Expirada"}</span>`;
  }

  function renderRecent() {
    const recentLeads = leads.slice(0, 6);
    $("#recent-leads").innerHTML = recentLeads.length ? recentLeads.map(item => `<div class="compact-item"><div><strong>${escapeHtml(item.nome)}</strong><small>${escapeHtml(item.produto)} / ${escapeHtml(item.plano)} • ${date(item.pagamentoCriadoEm)}</small></div>${statusBadge(item.statusPagamento)}</div>`).join("") : '<p class="loading">Nenhum pagamento ainda.</p>';
    const recentSubs = subscriptions.slice(0, 6);
    $("#recent-subscriptions").innerHTML = recentSubs.length ? recentSubs.map(item => `<div class="compact-item"><div><strong>${escapeHtml(item.nome)}</strong><small>${escapeHtml(item.plano || "Sem plano")} • ${item.vitalicio ? "Vitalício" : dateOnly(item.expiraEm)}</small></div>${subscriptionBadge(item)}</div>`).join("") : '<p class="loading">Nenhuma conta criada.</p>';
  }

  function filteredLeads() {
    const query = $("#lead-search").value.trim().toLowerCase();
    const status = $("#lead-status").value;
    const product = $("#lead-product").value;
    return leads.filter(item => {
      const text = [item.nome,item.email,item.telefone,item.cpf,item.transacao].join(" ").toLowerCase();
      const statusOk = !status || (status === "completed" ? completed(item.statusPagamento) : status === "pending" ? !completed(item.statusPagamento) && ["pending","created","waiting"].includes(String(item.statusPagamento || "pending").toLowerCase()) : !completed(item.statusPagamento) && !["pending","created","waiting"].includes(String(item.statusPagamento || "").toLowerCase()));
      return (!query || text.includes(query)) && statusOk && (!product || item.produto === product);
    });
  }

  function renderLeads() {
    const items = filteredLeads();
    $("#lead-table-body").innerHTML = items.map(item => `<tr><td><strong>${escapeHtml(item.nome)}</strong><small>${escapeHtml(item.cpf)}</small></td><td><strong>${escapeHtml(item.email)}</strong><small>${escapeHtml(item.telefone)}</small></td><td><strong>${escapeHtml(item.produto)} / ${escapeHtml(item.plano)}</strong><small>${escapeHtml(item.transacao)}</small></td><td>${money(item.valorCentavos)}</td><td>${statusBadge(item.statusPagamento)}</td><td><strong>${date(item.pagamentoCriadoEm)}</strong><small>${item.pagoEm ? `Pago: ${date(item.pagoEm)}` : ""}</small></td><td>${item.contaCriada ? '<span class="badge active">Criada</span>' : '<span class="badge pending">Não criada</span>'}</td></tr>`).join("");
    $("#lead-empty").hidden = items.length > 0;
  }

  function filteredSubscriptions() {
    const query = $("#subscription-search").value.trim().toLowerCase();
    const status = $("#subscription-status").value;
    return subscriptions.filter(item => {
      const text = [item.nome,item.email,item.telefone,item.cpf,item.plano,item.produto].join(" ").toLowerCase();
      return (!query || text.includes(query)) && (!status || subscriptionState(item) === status);
    });
  }

  function renderSubscriptions() {
    const items = filteredSubscriptions();
    $("#subscription-table-body").innerHTML = items.map(item => `<tr><td><strong>${escapeHtml(item.nome)}</strong><small>${escapeHtml(item.email)} • ${escapeHtml(item.telefone)}</small></td><td><strong>${escapeHtml(item.produto || "—")} / ${escapeHtml(item.plano || "—")}</strong><small>${escapeHtml(item.transacao || "")}</small></td><td>${money(item.valorCentavos)}</td><td><strong>${item.vitalicio ? "Vitalício" : dateOnly(item.expiraEm)}</strong><small>${item.compradoEm ? `Compra: ${date(item.compradoEm)}` : ""}</small></td><td>${subscriptionBadge(item)}</td><td><div class="table-actions"><button class="mini-button" data-reset-password="${escapeHtml(item.userId)}">Nova senha</button><button class="mini-button" data-validity="${escapeHtml(item.userId)}">Validade</button><button class="mini-button ${subscriptionState(item)==="active"?"danger":""}" data-toggle-subscription="${escapeHtml(item.userId)}" data-action="${subscriptionState(item)==="active"?"suspender":"reativar"}">${subscriptionState(item)==="active"?"Suspender":"Reativar"}</button></div></td></tr>`).join("");
    $("#subscription-empty").hidden = items.length > 0;
    bindSubscriptionActions();
  }

  function bindSubscriptionActions() {
    $$('[data-reset-password]').forEach(button => button.onclick = async () => {
      const password = prompt("Digite uma senha temporária com maiúscula, minúscula, número e símbolo:");
      if (!password) return;
      try { await api(`/api/admin/usuarios/${encodeURIComponent(button.dataset.resetPassword)}/redefinir-senha`, { method: "POST", body: JSON.stringify({ novaSenha: password }) }); alert("Senha temporária definida."); }
      catch (error) { alert(error.message); }
    });
    $$('[data-toggle-subscription]').forEach(button => button.onclick = async () => {
      const action = button.dataset.action;
      if (!confirm(`${action === "suspender" ? "Suspender" : "Reativar"} esta assinatura?`)) return;
      try { await api(`/api/admin/usuarios/${encodeURIComponent(button.dataset.toggleSubscription)}/assinatura`, { method: "POST", body: JSON.stringify({ acao: action }) }); await loadSubscriptions(); notice("Assinatura atualizada."); }
      catch (error) { alert(error.message); }
    });
    $$('[data-validity]').forEach(button => button.onclick = async () => {
      const value = prompt("Nova validade no formato AAAA-MM-DD. Digite vitalicio para não expirar:", "vitalicio");
      if (!value) return;
      const expiraEm = value.trim().toLowerCase() === "vitalicio" ? null : `${value.trim()}T23:59:59`;
      try { await api(`/api/admin/usuarios/${encodeURIComponent(button.dataset.validity)}/assinatura`, { method: "POST", body: JSON.stringify({ acao: "validade", expiraEm }) }); await loadSubscriptions(); notice("Validade atualizada."); }
      catch (error) { alert(error.message); }
    });
  }

  function renderContents() {
    const box = $("#admin-content-list");
    box.innerHTML = contents.length ? contents.map(item => {
      const preview = item.visibility === "public" && String(item.mime_type || "").startsWith("image/") ? `<img src="${apiBase}/api/media/public/${encodeURIComponent(item.content_id)}" alt="">` : '<div></div>';
      return `<article class="content-item">${preview}<div><strong>${escapeHtml(item.title || item.section)}</strong><small>${escapeHtml(item.section)} • ${escapeHtml(item.visibility)} • ordem ${escapeHtml(item.sort_order)}</small></div><div class="content-actions"><button class="mini-button danger" data-delete-content="${escapeHtml(item.content_id)}">Excluir</button></div></article>`;
    }).join("") : '<p class="loading">Nenhum conteúdo publicado.</p>';
    $$('[data-delete-content]').forEach(button => button.onclick = async () => {
      if (!confirm("Excluir esta publicação e o arquivo do R2?")) return;
      try { await api(`/api/admin/conteudos/${encodeURIComponent(button.dataset.deleteContent)}`, { method: "DELETE" }); await loadContents(); }
      catch (error) { alert(error.message); }
    });
  }

  async function loadSummary() { const data = await api("/api/admin/resumo"); summaryCards(data.resumo); }
  async function loadLeads() { const data = await api("/api/admin/leads"); leads = data.leads || []; renderLeads(); renderRecent(); }
  async function loadSubscriptions() { const data = await api("/api/admin/usuarios"); subscriptions = data.usuarios || []; renderSubscriptions(); renderRecent(); }
  async function loadContents() { const data = await api("/api/admin/conteudos"); contents = data.conteudos || []; renderContents(); }

  async function loadAll() {
    notice("");
    try { await Promise.all([loadSummary(), loadLeads(), loadSubscriptions(), loadContents()]); }
    catch (error) { notice(error.message, true); }
  }

  async function publish(event) {
    event.preventDefault(); const form = event.currentTarget; const button = form.querySelector("button[type=submit]");
    button.disabled = true; button.textContent = "Enviando…";
    try {
      const payload = new FormData(); payload.append("arquivo", form.elements.arquivo.files[0]);
      const upload = await api("/api/admin/upload", { method: "POST", body: payload });
      await api("/api/admin/conteudos", { method: "POST", body: JSON.stringify({ secao: form.elements.secao.value, visibilidade: form.elements.visibilidade.value, titulo: form.elements.titulo.value, legenda: form.elements.legenda.value, ordem: Number(form.elements.ordem.value || 0), mediaKey: upload.mediaKey, mimeType: upload.mimeType, publicado: true }) });
      form.reset(); notice("Conteúdo publicado com sucesso."); await loadContents();
    } catch (error) { notice(error.message, true); }
    finally { button.disabled = false; button.textContent = "Enviar e publicar"; }
  }

  function exportCsv() {
    const rows = [["Nome","E-mail","Telefone","CPF","Produto","Plano","Valor","Status","Transação","Criado em","Pago em","Conta criada"]];
    filteredLeads().forEach(item => rows.push([item.nome,item.email,item.telefone,item.cpf,item.produto,item.plano,(item.valorCentavos/100).toFixed(2),item.statusPagamento,item.transacao,item.pagamentoCriadoEm,item.pagoEm||"",item.contaCriada?"Sim":"Não"]));
    const csv = "\ufeff" + rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g,'""')}"`).join(";")).join("\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); link.download = `leads-${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(link.href);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    session = readSession(); renderAuth();
    $("#admin-login-form").addEventListener("submit", login);
    $("#admin-logout").addEventListener("click", () => { clearSession(); session = null; renderAuth(); });
    $("#admin-refresh").addEventListener("click", loadAll);
    $("#admin-content-form").addEventListener("submit", publish);
    $("#export-leads").addEventListener("click", exportCsv);
    $$("[data-tab]").forEach(btn => btn.addEventListener("click", () => openTab(btn.dataset.tab)));
    $$("[data-open-tab]").forEach(btn => btn.addEventListener("click", () => openTab(btn.dataset.openTab)));
    ["#lead-search","#lead-status","#lead-product"].forEach(selector => $(selector).addEventListener("input", renderLeads));
    ["#subscription-search","#subscription-status"].forEach(selector => $(selector).addEventListener("input", renderSubscriptions));
    if (session) {
      try { await api("/api/admin/me"); await loadAll(); }
      catch (error) { notice(error.message, true); }
    }
  });
})();
