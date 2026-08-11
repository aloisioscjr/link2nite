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
var USER_AUTH_CODE_TTL_SECONDS = 10 * 60;
var USER_AUTH_COOLDOWN_SECONDS = 60;
var USER_PHONE_CODE_TTL_SECONDS = 10 * 60;
var USER_PHONE_COOLDOWN_SECONDS = 60;
var USER_SESSION_TTL_DAYS = 30;
var GOING_TONIGHT_TTL_HOURS = 18;
var GOING_TONIGHT_TTL_MS = GOING_TONIGHT_TTL_HOURS * 60 * 60 * 1000;
var DEFAULT_STRIPE_SUCCESS_URL = "https://www.link2nite.com/beta/?checkout=success&session_id={CHECKOUT_SESSION_ID}";
var DEFAULT_STRIPE_CANCEL_URL = "https://www.link2nite.com/beta/?checkout=cancel";
var DEFAULT_STRIPE_PORTAL_RETURN_URL = "https://www.link2nite.com/beta/?billing=return";
var PROFILE_JSON_PARTS = 20;
var PROFILE_JSON_CHUNK_SIZE = 40000;
var SHARED_ACCOUNTS_SHEET_NAME = "L2N_Accounts";
var SHARED_PROFILES_SHEET_NAME = "L2N_Profiles";
var SHARED_PRESENCE_SHEET_NAME = "L2N_Presence";
var SHARED_LIKES_SHEET_NAME = "L2N_Likes";
var SHARED_MESSAGES_SHEET_NAME = "L2N_Messages";

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

function normalizePhoneE164_(value) {
  var raw = String(value || "").trim();
  if (!raw) return "";
  var digits = raw.replace(/\D+/g, "");
  if (raw.indexOf("+") === 0) {
    if (digits.length < 10 || digits.length > 15) return "";
    return "+" + digits;
  }
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.charAt(0) === "1") return "+" + digits;
  return "";
}

function isValidPhoneE164_(value) {
  return !!normalizePhoneE164_(value);
}

function maskPhone_(value) {
  var normalized = normalizePhoneE164_(value);
  if (!normalized) return "";
  return normalized.slice(0, Math.max(0, normalized.length - 4)).replace(/\d/g, "•") + normalized.slice(-4);
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

function getUserAuthCodeCacheKey_(email) {
  return "USER_AUTH_CODE_" + sha256Hex_(normalizeEmail_(email));
}

function getUserAuthCooldownCacheKey_(email) {
  return "USER_AUTH_COOLDOWN_" + sha256Hex_(normalizeEmail_(email));
}

function getUserSessionPropertyKey_(token) {
  return "USER_SESSION_" + sha256Hex_(String(token || ""));
}

function getUserPhoneAuthCodeCacheKey_(phone) {
  return "USER_PHONE_CODE_" + sha256Hex_(normalizePhoneE164_(phone));
}

function getUserPhoneCooldownCacheKey_(phone) {
  return "USER_PHONE_COOLDOWN_" + sha256Hex_(normalizePhoneE164_(phone));
}

function getSmsConfig_() {
  var props = PropertiesService.getScriptProperties();
  return {
    accountSid: String(props.getProperty("TWILIO_ACCOUNT_SID") || "").trim(),
    authToken: String(props.getProperty("TWILIO_AUTH_TOKEN") || "").trim(),
    fromNumber: String(props.getProperty("TWILIO_FROM_NUMBER") || "").trim(),
    messagingServiceSid: String(props.getProperty("TWILIO_MESSAGING_SERVICE_SID") || "").trim()
  };
}

function isSmsAuthConfigured_() {
  var cfg = getSmsConfig_();
  return !!(cfg.accountSid && cfg.authToken && (cfg.fromNumber || cfg.messagingServiceSid));
}

function getStripeConfig_() {
  var props = PropertiesService.getScriptProperties();
  return {
    secretKey: String(props.getProperty("STRIPE_SECRET_KEY") || "").trim(),
    monthlyPriceId: String(props.getProperty("STRIPE_PRICE_ID_MONTHLY") || "").trim(),
    weeklyPriceId: String(props.getProperty("STRIPE_PRICE_ID_WEEKLY") || "").trim(),
    successUrl: String(props.getProperty("STRIPE_SUCCESS_URL") || "").trim(),
    cancelUrl: String(props.getProperty("STRIPE_CANCEL_URL") || "").trim(),
    portalReturnUrl: String(props.getProperty("STRIPE_PORTAL_RETURN_URL") || "").trim()
  };
}

function isStripeCheckoutConfigured_() {
  var cfg = getStripeConfig_();
  return !!(cfg.secretKey && (cfg.monthlyPriceId || cfg.weeklyPriceId));
}

function normalizeBillingPlan_(value) {
  var plan = String(value || "").trim().toLowerCase();
  return plan === "weekly" ? "weekly" : "monthly";
}

function normalizeStripeStatus_(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeStripeId_(value) {
  return String(value || "").trim();
}

function getStripePriceIdForPlan_(plan) {
  var cfg = getStripeConfig_();
  var normalizedPlan = normalizeBillingPlan_(plan);
  return normalizedPlan === "weekly" ? cfg.weeklyPriceId : cfg.monthlyPriceId;
}

function getStripeSuccessUrl_() {
  var cfg = getStripeConfig_();
  return cfg.successUrl || DEFAULT_STRIPE_SUCCESS_URL;
}

function getStripeCancelUrl_() {
  var cfg = getStripeConfig_();
  return cfg.cancelUrl || DEFAULT_STRIPE_CANCEL_URL;
}

function getStripePortalReturnUrl_() {
  var cfg = getStripeConfig_();
  return cfg.portalReturnUrl || DEFAULT_STRIPE_PORTAL_RETURN_URL;
}

function buildFormUrlEncodedPayload_(pairs) {
  return (pairs || []).map(function(pair) {
    return encodeURIComponent(String(pair[0])) + "=" + encodeURIComponent(String(pair[1]));
  }).join("&");
}

function stripeApiRequest_(method, path, pairs) {
  var cfg = getStripeConfig_();
  if (!cfg.secretKey) throw new Error("Stripe is not configured on this deployment.");

  var normalizedMethod = String(method || "get").trim().toLowerCase();
  var url = "https://api.stripe.com/v1" + String(path || "");
  var options = {
    method: normalizedMethod,
    headers: {
      Authorization: "Bearer " + cfg.secretKey
    },
    muteHttpExceptions: true
  };

  if (normalizedMethod === "get") {
    if (pairs && pairs.length) {
      url += (url.indexOf("?") === -1 ? "?" : "&") + buildFormUrlEncodedPayload_(pairs);
    }
  } else if (pairs && pairs.length) {
    options.contentType = "application/x-www-form-urlencoded";
    options.payload = buildFormUrlEncodedPayload_(pairs);
  }

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var text = response.getContentText();
  var data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_) {
    data = {};
  }
  if (code < 200 || code >= 300) {
    var errorMessage = data && data.error && data.error.message
      ? data.error.message
      : ("Stripe API failed: HTTP " + code);
    throw new Error(errorMessage);
  }
  return data;
}

function unixSecondsToIso_(value) {
  var n = Number(value || 0);
  if (!isFinite(n) || n <= 0) return "";
  return new Date(n * 1000).toISOString();
}

function isStripeSubscriptionActiveStatus_(status) {
  var normalized = normalizeStripeStatus_(status);
  return normalized === "active" || normalized === "trialing";
}

function createStripeCheckoutSession_(identity, plan, reason, successUrl, cancelUrl, customerId) {
  var priceId = getStripePriceIdForPlan_(plan);
  if (!priceId) {
    throw new Error("That billing plan is not configured on this deployment.");
  }

  var pairs = [
    ["mode", "subscription"],
    ["success_url", successUrl || getStripeSuccessUrl_()],
    ["cancel_url", cancelUrl || getStripeCancelUrl_()],
    ["client_reference_id", identity.email],
    ["allow_promotion_codes", "true"],
    ["line_items[0][price]", priceId],
    ["line_items[0][quantity]", "1"],
    ["metadata[email]", identity.email],
    ["metadata[username]", identity.username],
    ["metadata[plan]", normalizeBillingPlan_(plan)],
    ["metadata[source]", "link2nite_beta"],
    ["metadata[reason]", String(reason || "").trim().slice(0, 80)],
    ["subscription_data[metadata][email]", identity.email],
    ["subscription_data[metadata][username]", identity.username],
    ["subscription_data[metadata][plan]", normalizeBillingPlan_(plan)],
    ["subscription_data[metadata][source]", "link2nite_beta"]
  ];
  var existingCustomerId = normalizeStripeId_(customerId || "");
  if (existingCustomerId) {
    pairs.push(["customer", existingCustomerId]);
  } else {
    pairs.push(["customer_email", identity.email]);
  }
  return stripeApiRequest_("post", "/checkout/sessions", pairs);
}

function getStripeCheckoutSession_(sessionId) {
  return stripeApiRequest_("get", "/checkout/sessions/" + encodeURIComponent(String(sessionId || "")), [
    ["expand[]", "subscription"]
  ]);
}

function getStripeSubscription_(subscriptionId) {
  return stripeApiRequest_("get", "/subscriptions/" + encodeURIComponent(String(subscriptionId || "")));
}

function createStripeBillingPortalSession_(customerId, returnUrl) {
  return stripeApiRequest_("post", "/billing_portal/sessions", [
    ["customer", String(customerId || "").trim()],
    ["return_url", returnUrl || getStripePortalReturnUrl_()]
  ]);
}

function sendSmsMessage_(to, body) {
  var cfg = getSmsConfig_();
  if (!isSmsAuthConfigured_()) {
    throw new Error("SMS verification is not configured on this deployment.");
  }

  var url = "https://api.twilio.com/2010-04-01/Accounts/" + encodeURIComponent(cfg.accountSid) + "/Messages.json";
  var payload = {
    To: normalizePhoneE164_(to),
    Body: String(body || "")
  };
  if (cfg.messagingServiceSid) payload.MessagingServiceSid = cfg.messagingServiceSid;
  else payload.From = cfg.fromNumber;

  var options = {
    method: "post",
    payload: payload,
    headers: {
      Authorization: "Basic " + Utilities.base64Encode(cfg.accountSid + ":" + cfg.authToken)
    },
    muteHttpExceptions: true
  };
  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error("Twilio SMS failed: HTTP " + code + " | " + response.getContentText());
  }
}

