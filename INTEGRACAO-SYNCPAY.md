# Integração Pix SyncPay — arquivos para o GitHub

Estes arquivos conectam a página de assinaturas ao Worker da Cloudflare e corrigem o valor do acesso vitalício para **R$ 99,90**.

## Arquivos

- `config.js` — adiciona o endpoint do Worker e corrige o valor vitalício.
- `payment.js` — novo arquivo responsável pelo formulário e pela geração do Pix.
- `privacy.css` — mantém o visual atual e adiciona os estilos do formulário/Pix.
- `privacy/index.html` — substitui o checkout externo pelo formulário interno.

## Como enviar ao GitHub

1. Abra o repositório `Yasminsantospriv/site`.
2. Na raiz, substitua `config.js` e `privacy.css`.
3. Na raiz, adicione o novo arquivo `payment.js`.
4. Abra a pasta `privacy` e substitua `index.html`.
5. Aguarde o GitHub Pages publicar e atualize a página com `Ctrl + F5`.

## Teste

Abra a página `privacy`, clique em um plano e use dados reais do comprador. O site deverá mostrar o Pix copia-e-cola.

## Observação importante

A geração do Pix está integrada. A liberação automática do conteúdo após o pagamento ainda depende da próxima etapa: webhook validado + banco de dados + controle de acesso.
