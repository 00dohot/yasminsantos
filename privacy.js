(() => {
  const cfg = window.SITE_CONFIG || {};
  const subscription = cfg.subscription || {};
  const plans = subscription.plans || {};

  document.querySelectorAll("[data-link]").forEach((element) => {
    const url = cfg.links?.[element.dataset.link];
    if (url) element.href = url;
  });

  document.querySelectorAll("[data-brand]").forEach((element) => {
    const value = cfg.brand?.[element.dataset.brand];
    if (value) element.textContent = value;
  });

  document.querySelectorAll("[data-profile]").forEach((element) => {
    const value = cfg.profile?.[element.dataset.profile];
    if (value) element.textContent = value;
  });

  document.querySelectorAll("[data-subscription]").forEach((element) => {
    const value = subscription[element.dataset.subscription];
    if (value) element.textContent = value;
  });

  Object.entries(plans).forEach(([key, plan]) => {
    const name = document.querySelector(`[data-plan-name="${key}"]`);
    const description = document.querySelector(`[data-plan-description="${key}"]`);
    const price = document.querySelector(`[data-plan-price="${key}"]`);

    if (name) name.textContent = key === "monthly" ? "1 mês" :
      key === "quarterly" ? "3 meses" : plan.name;
    if (description) description.textContent = plan.description;
    if (price) price.textContent = plan.price;
  });

  const readMore = document.getElementById("readMore");
  const bio = document.getElementById("creatorBio");
  readMore?.addEventListener("click", () => {
    bio.classList.toggle("expanded");
    readMore.textContent = bio.classList.contains("expanded") ? "Mostrar menos" : "Ler mais";
  });

  let selectedPlan = "monthly";
  const planButtons = [...document.querySelectorAll("[data-plan-select]")];

  planButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedPlan = button.dataset.planSelect;
      planButtons.forEach((item) => item.classList.toggle("selected", item === button));
    });
  });

  const modal = document.getElementById("paymentModal");
  const selectedPlanText = document.getElementById("selectedPlanText");
  const confirmPayment = document.getElementById("confirmPayment");

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  document.getElementById("subscribeButton")?.addEventListener("click", () => {
    const plan = plans[selectedPlan];

    if (!plan?.checkoutUrl || plan.checkoutUrl.includes("SEU-CHECKOUT")) {
      alert(`Configure o checkout de "${plan?.name || selectedPlan}" no arquivo config.js.`);
      return;
    }

    selectedPlanText.textContent = `${plan.name} — ${plan.price} — ${plan.period}`;
    confirmPayment.href = plan.checkoutUrl;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  });

  document.querySelectorAll("[data-close-payment]").forEach((element) => {
    element.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const tiles = [...document.querySelectorAll(".content-tile")];

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((item) => item.classList.toggle("active", item === button));
      tiles.forEach((tile) => {
        tile.classList.toggle("hidden", filter !== "all" && tile.dataset.type !== filter);
      });
    });
  });

  tiles.forEach((tile) => {
    tile.addEventListener("click", () => {
      document.getElementById("subscribeButton")?.scrollIntoView({behavior:"smooth", block:"center"});
    });
  });
})();

// Interações das publicações: curtir, salvar, comentar e compartilhar.
(() => {
  const storagePrefix = "yasmin-privacy-";
  const instagramUrl = window.SITE_CONFIG?.links?.privacyReal || window.SITE_CONFIG?.links?.instagramReal;

  function showToast(message) {
    let toast = document.querySelector(".share-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "share-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200);
  }

  document.querySelectorAll(".preview-post").forEach((post) => {
    const postId = post.dataset.postId;
    const likeButton = post.querySelector("[data-like]");
    const saveButton = post.querySelector("[data-save]");
    const likeCount = post.querySelector("[data-like-count]");

    const liked = localStorage.getItem(`${storagePrefix}${postId}-liked`) === "true";
    const saved = localStorage.getItem(`${storagePrefix}${postId}-saved`) === "true";

    if (liked) {
      likeButton.classList.add("active");
      likeButton.setAttribute("aria-pressed", "true");
      likeButton.querySelector(".action-symbol").textContent = "♥";
      likeCount.textContent = String(Number(likeCount.textContent) + 1);
    }

    if (saved) {
      saveButton.classList.add("active");
      saveButton.setAttribute("aria-pressed", "true");
      saveButton.querySelector(".action-symbol").textContent = "◆";
    }

    likeButton.addEventListener("click", () => {
      const active = likeButton.classList.toggle("active");
      likeButton.setAttribute("aria-pressed", String(active));
      likeButton.querySelector(".action-symbol").textContent = active ? "♥" : "♡";
      likeCount.textContent = String(Number(likeCount.textContent) + (active ? 1 : -1));
      localStorage.setItem(`${storagePrefix}${postId}-liked`, String(active));
      showToast(active ? "Publicação curtida." : "Curtida removida.");
    });

    saveButton.addEventListener("click", () => {
      const active = saveButton.classList.toggle("active");
      saveButton.setAttribute("aria-pressed", String(active));
      saveButton.querySelector(".action-symbol").textContent = active ? "◆" : "◇";
      localStorage.setItem(`${storagePrefix}${postId}-saved`, String(active));
      showToast(active ? "Publicação salva." : "Publicação removida dos salvos.");
    });

    post.querySelector("[data-share]")?.addEventListener("click", async () => {
      const shareData = {
        title: document.title,
        text: "Confira esta prévia de Yasmin Santos.",
        url: window.location.href
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(window.location.href);
          showToast("Link copiado.");
        }
      } catch (error) {
        if (error.name !== "AbortError") showToast("Não foi possível compartilhar.");
      }
    });

    post.querySelector("[data-open-post]")?.addEventListener("click", () => {
      document.getElementById("subscribeButton")?.scrollIntoView({behavior:"smooth", block:"center"});
      showToast("Assine para desbloquear esta publicação.");
    });
  });

  const commentsModal = document.getElementById("commentsModal");
  const commentForm = document.getElementById("privacyCommentForm");

  function openComments() {
    commentsModal.classList.add("open");
    commentsModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeComments() {
    commentsModal.classList.remove("open");
    commentsModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  document.querySelectorAll("[data-comment]").forEach((button) => {
    button.addEventListener("click", openComments);
  });

  document.querySelectorAll("[data-close-comments]").forEach((element) => {
    element.addEventListener("click", closeComments);
  });



  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && commentsModal?.classList.contains("open")) {
      closeComments();
    }
  });
})();


