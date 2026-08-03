(() => {
  "use strict";

  const cfg = window.SITE_CONFIG || {};
  const endpoint = cfg.payment?.verifyEndpoint || "";
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || "";
  const token = params.get("token") || "";

  const loading = document.getElementById("accessLoading");
  const denied = document.getElementById("accessDenied");
  const deniedMessage = document.getElementById("accessDeniedMessage");
  const content = document.getElementById("accessContent");
  const expiration = document.getElementById("contentExpiration");

  function showDenied(message) {
    loading.hidden = true;
    content.hidden = true;
    denied.hidden = false;
    if (message) deniedMessage.textContent = message;
  }

  function showContent(data) {
    loading.hidden = true;
    denied.hidden = true;
    content.hidden = false;

    if (data.expiraEm) {
      const date = new Date(data.expiraEm);
      expiration.textContent = Number.isNaN(date.getTime())
        ? ""
        : `Acesso válido até ${date.toLocaleDateString("pt-BR")}.`;
    } else {
      expiration.textContent = "Acesso sem data de expiração.";
    }
  }

  async function verify() {
    if (!endpoint || !id || !token) {
      showDenied("Este link de acesso está incompleto.");
      return;
    }

    try {
      const url = new URL(endpoint);
      url.searchParams.set("id", id);
      url.searchParams.set("token", token);

      const response = await fetch(url.toString(), {
        headers: { "Accept": "application/json" }
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok || !data.autorizado || data.produto !== "site") {
        if (data.expirado) {
          showDenied("O período de acesso deste plano terminou.");
        } else {
          showDenied("O pagamento ainda não foi confirmado ou o link não é válido.");
        }
        return;
      }

      showContent(data);
    } catch {
      showDenied("Não foi possível verificar o acesso agora. Tente novamente em instantes.");
    }
  }

  verify();
})();
