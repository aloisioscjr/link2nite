# Link2Nite - Codex Handoff

## Atualizacao operacional (Codex - 2026-08-13, Apps Script Versao 11 publicado + bug de status validado no live)

Depois do commit `e0e7525` (`Fix stale Stripe checkout status for free users`), o Apps Script foi republicado manualmente no projeto `Link2NiteWaitlistAPI`:

- deployment ativo atualizado com sucesso para:
  - `Versao 11 em 13 de ago. de 2026, 15:16`
- URL publicada permaneceu a mesma:
  - `https://script.google.com/macros/s/AKfycbxnPAbUdYLuTL4dN0x0Z0nJIVjmqZECNfiP-o3OVqy7ThzgGCLG9Gf_mr-FJZKOLVDp0g/exec`

Validacoes feitas logo apos a publicacao:

- endpoint live de capabilities continuou saudavel:
  - `{"ok":true,"supportsAdminAuth":true,"supportsUserAuth":true,"supportsSharedState":true,"supportsAppBackend":true,"supportsPhoneAuth":false,"supportsSmsAuth":false,"supportsPayments":true,"supportsStripeCheckout":true,"feature":"shared_state"}`
- beta live reaberto em conta `AJ`:
  - `Settings` passou de `PRO status = Checkout started` para `PRO status = Inactive`
  - badge permaneceu `FREE`

Leitura operacional disso:

- o fix do backend para limpar / migrar rows antigas presas em `checkout_created` ja esta publicado no live;
- o fix de frontend para nao exibir mais `Checkout started` em conta `FREE` tambem foi validado no beta live;
- pagamentos e Stripe Checkout seguem ativos no deploy atual;
- phone/SMS continuam desligados.

## Atualizacao operacional (Codex - 2026-08-13, fix local para status travado "Checkout started")

Bug observado no beta live em conta `FREE`:

- depois de abrir o Stripe Checkout e voltar sem concluir pagamento, `Settings` podia continuar mostrando `PRO status = Checkout started`;
- isso era confuso porque a conta seguia `FREE` e a cobranca nao tinha sido concluida.

Correcao aplicada localmente nas duas arvores (`beta/` raiz + `link2nite-repo/`):

- `beta/index.html` / `link2nite-repo/beta/index.html`
  - `checkout=cancel` agora tenta `refreshBillingState({refresh:true})` ao voltar do Stripe;
  - se ainda houver `proStatus = checkout_created` local numa conta nao-PRO, o frontend limpa esse estado do `userAuthSession`;
  - `Settings` nao exibe mais o label literal `Checkout started`; contas nao-PRO voltam para `Inactive` por padrao.
- `Code-gs-COMPLETO.js` / `link2nite-repo/Code-gs-COMPLETO.js`
  - `billing_create_checkout` para de persistir o status sintetico `checkout_created` e passa a salvar o status real retornado pela sessao Stripe (`payment_status` / `status`);
  - `billing_status` agora auto-refresh legacy rows que ainda estejam com `checkout_created` + `stripeCheckoutSessionId`, para migrar contas antigas presas nesse estado.

Estado operacional desta correcao:

- o fix foi aplicado localmente e deve ser commitado/pushado para GitHub;
- para a parte de backend valer no live, ainda e necessario republicar o Apps Script depois do push.

## Atualizacao operacional (Codex - 2026-08-11, Apps Script republicado com sucesso)

Publicacao manual feita no projeto `Link2NiteWaitlistAPI` em `2026-08-11`:

- projeto aberto no Google Apps Script:
  - `https://script.google.com/home/projects/11UJ8qPuhWH1SNpXfTvzze-jiXupfj6iHPDrT94bCae60hJSJTBo4BK8s/edit`
- o `Codigo.gs` remoto foi alinhado ao `Code-gs-COMPLETO.js` local;
- durante a primeira tentativa de publish, o editor do Apps Script deixou duas linhas espurias no fim do arquivo:
  - `800`
  - `data.displayName || data.username`
- isso quebrou o endpoint live com:
  - `ReferenceError: data is not defined (line 2192, file "Codigo")`
- o arquivo remoto foi corrigido em seguida, salvo novamente, e o deployment foi republicado com sucesso como:
  - `Versao 10 em 11 de ago. de 2026, 11:14`

Validacao live feita apos a `Versao 10`:

- endpoint consultado com cache-buster:
  - `https://script.google.com/macros/s/AKfycbxnPAbUdYLuTL4dN0x0Z0nJIVjmqZECNfiP-o3OVqy7ThzgGCLG9Gf_mr-FJZKOLVDp0g/exec?action=capabilities&feature=shared_state&cb=...`
