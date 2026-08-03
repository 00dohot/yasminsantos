# Yasmin Site — V13.2 Beta

Esta versão foi construída diretamente sobre a **V12 corrigida**. O visual, os cards, menus e demais funções da V12 foram preservados; somente as correções solicitadas foram aplicadas.

## Planos separados

### Conteúdos do site
- Mensal: R$ 20,00 — 30 dias
- Trimestral: R$ 49,90 — 90 dias
- Vitalício: R$ 99,90 — sem expiração

Depois da confirmação do pagamento, o Worker libera o botão **Acessar conteúdo**. A pasta `conteudo/` contém apenas a estrutura da futura página protegida.

### Página Privacy
- Mensal: R$ 20,00 — 30 dias
- Trimestral: R$ 49,90 — 90 dias
- Seis meses: R$ 99,90 — 180 dias

O plano vitalício não aparece no Privacy. Depois da confirmação, o Worker libera somente o botão **Acesse aqui**, que redireciona para o endereço configurado no Secret `PRIVACY_TELEGRAM_URL`.

## Correções visuais da V13
- botão Suporte removido do Privacy;
- seletor de idioma Português, English e Español;
- comentários removidos;
- 15,2K curtidas;
- contadores no primeiro card do perfil;
- print enviado aplicado no último card;
- botões de assinatura do Privacy em degradê laranja;
- limites visuais no fim das páginas;
- menu inferior do Instagram fixo no celular, com o conteúdo terminando antes dele.

## Cloudflare Worker

Copie `backend/worker.js` para o seu Worker e configure:

### Secrets
- `SYNCPAY_CLIENT_ID`
- `SYNCPAY_CLIENT_SECRET`
- `WEBHOOK_SECRET`
- `PRIVACY_TELEGRAM_URL`

### Variáveis
- `ALLOWED_ORIGINS=https://yasminsantospriv.github.io`
- `SITE_URL=https://yasminsantospriv.github.io/site`

### Banco D1
1. Crie um banco D1.
2. Execute `backend/schema.sql`.
3. Vincule o banco ao Worker usando o nome exato `DB`.
4. Faça o Deploy do Worker.

## Segurança da área exclusiva

O GitHub Pages é público. Não envie fotos ou vídeos privados diretamente para o repositório, mesmo que a página esteja escondida. A verificação desta versão controla o acesso à página, mas a mídia real deve ser entregue futuramente por armazenamento privado, URLs temporárias ou outro backend protegido.

## Publicação

Envie para a raiz do repositório o **conteúdo interno** desta pasta, mantendo as subpastas. O arquivo `index.html` deve ficar na raiz.


## Ajuste V13.2 Beta
A página Privacy recebeu somente a identidade visual da referência: cabeçalho, planos, abas Fotos/Vídeos e card bloqueado sem imagem de fundo. Os valores e códigos dos planos permanecem inalterados.


## Ajuste V13.2 Beta
A página Privacy recebeu somente um ajuste fino responsivo no primeiro card para aproximar o mobile da referência, sem mudanças nos planos ou no backend.
