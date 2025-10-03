// popup.js — fetch latest analysis + controls
function badgeColor(score, warn, block) {
  if (score >= block) return '#e11d48';
  if (score >= warn) return '#f59e0b';
  return '#10b981';
}

async function getActiveTabId() {
  const tabs = await chrome.tabs.query({active: true, currentWindow: true});
  return tabs[0]?.id;
}

async function requestAnalysis(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, {type: 'popupRequest'}, (resp) => resolve(resp));
  });
}

async function getSettings() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({type: 'getSettings'}, (resp) => resolve(resp?.settings));
  });
}

function render(resp) {
  if (!resp?.ok) return;
  const badge = document.getElementById('scoreBadge');
  const warn = resp.settings.warnThreshold;
  const block = resp.settings.blockThreshold;
  badge.style.background = badgeColor(resp.score, warn, block);
  badge.textContent = resp.score;
  const list = document.getElementById('items');
  list.innerHTML = '';
  (resp.items || []).forEach(txt => {
    const li = document.createElement('li');
    li.textContent = txt;
    list.appendChild(li);
  });
  const wt = document.getElementById('warnThreshold');
  const bt = document.getElementById('blockThreshold');
  wt.value = warn; bt.value = block;
  document.getElementById('whitelistBtn').onclick = () => {
    chrome.runtime.sendMessage({type: 'addWhitelist', domain: location.hostname}, () => window.close());
  };
  document.getElementById('saveThresholds').onclick = () => {
    const warnThreshold = parseInt(wt.value, 10);
    const blockThreshold = parseInt(bt.value, 10);
    chrome.runtime.sendMessage({type: 'updateThresholds', warnThreshold, blockThreshold}, () => window.close());
  };
}

(async function init() {
  const tabId = await getActiveTabId();
  const resp = await requestAnalysis(tabId);
  const settings = await getSettings();
  render(Object.assign({}, resp, {settings}));
})();