- resposta recebida:
  - `{"ok":true,"supportsAdminAuth":true,"supportsUserAuth":true,"supportsSharedState":true,"supportsAppBackend":true,"supportsPhoneAuth":false,"supportsSmsAuth":false,"supportsPayments":true,"supportsStripeCheckout":true,"feature":"shared_state"}`

Leitura operacional disso:

- o backend live voltou a responder normalmente;
- auth por email, shared state e pagamentos continuam live;
- phone/SMS continuam desligados no deploy atual (`supportsPhoneAuth = false`, `supportsSmsAuth = false`);
- o hotfix publicado no Apps Script agora inclui:
  - prioridade de `displayName` publico sobre `username` interno em `handleSharedProfileUpsert_`;
  - fallback limpo em `ensureAccountRecordForEmail_`, sem reaproveitar `opts.username` quando nao existe profile legado para o email.

Proximo passo recomendado depois desta publicacao:

1. QA manual em device real:
   - criar/entrar em duas contas;
   - confirmar nome publico correto;
   - confirmar match reciproco no `Who's going`;
   - confirmar bottom nav sem cortar conteudo no iPhone Safari.
2. So depois decidir se abrimos mais testers externos.

## Atualizacao operacional (Codex - 2026-08-11, frontend live validado + backend local ainda pendente de publish - historico antes da republicacao)

Validacao feita depois do commit `7efb32a` (`Fix public names, venue likes, and mobile safe area`):

- o HTML publicado em `https://www.link2nite.com/beta/` ja contem os marcadores do frontend novo:
  - `function togglePlaceLike(`
  - `function getPublicNameFallback(`
  - `safe-area-inset-bottom) + 168px`
- leitura pratica disso:
  - o hotfix do fluxo `Who's going` -> like -> match por venue ja entrou no frontend publicado;
  - o fallback de nome publico para nao expor sufixos tecnicos tipo `Nina 2` ja entrou no frontend publicado;
  - o aumento de safe-area / espaco do bottom nav no mobile ja entrou no frontend publicado.

Capabilities live revalidadas no Apps Script publicado:

- endpoint consultado:
  - `https://script.google.com/macros/s/AKfycbxnPAbUdYLuTL4dN0x0Z0nJIVjmqZECNfiP-o3OVqy7ThzgGCLG9Gf_mr-FJZKOLVDp0g/exec?action=capabilities&feature=shared_state`
- resposta em `2026-08-11`:
  - `{"ok":true,"supportsAdminAuth":true,"supportsUserAuth":true,"supportsSharedState":true,"supportsAppBackend":true,"supportsPhoneAuth":false,"supportsSmsAuth":false,"supportsPayments":true,"supportsStripeCheckout":true,"feature":"shared_state"}`

Leitura operacional disso:

- checkout / pagamentos ja estao live no backend publicado (`supportsPayments = true`);
- auth por email e shared state seguem live;
- telefone / SMS ainda **nao** estao live (`supportsPhoneAuth = false`, `supportsSmsAuth = false`);
- as mudancas locais recentes em `Code-gs-COMPLETO.js` ainda **dependem de republicar o Apps Script** para refletirem no backend publicado, principalmente:
  - priorizar `displayName` publico sobre `username` interno;
  - impedir que um email/conta novo herde `username` interno stale do device quando nao existe profile legado para esse email.

Proximo passo operacional recomendado depois desta validacao:

1. republicar o Apps Script com o `Code-gs-COMPLETO.js` atual;
2. revalidar o endpoint live de capabilities;
3. so depois rodar QA manual em device real para confirmar:
   - nome publico correto;
   - match reciproco no `Who's going`;
   - bottom nav sem cortar o conteudo no iPhone Safari.

## Atualizacao operacional (Codex - 2026-08-10, decisao de copy publica + observacao de deploy)

Decisao operacional consolidada:

- a copy publica do app fica neutra;
- nao vamos exibir label/badge de `closed beta` ou `prototype` para o publico neste momento;
- as frases internas restantes do owner foram limpas para texto neutro (`team review`, `venue and promoter tools`).

Observacao importante de deploy:

- este workspace **nao** tem `.openai/hosting.json`;
- portanto, nao existe configuracao local de deploy via Sites neste repo;
- tratar `git push` e publish live como etapas separadas ate o fluxo de publicacao estar completamente mapeado;
- sempre revalidar `https://www.link2nite.com/beta/` depois de push, porque o publicado pode nao refletir imediatamente o ultimo commit do GitHub.

