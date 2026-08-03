(() => {
  const cfg = window.SITE_CONFIG || {};

  document.querySelectorAll("[data-link]").forEach((element) => {
    const url = cfg.links?.[element.dataset.link];
    if (url) element.href = url;
  });

  const plans = document.getElementById("plans");
  const plansToggle = document.getElementById("plansToggle");
  const plansArrow = document.getElementById("plansArrow");

  if (plans && plansToggle && plansArrow) {
    plansToggle.addEventListener("click", () => {
      const collapsed = plans.classList.toggle("collapsed");
      plansToggle.setAttribute("aria-expanded", String(!collapsed));
      plansArrow.textContent = collapsed ? "⌄" : "⌃";
    });
  }

  const postKey = "yasmin-privacy-v9-post";
  const likeButton = document.querySelector("[data-like]");
  const saveButton = document.querySelector("[data-save]");
  const likeCount = document.querySelector("[data-like-count]");
  const comments = document.getElementById("comments");

  function readState() {
    try {
      return JSON.parse(
        localStorage.getItem(postKey) ||
        '{"liked":false,"saved":false,"likes":0,"comments":[]}'
      );
    } catch {
      return { liked:false, saved:false, likes:0, comments:[] };
    }
  }

  function saveState(state) {
    localStorage.setItem(postKey, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderPost() {
    const state = readState();
    likeButton.classList.toggle("active", state.liked);
    likeButton.setAttribute("aria-pressed", String(state.liked));
    saveButton.classList.toggle("active", state.saved);
    saveButton.setAttribute("aria-pressed", String(state.saved));

    likeCount.textContent = 15200 + state.likes;

    comments.innerHTML = state.comments.map((comment) => `
      <div class="comment">
        <strong>${escapeHtml(comment.handle)}</strong>
        ${escapeHtml(comment.text)}
      </div>
    `).join("");
  }

  likeButton.addEventListener("click", () => {
    const state = readState();
    state.liked = !state.liked;
    state.likes += state.liked ? 1 : -1;
    saveState(state);
    renderPost();
  });

  saveButton.addEventListener("click", () => {
    const state = readState();
    state.saved = !state.saved;
    saveState(state);
    renderPost();
  });

  document.querySelector("[data-share]").addEventListener("click", async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copiado.");
      }
    } catch {}
  });

  document.getElementById("focusComment").addEventListener("click", () => {
    document.getElementById("commentHandle").focus();
  });

  document.getElementById("commentForm").addEventListener("submit", (event) => {
    event.preventDefault();

    let handle = document.getElementById("commentHandle").value.trim();
    const text = document.getElementById("commentText").value.trim();

    if (!handle.startsWith("@")) handle = "@" + handle;

    const state = readState();
    state.comments.push({ handle, text });
    saveState(state);

    event.target.reset();
    renderPost();
  });

  renderPost();
})();


// Visualização ampliada da capa e da foto do perfil.
(() => {
  const modal = document.getElementById("profileImageModal");
  const preview = document.getElementById("profileImagePreview");
  if (!modal || !preview) return;

  function openImage(src) {
    preview.src = src;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeImage() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    preview.src = "";
  }

  document.querySelectorAll("[data-open-profile-image]").forEach((button) => {
    button.addEventListener("click", () => {
      openImage(button.dataset.openProfileImage);
    });
  });

  modal.querySelectorAll("[data-close-profile-image]").forEach((element) => {
    element.addEventListener("click", closeImage);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("open")) {
      closeImage();
    }
  });
})();
