const c=window.SITE_CONFIG||{};document.querySelectorAll("[data-link]").forEach(e=>{const u=c.links?.[e.dataset.link];if(u)e.href=u});document.querySelectorAll("[data-brand]").forEach(e=>{const v=c.brand?.[e.dataset.brand];if(v)e.textContent=v});document.querySelectorAll("[data-profile]").forEach(e=>{const v=c.profile?.[e.dataset.profile];if(v)e.textContent=v});document.querySelectorAll("[data-year]").forEach(e=>e.textContent=new Date().getFullYear());

// Galeria em estilo de prévia de rede social.
// Não solicita usuário ou senha; comentários continuam no Instagram oficial.
(() => {
  const modal = document.getElementById("galleryModal");
  if (!modal) return;

  const items = [...document.querySelectorAll(".gallery-item")];
  const image = document.getElementById("galleryImage");
  const caption = document.getElementById("galleryCaption");
  const counter = document.getElementById("galleryCounter");
  const prev = modal.querySelector(".gallery-prev");
  const next = modal.querySelector(".gallery-next");
  const form = document.getElementById("commentForm");
  const commentInput = document.getElementById("commentInput");
  let currentIndex = 0;

  function render(index) {
    currentIndex = (index + items.length) % items.length;
    const selected = items[currentIndex];
    const selectedImage = selected.querySelector("img");

    image.src = selectedImage.src;
    image.alt = selectedImage.alt;
    caption.textContent = selected.dataset.caption || "";
    counter.textContent = `${currentIndex + 1} / ${items.length}`;
  }

  function openGallery(index) {
    render(index);
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeGallery() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  items.forEach((item, index) => {
    item.addEventListener("click", () => openGallery(index));
  });

  prev.addEventListener("click", () => render(currentIndex - 1));
  next.addEventListener("click", () => render(currentIndex + 1));
  modal.querySelectorAll("[data-close-gallery]").forEach((el) => {
    el.addEventListener("click", closeGallery);
  });

  document.addEventListener("keydown", (event) => {
    if (!modal.classList.contains("open")) return;
    if (event.key === "Escape") closeGallery();
    if (event.key === "ArrowLeft") render(currentIndex - 1);
    if (event.key === "ArrowRight") render(currentIndex + 1);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const instagramUrl = window.SITE_CONFIG?.links?.instagramReal;

    if (!instagramUrl || instagramUrl.includes("SEU_USUARIO")) {
      alert("Configure o link real do Instagram no arquivo config.js.");
      return;
    }

    const message = commentInput.value.trim()
      ? "Para publicar este comentário, continue no Instagram oficial."
      : "Para comentar, continue no Instagram oficial.";

    const proceed = window.confirm(
      `${message}\n\nEste site não solicita nem armazena sua senha.`
    );

    if (proceed) {
      window.open(instagramUrl, "_blank", "noopener,noreferrer");
    }
  });
})();


// Página de assinatura e checkouts separados por plano.
(() => {
  const subscription = window.SITE_CONFIG?.subscription;
  if (!subscription) return;

  document.querySelectorAll("[data-subscription]").forEach((element) => {
    const key = element.dataset.subscription;
    if (subscription[key]) element.textContent = subscription[key];
  });

  document.querySelectorAll("[data-plan-card]").forEach((card) => {
    const planKey = card.dataset.planCard;
    const plan = subscription.plans?.[planKey];
    if (!plan) return;

    card.querySelectorAll("[data-plan-field]").forEach((element) => {
      const field = element.dataset.planField;
      if (plan[field]) element.textContent = plan[field];
    });
  });

  const modal = document.getElementById("checkoutModal");
  if (!modal) return;

  const summary = document.getElementById("checkoutPlanSummary");
  const confirmLink = document.getElementById("confirmCheckout");

  function closeCheckoutModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  document.querySelectorAll(".plan-checkout").forEach((button) => {
    button.addEventListener("click", () => {
      const planKey = button.dataset.plan;
      const plan = subscription.plans?.[planKey];

      if (!plan?.checkoutUrl || plan.checkoutUrl.includes("SEU-CHECKOUT")) {
        alert(`Configure o checkout do plano "${plan?.name || planKey}" no arquivo config.js.`);
        return;
      }

      summary.textContent = `${plan.name} — ${plan.price} — ${plan.period}`;
      confirmLink.href = plan.checkoutUrl;

      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    });
  });

  modal.querySelectorAll("[data-close-checkout]").forEach((element) => {
    element.addEventListener("click", closeCheckoutModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("open")) {
      closeCheckoutModal();
    }
  });
})();
