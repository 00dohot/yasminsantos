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
  const selectedPlan = modal.querySelector("[data-selected-plan]");
  const errorBox = modal.querySelector("[data-payment-error]");
  const submitButton = modal.querySelector("[data-payment-submit]");
  const pixCode = modal.querySelector("[data-pix-code]");
  const paymentStatus = modal.querySelector("[data-payment-status]");
  const paymentReference = modal.querySelector("[data-payment-reference]");
  const copyButton = modal.querySelector("[data-copy-pix]");
  const checkButton = modal.querySelector("[data-check-payment]");
  const deliveryButton = modal.querySelector("[data-delivery-button]");
  const nameInput = modal.querySelector("[name='nome']");
  const emailInput = modal.querySelector("[name='email']");
  const cpfInput = modal.querySelector("[name='cpf']");
  const phoneInput = modal.querySelector("[name='telefone']");

  let selection = null;
  let payment = null;
  let pollTimer = null;
  let pollAttempts = 0;

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
    stopPolling();
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function planFromConfig(product, plan) {
    if (product === "site") {
      const plans = cfg.siteAccess?.plans || {};
      const match = Object.values(plans).find(item => item.code === plan);
      return match || null;
    }

    if (product === "privacy") {
      const access = cfg.privacyAccess || {};
      if (access.mainOffer?.code === plan) return access.mainOffer;
      const match = Object.values(access.plans || {}).find(item => item.code === plan);
      return match || null;
    }

    return null;
  }

  function choosePlan(product, plan, label = "") {
    const configured = planFromConfig(product, plan);
    if (!configured) {
      setError("Não foi possível identificar o plano selecionado.");
      openModal("plans");
      return;
    }

    if (form) form.reset();

    selection = {
      product,
      plan,
      label: label || `${configured.name} — ${configured.price}`
    };

    if (selectedPlan) selectedPlan.textContent = selection.label;
    setError("");
    setStep("form");
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
    if (typeof data?.accessUrl === "string" && data.accessUrl) {
      return data.accessUrl;
    }
    return "";
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
  }

  async function checkPayment({silent = false} = {}) {
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
        throw new Error(data.erro || "Não foi possível verificar o pagamento.");
      }

      const status = String(data.status || "pending").toLowerCase();
      if (["completed", "paid", "approved", "confirmed"].includes(status)) {
        if (data.autorizado && data.accessUrl) {
          unlockDelivery(data);
          return true;
        }

        if (data.expirado) {
          stopPolling();
          if (paymentStatus) paymentStatus.textContent = "O período deste acesso terminou.";
          if (!silent) setError("Este acesso expirou.");
          return false;
        }
      }

      if (paymentStatus) {
        paymentStatus.textContent = "Aguardando a confirmação do Pix...";
      }
      return false;
    } catch (error) {
      if (!silent) setError(error?.message || "Não foi possível verificar o pagamento.");
      return false;
    } finally {
      if (checkButton && !checkButton.hidden) {
        checkButton.disabled = false;
        checkButton.textContent = "Verificar pagamento";
      }
    }
  }

  function schedulePoll() {
    stopPolling();
    if (!payment?.trackingEnabled) return;

    const maxAttempts = Number(paymentCfg.maxPollAttempts) || 120;
    const interval = Number(paymentCfg.pollIntervalMs) || 5000;

    const run = async () => {
      pollAttempts += 1;
      const completed = await checkPayment({silent:true});
      if (completed || pollAttempts >= maxAttempts) return;
      pollTimer = window.setTimeout(run, interval);
    };

    pollTimer = window.setTimeout(run, interval);
  }

  function showPaymentResult(data) {
    payment = {
      id: data.id,
      pixCopiaECola: data.pixCopiaECola,
      accessToken: data.accessToken || "",
      trackingEnabled: Boolean(data.trackingEnabled)
    };

    if (pixCode) pixCode.textContent = payment.pixCopiaECola;
    if (paymentReference) {
      paymentReference.textContent = payment.id
        ? `Identificação: ${payment.id}`
        : "";
    }
    if (paymentStatus) {
      paymentStatus.classList.remove("confirmed");
      paymentStatus.textContent = payment.trackingEnabled
        ? "Pix gerado. Aguardando a confirmação do pagamento..."
        : "Pix gerado. A confirmação automática será ativada após configurar o banco do Worker.";
    }
    if (deliveryButton) {
      deliveryButton.hidden = true;
      deliveryButton.removeAttribute("href");
    }
    if (checkButton) checkButton.hidden = !payment.trackingEnabled;

    setStep("result");
    pollAttempts = 0;
    schedulePoll();
  }

  document.querySelectorAll("[data-payment-open-plans]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      selection = null;
      payment = null;
      if (form) form.reset();
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
      setError("");
      setStep("plans");
    });
  });

  modal.querySelectorAll("[data-new-payment]").forEach(element => {
    element.addEventListener("click", () => {
      stopPolling();
      payment = null;
      if (form) form.reset();
      if (modal.dataset.defaultProduct === "privacy" && selection) {
        setStep("form");
      } else {
        setStep("plans");
      }
    });
  });

  cpfInput?.addEventListener("input", event => {
    event.target.value = formatCpf(event.target.value);
  });

  phoneInput?.addEventListener("input", event => {
    event.target.value = formatPhone(event.target.value);
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

    submitButton.disabled = true;
    submitButton.textContent = "Gerando Pix...";

    try {
      const response = await fetch(paymentCfg.createEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          produto: selection.product,
          plano: selection.plan,
          nome: nameInput.value.trim(),
          email: emailInput.value.trim(),
          cpf: onlyDigits(cpfInput.value),
          telefone: onlyDigits(phoneInput.value)
        })
      });

      const data = await readJson(response);
      if (!response.ok || !data.ok || !data.pagamento?.pixCopiaECola) {
        throw new Error(data.erro || "Não foi possível gerar o Pix.");
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
})();
