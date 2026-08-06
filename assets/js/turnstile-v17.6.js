(() => {
  "use strict";
  const widgets = new WeakMap();
  let loader = null;

  function siteKey() {
    return String(
      window.YASMIN_APP_CONFIG?.turnstileSiteKey ||
      window.SITE_CONFIG?.security?.turnstileSiteKey ||
      ""
    ).trim();
  }

  function enabled() {
    return Boolean(siteKey());
  }

  function formElement(target) {
    return typeof target === "string" ? document.querySelector(target) : target;
  }

  function loadApi() {
    if (!enabled()) return Promise.resolve(false);
    if (window.turnstile?.render) return Promise.resolve(true);
    if (loader) return loader;
    loader = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-yasmin-turnstile]');
      if (existing) {
        const wait = () => window.turnstile?.render ? resolve(true) : setTimeout(wait, 60);
        wait();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.yasminTurnstile = "1";
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Não foi possível carregar a verificação de segurança."));
      document.head.appendChild(script);
    });
    return loader;
  }

  async function mount(target, action) {
    const form = formElement(target);
    if (!form || !enabled()) return null;
    if (widgets.has(form)) return widgets.get(form).id;
    await loadApi();

    const holder = document.createElement("div");
    holder.className = "yasmin-turnstile";
    holder.dataset.turnstileHolder = "1";
    const submit = form.querySelector('button[type="submit"],input[type="submit"]');
    if (submit) submit.before(holder); else form.append(holder);

    const id = window.turnstile.render(holder, {
      sitekey: siteKey(),
      action,
      theme: "auto",
      size: "flexible",
      appearance: "interaction-only",
      "error-callback": () => holder.dataset.error = "1"
    });
    widgets.set(form, { id, action, holder });
    return id;
  }

  async function token(target, action) {
    const form = formElement(target);
    if (!enabled()) return "";
    const id = await mount(form, action);
    const value = String(window.turnstile.getResponse(id) || "").trim();
    if (!value) throw new Error("Conclua a verificação de segurança antes de continuar.");
    return value;
  }

  function reset(target) {
    const form = formElement(target);
    const state = form && widgets.get(form);
    if (state && window.turnstile?.reset) window.turnstile.reset(state.id);
  }

  window.YasminTurnstile = Object.freeze({ enabled, mount, token, reset });
})();