function getUserSignInEmailHtml_(email, code) {
  var img = WAITLIST_EMAIL_IMAGE_URL;
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#0f172a;font-family:\'Segoe UI\',Tahoma,Geneva,Verdana,sans-serif;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f172a;">' +
    '<tr><td align="center" style="padding:32px 16px;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">' +
    '<tr><td style="line-height:0;"><img src="' + img + '" alt="Link2Nite" width="560" style="display:block;width:100%;max-width:560px;height:auto;object-fit:cover;" /></td></tr>' +
    '<tr><td style="background-color:#0f172a;padding:20px 28px;text-align:center;border-bottom:1px solid rgba(148,163,184,0.15);">' +
    '<span style="font-size:22px;font-weight:800;color:#f1f5f9;letter-spacing:0.5px;">L2</span><span style="font-size:22px;font-weight:800;color:#a78bfa;letter-spacing:0.5px;">N</span><span style="font-size:22px;font-weight:800;color:#f1f5f9;letter-spacing:0.5px;"> Link2Nite</span></td></tr>' +
    '<tr><td style="background-color:#1e293b;padding:32px 28px;">' +
    '<p style="margin:0 0 16px;font-size:18px;color:#f1f5f9;font-weight:600;">Your Link2Nite sign-in code</p>' +
    '<p style="margin:0 0 16px;font-size:15px;color:#cbd5e1;line-height:1.6;">A sign-in was requested for <strong style="color:#f8fafc;">' + maskEmail_(email) + '</strong>.</p>' +
    '<p style="margin:0 0 24px;font-size:15px;color:#cbd5e1;line-height:1.6;">Use the code below in the app to keep your profile, going-tonight status, likes, matches, and chats synced across devices. This code expires in 10 minutes.</p>' +
    '<div style="display:inline-block;padding:14px 20px;border-radius:16px;background:#0f172a;border:1px solid rgba(167,139,250,0.35);font-size:30px;font-weight:800;letter-spacing:6px;color:#f8fafc;">' + code + '</div>' +
    '<p style="margin:24px 0 0;font-size:13px;color:#94a3b8;line-height:1.5;">If you did not request this code, you can ignore this email.</p>' +
    '</td></tr>' +
    '<tr><td style="background-color:#0f172a;padding:20px 28px;text-align:center;border-top:1px solid rgba(148,163,184,0.2);">' +
    '<p style="margin:0;font-size:12px;color:#94a3b8;">Link2Nite — Match. Meet. Tonight.</p></td></tr>' +
    '</table></td></tr></table></body></html>';
}

function storeUserSessionRecord_(token, email, username, phone, phoneVerified) {
  var props = PropertiesService.getScriptProperties();
  var expiresAt = new Date(Date.now() + USER_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  props.setProperty(
    getUserSessionPropertyKey_(token),
    JSON.stringify({
      email: normalizeEmail_(email),
      username: String(username || "").trim(),
      phone: normalizePhoneE164_(phone),
      phoneVerified: phoneVerified === true,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt
    })
  );
  return expiresAt;
}

function getUserSessionRecord_(token) {
  if (!token) return null;
  var props = PropertiesService.getScriptProperties();
  var key = getUserSessionPropertyKey_(token);
  var raw = props.getProperty(key);
  if (!raw) return null;

  try {
    var parsed = JSON.parse(raw);
    var expiresAt = parsed.expiresAt || "";
    if (expiresAt && Date.parse(expiresAt) <= Date.now()) {
      props.deleteProperty(key);
      return null;
    }
    if (!isValidEmail_(parsed.email)) {
      props.deleteProperty(key);
      return null;
    }
    parsed.email = normalizeEmail_(parsed.email);
    parsed.username = String(parsed.username || "").trim();
    parsed.phone = normalizePhoneE164_(parsed.phone);
    parsed.phoneVerified = parsed.phoneVerified === true;
    return parsed;
  } catch (err) {
    props.deleteProperty(key);
    return null;
  }
}

function deleteUserSessionRecord_(token) {
  if (!token) return;
  PropertiesService.getScriptProperties().deleteProperty(getUserSessionPropertyKey_(token));
}

function getSharedSpreadsheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    var id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
    if (id) ss = SpreadsheetApp.openById(id.trim());
  }
  if (!ss) throw new Error("Shared backend spreadsheet not configured.");
  return ss;
}

function getOrCreateSheet_(name, headers) {
  var ss = getSharedSpreadsheet_();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    var existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var sameHeaders = existingHeaders.length >= headers.length;
    if (sameHeaders) {
      for (var i = 0; i < headers.length; i++) {
        if (String(existingHeaders[i] || "") !== String(headers[i] || "")) {
          sameHeaders = false;
          break;
        }
      }
    }
    if (!sameHeaders) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }
  return sheet;
}

function readSheetObjects_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0].map(function(item) { return String(item || ""); });
  return values.slice(1).map(function(row, index) {
    var obj = { _rowNumber: index + 2 };
    headers.forEach(function(header, colIndex) {
      obj[header] = row[colIndex];
    });
    return obj;
  });
}

function withScriptLock_(callback) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function getAccountsSheetHeaders_() {
  return [
    "email",
    "username",
    "phone",
    "phone_verified",
    "pro_active",
    "pro_plan",
    "pro_status",
    "stripe_customer_id",
    "stripe_subscription_id",
    "stripe_checkout_session_id",
    "pro_expires_at",
    "pro_updated_at",
    "created_at",
    "updated_at"
  ];
}

function getProfilesSheetHeaders_() {
  var headers = ["username", "email"];
  for (var i = 1; i <= PROFILE_JSON_PARTS; i++) {
    headers.push("profile_part_" + i);
  }
  headers.push("created_at");
  headers.push("updated_at");
  return headers;
}

function getPresenceSheetHeaders_() {
  return ["place_id", "username", "state", "active", "updated_at", "expires_at"];
}

function getLikesSheetHeaders_() {
  return ["place_id", "from_username", "to_username", "active", "updated_at"];
}

function getMessagesSheetHeaders_() {
  return ["chat_key", "place_id", "from_username", "to_username", "text", "ts"];
}

function parseAccountRecord_(row) {
  return {
    rowNumber: row._rowNumber,
    email: normalizeEmail_(row.email),
    username: String(row.username || "").trim(),
    phone: normalizePhoneE164_(row.phone),
    phoneVerified: String(row.phone_verified || "").toLowerCase() === "true",
    proActive: String(row.pro_active || "").toLowerCase() === "true",
    proPlan: normalizeBillingPlan_(row.pro_plan || ""),
    proStatus: normalizeStripeStatus_(row.pro_status || ""),
    stripeCustomerId: normalizeStripeId_(row.stripe_customer_id || ""),
    stripeSubscriptionId: normalizeStripeId_(row.stripe_subscription_id || ""),
    stripeCheckoutSessionId: normalizeStripeId_(row.stripe_checkout_session_id || ""),
    proExpiresAt: String(row.pro_expires_at || "").trim(),
    proUpdatedAt: String(row.pro_updated_at || "").trim(),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || "")
  };
}

