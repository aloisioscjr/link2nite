# Workspace do agente link2nite-reels (OpenClaw)

Estes arquivos são os **bootstrap files** do agente. O OpenClaw injeta eles em todo turno, então o agente sempre começa com a descrição do trabalho e as regras.

## Forma mais fácil: rodar o script no Codespaces

Foi criado o script **`setup-workspace-in-codespaces.sh`**, que cria a pasta e grava os três arquivos sozinho.

1. No **Codespaces**, abra o terminal.
2. Coloque o script no Codespace (uma das opções):
   - Se esta pasta estiver no repo: `git pull` e vá para a pasta do projeto; ou
   - Abra o arquivo `setup-workspace-in-codespaces.sh` no Cursor, copie todo o conteúdo, no terminal do Codespace crie com `nano setup.sh`, cole, salve (Ctrl+O, Enter, Ctrl+X).
3. Rode:
   ```bash
   bash setup-workspace-in-codespaces.sh
   ```
   (ou `bash setup.sh` se você colou o conteúdo em `setup.sh`.)
4. Pronto. Teste: `openclaw agent --agent link2nite-reels --message "Cria um Reel sobre sexta à noite"`

---

## Como deixar fixo no agente (no Codespaces) — manual

O workspace do agente no OpenClaw é:

```text
~/.openclaw/workspace-link2nite-reels
```

No GitHub Codespaces isso é:

```text
/home/codespace/.openclaw/workspace-link2nite-reels
```

### Opção A — Copiar pela interface

1. No Codespaces, abra o Explorer e crie a pasta (se não existir):
   `~/.openclaw/workspace-link2nite-reels`
2. Copie para dentro dela os três arquivos desta pasta:
   - `AGENTS.md`
   - `SOUL.md`
   - `IDENTITY.md`

### Opção B — Se esta pasta estiver no repo no Codespaces

Se você tiver esta pasta (ou o conteúdo) no repositório que está aberto no Codespaces, no terminal do Codespaces:

```bash
cp -v /caminho/para/openclaw-link2nite-reels-workspace/AGENTS.md   ~/.openclaw/workspace-link2nite-reels/
cp -v /caminho/para/openclaw-link2nite-reels-workspace/SOUL.md    ~/.openclaw/workspace-link2nite-reels/
cp -v /caminho/para/openclaw-link2nite-reels-workspace/IDENTITY.md ~/.openclaw/workspace-link2nite-reels/
```

(Substitua `/caminho/para/` pelo caminho real da pasta no Codespaces.)

### Opção C — Colar o conteúdo no terminal

Se preferir, no terminal do Codespaces você pode criar os arquivos com `cat > arquivo.md << 'EOF'` e colar o conteúdo de cada um (AGENTS.md, SOUL.md, IDENTITY.md) entre `EOF` e o segundo `EOF`.

---

Depois de copiar, teste:

```bash
openclaw agent --agent link2nite-reels --message "Cria um Reel sobre sair de casa na sexta em vez de ficar no sofá"
```

O agente deve responder em português e entregar nome, roteiro por tempo, texto na tela, legenda, hashtags e prompt para Seedance 2, tudo em inglês no Reel.
