const SYNCPAY_BASE_URL = "https://api.syncpayments.com.br";
const DEFAULT_SITE_ORIGIN = "https://yasminsantospriv.github.io";
const DEFAULT_SITE_URL = "https://yasminsantospriv.github.io/site";

const CATALOG = Object.freeze({
  site: Object.freeze({
    mensal: {
      titulo: "Conteúdos do site — plano mensal",
      valorCentavos: 2000,
      dias: 30
    },
    trimestral: {
      titulo: "Conteúdos do site — plano trimestral",
      valorCentavos: 4990,
      dias: 90
    },
    vitalicio: {
      titulo: "Conteúdos do site — acesso vitalício",
      valorCentavos: 9990,
      dias: null
    }
  }),

  privacy: Object.freeze({
    mensal: {
      titulo: "Privacy — plano mensal",
      valorCentavos: 2000,
      dias: 30
    },
    trimestral: {
      titulo: "Privacy — plano trimestral",
      valorCentavos: 4990,
      dias: 90
    },
    semestral: {
      titulo: "Privacy — plano de 6 meses",
      valorCentavos: 9990,
      dias: 180
    }
  })
});

let tokenCache = {
  valor: null,
  expiraEm: 0
};

function allowedOrigins(env) {
  return new Set(
    String(env.ALLOWED_ORIGINS || DEFAULT_SITE_ORIGIN)
      .split(",")
      .map(value => value.trim())
      .filter(Boolean)
  );
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const origins = allowedOrigins(env);
  const allowedOrigin = origin && origins.has(origin)
    ? origin
    : [...origins][0] || DEFAULT_SITE_ORIGIN;

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(request, env, data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(request, env),
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}

function redirect(location, status = 302) {
  return new Response(null, {
    status,
    headers: {
      "Location": location,
      "Cache-Control": "no-store"
    }
  });
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validCpf(original) {
  const cpf = onlyDigits(original);

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const calculateDigit = quantity => {
    let sum = 0;
    for (let index = 0; index < quantity; index += 1) {
      sum += Number(cpf[index]) * (quantity + 1 - index);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return (
    calculateDigit(9) === Number(cpf[9]) &&
    calculateDigit(10) === Number(cpf[10])
  );
}

async function readResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 400) };
  }
}

