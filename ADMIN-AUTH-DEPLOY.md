# Link2Nite Admin Auth Deploy

## O que mudou

O beta agora separa:

- `profile email` salvo no app
- `team access` autenticado por código enviado por email

As ferramentas admin só aparecem quando existe uma sessão válida de `team access`.

## Arquivos envolvidos

- `beta/index.html`
- `link2nite-repo/beta/index.html`
- `Code-gs-COMPLETO.js`

## Passos para ativar no beta live

1. Abra o projeto do Google Apps Script que hoje atende o endpoint da waitlist.
2. Atualize o código do web app com o conteúdo novo de [Code-gs-COMPLETO.js](C:\Users\aloisio.campos\OneDrive\Documentos\Dating App\web app\Code-gs-COMPLETO.js).
3. Se quiser uma allowlist customizada, configure a Script Property:
   - `ADMIN_ALLOWLIST=team@link2nite.com,aloisioscjr@hotmail.com`
4. Faça `Deploy > Manage deployments` e atualize o Web App existente.
5. Confirme que este GET responde JSON:

```text
https://script.google.com/macros/s/AKfycbxnPAbUdYLuTL4dN0x0Z0nJIVjmqZECNfiP-o3OVqy7ThzgGCLG9Gf_mr-FJZKOLVDp0g/exec?action=capabilities&feature=admin_auth
```

Resposta esperada:

```json
{"ok":true,"supportsAdminAuth":true,"feature":"admin_auth"}
```

6. No beta, abra `Settings`.
7. Em `Team access`, peça o código por email.
8. Digite o código de 6 dígitos para liberar as ferramentas admin.

## Observação importante

Até o Apps Script ser redeployado, o beta mostra `Team sign-in is not live on this deployment yet.` e as ferramentas admin continuam escondidas.
