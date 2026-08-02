(() => {
  "use strict";

  const cfg = window.SITE_CONFIG || {};
  const paymentConfig = cfg.payment || {};
  const endpoint = String(paymentConfig.endpoint || "").trim();
  const timeoutMs = Number(paymentConfig.timeoutMs) > 0
    ? Number(paymentConfig.timeoutMs)
    : 25000;

  const modal = document.getElementById("purchaseModal");
  const formStep = document.getElementById("paymentFormStep");
  const pixStep = document.getElementById("paymentPixStep");
  const form = document.getElementById("paymentForm");
  const selectedPlan = document.getElementById("selectedPlan");
  const planInput = document.getElementById("paymentPlan");
  const submitButton = document.getElementById("paymentSubmit");
  const errorBox = document.getElementById("paymentError");
  const pixCode = document.getElementById("pixCode");
  const transactionId = document.getElementById("paymentTransaction");
  const copyButton = document.getElementById("copyPix");
  const newPaymentButton = document.getElementById("newPayment");

  if (
    !modal || !formStep || !pixStep || !form || !selectedPlan ||
    !planInput || !submitButton || !errorBox || !pixCode ||
    !transactionId || !copyButton || !newPaymentButton
  ) {
    return;
  }

  const PLAN_CODES = Object.freeze({
    monthly: "mensal",
    quarterly: "trimestral",
    lifetime: "vitalicio"
  });

  function getPlanDetails(trigger) {
    if (trigger.id === "featuredOffer") {
      const offer = cfg.subscription?.mainOffer || {};
      return {
        code: "mensal",
        label: `Assinatura mensal — ${offer.price || "R$ 20,00"}`
      };
    }

    const configKey = trigger.dataset.plan;
    const plan = cfg.subscription?.plans?.[configKey] || {};

    return {
      code: PLAN_CODES[configKey] || "",
      label: `${plan.name || "Assinatura"} — ${plan.price || ""}`.trim()
    };
  }

  function setError(message = "") {
    const text = String(message || "").trim();
    errorBox.textContent = text;
    errorBox.hidden = !text;
  }

  function showFormStep() {
    formStep.hidden = false;
    pixStep.hidden = true;
    setError("");
  }

  function showPixStep(payment) {
    pixCode.textContent = payment.pixCopiaECola || "";
    transactionId.textContent = payment.id
      ? `Identificação da transação: ${payment.id}`
      : "";

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
    submitButton.disabled = false;
    submitButton.textContent = "Gerar Pix";
    copyButton.textContent = "Copiar código Pix";
    showFormStep();

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    window.setTimeout(() => {
      document.getElementById("paymentName")?.focus();
    }, 180);
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    submitButton.disabled = false;
    submitButton.textContent = "Gerar Pix";
    setError("");
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

  document.getElementById("paymentCpf")?.addEventListener("input", (event) => {
    event.target.value = formatCpf(event.target.value);
  });

  document.getElementById("paymentPhone")?.addEventListener("input", (event) => {
    event.target.value = formatPhone(event.target.value);
  });

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("#featuredOffer, [data-plan]");
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
      nome: document.getElementById("paymentName").value.trim(),
      email: document.getElementById("paymentEmail").value.trim(),
      cpf: onlyDigits(document.getElementById("paymentCpf").value),
      telefone: onlyDigits(document.getElementById("paymentPhone").value)
    };

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

      showPixStep(data.pagamento);
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
      copyButton.textContent = "Código copiado";
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
    form.reset();
    planInput.value = currentPlan;
    showFormStep();
    document.getElementById("paymentName")?.focus();
  });
})();
