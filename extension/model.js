// model.js — features + logistic model

// Suspicious TLDs list (minimal; extend as desired)
const SUSPICIOUS_TLDS = new Set([
  'zip','mov','click','country','gq','ml','tk','top','work','xyz','party','link'
]);

function isIp(host) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

function hasAtSymbol(url) {
  return /@/.test(url);
}

function hostnameLen(host) {
  return (host || '').length;
}

function hyphenCount(host) {
  if (!host) return 0;
  return (host.match(/-/g) || []).length;
}

function isPunycode(host) {
  return /xn--/.test(host);
}

function tld(host) {
  const parts = (host || '').split('.');
  return parts[parts.length - 1] || '';
}

function isSuspiciousTLD(host) {
  return SUSPICIOUS_TLDS.has(tld(host).toLowerCase());
}

function isHTTP() {
  return (location.protocol || '').toLowerCase() === 'http:';
}

function countPasswordForms() {
  return Array.from(document.forms).filter(f =>
    Array.from(f.elements).some(el => el.type === 'password')
  ).length;
}

function externalActionForms() {
  const origin = location.origin;
  return Array.from(document.forms).filter(f => {
    const action = (f.getAttribute('action') || '').trim();
    if (!action) return false;
    try {
      const u = new URL(action, location.href);
      return u.origin !== origin; // external post target
    } catch(e) {
      return false;
    }
  }).length;
}

function countIframes() {
  return document.querySelectorAll('iframe').length;
}

function disablesRightClick() {
  return !!(document.body && (document.body.getAttribute('oncontextmenu') || window.oncontextmenu));
}

function phishingKeywords() {
  const rx = /(verify|suspend|limited|unusual activity|update account|security alert|confirm password|gift card|urgent|immediately)/gi;
  const text = document.body ? (document.body.innerText || '') : '';
  return (text.match(rx) || []).length;
}

function hiddenInputs() {
  return document.querySelectorAll('input[type="hidden"]').length;
}

// Logistic regression params (weights tuned by hand for demo)
const WEIGHTS = {
  bias: -2.0,
  isIp: 1.4,
  hasAt: 1.0,
  longHost: 0.8,           // hostnameLen > 30
  manyHyphens: 0.8,        // hyphenCount > 3
  puny: 0.9,
  suspTld: 1.1,
  http: 1.2,
  pwForms: 0.7,            // each
  extForms: 1.5,           // each
  iframes: 0.3,            // each up to 5
  noRightClick: 0.6,
  kw: 0.35,                // each keyword instance up to 6
  hidInputs: 0.15          // each up to 10
};

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

function extractFeatures() {
  const url = location.href;
  const host = location.hostname || '';
  const feats = {
    isIp: isIp(host) ? 1 : 0,
    hasAt: hasAtSymbol(url) ? 1 : 0,
    longHost: hostnameLen(host) > 30 ? 1 : 0,
    manyHyphens: hyphenCount(host) > 3 ? 1 : 0,
    puny: isPunycode(host) ? 1 : 0,
    suspTld: isSuspiciousTLD(host) ? 1 : 0,
    http: isHTTP() ? 1 : 0,
    pwForms: countPasswordForms(),
    extForms: externalActionForms(),
    iframes: clamp(countIframes(), 0, 5),
    noRightClick: disablesRightClick() ? 1 : 0,
    kw: clamp(phishingKeywords(), 0, 6),
    hidInputs: clamp(hiddenInputs(), 0, 10)
  };
  return feats;
}

function score(feats) {
  let z = WEIGHTS.bias;
  z += WEIGHTS.isIp * feats.isIp;
  z += WEIGHTS.hasAt * feats.hasAt;
  z += WEIGHTS.longHost * feats.longHost;
  z += WEIGHTS.manyHyphens * feats.manyHyphens;
  z += WEIGHTS.puny * feats.puny;
  z += WEIGHTS.suspTld * feats.suspTld;
  z += WEIGHTS.http * feats.http;
  z += WEIGHTS.pwForms * feats.pwForms;
  z += WEIGHTS.extForms * feats.extForms;
  z += WEIGHTS.iframes * feats.iframes;
  z += WEIGHTS.noRightClick * feats.noRightClick;
  z += WEIGHTS.kw * feats.kw;
  z += WEIGHTS.hidInputs * feats.hidInputs;
  const s = sigmoid(z) * 100;
  return Math.round(s);
}

function explain(feats) {
  const parts = [];
  if (feats.isIp) parts.push('IP address used as hostname');
  if (feats.hasAt) parts.push('‘@’ found in URL');
  if (feats.longHost) parts.push('Very long hostname');
  if (feats.manyHyphens) parts.push('Excessive hyphens in hostname');
  if (feats.puny) parts.push('Punycode (possible homograph)');
  if (feats.suspTld) parts.push(`Suspicious TLD .${(location.hostname.split('.').pop()||'').toLowerCase()}`);
  if (feats.http) parts.push('Insecure HTTP (no HTTPS)');
  if (feats.pwForms) parts.push(`${feats.pwForms} password form(s)`);
  if (feats.extForms) parts.push(`${feats.extForms} form(s) post to external origin`);
  if (feats.iframes) parts.push(`${feats.iframes} iframe(s)`);
  if (feats.noRightClick) parts.push('Right‑click disabled');
  if (feats.kw) parts.push(`Urgent language detected (${feats.kw})`);
  if (feats.hidInputs) parts.push(`${feats.hidInputs} hidden input(s)`);
  if (parts.length === 0) parts.push('No obvious risks detected');
  return parts;
}

// Export for content script
window.WebShieldModel = { extractFeatures, score, explain };
