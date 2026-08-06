(() => {
  "use strict";
  const config = window.YASMIN_APP_CONFIG;
  const storageKey = config.storageKeys.pendingPayment;

  function savePayment(payment) {
    localStorage.setItem(storageKey, JSON.stringify({
      id: payment.id,
      token: payment.accessToken,
      pix: payment.pixCopiaECola,
      savedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  function loadPayment() {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (!data?.id || !data?.token || Date.parse(data.expiresAt) <= Date.now()) {
        localStorage.removeItem(storageKey);
        return null;
      }
      return data;
    } catch { return null; }
  }


  function bootstrapFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = String(params.get("id") || "").trim();
    const token = String(params.get("token") || "").trim();
    if (!id || !token) return null;

    const current = loadPayment();
    if (current?.id === id && current?.token === token) return current;

    const data = {
      id,
      token,
      pix: "",
      product: String(params.get("produto") || ""),
      plan: String(params.get("plano") || ""),
      savedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(data));
    return data;
  }

  async function status() {
    const payment = loadPayment();
    if (!payment) return null;
    const response = await fetch(`${config.apiBase}/api/status-pagamento`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: payment.id, token: payment.token })
    });
    return response.json();
  }

  async function telegram() {
    const payment = loadPayment();
    if (!payment) throw new Error("Pagamento salvo não encontrado.");
    const response = await fetch(`${config.apiBase}/api/pagamento/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: payment.id, token: payment.token })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.erro || "Link indisponível.");
    location.href = data.telegramUrl;
  }

  async function createAccount(password, form = document.querySelector("#activation-account-form")) {
    const payment = loadPayment();
    if (!payment) throw new Error("Pagamento salvo não encontrado.");
    const turnstileToken = await window.YasminTurnstile?.token(form, "account_create") || "";
    const response = await fetch(`${config.apiBase}/api/conta/criar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: payment.id, token: payment.token, senha: password, turnstileToken })
    });
    const data = await response.json();
    if (!response.ok) {
      window.YasminTurnstile?.reset(form);
      throw new Error(data.erro || "Não foi possível criar a conta.");
    }
    localStorage.setItem(config.storageKeys.subscriberSession, JSON.stringify(data.sessao));
    location.href = data.redirecionarPara;
  }

  window.YasminPaymentRecovery = { savePayment, loadPayment, bootstrapFromUrl, status, telegram, createAccount };
})();