## Atualizacao operacional (Codex - 2026-08-10, QA live de boot neutro + limpeza de debug publico)

Validacao live feita no beta publicado em browser limpo:

- no in-app browser limpo, `https://www.link2nite.com/beta/` abriu em onboarding neutro em ingles;
- nao apareceu `Team access`;
- nao apareceram tools admin;
- `Back to landing` continuou ausente;
- isso fecha o item do checklist sobre boot neutro sem herdar estado demo no browser limpo.

Mudanca local aplicada em seguida:

- `beta/index.html` agora suprime `console.log` de debug de imagem quando `PUBLIC_REAL_LAUNCH_MODE = true`;
- objetivo: reduzir ruido de producao no console publico, sem perder `console.error` reais.

## Atualizacao operacional (Codex - 2026-08-10, preflight automatizado + fallback publico do paywall)

Mudancas locais aplicadas para endurecer a checagem antes de cada publish:

- `beta/index.html` agora troca o fallback do paywall quando billing nao responder:
  - `Checkout is not enabled yet on this build.` -> `Checkout is temporarily unavailable right now.`
  - `Weekly PRO coming soon` / `Monthly PRO coming soon` -> `Weekly PRO temporarily unavailable` / `Monthly PRO temporarily unavailable`
- Script novo: `smoke-public-preflight.ps1`
  - valida paridade local;
  - valida markers obrigatorios do build local;
  - valida ausencia de strings publicas antigas;
  - faz request no beta live;
  - faz request no endpoint live de capabilities.

Leitura operacional disso:

- isso fecha o item da checklist `Criar uma suite minima de smoke tests automatizados`;
- o mesmo script pode ser usado depois do ultimo mile do Twilio com:
  - `.\smoke-public-preflight.ps1 -RequirePhoneAuth -RequireSmsAuth`
- rodada validada em `2026-08-10`:
  - `.\smoke-public-preflight.ps1` passou contra local + live;
  - `supportsPayments = true`;
  - `supportsStripeCheckout = true`;
  - `supportsPhoneAuth = false`;
  - `supportsSmsAuth = false`.

## Atualizacao operacional (Codex - 2026-08-10, limpeza final de copy publica "beta")

Mudanca local aplicada para reduzir a cara de prototipo no fluxo publico:

- `beta/index.html` agora remove `beta` de toasts/erros publicos que ainda apareciam em fluxo real de conta:
  - `Couldn't sync the shared beta right now.` -> `Couldn't sync Link2Nite right now.`
  - `Enter a valid email to sync with the shared beta.` -> `Enter a valid email to sync your Link2Nite account.`
  - `Username changes aren't live yet on the shared beta.` -> `Display name changes aren't live yet.`
- `link2nite-repo/beta/index.html` foi resincronizado via `sync-beta-parity.ps1`.

Leitura operacional disso:

- ainda existem referencias a `beta` em blocos internos/admin e no proprio path publicado `/beta/`, o que e esperado;
- a limpeza acima foi focada apenas no que vazava para usuarios comuns no fluxo publico.

## Atualizacao operacional (Codex - 2026-08-10, UX publica de telefone + ultimo mile Twilio)

Mudancas locais aplicadas para limpar a UX publica enquanto o SMS ainda nao esta live:

- `beta/index.html` agora:
  - esconde os botoes de `Send SMS code` / `Verify phone` quando `supportsPhoneAuth` e `supportsSmsAuth` estao `false`;
  - esconde o campo de codigo SMS enquanto o provider nao estiver ativo;
  - continua exigindo telefone no onboarding, mas com copy alinhada ao comportamento real: o numero e salvo agora e a verificacao por SMS aparece automaticamente quando estiver live.
- Guia operacional novo: `SMS-TWILIO-DEPLOY.md`

Leitura operacional disso:

