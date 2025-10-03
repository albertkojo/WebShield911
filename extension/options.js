// options.js — manage whitelist
function getBaseDomain(hostname) {
  const parts = (hostname || '').split('.');
  if (parts.length <= 2) return hostname || '';
  return parts.slice(-2).join('.');
}

function render(list) {
  const ul = document.getElementById('list');
  ul.innerHTML = '';
  list.forEach(d => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${d}</span> <button data-d="${d}">Remove</button>`;
    ul.appendChild(li);
  });
  ul.onclick = (e) => {
    if (e.target.tagName === 'BUTTON') {
      const d = e.target.getAttribute('data-d');
      chrome.runtime.sendMessage({type: 'removeWhitelist', domain: d}, (resp) => render(resp.whitelist || []));
    }
  }
}

chrome.storage.local.get(null, (cfg) => render(cfg.whitelist || []));

document.getElementById('add').onclick = () => {
  const input = document.getElementById('domain');
  const domain = getBaseDomain((input.value || '').trim().toLowerCase());
  if (!domain) return;
  chrome.runtime.sendMessage({type: 'addWhitelist', domain}, (resp) => {
    input.value = '';
    render(resp.whitelist || []);
  });
};
