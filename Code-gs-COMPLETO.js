/**
 * Code.gs completo — Waitlist + email HTML profissional
 * Envio: se MS365_TENANT_ID, MS365_CLIENT_ID e MS365_CLIENT_SECRET estiverem
 * nas Script Properties, envia via Microsoft Graph (team@link2nite.com).
 * Senão usa MailApp (Gmail).
 */
var WAITLIST_EMAIL_IMAGE_URL = "https://www.link2nite.com/rooftop.png";
var MS365_FROM_EMAIL = "team@link2nite.com";
var DEFAULT_ADMIN_ALLOWLIST = ["team@link2nite.com", "aloisioscjr@hotmail.com"];
var AUTH_CODE_TTL_SECONDS = 10 * 60;
var AUTH_CODE_COOLDOWN_SECONDS = 60;
var AUTH_SESSION_TTL_DAYS = 30;

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeEmail_(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail_(value));
}

function getAdminAllowlist_() {
  var props = PropertiesService.getScriptProperties();
  var fromProps = String(props.getProperty("ADMIN_ALLOWLIST") || "")
    .split(",")
    .map(function(item) { return normalizeEmail_(item); })
    .filter(Boolean);
  return fromProps.length ? fromProps : DEFAULT_ADMIN_ALLOWLIST.slice();
}

function isAuthorizedAdminEmail_(email) {
  var normalized = normalizeEmail_(email);
  return !!normalized && getAdminAllowlist_().indexOf(normalized) !== -1;
}

function sha256Hex_(value) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value || ""));
  return bytes.map(function(b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? "0" + v : v;
  }).join("");
}

function generateOtpCode_() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function maskEmail_(email) {
  var normalized = normalizeEmail_(email);
  var parts = normalized.split("@");
  if (parts.length !== 2) return normalized;
  var local = parts[0];
  if (local.length <= 2) return local.charAt(0) + "•@" + parts[1];
  return local.charAt(0) + "•••" + local.charAt(local.length - 1) + "@" + parts[1];
}

function getAuthCodeCacheKey_(email) {
  return "AUTH_CODE_" + sha256Hex_(normalizeEmail_(email));
}

function getAuthCooldownCacheKey_(email) {
  return "AUTH_CODE_COOLDOWN_" + sha256Hex_(normalizeEmail_(email));
}

function getAuthSessionPropertyKey_(token) {
  return "AUTH_SESSION_" + sha256Hex_(String(token || ""));
}

function createSessionToken_() {
  return Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
}

function getAdminSignInEmailHtml_(email, code) {
  var img = WAITLIST_EMAIL_IMAGE_URL;
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#0f172a;font-family:\'Segoe UI\',Tahoma,Geneva,Verdana,sans-serif;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f172a;">' +
    '<tr><td align="center" style="padding:32px 16px;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">' +
    '<tr><td style="line-height:0;"><img src="' + img + '" alt="Link2Nite" width="560" style="display:block;width:100%;max-width:560px;height:auto;object-fit:cover;" /></td></tr>' +
    '<tr><td style="background-color:#0f172a;padding:20px 28px;text-align:center;border-bottom:1px solid rgba(148,163,184,0.15);">' +
    '<span style="font-size:22px;font-weight:800;color:#f1f5f9;letter-spacing:0.5px;">L2</span><span style="font-size:22px;font-weight:800;color:#a78bfa;letter-spacing:0.5px;">N</span><span style="font-size:22px;font-weight:800;color:#f1f5f9;letter-spacing:0.5px;"> Link2Nite</span></td></tr>' +
    '<tr><td style="background-color:#1e293b;padding:32px 28px;">' +
    '<p style="margin:0 0 16px;font-size:18px;color:#f1f5f9;font-weight:600;">Team sign-in code</p>' +
    '<p style="margin:0 0 16px;font-size:15px;color:#cbd5e1;line-height:1.6;">A sign-in was requested for <strong style="color:#f8fafc;">' + maskEmail_(email) + '</strong>.</p>' +
    '<p style="margin:0 0 24px;font-size:15px;color:#cbd5e1;line-height:1.6;">Use the code below in the Link2Nite beta settings screen. This code expires in 10 minutes.</p>' +
    '<div style="display:inline-block;padding:14px 20px;border-radius:16px;background:#0f172a;border:1px solid rgba(167,139,250,0.35);font-size:30px;font-weight:800;letter-spacing:6px;color:#f8fafc;">' + code + '</div>' +
    '<p style="margin:24px 0 0;font-size:13px;color:#94a3b8;line-height:1.5;">If you did not request this code, you can ignore this email.</p>' +
    '</td></tr>' +
    '<tr><td style="background-color:#0f172a;padding:20px 28px;text-align:center;border-top:1px solid rgba(148,163,184,0.2);">' +
    '<p style="margin:0;font-size:12px;color:#94a3b8;">Link2Nite — Team access verification</p></td></tr>' +
    '</table></td></tr></table></body></html>';
}