- o backend de SMS ja esta pronto no `Code-gs-COMPLETO.js`;
- o beta live so vai expor `supportsPhoneAuth = true` e `supportsSmsAuth = true` depois que o Apps Script publicado receber:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_FROM_NUMBER` **ou** `TWILIO_MESSAGING_SERVICE_SID`
- depois de definir essas Script Properties, ainda e necessario republicar o Apps Script e revalidar o endpoint de capabilities.

## Atualizacao operacional (Codex - 2026-08-10, Stripe checkout preparado no codigo)

Mudancas locais aplicadas para tirar o `PRO` do modo demo e preparar checkout real:

- `beta/index.html` agora:
  - abre Stripe Checkout real pelo paywall;
  - confirma retorno `?checkout=success&session_id=...`;
  - abre Stripe Billing Portal em `Settings` para contas `PRO`;
  - mostra status de billing nas settings sem desligar `PRO` localmente.
- `Code-gs-COMPLETO.js` agora:
  - cria Checkout Session (`billing_create_checkout`);
  - confirma checkout (`billing_checkout_status`);
  - consulta billing atual (`billing_status`);
  - abre Billing Portal (`billing_create_portal`);
  - persiste campos de billing na sheet de contas.
- O refresh de billing no Apps Script foi reforcado para recuperar o estado tambem pela `checkout_session` salva, nao apenas pela subscription. Isso reduz o risco de o usuario pagar e o browser falhar antes de confirmar o retorno.
- Guia operacional novo: `STRIPE-CHECKOUT-DEPLOY.md`

Leitura operacional disso:

- o checkout real ja esta preparado no codigo local;
- o beta live so vai expor `supportsPayments = true` depois que o Apps Script publicado receber:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PRICE_ID_MONTHLY`
  - `STRIPE_PRICE_ID_WEEKLY`
- esta versao ainda nao usa webhook assinado do Stripe; para beta controlado e aceitavel, para publico amplo o ideal e migrar a confirmacao final para backend com webhook validado.

Lembrar a regra de paridade descrita mais abaixo em **Duas árvores**:

- editar `beta/index.html` na raiz;
- tratar `link2nite-repo/beta/index.html` como espelho por copia/script;
- apos qualquer mudanca no beta, sincronizar tambem o espelho antes de push.

## Atualizacao operacional (Codex - 2026-08-10, verificacao live de launch readiness)

Checagem objetiva feita no estado publicado e no workspace local antes de seguir para abertura publica maior:

- `git status --short --branch` estava limpo em `main`.
- `git log --oneline -5` local:
  - `9516d50` - Translate onboarding flow to English
  - `f12c2af` - Improve match inbox and mobile chat UX
  - `b721fd3` - Add full-screen match celebration modal
  - `a094714` - Fix-duplicate-display-names-and-hide-internal-ids
  - `f9efb10` - Fix-PT-onboarding-copy-and-photo-step-resume-flow
- `check-beta-parity.ps1` confirmou paridade total:
  - `beta/index.html` = `link2nite-repo/beta/index.html`
  - **9907** linhas em cada copia
  - **29** JPGs em `beta/images/venues/` e no espelho
- O HTML live em `https://www.link2nite.com/beta/` respondeu `200` e confirmou marcadores do build novo:
  - onboarding em ingles presente;
  - strings antigas de onboarding em portugues ausentes;
  - `PUBLIC_REAL_LAUNCH_MODE = true`;
  - inbox de matches presente (`match-inbox`, `match-thread-row`, `nav-matches-badge`);
  - modal full-screen de match presente (`match-modal`, `openChatFromMatchCelebration`);
  - service worker presente;
  - string `Back to landing` ausente no HTML publicado.
- O endpoint live de capabilities do Apps Script respondeu `200` com:
  - `{"ok":true,"supportsAdminAuth":true,"supportsUserAuth":true,"supportsSharedState":true,"supportsAppBackend":true,"supportsPhoneAuth":false,"supportsSmsAuth":false,"feature":"admin_auth"}`

Leitura operacional disso:

- O frontend publicado e o backend publicado estao alinhados para:
  - admin auth por email;
  - user auth por email;
  - shared state de perfis / likes / matches / chat.
- A verificacao por telefone / SMS **ainda nao esta live** no deploy atual do Apps Script.
- O beta esta muito mais perto de um **beta publico controlado**, mas ainda nao de um "produto publico real".

Proximo passo recomendado apos esta verificacao:

1. Rodar QA manual em **device real**:
   - Android Chrome
   - iPhone Safari
2. Decidir a UX/copy do onboarding enquanto `supportsPhoneAuth = false`:
   - manter telefone como campo obrigatorio com mensagem clara de que SMS ainda nao valida nesta versao; ou
   - aliviar a copy publica ate o SMS realmente entrar no backend live.
3. So depois abrir para mais testers externos.

## Atualizacao publicada (Codex - 2026-07-30, hardening para public launch)

Mudancas aplicadas em `beta/index.html`, sincronizadas para o espelho e validadas no beta live:

