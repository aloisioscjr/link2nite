# Link2Nite - Public Launch Checklist

Status em 2026-07-30: beta live revalidado apos publish; hardening do fluxo publico confirmado no live, mas ainda nao pronto para lancamento publico real.

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

### 1.3 Remocao de comportamento de prototipo/demo
- [ ] Remover ou substituir textos publicos de demo no app.
- [x] Validar no live o hardening que desativa bots/crowd artificiais no fluxo publico principal.
- [ ] Remover dados falsos usados como experiencia principal, ou marcar claramente como beta fechado.
- [ ] Revisar o uso de bots antes de qualquer abertura publica.
- [ ] Revisar metricas e moderacao locais que hoje vivem so no navegador.

### 1.4 Pagamentos e PRO
- [ ] Implementar checkout real.
- [ ] Revisar toda a copy de PRO para nao prometer funcionalidade nao entregue.
- [ ] Definir o que e FREE e o que e PRO no produto real.

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
- O fluxo de paywall ainda usa linguagem de demo e partes "coming soon".
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

### 3.4 Smoke test de deploy
- [x] `beta/index.html` e `link2nite-repo/beta/index.html` estao identicos.
- [x] `beta/images/venues/` e o espelho em `link2nite-repo/beta/images/venues/` estao sincronizados.
- [x] Beta live confere com a copia local apos publish.

## 3.5 Pendencias curtas antes de uma demo publica mais limpa

- [ ] Validar no live que o boot limpa estado local de demo (`Launch Smoke 1`, `PRO`, etc.) e abre o beta em estado neutro.
- [ ] Rodar uma passada manual em mobile real.
- [ ] Decidir se o beta vai ficar explicitamente como `closed beta / prototype` na copy publica.
- [x] Confirmar no live que bots/demo nao voltaram ao fluxo principal para visitantes externos.

## 4. Melhorias que podem ficar para depois do launch

- [ ] Analytics mais sofisticado.
- [ ] Prioridade em cards.
- [ ] "See who liked you" completo.
- [ ] Dashboard real de venues/promoters.
- [ ] Fluxo de verificacao escalavel.

## 5. Ordem recomendada

1. Decidir se o proximo passo e "beta fechado com disclaimer" ou "produto publico real".
2. Se for publico real: backend + auth primeiro.
3. Depois: remover comportamento demo do fluxo principal.
4. Depois: smoke tests automatizados e rodada manual no beta live.
5. So entao abrir para publico amplo.

## 6. Recomendacao pratica

Se a meta for ganhar tracao agora, o caminho mais seguro e:
- manter como beta fechado / prototipo assistido;
- limpar mais copy publica de demo;
- validar a UX com usuarios reais;
- e so depois investir no backend minimo para abrir ao publico.
