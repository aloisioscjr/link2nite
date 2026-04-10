/**
 * Code.gs completo — Waitlist + email HTML profissional
 * Envio: se MS365_TENANT_ID, MS365_CLIENT_ID e MS365_CLIENT_SECRET estiverem
 * nas Script Properties, envia via Microsoft Graph (noreply@link2nite.com).
 * Senão usa MailApp (Gmail).
 */
var WAITLIST_EMAIL_IMAGE_URL = "https://www.link2nite.com/rooftop.png";
var MS365_FROM_EMAIL = "noreply@link2nite.com";

function getWaitlistEmailHtml(data) {
  var firstName = (data.firstName || "there").trim() || "there";
  var img = WAITLIST_EMAIL_IMAGE_URL;
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#0f172a;font-family:\'Segoe UI\',Tahoma,Geneva,Verdana,sans-serif;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f172a;">' +
    '<tr><td align="center" style="padding:32px 16px;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">' +
    '<tr><td style="line-height:0;"><img src="' + img + '" alt="Link2Nite" width="560" style="display:block;width:100%;max-width:560px;height:auto;object-fit:cover;" /></td></tr>' +
    '<tr><td style="background-color:#0f172a;padding:20px 28px;text-align:center;border-bottom:1px solid rgba(148,163,184,0.15);">' +
    '<span style="font-size:22px;font-weight:800;color:#f1f5f9;letter-spacing:0.5px;">L2</span><span style="font-size:22px;font-weight:800;color:#a78bfa;letter-spacing:0.5px;">N</span><span style="font-size:22px;font-weight:800;color:#f1f5f9;letter-spacing:0.5px;"> Link2Nite</span></td></tr>' +
    '<tr><td style="background-color:#1e293b;padding:32px 28px;">' +
    '<p style="margin:0 0 16px;font-size:18px;color:#f1f5f9;font-weight:600;">Hi ' + firstName + ',</p>' +
    '<p style="margin:0 0 20px;font-size:15px;color:#cbd5e1;line-height:1.6;">You\'re on the list. We\'re letting people in gradually — demand is high and spots are limited.</p>' +
    '<p style="margin:0 0 24px;font-size:15px;color:#cbd5e1;line-height:1.6;">Pick the spot, see who\'s going, match, and meet — no endless chat.</p>' +
    '<table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="border-radius:999px;background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);padding:14px 28px;">' +
    '<a href="https://www.link2nite.com/landing.html" target="_blank" style="font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Link2Nite</a></td></tr></table>' +
    '</td></tr>' +
    '<tr><td style="background-color:#0f172a;padding:20px 28px;text-align:center;border-top:1px solid rgba(148,163,184,0.2);">' +
    '<p style="margin:0;font-size:12px;color:#94a3b8;">Link2Nite — Match. Meet. Tonight.</p></td></tr>' +
    '</table></td></tr></table></body></html>';
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents || "{}");

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Waitlist") || ss.getSheets()[0];

    var headers = [
      "submittedAt", "firstName", "lastName", "email", "phoneRaw", "phone", "phoneE164",
      "city", "neighborhood", "nights", "intent", "gender", "priorityTag",
      "referrer", "refCode", "utm_source", "utm_campaign", "utm_content",
      "timezone", "userAgent", "pageUrl"
    ];

    if (sheet.getLastRow() === 0) sheet.appendRow(headers);

    var nights = Array.isArray(data.nights) ? data.nights.join(",") : (data.nights || "");
    var intent = Array.isArray(data.intent) ? data.intent.join(",") : (data.intent || "");
    var utm = data.utm || {};

    var row = [
      data.submittedAt || new Date().toISOString(),
      data.firstName || "",
      data.lastName || "",
      data.email || "",
      data.phoneRaw || "",
      data.phone || "",
      data.phoneE164 || "",
      data.city || "",
      data.neighborhood || "",
      nights,
      intent,
      data.gender || "",
      data.priorityTag || "",
      data.referrer || "",
      data.refCode || "",
      utm.source || "",
      utm.campaign || "",
      utm.content || "",
      data.timezone || "",
      data.userAgent || "",
      data.pageUrl || ""
    ];

    sheet.appendRow(row);

    // Email de confirmação (Microsoft Graph = noreply@link2nite.com, ou Gmail)
    try {
      var email = (data.email || "").trim();
      if (email) {
        var subject = "You're on the list — Link2Nite";
        var plainBody = "Hi " + (data.firstName || "there") + ", you're on the list. We're letting people in gradually — demand is high and spots are limited. Pick the spot, see who's going, match, and meet. — Link2Nite";
        var htmlBody = getWaitlistEmailHtml(data);
        sendWaitlistEmail(email, subject, plainBody, htmlBody);
      }
    } catch (mailErr) {
      Logger.log("Waitlist email error: " + mailErr);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Obtém token de acesso do Microsoft Graph (client credentials).
 */
function getGraphAccessToken() {
  var props = PropertiesService.getScriptProperties();
  var tenantId = props.getProperty("MS365_TENANT_ID");
  var clientId = props.getProperty("MS365_CLIENT_ID");
  var clientSecret = props.getProperty("MS365_CLIENT_SECRET");
  if (!tenantId || !clientId || !clientSecret) return null;
  var url = "https://login.microsoftonline.com/" + tenantId.trim() + "/oauth2/v2.0/token";
  var payload = "grant_type=client_credentials&client_id=" + encodeURIComponent(clientId.trim()) +
    "&client_secret=" + encodeURIComponent(clientSecret.trim()) +
    "&scope=" + encodeURIComponent("https://graph.microsoft.com/.default");
  var options = { method: "post", contentType: "application/x-www-form-urlencoded", payload: payload, muteHttpExceptions: true };
  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) {
    Logger.log("Graph token falhou: HTTP " + response.getResponseCode() + " | " + response.getContentText());
    return null;
  }
  var json = JSON.parse(response.getContentText());
  return json.access_token || null;
}