- `PUBLIC_REAL_LAUNCH_MODE = true` ativado no app.
- Limpeza automatica de artefatos de demo/smoke no boot:
  - perfis bot;
  - perfis `Launch Smoke ...`;
  - emails `@link2nite.test`;
  - likes, matches, messages e attendance relacionados a esses perfis;
  - sessao/localStorage de smoke quando detectada.
- Fluxo demo desativado no modo publico:
  - sem `seedDemoCrowd()` no load;
  - sem `ensureDemoBots()` no load;
  - sem fallback de bots em `who's going`;
  - sem fallback de bots no swipe;
  - sem match fake de 5% ao curtir bot.
- Ferramentas `launch-demo-only` agora ficam ocultas mesmo para admin autenticado:
  - `Beta data`
  - `Demo bots`
  - `Analytics (MVP)`
  - `Events (debug)`
  - `Image Debug`
  - FABs/paineis de demo/debug
- `Team access` nao fica mais visivel para publico no `Settings`.
- Para abrir o login do owner no build publico atual, usar o gesto discreto: tocar/clicar **7 vezes** no titulo `L2N Link2Nite`; isso revela `Team access` na sessao/dispositivo atual e continua respeitando o login por email autorizado.
- Acoes de reset/reseed demo agora abortam com toast no modo publico real.
- Estado esperado apos publish: os blocos de demo/debug marcados como `launch-demo-only` ficam ocultos mesmo para admin; continuam esperados para admin apenas os blocos operacionais reais, como `Venue tools - add a new venue/event`, `Admin (local)`, `Moderation (local)` e `Venue Photos (manual)`.

Importante:
- Isso e hardening de UX/fluxo do prototipo, nao seguranca de producao.
- Ainda falta backend/auth persistente para considerar launch publico real seguro.
- O beta live ja foi revalidado sem crowd/bots artificiais no fluxo publico principal.

## Última validação live (Codex — 2026-07-30, beta público + team access)

Validação manual feita no beta live em `https://www.link2nite.com/beta/`, com foco em estado público, imagens de venues, fluxo de `Team access` e smoke visual mobile.

### Confirmado no live - estado público
- O beta carregou com UI pública limpa nas áreas `Tonight`, `My night`, `Matches` e `Settings`.
- O título público aparece como `Link2Nite`.
- As ferramentas administrativas **não** aparecem para público deslogado.
- `Team access` não aparece no `Settings` público por padrão.
- O detalhe do venue `230 Fifth Rooftop Bar` mostra labels em inglês:
  - `Music:`
  - `Map`
  - `Website`
  - `Tickets / reservations`
- As **29** imagens de venues em `/beta/images/venues/` carregaram corretamente no beta live após percorrer o feed.
- O fluxo público principal não voltou a depender de crowd/bots artificiais:
  - `who's going` sem fallback fake;
  - swipe sem injeção de demo crowd;
  - estados vazios honestos quando não há perfis.
- O endpoint de auth do Apps Script respondeu com:
  - `{"ok":true,"supportsAdminAuth":true,"feature":"admin_auth"}`

### Confirmado no live - fluxo owner/admin
- Pedido de código para `aloisioscjr@hotmail.com` funcionou no beta live com a mensagem:
  - `If this email is authorized, a sign-in code was sent.`
- O código OTP foi aceito.
- Após verificação, o app mudou para:
  - `Admin unlocked`
  - `Signed in as aloisioscjr@hotmail.com. Admin tools are unlocked on this device.`
- O gesto discreto de tocar/clicar **7 vezes** no título `L2N Link2Nite` revelou corretamente o `Team access`.
- Blocos operacionais visíveis após login:
  - `Venue tools - add a new venue/event`
  - `Admin (local)`
  - `Moderation (local)`
  - `Venue Photos (manual)`
- Blocos `launch-demo-only` permaneceram ocultos após o hardening.
- `Sign out` foi validado com sucesso:
  - toast `Team access signed out.`
  - retorno para `Public mode`
  - ocultação dos blocos admin novamente
  - `Team access` volta a ficar escondido após sign out

### Confirmado no live - smoke visual mobile
- Smoke visual feito em viewport mobile `390x844` no Chrome:
  - sem overflow horizontal em `Home`, `Settings`, `Venue detail` e `Swipe`;
  - navegação principal funcional;
  - CTA e labels do venue aparecem corretamente;
  - estado vazio do swipe aparece sem quebrar o layout.

### Observação importante
- Essa rodada mobile foi viewport emulado no desktop, não teste em device real.
- Nenhum ficheiro foi alterado durante a rodada final de validação live; foi só verificação operacional.

