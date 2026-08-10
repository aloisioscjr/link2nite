# Link2Nite - SMS / Twilio Deploy

Status em 2026-08-10:
- o codigo local ja tem fluxo real de envio e verificacao de SMS;
- o beta publicado ainda responde `supportsPhoneAuth = false` e `supportsSmsAuth = false`;
- o ultimo mile para ligar isso no deploy live e configuracao de Script Properties no Apps Script + republicacao.

## 1. Arquivos envolvidos

- `beta/index.html`
- `link2nite-repo/beta/index.html`
- `Code-gs-COMPLETO.js`

## 2. Script Properties obrigatorias

Adicionar no projeto Apps Script publicado:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`

Adicionar tambem **uma** destas opcoes de envio:

- `TWILIO_FROM_NUMBER`
- `TWILIO_MESSAGING_SERVICE_SID`

Regra atual no codigo:

- o SMS liga quando existem `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e pelo menos um entre `TWILIO_FROM_NUMBER` ou `TWILIO_MESSAGING_SERVICE_SID`.

## 3. O que o fluxo faz

### Frontend

- pede telefone no onboarding;
- quando o provider de SMS estiver live, mostra `Send SMS code`;
- valida o codigo de 6 digitos antes de marcar o telefone como verificado.

### Apps Script

- envia codigo OTP com `user_phone_request_code`;
- valida o codigo com `user_phone_verify_code`;
- impede reutilizacao rapida por cooldown;
- impede vincular o mesmo telefone a outra conta.

## 4. Ordem recomendada de deploy

1. Criar/configurar a conta Twilio que vai enviar os SMS do app.
2. Escolher o remetente:
   - `TWILIO_FROM_NUMBER`; ou
   - `TWILIO_MESSAGING_SERVICE_SID`.
3. Definir no Apps Script:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM_NUMBER` ou `TWILIO_MESSAGING_SERVICE_SID`
4. Publicar nova versao do Apps Script contendo o `Code-gs-COMPLETO.js` atual.
5. Validar o endpoint de capabilities:
   - esperado: `supportsPhoneAuth = true`
   - esperado: `supportsSmsAuth = true`
6. Revalidar o onboarding no beta live.

## 5. QA obrigatorio depois de ligar o SMS

Rodar no beta live:

1. Conta nova -> email verificado -> pedir SMS code -> receber SMS real.
2. Inserir codigo correto -> telefone fica verificado.
3. Inserir codigo invalido -> erro amigavel.
4. Pedir codigo duas vezes seguidas -> cooldown respeitado.
5. Tentar cadastrar outra conta com o mesmo telefone -> bloqueio correto.
6. Confirmar que uma conta criada num device aparece autenticada e consistente em outro device.

## 6. Observacao importante

Enquanto `supportsPhoneAuth` e `supportsSmsAuth` estiverem `false`:

- o onboarding publico continua exigindo telefone;
- o numero e salvo agora;
- os controles de SMS ficam ocultos para nao parecerem quebrados;
- a verificacao de telefone nao esta ativa de fato no deploy.
