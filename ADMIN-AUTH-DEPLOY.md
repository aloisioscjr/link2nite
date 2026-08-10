# Link2Nite Admin Auth Deploy

## O que mudou

O beta agora separa:

- `profile email` salvo no app
- `team access` autenticado por código enviado por email

As ferramentas admin só aparecem quando existe uma sessão válida de `team access`.

## Status live confirmado em 2026-08-10

O endpoint publicado hoje respondeu:

```json
{"ok":true,"supportsAdminAuth":true,"supportsUserAuth":true,"supportsSharedState":true,"supportsAppBackend":true,"supportsPhoneAuth":false,"supportsSmsAuth":false,"feature":"admin_auth"}
```

Leitura prática:

- `team access` por email está live;
- `user auth` por email está live;
- `shared state` para o beta está live;
- verificação de telefone / SMS ainda não está live nesse deploy.

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

Resposta mínima esperada:

```json
{"ok":true,"supportsAdminAuth":true,"feature":"admin_auth"}
```

Resposta completa hoje no live:

```json
{"ok":true,"supportsAdminAuth":true,"supportsUserAuth":true,"supportsSharedState":true,"supportsAppBackend":true,"supportsPhoneAuth":false,"supportsSmsAuth":false,"feature":"admin_auth"}
```

6. No beta, abra `Settings`.
7. Em `Team access`, peça o código por email.
8. Digite o código de 6 dígitos para liberar as ferramentas admin.

## Observação importante

Se o Apps Script publicado ficar atrás do `Code-gs-COMPLETO.js`, o beta pode mostrar `Team sign-in is not live on this deployment yet.` e as ferramentas admin ficam escondidas.

No estado validado em 2026-08-10, isso não está acontecendo para admin/email auth; o ponto ainda pendente no deploy live é o suporte a phone/SMS auth.
