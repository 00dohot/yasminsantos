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

  commentForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!instagramUrl || instagramUrl.includes("SEU_PERFIL") || instagramUrl.includes("SEU_USUARIO")) {
      alert("Configure o perfil oficial no arquivo config.js.");
      return;
    }

    const proceed = window.confirm(
      "Para publicar este comentário, continue na plataforma oficial.\n\n" +
      "Este site não solicita nem armazena sua senha."
    );

    if (proceed) {
      window.open(instagramUrl, "_blank", "noopener,noreferrer");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && commentsModal?.classList.contains("open")) {
      closeComments();
    }
  });
})();