/**
 * Envia email via Microsoft Graph (noreply@link2nite.com). Se falhar ou não configurado, usa Gmail.
 * Logs ficam em Execuções do Apps Script para debug.
 */
function sendWaitlistEmail(to, subject, plainBody, htmlBody) {
  var token = getGraphAccessToken();
  if (token) {
    try {
      Logger.log("Graph: token obtido, tentando sendMail como " + MS365_FROM_EMAIL);
      var graphUrl = "https://graph.microsoft.com/v1.0/users/" + encodeURIComponent(MS365_FROM_EMAIL) + "/sendMail";
      var body = {
        message: {
          subject: subject,
          body: { contentType: "HTML", content: htmlBody },
          toRecipients: [{ emailAddress: { address: to } }]
        }
      };
      var options = {
        method: "post",
        contentType: "application/json",
        headers: { "Authorization": "Bearer " + token },
        payload: JSON.stringify(body),
        muteHttpExceptions: true
      };
      var response = UrlFetchApp.fetch(graphUrl, options);
      var code = response.getResponseCode();
      var responseText = response.getContentText();
      Logger.log("Graph sendMail: HTTP " + code + " | " + responseText);
      if (code >= 200 && code < 300) {
        Logger.log("Graph: envio aceito (202). Se o email não chegar, confira SPF/DKIM e caixa noreply@ no M365.");
        return;
      }
      Logger.log("Graph falhou, usando fallback Gmail.");
    } catch (graphErr) {
      Logger.log("Graph exceção: " + graphErr.toString());
      Logger.log("Usando fallback Gmail.");
    }
  } else {
    Logger.log("Graph: sem token (confira MS365_* nas Script Properties). Usando Gmail.");
  }
  try {
    MailApp.sendEmail(to, subject, plainBody, { htmlBody: htmlBody });
    Logger.log("Email enviado via Gmail para " + to);
  } catch (mailErr) {
    var mailMsg = (mailErr && (mailErr.message || mailErr.toString())) || "MailApp error";
    Logger.log("MailApp.sendEmail falhou: " + mailMsg);
    escreverErroNaPlanilha("MailApp: " + mailMsg, (mailErr && mailErr.stack) || "");
    throw mailErr;
  }
}

