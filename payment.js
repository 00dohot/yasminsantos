(() => {
  "use strict";

  const cfg = window.SITE_CONFIG || {};
  const paymentCfg = cfg.payment || {};
  const modal = document.querySelector("[data-payment-modal]");

  if (!modal) return;

  const planStep = modal.querySelector("[data-payment-plan-step]");
  const formStep = modal.querySelector("[data-payment-form-step]");
  const resultStep = modal.querySelector("[data-payment-result-step]");
  const form = modal.querySelector("[data-payment-form]");
  const formSelectedPlan = modal.querySelector("[data-payment-form-step] [data-selected-plan]");
  const errorBox = modal.querySelector("[data-payment-error]");
  const submitButton = modal.querySelector("[data-payment-submit]");
  const pixCode = modal.querySelector("[data-pix-code]");
  const pixQr = modal.querySelector("[data-pix-qr]");
  const pixQrCanvas = modal.querySelector("[data-pix-qr-canvas]");
  const paymentStatus = modal.querySelector("[data-payment-status]");
  const paymentReference = modal.querySelector("[data-payment-reference]");
  const copyButton = modal.querySelector("[data-copy-pix]");
  const checkButton = modal.querySelector("[data-check-payment]");
  const deliveryButton = modal.querySelector("[data-delivery-button]");
  const nameInput = modal.querySelector("[name='nome']");
  const emailInput = modal.querySelector("[name='email']");
  const cpfInput = modal.querySelector("[name='cpf']");
  const phoneInput = modal.querySelector("[name='telefone']");

  const CLIENT_VERSION = String(paymentCfg.contractVersion || "13.4.3");
  const LEAD_STORAGE_KEY = "yasmin_checkout_lead_v1";
  const PIX_STORAGE_KEY = "yasmin_pix_cache_v1";
  const PIX_CACHE_TTL_MS = 60 * 60 * 1000;

  const PRODUCT_ALIASES = Object.freeze({
    site: "site",
    principal: "site",
    privacy: "privacy",
    privas: "privacy"
  });

  const PLAN_ALIASES = Object.freeze({
    site: Object.freeze({
      daily: "diario",
      diario: "diario",
      monthly: "mensal",
      mensal: "mensal",
      lifetime: "vitalicio",
      vitalicio: "vitalicio"
    }),
    privacy: Object.freeze({
      monthly: "mensal",
      mensal: "mensal",
      quarterly: "trimestral",
      trimestral: "trimestral",
      semester: "semestral",
      semestral: "semestral"
    })
  });

  let selection = null;
  let payment = null;
  let pollTimer = null;
  let pollAttempts = 0;

  function onlyDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function normalizeProduct(value) {
    const key = String(value || "").trim().toLowerCase();
    return PRODUCT_ALIASES[key] || "";
  }

  function normalizePlan(product, value) {
    const key = String(value || "").trim().toLowerCase();
    return PLAN_ALIASES[product]?.[key] || "";
  }

  function formatCpf(value) {
    const digits = onlyDigits(value).slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function formatPhone(value) {
    const digits = onlyDigits(value).slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function storageRead(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function storageWrite(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function saveLead() {
    const lead = {
      nome: String(nameInput?.value || "").trim(),
      email: String(emailInput?.value || "").trim(),
      cpf: onlyDigits(cpfInput?.value),
      telefone: onlyDigits(phoneInput?.value),
      updatedAt: Date.now()
    };

    if (lead.nome || lead.email || lead.cpf || lead.telefone) {
      storageWrite(LEAD_STORAGE_KEY, lead);
    }
  }

  function restoreLead() {
    const lead = storageRead(LEAD_STORAGE_KEY, {});
    if (nameInput && lead.nome) nameInput.value = String(lead.nome).slice(0, 120);
    if (emailInput && lead.email) emailInput.value = String(lead.email).slice(0, 160);
    if (cpfInput && lead.cpf) cpfInput.value = formatCpf(lead.cpf);
    if (phoneInput && lead.telefone) phoneInput.value = formatPhone(lead.telefone);
  }

  function cacheKey(currentSelection = selection) {
    if (!currentSelection?.product || !currentSelection?.plan) return "";
    return `${currentSelection.product}:${currentSelection.plan}`;
  }

  function readPixCache() {
    const cache = storageRead(PIX_STORAGE_KEY, {});
    const now = Date.now();
    let changed = false;

    Object.keys(cache).forEach(key => {
      const item = cache[key];
      if (!item || Number(item.expiresAt) <= now || !item.pixCopiaECola) {
        delete cache[key];
        changed = true;
      }
    });

    if (changed) storageWrite(PIX_STORAGE_KEY, cache);
    return cache;
  }

  function getCachedPayment(currentSelection = selection) {
    const key = cacheKey(currentSelection);
    if (!key) return null;
    return readPixCache()[key] || null;
  }

  function saveCachedPayment(data, currentSelection = selection) {
    const key = cacheKey(currentSelection);
    if (!key || !data?.pixCopiaECola) return;

    const now = Date.now();
    const cache = readPixCache();
    const previous = cache[key] || {};

    cache[key] = {
      ...previous,
      id: String(data.id || previous.id || ""),
      accessToken: String(data.accessToken || previous.accessToken || ""),
      pixCopiaECola: String(data.pixCopiaECola || previous.pixCopiaECola || ""),
      status: String(data.status || previous.status || "pending"),
      accessUrl: String(data.accessUrl || previous.accessUrl || ""),
      confirmed: Boolean(data.confirmed || previous.confirmed),
      product: currentSelection.product,
      plan: currentSelection.plan,
      label: currentSelection.label,
      createdAt: Number(previous.createdAt) || now,
      expiresAt: Number(previous.expiresAt) > now
        ? Number(previous.expiresAt)
        : now + PIX_CACHE_TTL_MS
    };

    storageWrite(PIX_STORAGE_KEY, cache);
  }

  function clearCachedPayment(currentSelection = selection) {
    const key = cacheKey(currentSelection);
    if (!key) return;
    const cache = readPixCache();
    if (cache[key]) {
      delete cache[key];
      storageWrite(PIX_STORAGE_KEY, cache);
    }
  }

  function setStep(step) {
    if (planStep) planStep.hidden = step !== "plans";
    if (formStep) formStep.hidden = step !== "form";
    if (resultStep) resultStep.hidden = step !== "result";
  }

  function setError(message = "") {
    if (!errorBox) return;
    const text = String(message || "").trim();
    errorBox.textContent = text;
    errorBox.hidden = !text;
  }

  function stopPolling() {
    if (pollTimer) window.clearTimeout(pollTimer);
    pollTimer = null;
  }

  function openModal(step = "plans") {
    setError("");
    setStep(step);
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeModal() {
    saveLead();
    stopPolling();
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function planFromConfig(product, plan) {
    if (product === "site") {
      return Object.values(cfg.siteAccess?.plans || {})
        .find(item => normalizePlan("site", item?.code) === plan) || null;
    }

    if (product === "privacy") {
      const access = cfg.privacyAccess || {};
      if (normalizePlan("privacy", access.mainOffer?.code) === plan) {
        return access.mainOffer;
      }
      return Object.values(access.plans || {})
        .find(item => normalizePlan("privacy", item?.code) === plan) || null;
    }

    return null;
  }

  function pendingMessage() {
    return paymentStatus?.dataset.pendingText || "Escaneie o QR Code ou copie o código Pix.";
  }

  function renderQr(value) {
    if (!pixQr || !pixQrCanvas) return;

    pixQrCanvas.innerHTML = "";
    pixQr.hidden = true;

    if (!value || typeof window.QRCode !== "function") return;

    try {
      new window.QRCode(pixQrCanvas, {
        text: value,
        width: 190,
        height: 190,
        colorDark: "#111111",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.M
      });
      pixQr.hidden = false;
    } catch {
      pixQrCanvas.innerHTML = "";
      pixQr.hidden = true;
    }
  }

  function choosePlan(rawProduct, rawPlan, label = "") {
    const product = normalizeProduct(rawProduct);
    const plan = normalizePlan(product, rawPlan);
    const configured = planFromConfig(product, plan);

    if (!product || !plan || !configured) {
      setError("Não foi possível identificar o plano selecionado.");
      openModal("plans");
      return;
    }

    selection = Object.freeze({
      product,
      plan,
      label: label || `${configured.name} — ${configured.price}`
    });

    if (formSelectedPlan) formSelectedPlan.textContent = selection.label;
    restoreLead();
    setError("");

    const cached = getCachedPayment(selection);
    if (cached) {
      openModal("result");
      showPaymentResult(cached, { fromCache: true });
      return;
    }

    payment = null;
    openModal("form");
    window.setTimeout(() => nameInput?.focus(), 180);
  }

  async function readJson(response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  function buildAccessUrl(data) {
    return typeof data?.accessUrl === "string" ? data.accessUrl : "";
  }

  function unlockDelivery(data) {
    stopPolling();
    if (paymentStatus) {
      paymentStatus.textContent = selection?.product === "privacy"
        ? "Pagamento confirmado. Seu acesso está disponível."
        : "Pagamento confirmado. Seu conteúdo está disponível.";
      paymentStatus.classList.add("confirmed");
    }

    const accessUrl = buildAccessUrl(data);
    if (deliveryButton && accessUrl) {
      deliveryButton.href = accessUrl;
      deliveryButton.textContent = selection?.product === "privacy"
        ? "Acesse aqui"
        : "Acessar conteúdo";
      deliveryButton.hidden = false;
    }

    if (checkButton) checkButton.hidden = true;

    if (payment) {
      payment.confirmed = true;
      payment.accessUrl = accessUrl;
      saveCachedPayment(payment);
    }
  }

  async function checkPayment({ silent = false } = {}) {
    if (!payment?.id || !payment?.accessToken || !paymentCfg.statusEndpoint) {
      if (!silent) setError("A confirmação automática ainda não está disponível.");
      return false;
    }

    if (checkButton && !silent) {
      checkButton.disabled = true;
      checkButton.textContent = "Verificando...";
    }

    try {
      const response = await fetch(paymentCfg.statusEndpoint, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          id: payment.id,
          token: payment.accessToken
        })
      });

      const data = await readJson(response);
      if (!response.ok || !data.ok) {
        if (response.status === 404) clearCachedPayment();
        throw new Error(data.erro || "Não foi possível verificar o pagamento.");
      }

      const status = String(data.status || "pending").toLowerCase();
      payment.status = status;
      saveCachedPayment(payment);

      if (["completed", "paid", "approved", "confirmed"].includes(status)) {
        if (data.autorizado && data.accessUrl) {
          unlockDelivery(data);
          return true;
        }

        if (data.expirado) {
          stopPolling();
          clearCachedPayment();
          if (paymentStatus) paymentStatus.textContent = "O período deste acesso terminou.";
          if (!silent) setError("Este acesso expirou.");
          return false;
        }
      }

      if (paymentStatus) paymentStatus.textContent = pendingMessage();
      return false;
    } catch (error) {
      if (!silent) setError(error?.message || "Não foi possível verificar o pagamento.");
      return false;
    } finally {
      if (checkButton && !silent) {
        checkButton.disabled = false;
        checkButton.textContent = "Verificar pagamento";
      }
    }
  }

  function schedulePolling() {
    stopPolling();
    pollAttempts = 0;

    const maxAttempts = Number(paymentCfg.maxPollAttempts) || 120;
    const interval = Number(paymentCfg.pollIntervalMs) || 5000;

    const run = async () => {
      pollAttempts += 1;
      const confirmed = await checkPayment({ silent: true });
      if (!confirmed && pollAttempts < maxAttempts) {
        pollTimer = window.setTimeout(run, interval);
      }
    };

    pollTimer = window.setTimeout(run, interval);
  }

  function showPaymentResult(data, { fromCache = false } = {}) {
    payment = {
      id: String(data.id || ""),
      accessToken: String(data.accessToken || ""),
      pixCopiaECola: String(data.pixCopiaECola || ""),
      status: String(data.status || "pending"),
      accessUrl: String(data.accessUrl || ""),
      confirmed: Boolean(data.confirmed)
    };

    if (!fromCache) saveCachedPayment(payment);

    renderQr(payment.pixCopiaECola);
    if (pixCode) pixCode.textContent = payment.pixCopiaECola;
    if (paymentReference) {
      paymentReference.textContent = payment.id ? `Identificação: ${payment.id}` : "";
      paymentReference.hidden = true;
    }
    if (paymentStatus) {
      paymentStatus.textContent = pendingMessage();
      paymentStatus.classList.remove("confirmed");
    }
    if (deliveryButton) {
      deliveryButton.hidden = true;
      deliveryButton.removeAttribute("href");
    }
    if (checkButton) checkButton.hidden = true;

    setStep("result");

    if (payment.confirmed && payment.accessUrl) {
      unlockDelivery({ accessUrl: payment.accessUrl });
      return;
    }

    schedulePolling();
    if (fromCache) checkPayment({ silent: true });
  }

  function friendlyApiError(data, responseStatus) {
    const apiMessage = String(data?.erro || data?.message || "").trim();
    if (/produto ou plano inv[aá]lido/i.test(apiMessage) || /plano inv[aá]lido/i.test(apiMessage)) {
      return `O Worker publicado não reconheceu ${selection?.product || "o produto"}/${selection?.plan || "o plano"}.`;
    }
    return apiMessage || `Não foi possível gerar o Pix (HTTP ${responseStatus}).`;
  }

  document.querySelectorAll("[data-payment-open-plans]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      saveLead();
      selection = null;
      payment = null;
      openModal("plans");
    });
  });

  document.querySelectorAll("[data-payment-trigger]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      choosePlan(
        button.dataset.product,
        button.dataset.plan,
        button.dataset.label || ""
      );
    });
  });

  modal.querySelectorAll("[data-close-payment]").forEach(element => {
    element.addEventListener("click", closeModal);
  });

  modal.querySelectorAll("[data-back-to-plans]").forEach(element => {
    element.addEventListener("click", () => {
      saveLead();
      stopPolling();
      setError("");
      setStep("plans");
    });
  });

  modal.querySelectorAll("[data-new-payment]").forEach(element => {
    element.addEventListener("click", () => {
      saveLead();
      stopPolling();
      clearCachedPayment();
      payment = null;
      restoreLead();
      if (modal.dataset.defaultProduct === "privacy" && selection) {
        setStep("form");
      } else {
        setStep("plans");
      }
    });
  });

  nameInput?.addEventListener("input", saveLead);
  emailInput?.addEventListener("input", saveLead);

  cpfInput?.addEventListener("input", event => {
    event.target.value = formatCpf(event.target.value);
    saveLead();
  });

  phoneInput?.addEventListener("input", event => {
    event.target.value = formatPhone(event.target.value);
    saveLead();
  });

  form?.addEventListener("submit", async event => {
    event.preventDefault();
    setError("");

    if (!selection) {
      setError("Selecione um plano antes de continuar.");
      return;
    }

    if (!paymentCfg.createEndpoint) {
      setError("A integração de pagamento ainda não foi configurada.");
      return;
    }

    if (!form.reportValidity()) return;

    saveLead();
    submitButton.disabled = true;
    submitButton.textContent = "Gerando Pix...";

    const payload = {
      produto: selection.product,
      plano: selection.plan,
      product: selection.product,
      plan: selection.plan,
      nome: nameInput.value.trim(),
      email: emailInput.value.trim(),
      cpf: onlyDigits(cpfInput.value),
      telefone: onlyDigits(phoneInput.value),
      versao_cliente: CLIENT_VERSION
    };

    try {
      const response = await fetch(paymentCfg.createEndpoint, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await readJson(response);
      if (!response.ok || !data.ok || !data.pagamento?.pixCopiaECola) {
        throw new Error(friendlyApiError(data, response.status));
      }

      showPaymentResult(data.pagamento);
    } catch (error) {
      setError(error?.message || "Não foi possível gerar o Pix.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Gerar Pix";
    }
  });

  copyButton?.addEventListener("click", async () => {
    const value = pixCode?.textContent?.trim();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      copyButton.textContent = "Código copiado";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(pixCode);
      const selectionObject = window.getSelection();
      selectionObject.removeAllRanges();
      selectionObject.addRange(range);
      copyButton.textContent = "Selecione e copie";
    }

    window.setTimeout(() => {
      copyButton.textContent = "Copiar código Pix";
    }, 2200);
  });

  checkButton?.addEventListener("click", () => checkPayment());

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && modal.classList.contains("open")) {
      closeModal();
    }
  });

  restoreLead();
  readPixCache();
})();