function storeSessionRecord_(token, email) {
  var props = PropertiesService.getScriptProperties();
  var expiresAt = new Date(Date.now() + AUTH_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  props.setProperty(
    getAuthSessionPropertyKey_(token),
    JSON.stringify({
      email: normalizeEmail_(email),
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt
    })
  );
  return expiresAt;
}

function getSessionRecord_(token) {
  if (!token) return null;
  var props = PropertiesService.getScriptProperties();
  var key = getAuthSessionPropertyKey_(token);
  var raw = props.getProperty(key);
  if (!raw) return null;

  try {
    var parsed = JSON.parse(raw);
    var expiresAt = parsed.expiresAt || "";
    if (expiresAt && Date.parse(expiresAt) <= Date.now()) {
      props.deleteProperty(key);
      return null;
    }
    if (!isAuthorizedAdminEmail_(parsed.email)) {
      props.deleteProperty(key);
      return null;
    }
    return parsed;
  } catch (err) {
    props.deleteProperty(key);
    return null;
  }
}

function deleteSessionRecord_(token) {
  if (!token) return;
  PropertiesService.getScriptProperties().deleteProperty(getAuthSessionPropertyKey_(token));
}

function handleAuthRequestCode_(data) {
  var email = normalizeEmail_(data.email);
  if (!isValidEmail_(email)) {
    return { ok: false, error: "Enter a valid email." };
  }

  var cache = CacheService.getScriptCache();
  var cooldownKey = getAuthCooldownCacheKey_(email);
  if (cache.get(cooldownKey)) {
    return { ok: false, error: "Please wait a minute before requesting another code." };
  }

  var genericMessage = "If this email is authorized, a sign-in code was sent.";
  cache.put(cooldownKey, "1", AUTH_CODE_COOLDOWN_SECONDS);

  if (!isAuthorizedAdminEmail_(email)) {
    return { ok: true, message: genericMessage, sent: false };
  }

  var code = generateOtpCode_();
  cache.put(getAuthCodeCacheKey_(email), JSON.stringify({
    codeHash: sha256Hex_(code),
    expiresAt: Date.now() + AUTH_CODE_TTL_SECONDS * 1000
  }), AUTH_CODE_TTL_SECONDS);

  var subject = "Your Link2Nite team sign-in code";
  var plainBody = "Your Link2Nite team sign-in code is " + code + ". It expires in 10 minutes.";
  var htmlBody = getAdminSignInEmailHtml_(email, code);
  sendWaitlistEmail(email, subject, plainBody, htmlBody);

  return { ok: true, message: genericMessage, sent: true };
}

function handleAuthVerifyCode_(data) {
  var email = normalizeEmail_(data.email);
  var code = String(data.code || "").replace(/\D+/g, "").slice(0, 6);
  if (!isValidEmail_(email) || code.length !== 6 || !isAuthorizedAdminEmail_(email)) {
    return { ok: false, error: "Invalid or expired sign-in code." };
  }

  var cache = CacheService.getScriptCache();
  var raw = cache.get(getAuthCodeCacheKey_(email));
  if (!raw) {
    return { ok: false, error: "Invalid or expired sign-in code." };
  }

  try {
    var stored = JSON.parse(raw);
    if (!stored || !stored.codeHash || !stored.expiresAt || stored.expiresAt < Date.now()) {
      return { ok: false, error: "Invalid or expired sign-in code." };
    }
    if (stored.codeHash !== sha256Hex_(code)) {
      return { ok: false, error: "Invalid or expired sign-in code." };
    }
  } catch (err) {
    return { ok: false, error: "Invalid or expired sign-in code." };
  }

  cache.remove(getAuthCodeCacheKey_(email));
  var sessionToken = createSessionToken_();
  var expiresAt = storeSessionRecord_(sessionToken, email);

  return {
    ok: true,
    authenticated: true,
    email: email,
    sessionToken: sessionToken,
    expiresAt: expiresAt
  };
}

function handleAuthSessionStatus_(data) {
  var record = getSessionRecord_(data.sessionToken);
  if (!record) {
    return { ok: true, authenticated: false };
  }
  return {
    ok: true,
    authenticated: true,
    email: record.email,
    expiresAt: record.expiresAt
  };
}

function handleAuthLogout_(data) {
  deleteSessionRecord_(data.sessionToken);
  return { ok: true };
}

function handleWaitlistSubmission_(data) {
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

  return { ok: true };
}

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
    var action = String(data.action || "").trim();
    if (action === "auth_request_code") return jsonResponse_(handleAuthRequestCode_(data));
    if (action === "auth_verify_code") return jsonResponse_(handleAuthVerifyCode_(data));
    if (action === "auth_session_status") return jsonResponse_(handleAuthSessionStatus_(data));
    if (action === "auth_logout") return jsonResponse_(handleAuthLogout_(data));
    return jsonResponse_(handleWaitlistSubmission_(data));

  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
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
 * Envia email via Microsoft Graph (team@link2nite.com). Se falhar ou não configurado, usa Gmail.
 * Logs ficam em Execuções do Apps Script para debug.
 */
function sendWaitlistEmail(to, subject, plainBody, htmlBody) {
  var token = getGraphAccessToken();
  Logger.log("sendWaitlistEmail: Graph token = " + (token ? "OK (enviará de team@link2nite.com)" : "AUSENTE (enviará do Gmail)"));
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
        Logger.log("Graph: envio aceito (202). Se o email não chegar, confira SPF/DKIM e caixa team@ no M365.");
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

function doGet(e) {
  var action = e && e.parameter ? String(e.parameter.action || "").trim() : "";
  if (action === "capabilities") {
    return jsonResponse_({
      ok: true,
      supportsAdminAuth: true,
      feature: "admin_auth"
    });
  }
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
  var destinoTeste = "aloisioscjr@hotmail.com";
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