function doGet() {
  return ContentService.createTextOutput("Link2Nite endpoint running.");
}

// Escreve erro na planilha (e salva nas propriedades para ver depois)
function escreverErroNaPlanilha(msg, stack) {
  var txt = String(msg).slice(0, 500) + "\n---\n" + String(stack || "").slice(0, 500);
  try { PropertiesService.getScriptProperties().setProperty("LAST_ERROR", txt); } catch (_) {}
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      var id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
      if (id) ss = SpreadsheetApp.openById(id.trim());
    }
    if (!ss) return;
    var sheet = ss.getSheetByName("Log");
    if (!sheet) { sheet = ss.insertSheet("Log"); sheet.appendRow(["Data", "Erro", "Stack"]); }
    sheet.appendRow([new Date().toISOString(), String(msg).slice(0, 500), String(stack || "").slice(0, 500)]);
  } catch (_) {}
}

// Rode esta função DEPOIS de testarEnvioEmail falhar: ela cola o último erro na aba Log da planilha.
// Se a aba Log não aparecer, em Script Properties adicione SPREADSHEET_ID = ID da sua planilha (o que está na URL: .../d/ID_AQUI/edit).
function verUltimoErro() {
  var props = PropertiesService.getScriptProperties();
  var txt = props.getProperty("LAST_ERROR");
  if (!txt) { Logger.log("Nenhum erro salvo. Rode testarEnvioEmail primeiro."); return; }
  Logger.log(txt);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    var id = props.getProperty("SPREADSHEET_ID");
    if (id) ss = SpreadsheetApp.openById(id.trim());
  }
  if (ss) {
    var sheet = ss.getSheetByName("Log");
    if (!sheet) { sheet = ss.insertSheet("Log"); sheet.appendRow(["Data", "Erro", "Stack"]); }
    var parts = txt.split("\n---\n");
    sheet.appendRow([new Date().toISOString(), parts[0] || txt, parts[1] || ""]);
  }
}

// Troque "seu-email@exemplo.com" pelo email onde você quer RECEBER o teste (ex.: seu Gmail ou hello@link2nite.com)
function testarEnvioEmail() {
  Logger.log("testarEnvioEmail iniciado.");
  var destinoTeste = "aloisioscjr@gmail.com";
  var testData = { firstName: "Test", email: destinoTeste };
  var subject = "Teste Link2Nite — Email HTML";
  var plain = "Versão em texto simples.";
  try {
    var html = getWaitlistEmailHtml(testData);
    sendWaitlistEmail(destinoTeste, subject, plain, html);
    Logger.log("testarEnvioEmail concluído sem exceção.");
  } catch (e) {
    var msg = (e && (e.message || e.toString())) || String(e);
    var stack = (e && e.stack) || "n/a";
    Logger.log("ERRO em testarEnvioEmail: " + msg);
    Logger.log("Stack: " + stack);
    escreverErroNaPlanilha(msg, stack);
    throw e;
  }
}

// Teste mínimo: envia só com Gmail (sem Graph, sem HTML). Use para ver se o erro é do MailApp.
function testarSóGmail() {
  var to = "aloisioscjr@hotmail.com";
  try {
    MailApp.sendEmail(to, "Teste só Gmail", "Se você recebeu isso, o MailApp está ok.");
    Logger.log("testarSóGmail: enviado.");
  } catch (e) {
    Logger.log("testarSóGmail ERRO: " + (e.message || e.toString()));
    escreverErroNaPlanilha("testarSóGmail: " + (e.message || e.toString()), e.stack || "");
    throw e;
  }
}
