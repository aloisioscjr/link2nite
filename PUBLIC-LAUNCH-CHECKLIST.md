# Link2Nite - Public Launch Checklist

Status em 2026-08-10: beta live rechecado no ar; frontend publicado esta no build novo, backend live continua compativel com admin/user/shared state, mas ainda nao pronto para lancamento publico real.

## 0. Snapshot atual

Ja confirmado no beta live em `https://www.link2nite.com/beta/`:
- cards de venues carregam com as imagens corretas em `/beta/images/venues/`;
- detalhe de venue principal ja esta em ingles (`Music:`, `Map`, `Website`, `Tickets / reservations`);
- usuario publico nao ve ferramentas admin;
- `Team access` fica oculto para publico e so reaparece pelo gesto discreto + login autorizado;
- `Team access` com OTP por email funciona para `aloisioscjr@hotmail.com`;
- apos login owner, ficam visiveis apenas os blocos operacionais reais;
- `Sign out` volta corretamente para `Public mode` e esconde `Team access` de novo;
- onboarding publico com foto real funciona em contas consecutivas sem herdar slot antigo nem estourar `localStorage`;
- swipe real, match e chat basico tambem foram revalidados no live com duas contas locais no mesmo browser.
- Rechecado em `2026-08-10` no HTML publicado:
  - onboarding em ingles presente;
  - onboarding antigo em portugues ausente;
  - modal full-screen de match presente;
  - inbox/lista de matches presente;
  - `PUBLIC_REAL_LAUNCH_MODE = true`;
  - `Back to landing` ausente no HTML publicado.
- Rechecado em `2026-08-10` no endpoint de capabilities do Apps Script:
  - `supportsAdminAuth = true`
  - `supportsUserAuth = true`
  - `supportsSharedState = true`
  - `supportsAppBackend = true`
  - `supportsPhoneAuth = false`
  - `supportsSmsAuth = false`

Ainda bloqueia um lancamento publico real:
- sessao, dados de usuario, likes, matches, chats e moderacao continuam majoritariamente locais no navegador;
- o fluxo principal de demo/bots foi endurecido e revalidado no live, mas o app ainda depende de logica local de prototipo;
- checkout e PRO ainda nao sao produto real;
- protecoes atuais sao suficientes para beta/manual testing, nao para producao aberta.

## 1. Bloqueadores de launch

### 1.1 Autenticacao e acesso admin
- [ ] Endurecer a autenticacao admin para producao real.
- [ ] Remover dependencia de `localStorage` para definir sessao, privilegios e estado do usuario.
- [ ] Garantir que ferramentas administrativas nao possam ser reativadas via DevTools.

Nota:
- O beta live ja usa OTP por email via Apps Script e allowlist autorizada, mas a sessao ainda e orientada ao prototipo e nao deve ser tratada como auth de producao.

### 1.2 Persistencia real de dados
- [ ] Mover perfis, likes, matches, mensagens e presenca em venues para backend.
- [ ] Criar identificador real de usuario.
- [ ] Garantir sincronizacao entre dispositivos e sessoes.

Nota:
- O deploy live atual ja responde com `supportsSharedState = true`, entao existe base funcional para beta controlado.
- O que falta aqui e endurecimento/escala/consistencia de produto real, nao ausencia total de backend.

### 1.3 Remocao de comportamento de prototipo/demo
- [ ] Remover ou substituir textos publicos de demo no app.
- [x] Validar no live o hardening que desativa bots/crowd artificiais no fluxo publico principal.
- [ ] Remover dados falsos usados como experiencia principal, ou marcar claramente como beta fechado.
- [ ] Revisar o uso de bots antes de qualquer abertura publica.
- [ ] Revisar metricas e moderacao locais que hoje vivem so no navegador.

### 1.4 Pagamentos e PRO
- [x] Implementar no codigo o fluxo de Stripe Checkout + Billing Portal.
- [ ] Configurar chaves reais do Stripe e `price_id` no Apps Script publicado.
- [ ] Rodar QA end-to-end no beta live com checkout cancelado, checkout aprovado e retorno do Billing Portal.
- [ ] Definir o que e FREE e o que e PRO no produto real.

Nota:
- O guia operacional desta etapa ficou em `STRIPE-CHECKOUT-DEPLOY.md`.

### 1.5 Seguranca e operacao
- [ ] Definir politica de abuso, bloqueio, denuncia e verificacao com backend.
- [ ] Validar tratamento de dados pessoais.
- [ ] Configurar logs/telemetria reais para erro e uso.

### 1.6 Qualidade
- [ ] Criar uma suite minima de smoke tests automatizados.
- [ ] Validar o beta live em mobile e desktop antes do go-live.

## 2. O que ainda entrega cara de prototipo hoje

- O app ainda usa `localStorage` extensivamente para sessao, perfis, likes, mensagens, eventos, moderacao e fotos.
- Existem funcoes de distancia/status falsos no cliente.
- O fluxo de paywall ja aponta para Checkout real no codigo local, mas o deploy live ainda depende de configuracao Stripe no Apps Script.
- O fluxo de venue producer e essencialmente uma simulacao local.

## 3. Testes obrigatorios antes de abrir ao publico

### 3.1 Smoke test funcional
- [x] Onboarding completo com email comum.
- [x] Onboarding/login local com email admin autorizado.
- [x] Logout e retorno ao app.
- [x] Lista de venues carrega com todas as imagens corretas.
- [x] Filtros de venues funcionam.
- [x] Tela do venue abre, mostra "who's going" e CTA corretos.
- [x] Tela de swipe abre sem travar no estado vazio.
- [x] Swipe real com perfis disponiveis funciona sem travar.
- [x] Match aparece no fluxo esperado.
- [x] Chat abre e envia mensagens.
- [x] Perfil salva bio, fotos e preferencias.
- [x] Settings salva alteracoes sem quebrar sessao.

