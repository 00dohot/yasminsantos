# Yasmin Site Premium V2

Abra index.html para testar.

Edite todos os links em config.js.

Troque as imagens em assets/images e altere os caminhos nos HTML.

Envie todos os arquivos para a raiz do repositório GitHub; a Vercel publicará automaticamente.

## Galeria com navegação
Na página `pages/instagram.html`, cada botão `.gallery-item` representa uma publicação.

Para trocar uma foto:
```html
<img src="../assets/images/minha-foto.jpg" alt="Descrição">
```

Para trocar a legenda, edite:
```html
data-caption="Minha legenda"
```

Ao tentar comentar, o visitante é encaminhado ao Instagram real configurado em
`config.js`. O site não possui tela falsa de login e não coleta credenciais.


## V4 — Página Privacy e checkouts SynkPay

A página interna está em:

`pages/privacy.html`

### Configurar os links de checkout

Abra `config.js` e altere:

```js
subscription: {
  plans: {
    monthly: {
      checkoutUrl: "LINK_DO_CHECKOUT_MENSAL"
    },
    quarterly: {
      checkoutUrl: "LINK_DO_CHECKOUT_TRIMESTRAL"
    },
    lifetime: {
      checkoutUrl: "LINK_DO_CHECKOUT_VITALICIO"
    }
  }
}
```

Cada plano possui seu próprio botão e seu próprio checkout.

### Configurar suporte e perfil oficial

No mesmo `config.js`:

```js
privacyReal: "LINK_DO_PERFIL_PRIVACY",
support: "LINK_DO_SUPORTE"
```

### Funcionamento

1. O visitante abre a prévia da Privacy dentro do site.
2. Escolhe um plano.
3. Confirma que será redirecionado.
4. O checkout externo da SynkPay abre em uma nova aba.
5. A entrega do acesso é administrada pela configuração do produto/checkout.


## V5 — Privacy como página independente

A página `pages/privacy.html` agora possui identidade própria e não utiliza o
`style.css` do site principal.

Arquivos exclusivos:
- `privacy.css`
- `privacy.js`
- `pages/privacy.html`

Ela possui:
- cabeçalho branco e marca Privacy;
- capa e perfil;
- status ao vivo;
- biografia expansível;
- assinaturas selecionáveis;
- botão único que usa o checkout do plano selecionado;
- contadores;
- filtros de fotos, vídeos e pagos;
- grade bloqueada;
- benefícios e instruções;
- confirmação antes do redirecionamento para a SynkPay.

Os preços, textos e checkouts continuam editáveis em `config.js`.


## V6 — Interações nas publicações

A página Privacy agora permite:

- curtir e remover curtida;
- salvar e remover dos salvos;
- compartilhar pelo celular ou copiar o link;
- abrir uma janela de comentários;
- manter curtidas e salvos no navegador usando `localStorage`.

Ao tentar publicar um comentário, o visitante recebe um aviso e pode continuar
na plataforma oficial configurada. Não existe tela falsa de login e o site não
coleta usuário, senha ou dados de autenticação.


## V7

Alterações:

- URLs limpas: `/instagram/`, `/telegram/`, `/previas/`, `/privacy/` e `/roleta/`;
- TikTok removido;
- curtidas com valores iniciais e persistência no navegador;
- comentários locais com @, foto opcional e texto;
- comentários e curtidas salvos usando `localStorage`.

Importante: como o projeto é estático, curtidas e comentários ficam apenas no
navegador de cada visitante. Para uma contagem global compartilhada entre todos,
seria necessário conectar um banco de dados.