// Comentários locais da página Privacy.
(() => {
  const form = document.getElementById("privacyCommentForm");
  const list = document.querySelector(".comments-list");
  if (!form || !list) return;

  const storageKey = "yasmin-privacy-comments-v7";

  const read = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); }
    catch { return []; }
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
    list.querySelectorAll("[data-user-comment]").forEach(el => el.remove());
    read().forEach((comment) => {
      const item = document.createElement("article");
      item.className = "comment-item";
      item.dataset.userComment = "true";
      const fallback = escapeHtml(comment.handle.replace("@","").slice(0,1).toUpperCase() || "U");
      const avatar = comment.photo
        ? `<img src="${comment.photo}" alt="">`
        : `<div class="comment-avatar-fallback">${fallback}</div>`;
      item.innerHTML = `${avatar}<div><strong>${escapeHtml(comment.handle)}</strong><p>${escapeHtml(comment.text)}</p><small>Agora</small></div>`;
      list.appendChild(item);
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const handleInput = document.getElementById("privacyCommentHandle");
    const photoInput = document.getElementById("privacyCommentPhoto");
    const textInput = document.getElementById("privacyCommentInput");

    let handle = handleInput.value.trim();
    if (!handle.startsWith("@")) handle = "@" + handle;
    const text = textInput.value.trim();
    if (!text) return;

    const photo = await fileToDataUrl(photoInput.files?.[0]);
    const comments = read();
    comments.push({handle, text, photo, createdAt: Date.now()});
    save(comments);
    render();
    form.reset();
  });

  render();
})();


// Estatísticas e oferta principal.
(() => {
  const cfg = window.SITE_CONFIG || {};
  document.querySelectorAll("[data-privacy-stat]").forEach(el => {
    const v = cfg.privacyStats?.[el.dataset.privacyStat];
    if (v) el.textContent = v;
  });
  document.querySelectorAll("[data-main-offer]").forEach(el => {
    const v = cfg.subscription?.mainOffer?.[el.dataset.mainOffer];
    if (v) el.textContent = v;
  });

  const options = document.getElementById("subscriptionOptions");
  const toggle = document.getElementById("plansAccordionToggle");
  const arrow = document.getElementById("plansArrow");
  toggle?.addEventListener("click", () => {
    const collapsed = options.classList.toggle("collapsed");
    arrow.textContent = collapsed ? "⌄" : "⌃";
  });

  const mainBtn = document.getElementById("mainOfferButton");
  mainBtn?.addEventListener("click", () => {
    const url = cfg.subscription?.mainOffer?.checkoutUrl;
    if (!url || url.includes("SEU-CHECKOUT")) {
      alert("Configure o checkout principal no arquivo config.js.");
      return;
    }
    document.getElementById("selectedPlanText").textContent = `Assinatura — ${cfg.subscription.mainOffer.price}`;
    document.getElementById("confirmPayment").href = url;
    document.getElementById("paymentModal").classList.add("open");
  });
})();

// Comentário direto no card Privacy.
(() => {
  const form = document.getElementById("privacyInlineComment");
  const out = document.getElementById("privacyInlineComments");
  if (!form || !out) return;
  const key = "yasmin-v8-privacy-comments";
  const read = () => { try { return JSON.parse(localStorage.getItem(key)||"[]"); } catch { return []; } };
  const save = d => localStorage.setItem(key, JSON.stringify(d));
  const render = () => {
    out.innerHTML = "";
    read().forEach(c => {
      const row = document.createElement("div");
      row.className = "privacy-comment-row";
      row.innerHTML = `<strong>${c.handle}</strong> ${c.text}`;
      out.appendChild(row);
    });
  };
  form.addEventListener("submit", e => {
    e.preventDefault();
    let h = document.getElementById("privacyInlineHandle").value.trim();
    const t = document.getElementById("privacyInlineText").value.trim();
    if (!h.startsWith("@")) h = "@"+h;
    const d = read(); d.push({handle:h,text:t}); save(d);
    render(); form.reset();
  });
  render();
})();
