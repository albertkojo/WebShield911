// background.js — service worker
// Manages whitelist, thresholds, and provides data to popup

const DEFAULT_SETTINGS = {
  warnThreshold: 33,
  blockThreshold: 66,
  whitelist: [] // array of base domains
};

function getBaseDomain(hostname) {
  // naive base domain extraction
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join('.');
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(null, (cfg) => {
    const merged = Object.assign({}, DEFAULT_SETTINGS, cfg || {});
    chrome.storage.local.set(merged);
  });
});

// Respond to requests for settings or to update whitelist
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'getSettings') {
    chrome.storage.local.get(null, (cfg) => {
      const out = Object.assign({}, DEFAULT_SETTINGS, cfg || {});
      sendResponse({ok: true, settings: out});
    });
    return true; // async
  }
  if (msg?.type === 'addWhitelist') {
    const domain = getBaseDomain(msg.domain || '');
    chrome.storage.local.get(null, (cfg) => {
      const w = new Set([...(cfg.whitelist || [])]);
      if (domain) w.add(domain);
      const updated = Object.assign({}, DEFAULT_SETTINGS, cfg || {}, {whitelist: [...w]});
      chrome.storage.local.set(updated, () => sendResponse({ok: true, whitelist: updated.whitelist}));
    });
    return true;
  }
  if (msg?.type === 'removeWhitelist') {
    const domain = getBaseDomain(msg.domain || '');
    chrome.storage.local.get(null, (cfg) => {
      const arr = (cfg.whitelist || []).filter(d => d !== domain);
      const updated = Object.assign({}, DEFAULT_SETTINGS, cfg || {}, {whitelist: arr});
      chrome.storage.local.set(updated, () => sendResponse({ok: true, whitelist: updated.whitelist}));
    });
    return true;
  }
  if (msg?.type === 'updateThresholds') {
    const {warnThreshold, blockThreshold} = msg;
    chrome.storage.local.get(null, (cfg) => {
      const updated = Object.assign({}, DEFAULT_SETTINGS, cfg || {}, {
        warnThreshold: Math.max(0, Math.min(100, warnThreshold|0)),
        blockThreshold: Math.max(0, Math.min(100, blockThreshold|0))
      });
      chrome.storage.local.set(updated, () => sendResponse({ok: true, settings: updated}));
    });
    return true;
  }
});
