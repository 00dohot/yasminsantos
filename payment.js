(() => {
  "use strict";

  const cfg = window.SITE_CONFIG || {};
  const paymentConfig = cfg.payment || {};
  const endpoint = String(paymentConfig.endpoint || "").trim();
  const timeoutMs = Number(paymentConfig.timeoutMs) > 0
    ? Number(paymentConfig.timeoutMs)
    : 25000;

  // Os dados ficam somente na aba atual e expiram automaticamente em 1 hora.
  const STORAGE_TTL_MS = 60 * 60 * 1000;
  const LEAD_STORAGE_KEY = "yasmin_payment_lead_v1";
  const PIX_STORAGE_KEY = "yasmin_payment_pix_v1";

  const modal = document.getElementById("purchaseModal");
  const formStep = document.getElementById("paymentFormStep");
  const pixStep = document.getElementById("paymentPixStep");
  const form = document.getElementById("paymentForm");
  const selectedPlan = document.getElementById("selectedPlan");
  const planInput = document.getElementById("paymentPlan");
  const nameInput = document.getElementById("paymentName");
  const emailInput = document.getElementById("paymentEmail");
  const cpfInput = document.getElementById("paymentCpf");
  const phoneInput = document.getElementById("paymentPhone");
  const submitButton = document.getElementById("paymentSubmit");
  const errorBox = document.getElementById("paymentError");
  const pixCode = document.getElementById("pixCode");
  const pixQrCode = document.getElementById("pixQrCode");
  const pixQrCard = document.getElementById("pixQrCard");
  const transactionId = document.getElementById("paymentTransaction");
  const copyButton = document.getElementById("copyPix");
  const newPaymentButton = document.getElementById("newPayment");
  const pixInstruction = pixStep?.querySelector(".payment-pix-heading p");
  const privacyNote = form?.querySelector(".payment-privacy-note");

  if (
    !modal || !formStep || !pixStep || !form || !selectedPlan ||
    !planInput || !nameInput || !emailInput || !cpfInput || !phoneInput ||
    !submitButton || !errorBox || !pixCode || !pixQrCode || !pixQrCard ||
    !transactionId || !copyButton || !newPaymentButton
  ) {
    return;
  }

  if (privacyNote) {
    privacyNote.textContent =
      "Seus dados ficam salvos somente nesta aba por até 1 hora para facilitar o pagamento.";
  }

  const PLAN_CODES = Object.freeze({
    daily: "diario",
    monthly: "mensal",
    quarterly: "trimestral",
    lifetime: "vitalicio"
  });

  let leadSaveTimer = 0;

  function getPlanDetails(trigger) {
    const directCode = String(trigger.dataset.planCode || "").trim();
    const directLabel = String(trigger.dataset.planLabel || "").trim();

    if (directCode) {
      return {
        code: directCode,
        label: directLabel || "Acesso exclusivo"
      };
    }

    const configKey = String(trigger.dataset.plan || "").trim();
    const plan = cfg.subscription?.plans?.[configKey] || {};

    if (configKey) {
      return {
        code: String(plan.code || PLAN_CODES[configKey] || ""),
        label: `${plan.name || "Acesso"} — ${plan.price || ""}`.trim()
      };
    }

    if (trigger.id === "featuredOffer") {
      const monthly = cfg.subscription?.plans?.monthly || {};
      return {
        code: String(monthly.code || "mensal"),
        label: `${monthly.name || "Acesso mensal"} — ${monthly.price || "R$ 24,90"}`
      };
    }

    return { code: "", label: "" };
  }

  function setError(message = "") {
    const text = String(message || "").trim();
    errorBox.textContent = text;
    errorBox.hidden = !text;
  }

  function onlyDigits(value) {
    return String(value || "").replace(/\D/g, "");
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

  function readStorage(key, fallback) {
    try {
      const raw = window.sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function removeStorage(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // O checkout continua funcionando mesmo se o navegador bloquear storage.
    }
  }

  function getLeadFromForm() {
    return {
      nome: nameInput.value.trim(),
      email: emailInput.value.trim(),
      cpf: onlyDigits(cpfInput.value),
      telefone: onlyDigits(phoneInput.value)
    };
  }

  function saveLead(lead = getLeadFromForm()) {
    const hasValue = Object.values(lead).some((value) => String(value || "").trim());

    if (!hasValue) {
      removeStorage(LEAD_STORAGE_KEY);
      return;
    }

    writeStorage(LEAD_STORAGE_KEY, {
      ...lead,
      savedAt: Date.now(),
      expiresAt: Date.now() + STORAGE_TTL_MS
    });
  }

  function scheduleLeadSave() {
    window.clearTimeout(leadSaveTimer);
    leadSaveTimer = window.setTimeout(() => saveLead(), 180);
  }

  function getSavedLead() {
    const lead = readStorage(LEAD_STORAGE_KEY, null);

    if (!lead || Number(lead.expiresAt) <= Date.now()) {
      removeStorage(LEAD_STORAGE_KEY);
      return null;
    }

    return lead;
  }

  function fillSavedLead() {
    const lead = getSavedLead();
    if (!lead) return false;

    nameInput.value = String(lead.nome || "");
    emailInput.value = String(lead.email || "");
    cpfInput.value = formatCpf(lead.cpf || "");
    phoneInput.value = formatPhone(lead.telefone || "");
    return true;
  }

  function readPixStore() {
    const store = readStorage(PIX_STORAGE_KEY, {});
    const validStore = store && typeof store === "object" ? store : {};
    let changed = false;

    Object.keys(validStore).forEach((planCode) => {
      const entry = validStore[planCode];
      const expired = !entry || Number(entry.expiresAt) <= Date.now();
      const missingCode = !entry?.payment?.pixCopiaECola;

      if (expired || missingCode) {
        delete validStore[planCode];
        changed = true;
      }
    });

    if (changed) {
      writeStorage(PIX_STORAGE_KEY, validStore);
    }

    return validStore;
  }

  function getSavedPix(planCode) {
    const store = readPixStore();
    return store[planCode] || null;
  }

  function savePix(plan, payment) {
    const now = Date.now();
    const store = readPixStore();

    store[plan.code] = {
      planCode: plan.code,
      planLabel: plan.label,
      payment: {
        id: String(payment.id || ""),
        plano: String(payment.plano || plan.code),
        titulo: String(payment.titulo || ""),
        valor: payment.valor,
        diasDeAcesso: payment.diasDeAcesso ?? null,
        status: String(payment.status || "pending"),
        pixCopiaECola: String(payment.pixCopiaECola || "")
      },
      createdAt: now,
      expiresAt: now + STORAGE_TTL_MS
    };

    writeStorage(PIX_STORAGE_KEY, store);
    return store[plan.code];
  }

  function removeSavedPix(planCode) {
    const store = readPixStore();
    delete store[planCode];
    writeStorage(PIX_STORAGE_KEY, store);
  }

  function clearQrCode() {
    pixQrCode.innerHTML = "";
    pixQrCard.hidden = false;
  }

  function renderQrCode(value) {
    clearQrCode();

    if (!value || typeof window.QRCode !== "function") {
      pixQrCard.hidden = true;
      return;
    }

    new window.QRCode(pixQrCode, {
      text: value,
      width: 196,
      height: 196,
      colorDark: "#17131a",
      colorLight: "#ffffff",
      correctLevel: window.QRCode.CorrectLevel.M
    });
  }

  function clearPixPresentation() {
    pixCode.textContent = "";
    transactionId.textContent = "";
    clearQrCode();
  }

  function showFormStep() {
    formStep.hidden = false;
    pixStep.hidden = true;
    clearPixPresentation();
    setError("");
  }

  function showPixStep(payment, options = {}) {
    const code = String(payment.pixCopiaECola || "").trim();
    const remainingMs = Number(options.expiresAt) - Date.now();
    const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));

    pixCode.textContent = code;
    transactionId.textContent = payment.id
      ? `ID da cobrança: ${payment.id}`
      : "";

    if (pixInstruction) {
      pixInstruction.textContent = options.restored
        ? `Cobrança recuperada. O código ficará salvo nesta aba por mais ${remainingMinutes} min.`
        : "Escaneie o QR Code ou copie o código abaixo. Ele ficará salvo nesta aba por até 1 hora.";
    }

    renderQrCode(code);
    formStep.hidden = true;
    pixStep.hidden = false;
    setError("");
  }

  function openModal(plan) {
    if (!endpoint) {
      alert("A integração de pagamento ainda não foi configurada.");
      return;
    }

    if (!plan.code) {
      alert("Não foi possível identificar o plano selecionado.");
      return;
    }

    form.reset();
    planInput.value = plan.code;
    selectedPlan.textContent = plan.label;
    fillSavedLead();

    submitButton.disabled = false;
    submitButton.textContent = "Gerar Pix";
    copyButton.textContent = "Copiar código Pix";

    const savedPix = getSavedPix(plan.code);

    if (savedPix) {
      showPixStep(savedPix.payment, {
        restored: true,
        expiresAt: savedPix.expiresAt
      });
    } else {
      showFormStep();
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    if (!savedPix) {
      window.setTimeout(() => {
        const firstEmptyField = [nameInput, emailInput, cpfInput, phoneInput]
          .find((input) => !input.value.trim());
        firstEmptyField?.focus();
      }, 180);
    }
  }

  function closeModal() {
    saveLead();
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    submitButton.disabled = false;
    submitButton.textContent = "Gerar Pix";
    setError("");
    clearQrCode();
  }

  [nameInput, emailInput].forEach((input) => {
    input.addEventListener("input", scheduleLeadSave);
  });

  cpfInput.addEventListener("input", (event) => {
    event.target.value = formatCpf(event.target.value);
    scheduleLeadSave();
  });

  phoneInput.addEventListener("input", (event) => {
    event.target.value = formatPhone(event.target.value);
    scheduleLeadSave();
  });

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-payment-plan], #featuredOffer, [data-plan]");
    if (!trigger) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openModal(getPlanDetails(trigger));
  }, true);

  modal.querySelectorAll("[data-close-modal]").forEach((element) => {
    element.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("open")) {
      closeModal();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setError("");

    if (!form.reportValidity()) return;

    const body = {
      plano: planInput.value,
      nome: nameInput.value.trim(),
      email: emailInput.value.trim(),
      cpf: onlyDigits(cpfInput.value),
      telefone: onlyDigits(phoneInput.value)
    };

    saveLead(body);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

    submitButton.disabled = true;
    submitButton.textContent = "Gerando Pix...";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok || !data.pagamento?.pixCopiaECola) {
        throw new Error(
          data.erro || "Não foi possível gerar o Pix. Tente novamente."
        );
      }

      const currentPlan = {
        code: planInput.value,
        label: selectedPlan.textContent.trim()
      };

      const savedPix = savePix(currentPlan, data.pagamento);
      showPixStep(savedPix.payment, {
        restored: false,
        expiresAt: savedPix.expiresAt
      });
    } catch (error) {
      const message = error?.name === "AbortError"
        ? "A solicitação demorou demais. Tente novamente."
        : error?.message || "Não foi possível gerar o Pix.";

      setError(message);
    } finally {
      window.clearTimeout(timeout);
      submitButton.disabled = false;
      submitButton.textContent = "Gerar Pix";
    }
  });

  copyButton.addEventListener("click", async () => {
    const value = pixCode.textContent.trim();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      copyButton.textContent = "Código copiado ✓";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(pixCode);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      copyButton.textContent = "Selecione e copie o código";
    }

    window.setTimeout(() => {
      copyButton.textContent = "Copiar código Pix";
    }, 2200);
  });

  newPaymentButton.addEventListener("click", () => {
    const currentPlan = planInput.value;
    removeSavedPix(currentPlan);

    form.reset();
    planInput.value = currentPlan;
    fillSavedLead();
    showFormStep();

    const firstEmptyField = [nameInput, emailInput, cpfInput, phoneInput]
      .find((input) => !input.value.trim());
    (firstEmptyField || nameInput).focus();
  });

  window.addEventListener("pagehide", () => saveLead());
})();
