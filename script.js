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
    const localModal = document.getElementById("localCommentModal");
    localModal?.classList.add("open");
    localModal?.setAttribute("aria-hidden", "false");
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


// Comentários locais da galeria do Instagram.
(() => {
  const modal = document.getElementById("localCommentModal");
  const form = document.getElementById("localCommentForm");
  const galleryModal = document.getElementById("galleryModal");
  const list = galleryModal?.querySelector(".comment-scroll");
  if (!modal || !form || !list) return;

  let postIndex = 0;
  const storageKey = "yasmin-instagram-comments-v7";

  const read = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); }
    catch { return {}; }
  };
  const save = (data) => localStorage.setItem(storageKey, JSON.stringify(data));

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function render() {
    list.querySelectorAll("[data-local-comment]").forEach(el => el.remove());
    const comments = read()[String(postIndex)] || [];

    comments.forEach((comment) => {
      const item = document.createElement("div");
      item.className = "local-comment-item";
      item.dataset.localComment = "true";
      const fallback = escapeHtml(comment.handle.replace("@","").slice(0,1).toUpperCase() || "U");
      const avatar = comment.photo
        ? `<img src="${comment.photo}" alt="">`
        : `<div class="local-comment-fallback">${fallback}</div>`;
      item.innerHTML = `${avatar}<div><strong>${escapeHtml(comment.handle)}</strong><p>${escapeHtml(comment.text)}</p><small>Agora</small></div>`;
      list.appendChild(item);
    });
  }

  document.querySelectorAll(".gallery-item").forEach((item, index) => {
    item.addEventListener("click", () => {
      postIndex = index;
      setTimeout(render, 0);
    });
  });

  modal.querySelectorAll("[data-close-local-comment]").forEach((el) => {
    el.addEventListener("click", () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const handleInput = document.getElementById("localCommentHandle");
    const photoInput = document.getElementById("localCommentPhoto");
    const textInput = document.getElementById("localCommentText");

    let handle = handleInput.value.trim();
    if (!handle.startsWith("@")) handle = "@" + handle;
    const text = textInput.value.trim();
    if (!text) return;

    const photo = await fileToDataUrl(photoInput.files?.[0]);
    const data = read();
    const key = String(postIndex);
    data[key] = data[key] || [];
    data[key].push({handle, text, photo, createdAt: Date.now()});
    save(data);

    render();
    form.reset();
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  });
})();
