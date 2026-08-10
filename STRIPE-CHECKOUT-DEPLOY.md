# Link2Nite - Stripe Checkout Deploy

Status em 2026-08-10:
- o codigo local ja tem fluxo real de Stripe Checkout + Billing Portal;
- o beta publicado so passa a expor `supportsPayments = true` depois que o Apps Script receber as chaves/Price IDs do Stripe e for republicado;
- a confirmacao de PRO nesta versao funciona por retorno do Checkout + refresh sob demanda na API do Stripe.

## 1. Arquivos envolvidos

- `beta/index.html`
- `link2nite-repo/beta/index.html`
- `Code-gs-COMPLETO.js`
- `link2nite-repo/Code-gs-COMPLETO.js`

## 2. Script Properties obrigatorias

Adicionar no projeto Apps Script publicado:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID_MONTHLY`
- `STRIPE_PRICE_ID_WEEKLY`

## 3. Script Properties opcionais

Se nao forem definidas, o codigo usa defaults apontando para o beta publico:

- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`
- `STRIPE_PORTAL_RETURN_URL`

Defaults atuais no codigo:

- success: `https://www.link2nite.com/beta/?checkout=success&session_id={CHECKOUT_SESSION_ID}`
- cancel: `https://www.link2nite.com/beta/?checkout=cancel`
- portal return: `https://www.link2nite.com/beta/?billing=return`

## 4. O que o fluxo faz

### Frontend

- abre Stripe Checkout para plano semanal ou mensal;
- confirma o retorno em `?checkout=success&session_id=...`;
- atualiza `PRO` no app;
- abre Stripe Billing Portal em `Settings` quando o usuario ja e PRO.

### Apps Script

- cria Checkout Session (`billing_create_checkout`);
- confirma status do Checkout (`billing_checkout_status`);
- consulta billing atual (`billing_status`);
- abre Billing Portal (`billing_create_portal`).

## 5. Ordem recomendada de deploy

1. Criar no Stripe os produtos/precos recorrentes semanal e mensal.
2. Copiar os `price_...` reais para:
   - `STRIPE_PRICE_ID_WEEKLY`
   - `STRIPE_PRICE_ID_MONTHLY`
3. Definir `STRIPE_SECRET_KEY` no Apps Script.
4. Publicar a nova versao do Apps Script contendo o `Code-gs-COMPLETO.js` atualizado.
5. Publicar o frontend atualizado em `/beta/`.
6. Validar o endpoint de capabilities:
   - esperado: `supportsPayments = true`
   - esperado: `supportsStripeCheckout = true`

## 6. QA obrigatorio depois de ligar o Stripe

Rodar no beta live:

1. Conta FREE -> abrir paywall -> cancelar checkout -> voltar sem quebrar sessao.
2. Conta FREE -> pagar com checkout de teste -> voltar com `PRO` ativo.
3. Abrir `Settings` com conta PRO -> `Manage billing` -> Stripe Billing Portal abre.
4. Voltar do portal -> app reflete o estado atualizado.
5. Reabrir o app em outro device com a mesma conta -> `PRO` continua ativo.

## 7. Limitacao importante desta versao

Esta implementacao ainda nao usa webhook assinado do Stripe.

Hoje o estado de `PRO` e confirmado por:

- retorno do Checkout com `session_id`; e
- refresh sob demanda da subscription/session salvas no Apps Script.

Isso e suficiente para beta controlado e QA real, mas para abertura publica maior o ideal e migrar a confirmacao final para um backend com webhook assinado do Stripe.