Nota:
- Passada dedicada concluida no beta live em 2026-07-30: `Smoke Live B` salvou bio, location, work, company, school, Instagram e uma 2a foto (`rooftop.png`), e o perfil reabriu apos reload com os mesmos campos e 2 fotos.
- Preferences tambem foram revalidadas apos reload no mesmo smoke: `Who you want to see = Everyone` (valor interno `both`) e `Max distance = 25 mi`.

### 3.2 Smoke test de permissao
- [x] Usuario comum nao ve nenhuma ferramenta admin.
- [x] Usuario comum nao consegue abrir tools admin nem por navegacao manual.
- [x] Revalidado no live que `Team access` fica oculto para publico e so aparece pelo gesto discreto + login autorizado.
- [x] Revalidado no live quais tools admin continuam visiveis apos o hardening `launch-demo-only`.

### 3.3 Smoke test visual
- [x] Viewport mobile `390x844` no Chrome desktop sem overflow horizontal.
- [x] Preflight adicional em Chrome com viewport `390x844` e `412x915`: `Home`, `Venue`, `Swipe`, `My profile`, `My night`, `Matches` e `Settings` sem overflow horizontal.
- [ ] Mobile Chrome Android.
- [ ] Mobile Safari iPhone.
- [x] Desktop Chrome.
- [ ] Desktop Safari ou Edge.
- [x] Refresh com cache/service worker nao quebra venue images nem telas.

### 3.3.1 Roteiro rapido para device real
Rodar no Android Chrome e no iPhone Safari:

1. Abrir `https://www.link2nite.com/beta/` em aba nova e fazer refresh forte.
2. Confirmar que a home abre sem zoom estranho, corte lateral ou nav inferior truncada.
3. Abrir o primeiro venue (`230 Fifth Rooftop Bar`) e confirmar:
   - foto visivel;
   - botoes `Map`, `Website`, `Tickets / reservations`, `Going tonight`, `Swipe (cards)` e `See who's going tonight` dentro da largura.
4. Abrir `Swipe (cards)` e confirmar:
   - card inteiro aparece;
   - botoes `✕`, `♥` e `👤` ficam tocaveis;
   - nenhum texto passa para fora da tela.
5. Abrir `⚙️ Settings` e depois `My profile`, verificando:
   - hero/foto principal sem corte lateral;
   - campos de bio/fotos visiveis;
   - scroll vertical normal ate o fim da tela.
6. Abrir `My night` e `Matches` e confirmar que a nav inferior continua fixa e visivel.
7. Voltar para `Tonight`, fechar e reabrir o browser, e confirmar que a sessao nao voltou com layout quebrado.
8. Registrar qualquer erro visivel com:
   - device;
   - browser;
   - tela;
   - screenshot;
   - se houve scroll lateral, CTA cortado ou botao impossivel de tocar.

### 3.4 Smoke test de deploy
- [x] `beta/index.html` e `link2nite-repo/beta/index.html` estao identicos.
- [x] `beta/images/venues/` e o espelho em `link2nite-repo/beta/images/venues/` estao sincronizados.
- [x] Beta live confere com a copia local apos publish.

## 3.5 Pendencias curtas antes de uma demo publica mais limpa

- [ ] Validar no live que o boot limpa estado local de demo (`Launch Smoke 1`, `PRO`, etc.) e abre o beta em estado neutro.
- [ ] Rodar uma passada manual em mobile real.
- [x] Decidir a copy / obrigatoriedade de telefone enquanto `supportsPhoneAuth` e `supportsSmsAuth` continuam `false` no deploy live.
- [ ] Ligar Twilio no Apps Script publicado e validar o fluxo real de SMS/telefone.
- [ ] Decidir se o beta vai ficar explicitamente como `closed beta / prototype` na copy publica.
- [x] Confirmar no live que bots/demo nao voltaram ao fluxo principal para visitantes externos.

Nota:
- Decisao atual em `2026-08-10`: telefone continua obrigatorio por seguranca, mas quando `supportsPhoneAuth = false` e `supportsSmsAuth = false` o app oculta os controles de SMS e salva o numero agora. O ultimo mile operacional ficou documentado em `SMS-TWILIO-DEPLOY.md`.

## 4. Melhorias que podem ficar para depois do launch

- [ ] Analytics mais sofisticado.
- [ ] Prioridade em cards.
- [ ] "See who liked you" completo.
- [ ] Dashboard real de venues/promoters.
- [ ] Fluxo de verificacao escalavel.

## 5. Ordem recomendada

1. Fechar a rodada de QA manual em Android Chrome e iPhone Safari.
2. Ligar Twilio no Apps Script publicado e validar o fluxo real de SMS/telefone.
3. Ligar Stripe no Apps Script publicado e validar o ciclo `checkout -> retorno -> portal`.
4. Decidir se o beta vai ficar explicitamente como `closed beta / prototype` na copy publica.
5. Se a meta imediata for tracao: abrir como beta controlado / assistido.
6. Se a meta for produto publico real: endurecer backend + auth primeiro.
7. So entao abrir para publico amplo.

## 6. Recomendacao pratica

Se a meta for ganhar tracao agora, o caminho mais seguro e:
- manter como beta fechado / prototipo assistido;
- limpar mais copy publica de demo;
- validar a UX com usuarios reais;
- e so depois investir no backend minimo para abrir ao publico.