## Atualizacao publicada (Codex - 2026-07-30, smoke de onboarding/fotos/match/chat)

Correcao publicada no commit `6f60006` e validada no beta live:

- Bug real encontrado no fluxo publico: criar um segundo perfil com foto "normal" podia falhar com `QuotaExceededError` em `localStorage` porque o onboarding novo ainda gravava imagem crua em base64.
- Correcao aplicada em `beta/index.html` e sincronizada para `link2nite-repo/beta/index.html`:
  - onboarding e editor de perfil agora usam `compressImageToDataUrl(file)` em vez de `FileReader` cru;
  - `photoSlots` e `tempPhotos` agora resetam ao iniciar novo onboarding e tambem no `logout()`;
  - save de onboarding/perfil agora trata erro de quota com mensagem amigavel, em vez de quebrar silenciosamente.
- Paridade revalidada depois da correcao:
  - `beta/index.html` e `link2nite-repo/beta/index.html` com o mesmo numero de linhas;
  - `beta/images/venues/` e espelho continuam com **29** JPGs.

### Confirmado no live apos esse fix
- Onboarding publico completo com email comum e foto real (`rooftop.png`) funcionou.
- Segundo onboarding consecutivo tambem funcionou com foto grande:
  - a tela abriu com slot limpo `+ Add photo Required`;
  - upload no segundo perfil funcionou;
  - nao houve `QuotaExceededError` no console.
- Smoke funcional com duas contas locais no mesmo browser passou:
  - `Smoke Live A` e `Smoke Live B` marcaram `Going tonight` no `230 Fifth Rooftop Bar`;
  - `Swipe (cards)` funcionou com perfis reais disponiveis;
  - like reciproco gerou `💖 Match with Smoke Live B!`;
  - `Matches` mostrou `You & Smoke Live ...` no venue correto;
  - `Chat` abriu e a mensagem enviada por `Smoke Live A` ficou visivel tambem para `Smoke Live B`.

### Confirmado no live no smoke dedicado do editor de perfil
- O item pendente do checklist `Perfil salva bio, fotos e preferencias.` foi revalidado no beta live em `2026-07-30`.
- Fluxo usado:
  - conta publica `Smoke Live B`;
  - abertura da tela real `My profile`;
  - preenchimento de bio, `location`, `jobTitle`, `company`, `school` e `instagram`;
  - upload de mais uma foto (`rooftop.png`), ficando com **2** fotos no perfil.
- Resultado confirmado apos reload:
  - `My profile` reabriu com os mesmos valores preenchidos;
  - `location` apareceu como `Chelsea`;
  - o perfil continuou com **2** previews / **2** dots de foto.
- Preferences tambem foram rechecadas na mesma conta:
  - `Who you want to see` mudou para `Everyone` (valor interno `both`);
  - `Max distance` mudou para `25 mi`;
  - ambos persistiram apos reload.
- Observacao operacional:
  - o browser automation ficou preso numa aba logo apos o `alert()` nativo do save, mas a reabertura do beta em nova aba confirmou persistencia real dos dados; isso pareceu friccao do runtime de automacao, nao perda de dados do app.

### Preflight mobile adicional (Codex - 2026-07-30, viewport QA em Chrome)
- Rodada extra feita em Chrome com viewport explicito, **nao** em device fisico:
  - `390x844` (faixa iPhone 12/13);
  - `412x915` (faixa Android alta).
- Telas checadas:
  - `Home`;
  - `Venue` (`230 Fifth Rooftop Bar`);
  - `Swipe`;
  - `My profile`;
  - `My night`;
  - `Matches`;
  - `Settings`.
- Resultado dessa rodada:
  - sem overflow horizontal nas telas testadas (`overflowX = 0`);
  - nav inferior permaneceu inteira e dentro da viewport nas duas larguras;
  - hero/cards/CTAs principais continuaram dentro da largura util.
- Isso **reduz risco** de layout quebrado em mobile, mas **nao substitui** os itens ainda pendentes:
  - `Mobile Chrome Android`;
  - `Mobile Safari iPhone`.

### Proximo passo recomendado apos o preflight mobile
- Fazer a passada manual em device real seguindo o roteiro curto agora documentado em `PUBLIC-LAUNCH-CHECKLIST.md`:
  1. abrir o beta em Android Chrome;
  2. repetir em iPhone Safari;
  3. validar `Home`, `Venue`, `Swipe`, `Settings`, `My profile`, `My night` e `Matches`;
  4. registrar screenshot se houver scroll lateral, CTA cortado ou botao dificil de tocar.