function getAccountRecords_(sheet) {
  return readSheetObjects_(sheet)
    .map(parseAccountRecord_)
    .filter(function(record) {
      return !!record.email;
    });
}

function findAccountRecordByEmail_(records, email) {
  var normalized = normalizeEmail_(email);
  for (var i = 0; i < records.length; i++) {
    if (records[i].email === normalized) return records[i];
  }
  return null;
}

function findAccountRecordByUsername_(records, username) {
  var normalized = String(username || "").trim();
  for (var i = 0; i < records.length; i++) {
    if (records[i].username === normalized) return records[i];
  }
  return null;
}

function findAccountRecordByPhone_(records, phone) {
  var normalized = normalizePhoneE164_(phone);
  for (var i = 0; i < records.length; i++) {
    if (records[i].phone === normalized) return records[i];
  }
  return null;
}

function mergeAccountBillingState_(existingRecord, extra) {
  var merged = {
    proActive: existingRecord ? existingRecord.proActive === true : false,
    proPlan: existingRecord ? normalizeBillingPlan_(existingRecord.proPlan) : "",
    proStatus: existingRecord ? normalizeStripeStatus_(existingRecord.proStatus) : "",
    stripeCustomerId: existingRecord ? normalizeStripeId_(existingRecord.stripeCustomerId) : "",
    stripeSubscriptionId: existingRecord ? normalizeStripeId_(existingRecord.stripeSubscriptionId) : "",
    stripeCheckoutSessionId: existingRecord ? normalizeStripeId_(existingRecord.stripeCheckoutSessionId) : "",
    proExpiresAt: existingRecord ? String(existingRecord.proExpiresAt || "").trim() : "",
    proUpdatedAt: existingRecord ? String(existingRecord.proUpdatedAt || "").trim() : ""
  };
  var source = extra || {};
  if (Object.prototype.hasOwnProperty.call(source, "proActive")) merged.proActive = source.proActive === true;
  if (Object.prototype.hasOwnProperty.call(source, "proPlan")) merged.proPlan = normalizeBillingPlan_(source.proPlan);
  if (Object.prototype.hasOwnProperty.call(source, "proStatus")) merged.proStatus = normalizeStripeStatus_(source.proStatus);
  if (Object.prototype.hasOwnProperty.call(source, "stripeCustomerId")) merged.stripeCustomerId = normalizeStripeId_(source.stripeCustomerId);
  if (Object.prototype.hasOwnProperty.call(source, "stripeSubscriptionId")) merged.stripeSubscriptionId = normalizeStripeId_(source.stripeSubscriptionId);
  if (Object.prototype.hasOwnProperty.call(source, "stripeCheckoutSessionId")) merged.stripeCheckoutSessionId = normalizeStripeId_(source.stripeCheckoutSessionId);
  if (Object.prototype.hasOwnProperty.call(source, "proExpiresAt")) merged.proExpiresAt = String(source.proExpiresAt || "").trim();
  if (Object.prototype.hasOwnProperty.call(source, "proUpdatedAt")) merged.proUpdatedAt = String(source.proUpdatedAt || "").trim();
  return merged;
}

