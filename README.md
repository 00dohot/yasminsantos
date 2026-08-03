# Yasmin Santos — V2 Beta (visual preservado)

Esta versão foi montada sobre a **V12 corrigida**. O visual e as interações existentes foram mantidos; as alterações estão restritas aos pontos combinados.

## O que permanece igual

- Página inicial, cards, menu lateral, Telegram interno e roleta.
- Página do Instagram com perfil, publicações, stories, reels, busca, direct e modais.
- Página Privacy com perfil, postagem, curtidas, comentários e visualização das imagens.
- Página de prévias, página do Telegram, imagens e identidade visual da V12.

## Alterações desta V2 Beta

### 1. Limite no final das páginas

Foi adicionado um encerramento visual discreto no fim da página inicial, Instagram, Privacy, Telegram, prévias e área exclusiva. A roleta continua em tela cheia.

### 2. Menu inferior do Instagram

No celular, a barra inferior do Instagram fica fixa na parte de baixo da tela. O conteúdo possui espaço final próprio e termina antes da barra, sem empurrá-la para cima durante a rolagem.

### 3. Dois produtos independentes

#### Conteúdos do site — vendidos na página inicial

- Mensal: R$ 20,00 — 30 dias.
- Trimestral: R$ 49,90 — 90 dias.
- Vitalício: R$ 99,90 — sem expiração.

Não foi criado login nem senha. Depois que a SyncPay confirmar o pagamento, o botão **Acessar conteúdo** libera a página `conteudo/` por meio de um token validado pelo Worker.

#### Acesso vendido na página Privacy

- Mensal: R$ 20,00 — 30 dias.
- Trimestral: R$ 49,90 — 90 dias.
- Seis meses: R$ 99,90 — 180 dias.

O plano vitalício não aparece no Privacy. Depois da confirmação, o site mostra somente o botão **Acesse aqui**. O link real de destino não fica no GitHub: ele é guardado no Secret `PRIVACY_TELEGRAM_URL` do Worker.

## Fluxo do pagamento

1. O comprador escolhe o plano.
2. Preenche nome, e-mail, CPF e celular.
3. O Worker gera o Pix na SyncPay.
4. O site aguarda a atualização do webhook.
5. Quando o status passa para `completed`, o Worker libera o destino correspondente ao produto comprado.

## Arquivos do site

Envie o conteúdo desta pasta para a raiz do repositório GitHub Pages. O endereço configurado é:

```text
https://yasminsantospriv.github.io/site/
```

Os endpoints ficam em `config.js`.

## Configuração do Cloudflare Worker

### Código

Use o arquivo:

```text
backend/worker.js
```

### Secrets

Mantenha os Secrets da SyncPay e crie também:

```text
SYNCPAY_CLIENT_ID
SYNCPAY_CLIENT_SECRET
WEBHOOK_SECRET
PRIVACY_TELEGRAM_URL
```

`PRIVACY_TELEGRAM_URL` contém o endereço real aberto pelo botão **Acesse aqui**. Ele não aparece no código público do site.

### Variáveis comuns

```text
ALLOWED_ORIGINS = https://yasminsantospriv.github.io
SITE_URL = https://yasminsantospriv.github.io/site
```

### Banco D1

Crie um banco D1, execute `backend/schema.sql` e vincule-o ao Worker com o nome exato:

```text
DB
```

O exemplo de configuração está em `backend/wrangler.example.toml`.

### Conferência

Depois do Deploy, abra `GET /api/status`. A resposta deve indicar que SyncPay, webhook, banco e destino do Privacy estão configurados.

## Rotas usadas

```text
GET  /api/status
POST /api/testar-syncpay
POST /api/criar-pagamento
POST /api/status-pagamento
POST /api/webhook/syncpay
GET  /api/verificar-acesso
GET  /api/acesso/telegram
```

## Proteção da futura página de fotos e vídeos

A página `conteudo/` só revela a interface após validar o pagamento. Contudo, um repositório público do GitHub não é adequado para armazenar mídia paga real. Quando as fotos e os vídeos definitivos forem adicionados, coloque-os em armazenamento privado, como Cloudflare R2, e faça o Worker entregá-los somente após validar o token.

Nesta Beta, a página exclusiva usa apenas os mesmos arquivos visuais públicos já presentes no projeto.