function firstValue(object, names) {
  if (!object || typeof object !== "object") return null;
  for (const name of names) {
    const value = object[name];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return null;
}

function extractPayment(data) {
  const candidates = [
    data,
    data?.data,
    data?.result,
    data?.payment,
    data?.transaction,
    data?.response,
    data?.response?.data
  ].filter(value => value && typeof value === "object" && !Array.isArray(value));

  for (const item of candidates) {
    const pix = firstValue(item, [
      "pix_code",
      "pixCode",
      "paymentCode",
      "paymentcode",
      "payment_code",
      "payload"
    ]);

    const id = firstValue(item, [
      "identifier",
      "id",
      "idTransaction",
      "idtransaction",
      "transactionId",
      "transaction_id",
      "reference_id"
    ]);

    if (pix && id) {
      return {
        id: String(id),
        pixCopiaECola: String(pix),
        status: String(firstValue(item, ["status", "status_transaction"]) || "pending")
      };
    }
  }

  return null;
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  if (a.length !== b.length || a.length === 0) return false;

  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

function databaseConfigured(env) {
  return Boolean(env.DB && typeof env.DB.prepare === "function");
}

async function getSyncPayToken(env) {
  const now = Date.now();

  if (tokenCache.valor && now < tokenCache.expiraEm - 60_000) {
    return tokenCache.valor;
  }

  if (!env.SYNCPAY_CLIENT_ID || !env.SYNCPAY_CLIENT_SECRET) {
    throw new Error("As credenciais da SyncPay não estão configuradas.");
  }

  const response = await fetch(
    `${SYNCPAY_BASE_URL}/api/partner/v1/auth-token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: env.SYNCPAY_CLIENT_ID,
        client_secret: env.SYNCPAY_CLIENT_SECRET
      })
    }
  );

  const data = await readResponse(response);
  const accessToken = data?.access_token || data?.data?.access_token;

  if (!response.ok || !accessToken) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Autenticação recusada: HTTP ${response.status}`
    );
  }

  const expiresIn = Number(data?.expires_in || data?.data?.expires_in) || 3600;
  tokenCache = {
    valor: accessToken,
    expiraEm: now + expiresIn * 1000
  };

  return accessToken;
}

async function savePendingPayment(env, payment) {
  if (!databaseConfigured(env)) return false;

  await env.DB.prepare(`
    INSERT INTO payments (
      transaction_id,
      external_reference,
      product,
      plan,
      amount_cents,
      token_hash,
      status,
      access_expires_at,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL, ?, ?)
    ON CONFLICT(transaction_id) DO UPDATE SET
      external_reference = excluded.external_reference,
      product = excluded.product,
      plan = excluded.plan,
      amount_cents = excluded.amount_cents,
      token_hash = excluded.token_hash,
      updated_at = excluded.updated_at
  `).bind(
    payment.id,
    payment.externalReference,
    payment.product,
    payment.plan,
    payment.amountCents,
    payment.tokenHash,
    payment.createdAt,
    payment.createdAt
  ).run();

  return true;
}

async function findPayment(env, id) {
  if (!databaseConfigured(env)) return null;
  return env.DB.prepare(`
    SELECT
      transaction_id,
      product,
      plan,
      amount_cents,
      token_hash,
      status,
      access_expires_at,
      created_at,
      updated_at
    FROM payments
    WHERE transaction_id = ?
    LIMIT 1
  `).bind(id).first();
}

async function authorizePayment(env, id, token) {
  if (!id || !token || !databaseConfigured(env)) return null;

  const record = await findPayment(env, id);
  if (!record) return null;

  const tokenHash = await sha256(token);
  if (!safeEqual(tokenHash, record.token_hash)) return null;

  const status = String(record.status || "pending").toLowerCase();
  if (!["completed", "paid", "approved", "confirmed"].includes(status)) {
    return { ...record, authorized: false };
  }

  if (record.access_expires_at) {
    const expiration = Date.parse(record.access_expires_at);
    if (Number.isFinite(expiration) && Date.now() > expiration) {
      return { ...record, authorized: false, expired: true };
    }
  }

  return { ...record, authorized: true };
}

function accessExpiration(product, plan, completedAt = new Date()) {
  const days = CATALOG[product]?.[plan]?.dias;
  if (days === null || days === undefined) return null;

  const expiration = new Date(completedAt);
  expiration.setUTCDate(expiration.getUTCDate() + Number(days));
  return expiration.toISOString();
}

async function createPayment(request, env) {
  const origin = request.headers.get("Origin");
  if (origin && !allowedOrigins(env).has(origin)) {
    return json(request, env, { ok: false, erro: "Origem não autorizada." }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(request, env, { ok: false, erro: "O Body precisa estar em formato JSON." }, 400);
  }

  const product = String(body?.produto || "").trim().toLowerCase();
  const planCode = String(body?.plano || "").trim().toLowerCase();
  const plan = CATALOG[product]?.[planCode];

  if (!plan) {
    return json(request, env, { ok: false, erro: "Produto ou plano inválido." }, 400);
  }

  const name = String(body?.nome || "").trim().replace(/\s+/g, " ").slice(0, 120);
  const email = String(body?.email || "").trim().toLowerCase().slice(0, 160);
  const cpf = onlyDigits(body?.cpf);
  const phone = onlyDigits(body?.telefone);

  if (name.length < 3) {
    return json(request, env, { ok: false, erro: "Informe o nome completo." }, 400);
  }
  if (!validEmail(email)) {
    return json(request, env, { ok: false, erro: "Informe um e-mail válido." }, 400);
  }
  if (!validCpf(cpf)) {
    return json(request, env, { ok: false, erro: "Informe um CPF válido." }, 400);
  }
  if (phone.length < 10 || phone.length > 13) {
    return json(request, env, { ok: false, erro: "Informe um telefone válido com DDD." }, 400);
  }

  const amount = plan.valorCentavos / 100;
  const externalReference = crypto.randomUUID();
  const accessToken = randomToken();
  const tokenHash = await sha256(accessToken);
  const workerOrigin = new URL(request.url).origin;

  if (!env.WEBHOOK_SECRET) {
    return json(
      request,
      env,
      {
        ok: false,
        erro: "Configure o Secret WEBHOOK_SECRET antes de criar cobranças pela versão com liberação automática."
      },
      503
    );
  }

  if (!databaseConfigured(env)) {
    return json(
      request,
      env,
      {
        ok: false,
        erro: "Configure o banco D1 com a vinculação DB antes de receber pagamentos."
      },
      503
    );
  }

  const webhookUrl = `${workerOrigin}/api/webhook/syncpay?key=${encodeURIComponent(env.WEBHOOK_SECRET)}`;

  try {
    const bearerToken = await getSyncPayToken(env);
    const response = await fetch(
      `${SYNCPAY_BASE_URL}/api/partner/v1/cash-in`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${bearerToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          amount,
          description: plan.titulo,
          webhook_url: webhookUrl,
          client: {
            name,
            cpf,
            email,
            phone
          }
        })
      }
    );

    const data = await readResponse(response);
    const createdPayment = extractPayment(data);

    if (!response.ok || !createdPayment) {
      return json(
        request,
        env,
        {
          ok: false,
          erro: data?.message || data?.error || "A SyncPay não conseguiu gerar o Pix.",
          syncPayStatus: response.status,
          camposRecebidos: data && typeof data === "object" ? Object.keys(data).slice(0, 30) : []
        },
        502
      );
    }

    const createdAt = new Date().toISOString();
    await savePendingPayment(env, {
      id: createdPayment.id,
      externalReference,
      product,
      plan: planCode,
      amountCents: plan.valorCentavos,
      tokenHash,
      createdAt
    });

    return json(request, env, {
      ok: true,
      pagamento: {
        id: createdPayment.id,
        referencia: externalReference,
        produto: product,
        plano: planCode,
        titulo: plan.titulo,
        valor: amount,
        diasDeAcesso: plan.dias,
        status: createdPayment.status,
        pixCopiaECola: createdPayment.pixCopiaECola,
        accessToken,
        trackingEnabled: true
      }
    });
  } catch (error) {
    return json(
      request,
      env,
      {
        ok: false,
        erro: error?.message || "Não foi possível conectar à SyncPay."
      },
      502
    );
  }
}