function writeAccountRecord_(sheet, rowNumber, email, username, phone, phoneVerified, createdAt, updatedAt, billingState) {
  var state = mergeAccountBillingState_(null, billingState || {});
  var row = [
    normalizeEmail_(email),
    String(username || "").trim(),
    normalizePhoneE164_(phone),
    phoneVerified === true ? "true" : "false",
    state.proActive === true ? "true" : "false",
    state.proPlan || "",
    state.proStatus || "",
    state.stripeCustomerId || "",
    state.stripeSubscriptionId || "",
    state.stripeCheckoutSessionId || "",
    state.proExpiresAt || "",
    state.proUpdatedAt || "",
    createdAt || "",
    updatedAt || ""
  ];
  if (rowNumber) {
    sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function upsertAccountRecord_(sheet, existingRecord, email, username, phone, phoneVerified, createdAt, updatedAt, billingState) {
  var mergedBillingState = mergeAccountBillingState_(existingRecord, billingState || {});
  writeAccountRecord_(
    sheet,
    existingRecord ? existingRecord.rowNumber : 0,
    email,
    username,
    phone,
    phoneVerified,
    createdAt,
    updatedAt,
    mergedBillingState
  );
  return findAccountRecordByEmail_(getAccountRecords_(sheet), email);
}

function ensureAccountRecordForEmail_(accountsSheet, profilesSheet, email, options) {
  var normalizedEmail = normalizeEmail_(email);
  if (!normalizedEmail) return null;

  var opts = options || {};
  var existingRecord = findAccountRecordByEmail_(getAccountRecords_(accountsSheet), normalizedEmail);
  if (existingRecord) return existingRecord;

  var legacyProfile = profilesSheet ? findProfileRecordByEmail_(getProfileRecords_(profilesSheet), normalizedEmail) : null;
  if (!legacyProfile && opts.createIfMissing !== true) return null;

  var nowIso = new Date().toISOString();
  var createdAt = legacyProfile ? (legacyProfile.createdAt || nowIso) : nowIso;
  return upsertAccountRecord_(
    accountsSheet,
    null,
    normalizedEmail,
    legacyProfile ? legacyProfile.username : "",
    opts.phone,
    opts.phoneVerified === true,
    createdAt,
    nowIso
  );
}

function splitTextIntoChunks_(text, size, maxParts) {
  var source = String(text || "");
  if (source.length > size * maxParts) {
    throw new Error("Profile data is too large to sync right now.");
  }
  var chunks = [];
  for (var i = 0; i < maxParts; i++) {
    chunks.push(source.slice(i * size, (i + 1) * size));
  }
  return chunks;
}

function joinProfileChunksFromRow_(row) {
  var parts = [];
  for (var i = 1; i <= PROFILE_JSON_PARTS; i++) {
    var value = row["profile_part_" + i];
    if (value !== null && value !== undefined && value !== "") {
      parts.push(String(value));
    }
  }
  return parts.join("");
}

function parseProfileRecord_(row) {
  var parsedProfile = {};
  var rawProfile = joinProfileChunksFromRow_(row);
  if (rawProfile) {
    try {
      parsedProfile = JSON.parse(rawProfile) || {};
    } catch (_) {
      parsedProfile = {};
    }
  }
  return {
    rowNumber: row._rowNumber,
    username: String(row.username || "").trim(),
    email: normalizeEmail_(row.email),
    profile: parsedProfile,
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || "")
  };
}

function getProfileRecords_(sheet) {
  return readSheetObjects_(sheet)
    .map(parseProfileRecord_)
    .filter(function(record) {
      return !!record.username && !!record.email;
    });
}

function findProfileRecordByEmail_(records, email) {
  var normalized = normalizeEmail_(email);
  for (var i = 0; i < records.length; i++) {
    if (records[i].email === normalized) return records[i];
  }
  return null;
}

function findProfileRecordByUsername_(records, username) {
  var normalized = String(username || "").trim();
  for (var i = 0; i < records.length; i++) {
    if (records[i].username === normalized) return records[i];
  }
  return null;
}

function sanitizeDisplayName_(value) {
  return String(value || "").trim().slice(0, 80);
}

function usernameExistsInRecords_(accountRecords, profileRecords, username) {
  return !!(
    findAccountRecordByUsername_(accountRecords || [], username) ||
    findProfileRecordByUsername_(profileRecords || [], username)
  );
}

function generateUniqueUsername_(desiredDisplayName, accountRecords, profileRecords) {
  var base = sanitizeDisplayName_(desiredDisplayName) || "member";
  var candidate = base;
  var suffix = 2;
  while (usernameExistsInRecords_(accountRecords, profileRecords, candidate)) {
    candidate = base + " " + suffix;
    suffix += 1;
    if (suffix > 9999) {
      candidate = base + " " + Utilities.getUuid().slice(0, 8);
      if (!usernameExistsInRecords_(accountRecords, profileRecords, candidate)) break;
    }
  }
  return candidate;
}

function writeProfileRecord_(sheet, rowNumber, username, email, profile, createdAt, updatedAt) {
  var json = JSON.stringify(profile || {});
  var chunks = splitTextIntoChunks_(json, PROFILE_JSON_CHUNK_SIZE, PROFILE_JSON_PARTS);
  var row = [String(username || "").trim(), normalizeEmail_(email)].concat(chunks).concat([createdAt || "", updatedAt || ""]);
  if (rowNumber) {
    sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function sanitizePublicProfilePayload_(profile) {
  var source = profile && typeof profile === "object" ? profile : {};
  var result = {};

  var displayName = sanitizeDisplayName_(source.displayName);
  if (displayName) result.displayName = displayName;

  if (source.age !== undefined && source.age !== null && source.age !== "") {
    var age = parseInt(source.age, 10);
    if (!isNaN(age) && age >= 18 && age <= 99) result.age = age;
  }

  ["vibe", "gender", "showMe", "bio", "location", "jobTitle", "company", "school", "instagram"].forEach(function(key) {
    var value = source[key];
    if (value === undefined || value === null) return;
    var text = String(value).trim();
    if (!text) return;
    result[key] = text.slice(0, key === "bio" ? 600 : 120);
  });

  if (source.showAge !== undefined) result.showAge = source.showAge !== false;
  if (source.isBot === true) result.isBot = true;

  if (Array.isArray(source.photos)) {
    result.photos = source.photos
      .filter(function(item) {
        return typeof item === "string" && item.trim();
      })
      .slice(0, 6)
      .map(function(item) {
        return String(item);
      });
  }

  return result;
}

function sanitizeProfileForPublic_(profile) {
  var clean = sanitizePublicProfilePayload_(profile || {});
  if (profile && profile.isBot === true) clean.isBot = true;
  return clean;
}

function getResolvedUserSessionIdentity_(sessionRecord, sessionToken) {
  if (!sessionRecord || !sessionRecord.email) {
    return {
      email: "",
      username: "",
      phone: "",
      phoneVerified: false,
      proActive: false,
      proPlan: "",
      proStatus: "",
      proExpiresAt: "",
      expiresAt: ""
    };
  }

  var currentEmail = normalizeEmail_(sessionRecord.email);
  var currentUsername = String(sessionRecord.username || "").trim();
  var currentPhone = normalizePhoneE164_(sessionRecord.phone);
  var currentPhoneVerified = sessionRecord.phoneVerified === true;
  var currentExpiresAt = String(sessionRecord.expiresAt || "");

  var accountsSheet = getOrCreateSheet_(SHARED_ACCOUNTS_SHEET_NAME, getAccountsSheetHeaders_());
  var profilesSheet = getOrCreateSheet_(SHARED_PROFILES_SHEET_NAME, getProfilesSheetHeaders_());
  var accountRecord = ensureAccountRecordForEmail_(accountsSheet, profilesSheet, currentEmail, {
    createIfMissing: false,
    username: currentUsername,
    phone: currentPhone,
    phoneVerified: currentPhoneVerified
  });

  var identity = {
    email: currentEmail,
    username: currentUsername,
    phone: currentPhone,
    phoneVerified: currentPhoneVerified,
    proActive: false,
    proPlan: "",
    proStatus: "",
    proExpiresAt: "",
    expiresAt: currentExpiresAt
  };

  if (accountRecord) {
    if (accountRecord.username) identity.username = accountRecord.username;
    if (accountRecord.phone) identity.phone = accountRecord.phone;
    identity.phoneVerified = accountRecord.phoneVerified === true;
    identity.proActive = accountRecord.proActive === true;
    identity.proPlan = normalizeBillingPlan_(accountRecord.proPlan || "");
    identity.proStatus = normalizeStripeStatus_(accountRecord.proStatus || "");
    identity.proExpiresAt = String(accountRecord.proExpiresAt || "").trim();
  }

  if (
    sessionToken &&
    (
      identity.email !== currentEmail ||
      identity.username !== currentUsername ||
      identity.phone !== currentPhone ||
      identity.phoneVerified !== currentPhoneVerified
    )
  ) {
    storeUserSessionRecord_(sessionToken, identity.email, identity.username, identity.phone, identity.phoneVerified);
  }

  sessionRecord.email = identity.email;
  sessionRecord.username = identity.username;
  sessionRecord.phone = identity.phone;
  sessionRecord.phoneVerified = identity.phoneVerified;
  sessionRecord.proActive = identity.proActive;
  sessionRecord.proPlan = identity.proPlan;
  sessionRecord.proStatus = identity.proStatus;
  sessionRecord.proExpiresAt = identity.proExpiresAt;
  return identity;
}

function getUsernameForUserSession_(sessionRecord, sessionToken) {
  return getResolvedUserSessionIdentity_(sessionRecord, sessionToken).username;
}

function buildChatKey_(placeId, userA, userB) {
  var names = [String(userA || "").trim(), String(userB || "").trim()].sort();
  return String(placeId || "").trim() + "||" + names[0] + "||" + names[1];
}

function buildSharedSnapshot_() {
  var profilesSheet = getOrCreateSheet_(SHARED_PROFILES_SHEET_NAME, getProfilesSheetHeaders_());
  var presenceSheet = getOrCreateSheet_(SHARED_PRESENCE_SHEET_NAME, getPresenceSheetHeaders_());
  var likesSheet = getOrCreateSheet_(SHARED_LIKES_SHEET_NAME, getLikesSheetHeaders_());
  var messagesSheet = getOrCreateSheet_(SHARED_MESSAGES_SHEET_NAME, getMessagesSheetHeaders_());

  var profiles = {};
  getProfileRecords_(profilesSheet).forEach(function(record) {
    profiles[record.username] = sanitizeProfileForPublic_(record.profile);
  });

  var now = Date.now();
  var going = {};
  var goingMeta = {};
  var interested = {};
  readSheetObjects_(presenceSheet).forEach(function(row) {
    var placeId = String(row.place_id || "").trim();
    var username = String(row.username || "").trim();
    var state = String(row.state || "").trim();
    var isActive = String(row.active || "").toLowerCase() === "true";
    if (!placeId || !username || !state || !isActive) return;

    var updatedAtText = String(row.updated_at || "");
    var expiresAtText = String(row.expires_at || "");
    var updatedAtTs = Date.parse(updatedAtText);
    var expiresAtTs = Date.parse(expiresAtText);

    if (state === "going") {
      if (Number.isFinite(expiresAtTs) && expiresAtTs <= now) return;
      if (!going[placeId]) going[placeId] = [];
      if (!goingMeta[placeId]) goingMeta[placeId] = {};
      if (going[placeId].indexOf(username) === -1) going[placeId].push(username);
      goingMeta[placeId][username] = Number.isFinite(updatedAtTs) ? updatedAtTs : now;
      return;
    }

    if (state === "interested") {
      if (!interested[placeId]) interested[placeId] = [];
      if (interested[placeId].indexOf(username) === -1) interested[placeId].push(username);
    }
  });

  var likes = {};
  readSheetObjects_(likesSheet).forEach(function(row) {
    var placeId = String(row.place_id || "").trim();
    var fromUsername = String(row.from_username || "").trim();
    var toUsername = String(row.to_username || "").trim();
    var isActive = String(row.active || "").toLowerCase() === "true";
    if (!placeId || !fromUsername || !toUsername || !isActive) return;
    if (!likes[placeId]) likes[placeId] = {};
    if (!Array.isArray(likes[placeId][fromUsername])) likes[placeId][fromUsername] = [];
    if (likes[placeId][fromUsername].indexOf(toUsername) === -1) likes[placeId][fromUsername].push(toUsername);
  });

  var messages = {};
  readSheetObjects_(messagesSheet).forEach(function(row) {
    var chatKey = String(row.chat_key || "").trim();
    var fromUsername = String(row.from_username || "").trim();
    var text = String(row.text || "");
    var ts = Number(row.ts || 0);
    if (!chatKey || !fromUsername || !text) return;
    if (!Array.isArray(messages[chatKey])) messages[chatKey] = [];
    messages[chatKey].push({
      from: fromUsername,
      text: text,
      ts: Number.isFinite(ts) && ts > 0 ? ts : Date.now()
    });
  });

  Object.keys(messages).forEach(function(chatKey) {
    messages[chatKey].sort(function(a, b) {
      return Number(a.ts || 0) - Number(b.ts || 0);
    });
  });

  return {
    profiles: profiles,
    going: going,
    goingMeta: goingMeta,
    interested: interested,
    likes: likes,
    messages: messages,
    snapshotAt: new Date().toISOString(),
    goingTtlHours: GOING_TONIGHT_TTL_HOURS
  };
}

function handleUserRequestCode_(data) {
  var email = normalizeEmail_(data.email);
  if (!isValidEmail_(email)) {
    return { ok: false, error: "Enter a valid email." };
  }

  var cache = CacheService.getScriptCache();
  var cooldownKey = getUserAuthCooldownCacheKey_(email);
  if (cache.get(cooldownKey)) {
    return { ok: false, error: "Please wait a minute before requesting another code." };
  }

  cache.put(cooldownKey, "1", USER_AUTH_COOLDOWN_SECONDS);
  var code = generateOtpCode_();
  cache.put(getUserAuthCodeCacheKey_(email), JSON.stringify({
    codeHash: sha256Hex_(code),
    expiresAt: Date.now() + USER_AUTH_CODE_TTL_SECONDS * 1000
  }), USER_AUTH_CODE_TTL_SECONDS);

  var subject = "Your Link2Nite sign-in code";
  var plainBody = "Your Link2Nite sign-in code is " + code + ". It expires in 10 minutes.";
  var htmlBody = getUserSignInEmailHtml_(email, code);
  sendWaitlistEmail(email, subject, plainBody, htmlBody);

  return {
    ok: true,
    message: "If this email can receive Link2Nite access codes, a sign-in code was sent."
  };
}

function handleUserVerifyCode_(data) {
  var email = normalizeEmail_(data.email);
  var code = String(data.code || "").replace(/\D+/g, "").slice(0, 6);
  if (!isValidEmail_(email) || code.length !== 6) {
    return { ok: false, error: "Invalid or expired sign-in code." };
  }

  var cache = CacheService.getScriptCache();
  var raw = cache.get(getUserAuthCodeCacheKey_(email));
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

  cache.remove(getUserAuthCodeCacheKey_(email));
  return withScriptLock_(function() {
    var accountsSheet = getOrCreateSheet_(SHARED_ACCOUNTS_SHEET_NAME, getAccountsSheetHeaders_());
    var profilesSheet = getOrCreateSheet_(SHARED_PROFILES_SHEET_NAME, getProfilesSheetHeaders_());
    var accountRecord = ensureAccountRecordForEmail_(accountsSheet, profilesSheet, email, { createIfMissing: true });
    var username = accountRecord ? accountRecord.username : "";
    var phone = accountRecord ? accountRecord.phone : "";
    var phoneVerified = accountRecord ? accountRecord.phoneVerified === true : false;
    var sessionToken = createSessionToken_();
    var expiresAt = storeUserSessionRecord_(sessionToken, email, username, phone, phoneVerified);

    return {
      ok: true,
      authenticated: true,
      email: email,
      username: username,
      phone: phone,
      phoneVerified: phoneVerified,
      proActive: accountRecord ? accountRecord.proActive === true : false,
      proPlan: accountRecord ? accountRecord.proPlan : "",
      proStatus: accountRecord ? accountRecord.proStatus : "",
      proExpiresAt: accountRecord ? String(accountRecord.proExpiresAt || "") : "",
      sessionToken: sessionToken,
      expiresAt: expiresAt
    };
  });
}

function handleUserSessionStatus_(data) {
  var token = String(data.sessionToken || "");
  var record = getUserSessionRecord_(token);
  if (!record) {
    return { ok: true, authenticated: false };
  }
  var identity = getResolvedUserSessionIdentity_(record, token);
  return {
    ok: true,
    authenticated: true,
    email: identity.email,
    username: identity.username,
    phone: identity.phone,
    phoneVerified: identity.phoneVerified,
    proActive: identity.proActive === true,
    proPlan: identity.proPlan || "",
    proStatus: identity.proStatus || "",
    proExpiresAt: identity.proExpiresAt || "",
    expiresAt: record.expiresAt
  };
}

function handleUserLogout_(data) {
  deleteUserSessionRecord_(data.sessionToken);
  return { ok: true };
}

function handleSharedSnapshot_(data) {
  var token = String(data.sessionToken || "");
  var sessionRecord = token ? getUserSessionRecord_(token) : null;
  var viewer = { authenticated: false };

  if (sessionRecord) {
    var identity = getResolvedUserSessionIdentity_(sessionRecord, token);
    viewer = {
      authenticated: true,
      email: identity.email,
      username: identity.username,
      phone: identity.phone,
      phoneVerified: identity.phoneVerified,
      proActive: identity.proActive === true,
      proPlan: identity.proPlan || "",
      proStatus: identity.proStatus || "",
      proExpiresAt: identity.proExpiresAt || "",
      expiresAt: sessionRecord.expiresAt
    };
  }

  return {
    ok: true,
    supportsSharedState: true,
    supportsUserAuth: true,
    supportsPhoneAuth: isSmsAuthConfigured_(),
    supportsSmsAuth: isSmsAuthConfigured_(),
    supportsPayments: isStripeCheckoutConfigured_(),
    supportsStripeCheckout: isStripeCheckoutConfigured_(),
    viewer: viewer,
    snapshot: buildSharedSnapshot_()
  };
}

function handleSharedProfileUpsert_(data) {
  return withScriptLock_(function() {
    var token = String(data.sessionToken || "");
    var sessionRecord = getUserSessionRecord_(token);
    if (!sessionRecord) return { ok: false, error: "Sign in again to sync this profile.", code: "user_session_required" };

    var desiredDisplayName = sanitizeDisplayName_(data.displayName || data.username);
    if (!desiredDisplayName) return { ok: false, error: "Choose a display name first.", code: "missing_username" };
    var rawRequestedPhone = String(data.phone || "").trim();
    var requestedPhone = rawRequestedPhone ? normalizePhoneE164_(rawRequestedPhone) : "";
    if (rawRequestedPhone && !requestedPhone) {
      return { ok: false, error: "Enter a valid phone number.", code: "invalid_phone" };
    }

    var accountsSheet = getOrCreateSheet_(SHARED_ACCOUNTS_SHEET_NAME, getAccountsSheetHeaders_());
    var profilesSheet = getOrCreateSheet_(SHARED_PROFILES_SHEET_NAME, getProfilesSheetHeaders_());
    var accountRecord = ensureAccountRecordForEmail_(accountsSheet, profilesSheet, sessionRecord.email, {
      createIfMissing: true,
      username: sessionRecord.username,
      phone: sessionRecord.phone,
      phoneVerified: sessionRecord.phoneVerified === true
    });
    var accountRecords = getAccountRecords_(accountsSheet);
    var accountByEmail = findAccountRecordByEmail_(accountRecords, sessionRecord.email) || accountRecord;
    var byPhone = requestedPhone ? findAccountRecordByPhone_(accountRecords, requestedPhone) : null;

    if (byPhone && byPhone.email !== sessionRecord.email) {
      return {
        ok: false,
        error: "That phone number is already linked to another account.",
        code: "phone_in_use"
      };
    }

    var profileRecords = getProfileRecords_(profilesSheet);
    var username = accountByEmail && accountByEmail.username
      ? accountByEmail.username
      : generateUniqueUsername_(desiredDisplayName, accountRecords, profileRecords);
    var profileByEmail = findProfileRecordByEmail_(profileRecords, sessionRecord.email);
    var profileByUsername = findProfileRecordByUsername_(profileRecords, username);

    var existingProfile = profileByEmail ? profileByEmail.profile : (profileByUsername ? profileByUsername.profile : {});
    var nextProfile = sanitizePublicProfilePayload_(existingProfile);
    var incomingProfile = sanitizePublicProfilePayload_(data.profile || {});
    Object.keys(incomingProfile).forEach(function(key) {
      nextProfile[key] = incomingProfile[key];
    });
    nextProfile.displayName = desiredDisplayName;
    nextProfile.isBot = false;

    var nowIso = new Date().toISOString();
    var existingPhone = normalizePhoneE164_(accountByEmail ? accountByEmail.phone : sessionRecord.phone);
    var existingPhoneVerified = accountByEmail ? accountByEmail.phoneVerified === true : sessionRecord.phoneVerified === true;
    var nextPhone = requestedPhone || existingPhone;
    var nextPhoneVerified = !!(nextPhone && existingPhoneVerified && existingPhone && existingPhone === nextPhone);
    var updatedAccount = upsertAccountRecord_(
      accountsSheet,
      accountByEmail || null,
      sessionRecord.email,
      username,
      nextPhone,
      nextPhoneVerified,
      accountByEmail ? (accountByEmail.createdAt || nowIso) : nowIso,
      nowIso
    );
    var createdAt = profileByEmail
      ? (profileByEmail.createdAt || nowIso)
      : (profileByUsername ? (profileByUsername.createdAt || nowIso) : nowIso);
    var rowNumber = profileByEmail ? profileByEmail.rowNumber : (profileByUsername ? profileByUsername.rowNumber : 0);
    writeProfileRecord_(profilesSheet, rowNumber, username, sessionRecord.email, nextProfile, createdAt, nowIso);
    storeUserSessionRecord_(
      token,
      sessionRecord.email,
      username,
      updatedAccount ? updatedAccount.phone : nextPhone,
      updatedAccount ? updatedAccount.phoneVerified === true : nextPhoneVerified
    );

    return {
      ok: true,
      username: username,
      displayName: desiredDisplayName,
      phone: updatedAccount ? updatedAccount.phone : normalizePhoneE164_(sessionRecord.phone),
      phoneVerified: updatedAccount ? updatedAccount.phoneVerified === true : sessionRecord.phoneVerified === true,
      updatedAt: nowIso,
      profile: sanitizeProfileForPublic_(nextProfile)
    };
  });
}

function buildStripeBillingState_(checkoutSession, subscription, fallbackPlan) {
  var session = checkoutSession || {};
  var sub = subscription || null;
  var plan = normalizeBillingPlan_(
    (session.metadata && session.metadata.plan) ||
    (sub && sub.metadata && sub.metadata.plan) ||
    fallbackPlan ||
    ""
  );
  var status = normalizeStripeStatus_(sub ? sub.status : (session.payment_status || session.status || ""));
  return {
    proActive: sub ? isStripeSubscriptionActiveStatus_(sub.status) : (String(session.status || "") === "complete" && String(session.payment_status || "") === "paid"),
    proPlan: plan,
    proStatus: status,
    stripeCustomerId: normalizeStripeId_((session.customer || (sub && sub.customer) || "")),
    stripeSubscriptionId: normalizeStripeId_((sub && sub.id) || session.subscription || ""),
    stripeCheckoutSessionId: normalizeStripeId_(session.id || ""),
    proExpiresAt: sub ? unixSecondsToIso_(sub.current_period_end) : "",
    proUpdatedAt: new Date().toISOString()
  };
}

function refreshAccountBillingFromStripe_(accountsSheet, accountRecord) {
  if (!accountRecord || !isStripeCheckoutConfigured_()) {
    return accountRecord;
  }

  var nowIso = new Date().toISOString();
  if (accountRecord.stripeSubscriptionId) {
    var subscription = getStripeSubscription_(accountRecord.stripeSubscriptionId);
    return upsertAccountRecord_(
      accountsSheet,
      accountRecord,
      accountRecord.email,
      accountRecord.username,
      accountRecord.phone,
      accountRecord.phoneVerified === true,
      accountRecord.createdAt || nowIso,
      nowIso,
      {
        proActive: isStripeSubscriptionActiveStatus_(subscription.status),
        proPlan: accountRecord.proPlan || ((subscription.metadata && subscription.metadata.plan) || ""),
        proStatus: normalizeStripeStatus_(subscription.status),
        stripeCustomerId: normalizeStripeId_(subscription.customer || accountRecord.stripeCustomerId),
        stripeSubscriptionId: normalizeStripeId_(subscription.id || accountRecord.stripeSubscriptionId),
        stripeCheckoutSessionId: accountRecord.stripeCheckoutSessionId,
        proExpiresAt: unixSecondsToIso_(subscription.current_period_end),
        proUpdatedAt: nowIso
      }
    );
  }

  if (accountRecord.stripeCheckoutSessionId) {
    var checkoutSession = getStripeCheckoutSession_(accountRecord.stripeCheckoutSessionId);
    var checkoutSubscription = null;
    if (checkoutSession.subscription && typeof checkoutSession.subscription === "object") {
      checkoutSubscription = checkoutSession.subscription;
    } else if (checkoutSession.subscription) {
      checkoutSubscription = getStripeSubscription_(checkoutSession.subscription);
    }
    return upsertAccountRecord_(
      accountsSheet,
      accountRecord,
      accountRecord.email,
      accountRecord.username,
      accountRecord.phone,
      accountRecord.phoneVerified === true,
      accountRecord.createdAt || nowIso,
      nowIso,
      buildStripeBillingState_(checkoutSession, checkoutSubscription, accountRecord.proPlan || "")
    );
  }

  return accountRecord;
}

function handleBillingCreateCheckout_(data) {
  if (!isStripeCheckoutConfigured_()) {
    return { ok: false, error: "Stripe Checkout is not configured on this deployment.", code: "billing_not_configured" };
  }

  return withScriptLock_(function() {
    var token = String(data.sessionToken || "");
    var sessionRecord = getUserSessionRecord_(token);
    if (!sessionRecord) return { ok: false, error: "Sign in again before upgrading to PRO.", code: "user_session_required" };

    var identity = getResolvedUserSessionIdentity_(sessionRecord, token);
    if (!identity.email) return { ok: false, error: "Add a valid email before upgrading.", code: "missing_email" };
    if (!identity.username) return { ok: false, error: "Create your profile before upgrading.", code: "missing_profile" };

    var plan = normalizeBillingPlan_(data.plan || "monthly");
    var priceId = getStripePriceIdForPlan_(plan);
    if (!priceId) return { ok: false, error: "That plan is not live on this deployment yet.", code: "plan_not_available" };

    var reason = String(data.reason || "").trim().slice(0, 80);
    var accountsSheet = getOrCreateSheet_(SHARED_ACCOUNTS_SHEET_NAME, getAccountsSheetHeaders_());
    var profilesSheet = getOrCreateSheet_(SHARED_PROFILES_SHEET_NAME, getProfilesSheetHeaders_());
    var accountRecord = ensureAccountRecordForEmail_(accountsSheet, profilesSheet, identity.email, {
      createIfMissing: true,
      username: identity.username,
      phone: identity.phone,
      phoneVerified: identity.phoneVerified === true
    });
    var successUrl = String(data.successUrl || getStripeSuccessUrl_()).trim() || getStripeSuccessUrl_();
    var cancelUrl = String(data.cancelUrl || getStripeCancelUrl_()).trim() || getStripeCancelUrl_();
    var checkoutSession = createStripeCheckoutSession_(
      identity,
      plan,
      reason,
      successUrl,
      cancelUrl,
      accountRecord ? accountRecord.stripeCustomerId : ""
    );
    var nowIso = new Date().toISOString();
    upsertAccountRecord_(
      accountsSheet,
      accountRecord,
      identity.email,
      identity.username,
      identity.phone,
      identity.phoneVerified === true,
      accountRecord ? (accountRecord.createdAt || nowIso) : nowIso,
      nowIso,
      {
        proPlan: plan,
        proStatus: "checkout_created",
        stripeCustomerId: normalizeStripeId_(checkoutSession.customer || (accountRecord && accountRecord.stripeCustomerId) || ""),
        stripeCheckoutSessionId: normalizeStripeId_(checkoutSession.id || ""),
        proUpdatedAt: nowIso
      }
    );

    return {
      ok: true,
      sessionId: String(checkoutSession.id || ""),
      checkoutUrl: String(checkoutSession.url || ""),
      plan: plan
    };
  });
}

function handleBillingCheckoutStatus_(data) {
  if (!isStripeCheckoutConfigured_()) {
    return { ok: false, error: "Stripe Checkout is not configured on this deployment.", code: "billing_not_configured" };
  }

  return withScriptLock_(function() {
    var token = String(data.sessionToken || "");
    var sessionRecord = getUserSessionRecord_(token);
    if (!sessionRecord) return { ok: false, error: "Sign in again before confirming your upgrade.", code: "user_session_required" };

    var identity = getResolvedUserSessionIdentity_(sessionRecord, token);
    var sessionId = normalizeStripeId_(data.sessionId || "");
    if (!sessionId) return { ok: false, error: "Missing Stripe checkout session.", code: "missing_checkout_session" };

    var checkoutSession = getStripeCheckoutSession_(sessionId);
    var checkoutEmail = normalizeEmail_(
      (checkoutSession.customer_details && checkoutSession.customer_details.email) ||
      checkoutSession.customer_email ||
      (checkoutSession.metadata && checkoutSession.metadata.email) ||
      ""
    );
    if (checkoutEmail && checkoutEmail !== identity.email) {
      return { ok: false, error: "This checkout belongs to a different Link2Nite account.", code: "checkout_account_mismatch" };
    }

    var subscription = null;
    if (checkoutSession.subscription && typeof checkoutSession.subscription === "object") {
      subscription = checkoutSession.subscription;
    } else if (checkoutSession.subscription) {
      subscription = getStripeSubscription_(checkoutSession.subscription);
    }

    var billingState = buildStripeBillingState_(checkoutSession, subscription, data.plan || "");
    var accountsSheet = getOrCreateSheet_(SHARED_ACCOUNTS_SHEET_NAME, getAccountsSheetHeaders_());
    var profilesSheet = getOrCreateSheet_(SHARED_PROFILES_SHEET_NAME, getProfilesSheetHeaders_());
    var accountRecord = ensureAccountRecordForEmail_(accountsSheet, profilesSheet, identity.email, {
      createIfMissing: true,
      username: identity.username,
      phone: identity.phone,
      phoneVerified: identity.phoneVerified === true
    });
    var nowIso = new Date().toISOString();
    var updatedAccount = upsertAccountRecord_(
      accountsSheet,
      accountRecord,
      identity.email,
      identity.username,
      identity.phone,
      identity.phoneVerified === true,
      accountRecord ? (accountRecord.createdAt || nowIso) : nowIso,
      nowIso,
      billingState
    );

    return {
      ok: true,
      checkoutStatus: String(checkoutSession.status || ""),
      paymentStatus: String(checkoutSession.payment_status || ""),
      proActive: updatedAccount ? updatedAccount.proActive === true : billingState.proActive === true,
      proPlan: updatedAccount ? updatedAccount.proPlan : billingState.proPlan,
      proStatus: updatedAccount ? updatedAccount.proStatus : billingState.proStatus,
      proExpiresAt: updatedAccount ? updatedAccount.proExpiresAt : billingState.proExpiresAt
    };
  });
}

function handleBillingStatus_(data) {
  var token = String(data.sessionToken || "");
  var sessionRecord = getUserSessionRecord_(token);
  if (!sessionRecord) return { ok: false, error: "Sign in again to load billing.", code: "user_session_required" };

  return withScriptLock_(function() {
    var identity = getResolvedUserSessionIdentity_(sessionRecord, token);
    var accountsSheet = getOrCreateSheet_(SHARED_ACCOUNTS_SHEET_NAME, getAccountsSheetHeaders_());
    var profilesSheet = getOrCreateSheet_(SHARED_PROFILES_SHEET_NAME, getProfilesSheetHeaders_());
    var accountRecord = ensureAccountRecordForEmail_(accountsSheet, profilesSheet, identity.email, {
      createIfMissing: true,
      username: identity.username,
      phone: identity.phone,
      phoneVerified: identity.phoneVerified === true
    });

    if (data && (data.refresh === true || String(data.refresh || "").toLowerCase() === "true")) {
      accountRecord = refreshAccountBillingFromStripe_(accountsSheet, accountRecord);
    }

    accountRecord = accountRecord || {};
    return {
      ok: true,
      billingLive: isStripeCheckoutConfigured_(),
      proActive: accountRecord.proActive === true,
      proPlan: accountRecord.proPlan || "",
      proStatus: accountRecord.proStatus || "",
      proExpiresAt: String(accountRecord.proExpiresAt || ""),
      stripeCustomerId: normalizeStripeId_(accountRecord.stripeCustomerId || ""),
      stripeSubscriptionId: normalizeStripeId_(accountRecord.stripeSubscriptionId || "")
    };
  });
}

function handleBillingCreatePortal_(data) {
  if (!isStripeCheckoutConfigured_()) {
    return { ok: false, error: "Stripe billing is not configured on this deployment.", code: "billing_not_configured" };
  }

  return withScriptLock_(function() {
    var token = String(data.sessionToken || "");
    var sessionRecord = getUserSessionRecord_(token);
    if (!sessionRecord) return { ok: false, error: "Sign in again before managing billing.", code: "user_session_required" };

    var identity = getResolvedUserSessionIdentity_(sessionRecord, token);
    var accountsSheet = getOrCreateSheet_(SHARED_ACCOUNTS_SHEET_NAME, getAccountsSheetHeaders_());
    var profilesSheet = getOrCreateSheet_(SHARED_PROFILES_SHEET_NAME, getProfilesSheetHeaders_());
    var accountRecord = ensureAccountRecordForEmail_(accountsSheet, profilesSheet, identity.email, {
      createIfMissing: true,
      username: identity.username,
      phone: identity.phone,
      phoneVerified: identity.phoneVerified === true
    });
    accountRecord = refreshAccountBillingFromStripe_(accountsSheet, accountRecord);
    var customerId = accountRecord ? normalizeStripeId_(accountRecord.stripeCustomerId || "") : "";
    if (!customerId) {
      return { ok: false, error: "No Stripe customer is linked to this account yet.", code: "missing_stripe_customer" };
    }

    var portal = createStripeBillingPortalSession_(
      customerId,
      String(data.returnUrl || getStripePortalReturnUrl_()).trim() || getStripePortalReturnUrl_()
    );
    return {
      ok: true,
      url: String(portal.url || "")
    };
  });
}

function handleUserPhoneRequestCode_(data) {
  if (!isSmsAuthConfigured_()) {
    return { ok: false, error: "SMS verification is not configured on this deployment." };
  }

  var token = String(data.sessionToken || "");
  var sessionRecord = getUserSessionRecord_(token);
  if (!sessionRecord) {
    return { ok: false, error: "Sign in again to verify your phone.", code: "user_session_required" };
  }

  var phone = normalizePhoneE164_(data.phone);
  if (!isValidPhoneE164_(phone)) {
    return { ok: false, error: "Enter a valid phone number." };
  }

  return withScriptLock_(function() {
    var accountsSheet = getOrCreateSheet_(SHARED_ACCOUNTS_SHEET_NAME, getAccountsSheetHeaders_());
    var profilesSheet = getOrCreateSheet_(SHARED_PROFILES_SHEET_NAME, getProfilesSheetHeaders_());
    ensureAccountRecordForEmail_(accountsSheet, profilesSheet, sessionRecord.email, {
      createIfMissing: true,
      username: sessionRecord.username,
      phone: sessionRecord.phone,
      phoneVerified: sessionRecord.phoneVerified === true
    });

    var accountRecords = getAccountRecords_(accountsSheet);
    var byPhone = findAccountRecordByPhone_(accountRecords, phone);
    if (byPhone && byPhone.email !== normalizeEmail_(sessionRecord.email)) {
      return {
        ok: false,
        error: "That phone number is already linked to another account.",
        code: "phone_in_use"
      };
    }

    var cache = CacheService.getScriptCache();
    var cooldownKey = getUserPhoneCooldownCacheKey_(phone);
    if (cache.get(cooldownKey)) {
      return { ok: false, error: "Please wait a minute before requesting another code." };
    }

    cache.put(cooldownKey, "1", USER_PHONE_COOLDOWN_SECONDS);
    var code = generateOtpCode_();
    cache.put(getUserPhoneAuthCodeCacheKey_(phone), JSON.stringify({
      codeHash: sha256Hex_(code),
      expiresAt: Date.now() + USER_PHONE_CODE_TTL_SECONDS * 1000,
      email: normalizeEmail_(sessionRecord.email)
    }), USER_PHONE_CODE_TTL_SECONDS);

    try {
      sendSmsMessage_(phone, "Your Link2Nite verification code is " + code + ". It expires in 10 minutes.");
    } catch (err) {
      cache.remove(cooldownKey);
      cache.remove(getUserPhoneAuthCodeCacheKey_(phone));
      return { ok: false, error: "Couldn't send the SMS code right now." };
    }

    return {
      ok: true,
      phone: phone,
      message: "SMS code sent to " + maskPhone_(phone) + "."
    };
  });
}

function handleUserPhoneVerifyCode_(data) {
  var token = String(data.sessionToken || "");
  var sessionRecord = getUserSessionRecord_(token);
  if (!sessionRecord) {
    return { ok: false, error: "Sign in again to verify your phone.", code: "user_session_required" };
  }

  var phone = normalizePhoneE164_(data.phone);
  var code = String(data.code || "").replace(/\D+/g, "").slice(0, 6);
  if (!isValidPhoneE164_(phone) || code.length !== 6) {
    return { ok: false, error: "Invalid or expired SMS code." };
  }

  var cache = CacheService.getScriptCache();
  var raw = cache.get(getUserPhoneAuthCodeCacheKey_(phone));
  if (!raw) {
    return { ok: false, error: "Invalid or expired SMS code." };
  }

  try {
    var stored = JSON.parse(raw);
    if (!stored || !stored.codeHash || !stored.expiresAt || stored.expiresAt < Date.now()) {
      return { ok: false, error: "Invalid or expired SMS code." };
    }
    if (stored.codeHash !== sha256Hex_(code)) {
      return { ok: false, error: "Invalid or expired SMS code." };
    }
    if (normalizeEmail_(stored.email) !== normalizeEmail_(sessionRecord.email)) {
      return { ok: false, error: "This SMS code belongs to a different account." };
    }
  } catch (err) {
    return { ok: false, error: "Invalid or expired SMS code." };
  }

  return withScriptLock_(function() {
    var accountsSheet = getOrCreateSheet_(SHARED_ACCOUNTS_SHEET_NAME, getAccountsSheetHeaders_());
    var profilesSheet = getOrCreateSheet_(SHARED_PROFILES_SHEET_NAME, getProfilesSheetHeaders_());
    var accountRecord = ensureAccountRecordForEmail_(accountsSheet, profilesSheet, sessionRecord.email, {
      createIfMissing: true,
      username: sessionRecord.username,
      phone: sessionRecord.phone,
      phoneVerified: sessionRecord.phoneVerified === true
    });
    var accountRecords = getAccountRecords_(accountsSheet);
    var byPhone = findAccountRecordByPhone_(accountRecords, phone);
    if (byPhone && byPhone.email !== normalizeEmail_(sessionRecord.email)) {
      return {
        ok: false,
        error: "That phone number is already linked to another account.",
        code: "phone_in_use"
      };
    }

    var nowIso = new Date().toISOString();
    var updatedAccount = upsertAccountRecord_(
      accountsSheet,
      accountRecord,
      sessionRecord.email,
      accountRecord ? accountRecord.username : sessionRecord.username,
      phone,
      true,
      accountRecord ? (accountRecord.createdAt || nowIso) : nowIso,
      nowIso
    );

    cache.remove(getUserPhoneAuthCodeCacheKey_(phone));
    var username = updatedAccount ? updatedAccount.username : String(sessionRecord.username || "").trim();
    var expiresAt = storeUserSessionRecord_(token, sessionRecord.email, username, phone, true);
    return {
      ok: true,
      username: username,
      phone: phone,
      phoneVerified: true,
      expiresAt: expiresAt
    };
  });
}

function handleSharedPresenceSet_(data) {
  return withScriptLock_(function() {
    var token = String(data.sessionToken || "");
    var sessionRecord = getUserSessionRecord_(token);
    if (!sessionRecord) return { ok: false, error: "Sign in again to sync your plan.", code: "user_session_required" };

    var username = getUsernameForUserSession_(sessionRecord, token);
    if (!username) return { ok: false, error: "Create your profile before syncing venue activity.", code: "missing_profile" };

    var placeId = String(data.placeId || "").trim();
    var state = String(data.state || "").trim();
    var active = data.active === true || String(data.active || "").toLowerCase() === "true";
    if (!placeId) return { ok: false, error: "Missing venue.", code: "missing_place" };
    if (state !== "going" && state !== "interested") {
      return { ok: false, error: "Unsupported presence state.", code: "invalid_state" };
    }

    var presenceSheet = getOrCreateSheet_(SHARED_PRESENCE_SHEET_NAME, getPresenceSheetHeaders_());
    var rows = readSheetObjects_(presenceSheet);
    var rowNumber = 0;
    rows.some(function(row) {
      if (String(row.place_id || "").trim() === placeId &&
          String(row.username || "").trim() === username &&
          String(row.state || "").trim() === state) {
        rowNumber = row._rowNumber;
        return true;
      }
      return false;
    });

    var nowIso = new Date().toISOString();
    var expiresAt = "";
    if (state === "going" && active) {
      expiresAt = new Date(Date.now() + GOING_TONIGHT_TTL_MS).toISOString();
    }
    var row = [placeId, username, state, active ? "true" : "false", nowIso, expiresAt];
    if (rowNumber) {
      presenceSheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
    } else {
      presenceSheet.appendRow(row);
    }

    return {
      ok: true,
      username: username,
      placeId: placeId,
      state: state,
      active: active,
      expiresAt: expiresAt,
      updatedAt: nowIso
    };
  });
}

function handleSharedLikeSet_(data) {
  return withScriptLock_(function() {
    var token = String(data.sessionToken || "");
    var sessionRecord = getUserSessionRecord_(token);
    if (!sessionRecord) return { ok: false, error: "Sign in again to sync your likes.", code: "user_session_required" };

    var fromUsername = getUsernameForUserSession_(sessionRecord, token);
    if (!fromUsername) return { ok: false, error: "Create your profile before liking someone.", code: "missing_profile" };

    var placeId = String(data.placeId || "").trim();
    var toUsername = String(data.targetName || "").trim();
    var active = data.active === true || String(data.active || "").toLowerCase() === "true";
    if (!placeId || !toUsername) return { ok: false, error: "Missing like target.", code: "missing_like_target" };
    if (toUsername === fromUsername) return { ok: false, error: "You can't like yourself.", code: "self_like" };

    var likesSheet = getOrCreateSheet_(SHARED_LIKES_SHEET_NAME, getLikesSheetHeaders_());
    var rows = readSheetObjects_(likesSheet);
    var rowNumber = 0;
    rows.some(function(row) {
      if (String(row.place_id || "").trim() === placeId &&
          String(row.from_username || "").trim() === fromUsername &&
          String(row.to_username || "").trim() === toUsername) {
        rowNumber = row._rowNumber;
        return true;
      }
      return false;
    });

    var nowIso = new Date().toISOString();
    var row = [placeId, fromUsername, toUsername, active ? "true" : "false", nowIso];
    if (rowNumber) {
      likesSheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
    } else {
      likesSheet.appendRow(row);
    }

    return {
      ok: true,
      placeId: placeId,
      fromUsername: fromUsername,
      toUsername: toUsername,
      active: active,
      updatedAt: nowIso
    };
  });
}

function handleSharedMessageAdd_(data) {
  return withScriptLock_(function() {
    var token = String(data.sessionToken || "");
    var sessionRecord = getUserSessionRecord_(token);
    if (!sessionRecord) return { ok: false, error: "Sign in again to sync chat.", code: "user_session_required" };

    var fromUsername = getUsernameForUserSession_(sessionRecord, token);
    if (!fromUsername) return { ok: false, error: "Create your profile before chatting.", code: "missing_profile" };

    var placeId = String(data.placeId || "").trim();
    var toUsername = String(data.otherName || "").trim();
    var text = String(data.text || "").trim();
    if (!placeId || !toUsername || !text) return { ok: false, error: "Missing chat data.", code: "missing_chat_payload" };
    if (text.length > 500) text = text.slice(0, 500);

    var ts = Date.now();
    var chatKey = buildChatKey_(placeId, fromUsername, toUsername);
    var messagesSheet = getOrCreateSheet_(SHARED_MESSAGES_SHEET_NAME, getMessagesSheetHeaders_());
    messagesSheet.appendRow([chatKey, placeId, fromUsername, toUsername, text, ts]);

    return {
      ok: true,
      chatKey: chatKey,
      message: {
        from: fromUsername,
        text: text,
        ts: ts
      }
    };
  });
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
    if (action === "user_auth_request_code") return jsonResponse_(handleUserRequestCode_(data));
    if (action === "user_auth_verify_code") return jsonResponse_(handleUserVerifyCode_(data));
    if (action === "user_phone_request_code") return jsonResponse_(handleUserPhoneRequestCode_(data));
    if (action === "user_phone_verify_code") return jsonResponse_(handleUserPhoneVerifyCode_(data));
    if (action === "user_session_status") return jsonResponse_(handleUserSessionStatus_(data));
    if (action === "user_logout") return jsonResponse_(handleUserLogout_(data));
    if (action === "shared_snapshot") return jsonResponse_(handleSharedSnapshot_(data));
    if (action === "shared_profile_upsert") return jsonResponse_(handleSharedProfileUpsert_(data));
    if (action === "billing_create_checkout") return jsonResponse_(handleBillingCreateCheckout_(data));
    if (action === "billing_checkout_status") return jsonResponse_(handleBillingCheckoutStatus_(data));
    if (action === "billing_status") return jsonResponse_(handleBillingStatus_(data));
    if (action === "billing_create_portal") return jsonResponse_(handleBillingCreatePortal_(data));
    if (action === "shared_presence_set") return jsonResponse_(handleSharedPresenceSet_(data));
    if (action === "shared_like_set") return jsonResponse_(handleSharedLikeSet_(data));
    if (action === "shared_message_add") return jsonResponse_(handleSharedMessageAdd_(data));
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
      supportsUserAuth: true,
      supportsSharedState: true,
      supportsAppBackend: true,
      supportsPhoneAuth: isSmsAuthConfigured_(),
      supportsSmsAuth: isSmsAuthConfigured_(),
      supportsPayments: isStripeCheckoutConfigured_(),
      supportsStripeCheckout: isStripeCheckoutConfigured_(),
      feature: String((e && e.parameter && e.parameter.feature) || "app_backend")
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
