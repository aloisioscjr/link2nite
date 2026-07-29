# Link2Nite - Public Launch Checklist

Status em 2026-07-29: nao pronto para lancamento publico real.

## 1. Bloqueadores de launch

### 1.1 Autenticacao e acesso admin
- [ ] Trocar o gate de admin por email no front-end por autenticacao real no servidor.
- [ ] Remover dependencia de `localStorage` para definir sessao, privilegios e estado do usuario.
- [ ] Garantir que ferramentas administrativas nao possam ser reativadas via DevTools.

### 1.2 Persistencia real de dados
- [ ] Mover perfis, likes, matches, mensagens e presenca em venues para backend.
- [ ] Criar identificador real de usuario.
- [ ] Garantir sincronizacao entre dispositivos e sessoes.

### 1.3 Remocao de comportamento de prototipo/demo
- [ ] Remover ou substituir textos publicos de demo no app.
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
- [ ] Onboarding completo com email comum.
- [ ] Onboarding/login local com email admin autorizado.
- [ ] Logout e retorno ao app.
- [ ] Lista de venues carrega com todas as imagens corretas.
- [ ] Filtros de venues funcionam.
- [ ] Tela do venue abre, mostra "who's going" e CTA corretos.
- [ ] Swipe funciona sem travar.
- [ ] Match aparece no fluxo esperado.
- [ ] Chat abre e envia mensagens.
- [ ] Perfil salva bio, fotos e preferencias.
- [ ] Settings salva alteracoes sem quebrar sessao.

### 3.2 Smoke test de permissao
- [ ] Usuario comum nao ve nenhuma ferramenta admin.
- [ ] Usuario comum nao consegue abrir tools admin nem por navegacao manual.
- [ ] Usuario admin autenticado ve e usa as tools admin esperadas.

### 3.3 Smoke test visual
- [ ] Mobile Chrome Android.
- [ ] Mobile Safari iPhone.
- [ ] Desktop Chrome.
- [ ] Desktop Safari ou Edge.
- [ ] Refresh com cache/service worker nao quebra venue images nem telas.

### 3.4 Smoke test de deploy
- [ ] `beta/index.html` e `link2nite-repo/beta/index.html` estao identicos.
- [ ] `beta/images/venues/` e o espelho em `link2nite-repo/beta/images/venues/` estao sincronizados.
- [ ] Beta live confere com a copia local apos publish.

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