- A ideia e sair dessa etapa com um veredito simples por device:
  - `passou sem ressalvas`;
  - `passou com ajuste visual pequeno`;
  - `bloqueia demo publica`.

### O que isso resolve e o que ainda nao resolve
- Resolve o bloqueador de UX/local storage do onboarding com fotos maiores no prototipo.
- Nao muda o fato principal do launch: perfis, likes, matches e chats continuam locais no navegador; ainda falta backend/persistencia real para lancamento publico amplo.

## Última sessão (Codex — 2026-04-11, imagens em `/beta/`)

Leu este handoff; trechos decisivos: imagens do site ao vivo em `beta/images/venues/` e próximo passo de copiar/baixar por `placeId`. Conferiu `PLACE_IMAGE_DIRECT_MAP` em `beta/index.html` (**29** IDs) vs conteúdo de `beta/images/venues/` (só `230fifth.jpg` antes). Copiou todas as `.jpg` de `images/venues/` para `beta/images/venues/`; completou `jane_ballroom.jpg` renomeando a partir de `Jane Ballroom.jpg`. Checagem local sem faltantes. **Commit:** `34ff6af` — *Add venue images under beta/images/venues for production path* — **push** para `origin/main`, sem incluir mudanças locais já existentes (`Code-gs-COMPLETO.js`, `INSTAGRAM-REELS-ROTEIROS.md`, `instagram-assets/reels/videos-finais/README.txt`, `openclaw-link2nite-reels-workspace/AGENTS.md`). Detalhe narrado em `CURSOR-OTHER-AGENTS-HISTORY.md` (mesma data).

## Última sessão (Cursor — 2026-04-11)

OpenClaw: workspace `openclaw-link2nite-reels-workspace/` com bootstrap do agente + script de setup para Codespaces; fluxo real usa `openclaw gateway` + `openclaw message send` / `openclaw agent --deliver`. Marketing: Reels 11–15 em `INSTAGRAM-REELS-ROTEIROS.md` e 15 capas PNG novas em `instagram-assets/reels/` (`reels-cover-01-…` … `15`). **Protótipo / deploy:** `beta/index.html` e `link2nite-repo/beta/index.html` foram alinhados para inglês e remoção de menções “Tinder” na UI. **Mapa de imagens:** ambos devem usar `/beta/images/venues/<placeId>.jpg` e a pasta `beta/images/venues/` correspondente em cada árvore (ver seção *Duas árvores* abaixo). Detalhe da conversa: `CURSOR-OTHER-AGENTS-HISTORY.md` → seção **2026-04-11**.

## Sessão anterior (Cursor — 2026-04-10)

Documentação e organização para Reels com vídeo IA: arquivo `REELS-VIDEO-AI-PROMPTS.md`, pastas `instagram-assets/reels/ai-clips-reel-1` … `ai-clips-reel-16` com READMEs (durações 5s/10s e prompts), Reel 16 alinhado à landing (`INSTAGRAM-REELS-ROTEIROS.md`), atualização de `videos-finais/README.txt`. Não altera `/beta/` nem GitHub Pages; é conteúdo de marketing local até commit. Capas/end cards do Reel 16 ficaram só como prompts em chat (sem PNG novos no repo).

Na sessão de 2026-02-10, foram removidas referências a Tinder nos textos de onboarding e perfil em `betaindex.html` e `beta/index.html`. Nenhuma ação de git foi executada e não houve mudanças de deploy além do conteúdo textual.

## Project
- Name: Link2Nite
- Prototype URL: `https://www.link2nite.com/beta/`
- Local workspace: `C:\Users\aloisio.campos\OneDrive\Documentos\Dating App\web app`
- Main prototype file: `beta/index.html`

## Duas árvores `beta/` (raiz vs `link2nite-repo/`)

Existem **duas cópias** do protótipo no mesmo monorepo:

| Caminho | Uso típico |
|--------|------------|
| `beta/index.html` + `beta/images/venues/` | Árvore principal; costuma ser a que alimenta GitHub Pages em `/beta/`. |
| `link2nite-repo/beta/index.html` + `link2nite-repo/beta/images/venues/` | Espelho dentro da pasta `link2nite-repo/` (deploy alternativo ou referência). |

