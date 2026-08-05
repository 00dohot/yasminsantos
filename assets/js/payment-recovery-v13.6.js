(() => {
  "use strict";
  const config = window.YASMIN_APP_CONFIG;
  if (!config) throw new Error("app-config-v13.6.js não foi carregado.");
  const storageKey = config.storageKeys.pendingPayment;

  function savePayment(payment) {
    if (!payment?.id || !payment?.accessToken) return;
    localStorage.setItem(storageKey, JSON.stringify({
      id: String(payment.id),
      token: String(payment.accessToken),
      pix: String(payment.pixCopiaECola || ""),
      produto: String(payment.produto || ""),
      plano: String(payment.plano || ""),
      savedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }));
    renderResumeButton();
  }

  function loadPayment() {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (!data?.id || !data?.token || !data?.expiresAt || Date.parse(data.expiresAt) <= Date.now()) {
        localStorage.removeItem(storageKey);
        return null;
      }
      return data;
    } catch {
      localStorage.removeItem(storageKey);
      return null;
    }
  }

  function clearPayment() {
    localStorage.removeItem(storageKey);
    document.getElementById("pending-payment-resume")?.remove();
  }

  async function status() {
    const payment = loadPayment();
    if (!payment) return null;
    const response = await fetch(`${config.apiBase}/api/status-pagamento`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ id: payment.id, token: payment.token })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.erro || "Não foi possível consultar o pagamento.");
    return data;
  }

  async function telegram() {
    const payment = loadPayment();
    if (!payment) throw new Error("Pagamento salvo não encontrado neste navegador.");
    const response = await fetch(`${config.apiBase}/api/pagamento/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ id: payment.id, token: payment.token })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.erro || "Link indisponível.");
    location.href = data.telegramUrl;
  }

  async function createAccount(password) {
    const payment = loadPayment();
    if (!payment) throw new Error("Pagamento salvo não encontrado neste navegador.");
    const response = await fetch(`${config.apiBase}/api/conta/criar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ id: payment.id, token: payment.token, senha: password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.erro || "Não foi possível criar a conta.");
    localStorage.setItem(config.storageKeys.subscriberSession, JSON.stringify(data.sessao));
    clearPayment();
    location.href = data.redirecionarPara;
  }

  function renderResumeButton() {
    const payment = loadPayment();
    const activationUrl = config.activationUrl || `${config.siteBase.replace(/\/$/, "")}/ativar/`;
    const onActivationPage = location.pathname.replace(/\/+$/, "").endsWith("/ativar");
    let button = document.getElementById("pending-payment-resume");

    if (!payment || onActivationPage) {
      button?.remove();
      return;
    }
    if (!button) {
      button = document.createElement("a");
      button.id = "pending-payment-resume";
      button.className = "pending-payment-resume";
      button.textContent = "Continuar acesso da compra";
      button.setAttribute("aria-label", "Continuar verificação e liberação do pagamento");
      document.body.append(button);
    }
    button.href = activationUrl;
  }

  document.addEventListener("DOMContentLoaded", renderResumeButton);
  window.YasminPaymentRecovery = { savePayment, loadPayment, clearPayment, status, telegram, createAccount, renderResumeButton };
})();