async function paymentStatus(request, env) {
  if (!databaseConfigured(env)) {
    return json(request, env, { ok: false, erro: "O banco D1 ainda não está configurado." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(request, env, { ok: false, erro: "Requisição inválida." }, 400);
  }

  const id = String(body?.id || "").trim();
  const token = String(body?.token || "").trim();
  const record = await authorizePayment(env, id, token);

  if (!record) {
    return json(request, env, { ok: false, erro: "Pagamento não encontrado." }, 404);
  }

  const siteUrl = String(env.SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, "");
  const status = String(record.status || "pending").toLowerCase();
  const completed = ["completed", "paid", "approved", "confirmed"].includes(status);

  let accessUrl = "";
  if (completed && record.authorized) {
    if (record.product === "privacy") {
      accessUrl = `${new URL(request.url).origin}/api/acesso/telegram?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;
    } else if (record.product === "site") {
      accessUrl = `${siteUrl}/conteudo/?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;
    }
  }

  return json(request, env, {
    ok: true,
    status,
    produto: record.product,
    plano: record.plan,
    autorizado: Boolean(record.authorized),
    expirado: Boolean(record.expired),
    expiraEm: record.access_expires_at || null,
    accessUrl
  });
}

async function verifyAccess(request, env) {
  const url = new URL(request.url);
  const id = String(url.searchParams.get("id") || "").trim();
  const token = String(url.searchParams.get("token") || "").trim();
  const record = await authorizePayment(env, id, token);

  if (!record) {
    return json(request, env, { ok: false, autorizado: false }, 404);
  }

  return json(request, env, {
    ok: true,
    autorizado: Boolean(record.authorized),
    expirado: Boolean(record.expired),
    status: record.status,
    produto: record.product,
    plano: record.plan,
    expiraEm: record.access_expires_at || null
  });
}

async function telegramAccess(request, env) {
  const url = new URL(request.url);
  const id = String(url.searchParams.get("id") || "").trim();
  const token = String(url.searchParams.get("token") || "").trim();
  const record = await authorizePayment(env, id, token);

  if (!record || !record.authorized || record.product !== "privacy") {
    return new Response("Acesso não autorizado.", { status: 403 });
  }

  const telegramUrl = String(env.PRIVACY_TELEGRAM_URL || "").trim();
  if (!telegramUrl) {
    return new Response("O endereço do grupo VIP ainda não foi configurado.", { status: 503 });
  }

  return redirect(telegramUrl);
}

async function syncPayWebhook(request, env) {
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("key") || "";
  const authorization = request.headers.get("Authorization") || "";
  const bearerSecret = authorization.replace(/^Bearer\s+/i, "").trim();
  const validSecret = Boolean(
    env.WEBHOOK_SECRET &&
    (safeEqual(querySecret, env.WEBHOOK_SECRET) || safeEqual(bearerSecret, env.WEBHOOK_SECRET))
  );

  if (!validSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!databaseConfigured(env)) {
    return new Response("Database not configured", { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const data = body?.data || body || {};
  const id = String(firstValue(data, [
    "id",
    "identifier",
    "idTransaction",
    "idtransaction",
    "transactionId",
    "transaction_id"
  ]) || "").trim();

  const status = String(firstValue(data, [
    "status",
    "status_transaction",
    "transaction_status"
  ]) || "pending").toLowerCase();

  if (!id) {
    return new Response("Missing transaction id", { status: 400 });
  }

  const record = await findPayment(env, id);
  if (!record) {
    return new Response("Unknown transaction", { status: 404 });
  }

  const receivedAmount = Number(firstValue(data, ["amount", "valor", "value"]));
  if (Number.isFinite(receivedAmount) && Math.round(receivedAmount * 100) !== Number(record.amount_cents)) {
    return new Response("Amount mismatch", { status: 409 });
  }

  const completedStatuses = new Set(["completed", "paid", "approved", "confirmed"]);
  const normalizedStatus = completedStatuses.has(status) ? "completed" : status;
  const now = new Date();
  const expiration = normalizedStatus === "completed"
    ? accessExpiration(record.product, record.plan, now)
    : record.access_expires_at;

  await env.DB.prepare(`
    UPDATE payments
    SET status = ?, access_expires_at = ?, updated_at = ?
    WHERE transaction_id = ?
  `).bind(normalizedStatus, expiration, now.toISOString(), id).run();

  return new Response(JSON.stringify({ recebido: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env)
      });
    }

    if (url.pathname === "/api/status" && request.method === "GET") {
      return json(request, env, {
        ok: true,
        servico: "yasmin-backend-v2-beta",
        syncPayConfigurada: Boolean(env.SYNCPAY_CLIENT_ID && env.SYNCPAY_CLIENT_SECRET),
        webhookConfigurado: Boolean(env.WEBHOOK_SECRET),
        bancoConfigurado: databaseConfigured(env),
        telegramVipConfigurado: Boolean(env.PRIVACY_TELEGRAM_URL),
        catalogo: Object.entries(CATALOG).flatMap(([product, plans]) =>
          Object.entries(plans).map(([code, plan]) => ({
            produto: product,
            codigo: code,
            titulo: plan.titulo,
            valor: plan.valorCentavos / 100,
            dias: plan.dias
          }))
        )
      });
    }

    if (url.pathname === "/api/testar-syncpay" && request.method === "POST") {
      try {
        await getSyncPayToken(env);
        return json(request, env, { ok: true, autenticado: true });
      } catch (error) {
        return json(request, env, { ok: false, autenticado: false, erro: error.message }, 502);
      }
    }

    if (url.pathname === "/api/criar-pagamento" && request.method === "POST") {
      return createPayment(request, env);
    }

    if (url.pathname === "/api/status-pagamento" && request.method === "POST") {
      return paymentStatus(request, env);
    }

    if (url.pathname === "/api/verificar-acesso" && request.method === "GET") {
      return verifyAccess(request, env);
    }

    if (url.pathname === "/api/acesso/telegram" && request.method === "GET") {
      return telegramAccess(request, env);
    }

    if (url.pathname === "/api/webhook/syncpay" && request.method === "POST") {
      return syncPayWebhook(request, env);
    }

    return json(request, env, { ok: false, erro: "Rota não encontrada." }, 404);
  }
};
