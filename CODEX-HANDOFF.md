# Link2Nite - Codex Handoff

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

