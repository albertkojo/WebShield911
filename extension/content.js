// content.js — page analyzer + overlay badge

function getBaseDomain(hostname) {
  const parts = (hostname || '').split('.');
  if (parts.length <= 2) return hostname || '';
  return parts.slice(-2).join('.');
}

function badgeColor(score, warn, block) {
  if (score >= block) return '#e11d48'; // red-600
  if (score >= warn) return '#f59e0b'; // amber-500
  return '#10b981'; // emerald-500
}

function badgeEmoji(score, warn, block) {
  if (score >= block) return '⛔';
  if (score >= warn) return '⚠️';
  return '✅';
}

let lastResult = null;
let overlayEl = null;

async function getSettings() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({type: 'getSettings'}, (resp) => {
      resolve(resp?.settings || {warnThreshold: 33, blockThreshold: 66, whitelist: []});
    });
  });
}

function renderOverlay(score, settings) {
  const color = badgeColor(score, settings.warnThreshold, settings.blockThreshold);
  const emoji = badgeEmoji(score, settings.warnThreshold, settings.blockThreshold);
  if (!overlayEl) {
    overlayEl = document.createElement('div');
    overlayEl.id = 'webshield911-badge';
    overlayEl.style.position = 'fixed';
    overlayEl.style.zIndex = '2147483647';
    overlayEl.style.right = '12px';
    overlayEl.style.bottom = '12px';
    overlayEl.style.padding = '8px 10px';
    overlayEl.style.borderRadius = '999px';
    overlayEl.style.fontFamily = 'system-ui, sans-serif';
    overlayEl.style.fontSize = '14px';
    overlayEl.style.boxShadow = '0 4px 14px rgba(0,0,0,.2)';
    overlayEl.style.cursor = 'pointer';
    overlayEl.title = 'WebShield 911 risk indicator — click for details in the toolbar popup';
    document.documentElement.appendChild(overlayEl);
  }
  overlayEl.style.background = color;
  overlayEl.textContent = `${emoji} ${score}`;
}

async function analyze() {
  const settings = await getSettings();
  const domain = getBaseDomain(location.hostname || '');
  if (settings.whitelist && settings.whitelist.includes(domain)) {
    lastResult = {score: 0, feats: {}, items: ['Domain whitelisted'], settings};
    renderOverlay(0, settings);
    return;
  }
  const feats = window.WebShieldModel.extractFeatures();
  const score = window.WebShieldModel.score(feats);
  const items = window.WebShieldModel.explain(feats);
  lastResult = {score, feats, items, settings, domain};
  renderOverlay(score, settings);
}

// Handle popup requests
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'popupRequest') {
    if (!lastResult) {
      analyze().then(() => sendResponse({ok: true, ...lastResult}));
      return true;
    }
    sendResponse({ok: true, ...lastResult});
  }
});

// Initial run
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  analyze();
} else {
  window.addEventListener('DOMContentLoaded', analyze);
}