**Regra:** manter `beta/index.html` **funcionalmente idêntico** entre raiz e `link2nite-repo/beta/` (ou aceitar explicitamente que só uma árvore é usada no deploy). Além do mapa de imagens e dos JPGs, houve um problema grave: `link2nite-repo/beta/index.html` chegou a estar **truncado** (~6268 linhas, `initApp()` sem fechar, sem swipe nem fecho `</html>`). **Correção:** copiar a versão canónica da raiz `beta/index.html` → `link2nite-repo/beta/index.html` quando for preciso paridade total (ver commit que menciona *full parity* ou *restore truncated*).

**Regra operacional fixa recomendada:**
1. Editar **somente** `beta/index.html` na raiz.
2. Tratar `link2nite-repo/beta/index.html` como **espelho por cópia/script**, não como ficheiro para edição manual.
3. Sempre que mudar o beta, sincronizar a partir da raiz e rodar uma verificação rápida de paridade antes de qualquer push/deploy.
4. Se aparecer um diff muito grande entre as duas árvores, assumir primeiro risco de **truncamento/corrupção** antes de interpretar como mudança funcional legítima.
5. No estado atual, o escopo dessa paridade é simples: dentro de `beta/` existem apenas `index.html` e `images/venues/*.jpg` em ambas as árvores.

## What was already done
- Translated major prototype text from Portuguese to English.
- Removed/reduced Tinder mentions in prototype flows.
- Added onboarding photo slots logic (6 slots, at least 1 required).
- Updated venue image mapping in `beta/index.html` to use `/beta/images/venues/<placeId>.jpg`.
- Confirmed all venue cards in `beta/index.html` point to `/beta/images/venues/<placeId>.jpg`.
- Copied/pushed the full venue image set into `beta/images/venues/`, including `230fifth.jpg` and `jane_ballroom.jpg`.
- Updated OpenClaw agent instructions in `openclaw-link2nite-reels-workspace/AGENTS.md` so it outputs runnable `curl` scripts for venue downloads.

## Current git state (important)
- Branch: `main`
- Sempre confira o estado real com `git status` e `git log --oneline -5`.
- Commits de referência (ordem pode variar; ver log local):
  - `576acda` — `link2nite-repo/beta/index.html` = cópia integral da raiz (ficheiro antes truncado) + nota no handoff
  - `a17a7fa` — alinhar `link2nite-repo/beta/` com a raiz (`PLACE_IMAGE_DIRECT_MAP` + `beta/images/venues/*.jpg`) + handoff
  - `acb4a00` — sync de trabalho local + snapshot `link2nite-repo/` no repo pai
  - `8918651` / `638d870` — docs handoff/histórico
  - `34ff6af` — imagens em `beta/images/venues/` (raiz)
- Pasta `link2nite-repo/` está **versionada** no repositório principal (não é mais só untracked local).

## Critical deployment detail (images)
- `beta/index.html` currently maps cards to:
  - `/beta/images/venues/<placeId>.jpg`
- Therefore, image files for the live site must exist under:
  - `beta/images/venues/`
- If images exist only in `images/venues/` (repo root), they may not render in the deployed `/beta/` app.

## Status of the venue image task
- The missing-image checklist from the previous handoff has been completed.
- A local comparison against the `PLACE_IMAGE_DIRECT_MAP` entries in `beta/index.html` found no remaining missing `placeId` JPEGs under `beta/images/venues/`.
- `jane_ballroom.jpg` was created from the root file `Jane Ballroom.jpg` so the live `/beta/` path matches the card mapping exactly.
- The resulting image-only commit was pushed as `34ff6af`.

## Safe next commands (PowerShell)
```powershell
cd "C:\Users\aloisio.campos\OneDrive\Documentos\Dating App\web app"
git status --short --branch
git log --oneline -3
.\check-beta-parity.ps1
.\smoke-public-preflight.ps1
# Só quando quiser sincronizar o espelho deliberadamente:
# .\sync-beta-parity.ps1
```

## Next operational checks
1. Open `https://www.link2nite.com/beta/`
2. Hard refresh (`Ctrl + F5`)
3. Confirm cards (especially `230fifth`, `jane_ballroom`) load images.
4. Optional: commit/push **only** the handoff/history `.md` files in a separate commit (keep marketing/OpenClaw edits unstaged until you intend to ship them).
5. Se publicar a partir de `link2nite-repo/`, conferir que `link2nite-repo/beta/index.html` e `link2nite-repo/beta/images/venues/` estão alinhados com a raiz (foi feito; repetir após mudanças futuras em um dos lados).

## OpenClaw note
- In many setups, OpenClaw agent cannot directly write files unless gateway/tools are configured with shell and filesystem access.
- Current practical flow: agent returns `curl` script, user runs it in Codespaces/local terminal.

