# WebShield 911 — Privacy & Phishing Protection (Chrome Extension)
# By Albert Kojo Dum Essiaw

**Track:** Cyber Shield Mission (Infinity Code Hackathon)  
**Domains:** AI/ML, Cybersecurity, Web of Connections

WebShield 911 is a lightweight Chrome extension that protects users from phishing and invasive privacy patterns. It runs *entirely on-device* and combines heuristics with a small logistic model to score page risk and show **clear, actionable explanations**.

## Why this matters
Phishing and dark patterns are still top attack vectors. Most solutions rely on network lookups or heavy suites that collect browsing data. WebShield 911 is:
- **Private by design:** No data leaves the device.
- **Explainable:** Highlights risky features (e.g., external login forms, suspicious domains).
- **Fast:** Pure JS; no heavy frameworks or cloud calls.
- **Tunable:** Whitelist trusted sites, adjust thresholds.

## Features
- URL & DOM feature extraction in a content script.
- Local logistic regression score (weights bundled in `model.js`).
- On-page badge (green/amber/red) + popup with detailed rationale.
- Options page to manage whitelist and risk threshold.
- Demo pages for quick testing (`docs/demo-pages`).

## Quick Start
1. **Clone or download** this repo.
2. Open Chrome → `chrome://extensions` → toggle **Developer mode**.
3. **Load unpacked** → select the `extension/` folder.
4. Visit `docs/demo-pages/legit1.html` or `docs/demo-pages/phish1.html` via a local server (e.g., `python -m http.server` in the repo root) and observe the badge.
5. Click the toolbar icon to see details and whitelist a site if needed.

> **Note:** For local demo pages, the extension needs file access. In the Chrome Extensions page, enable **Allow access to file URLs** for WebShield 911, or serve files via a local HTTP server.

## Folder Structure
```
WebShield911/
├─ extension/
│  ├─ manifest.json
│  ├─ background.js
│  ├─ model.js
│  ├─ content.js
│  ├─ overlay.css
│  ├─ popup.html
│  ├─ popup.js
│  ├─ popup.css
│  ├─ options.html
│  ├─ options.js
│  └─ icons/
│     ├─ icon16.png
│     ├─ icon48.png
│     └─ icon128.png
├─ docs/
│  └─ demo-pages/
│     ├─ legit1.html
│     └─ phish1.html
├─ .gitignore
└─ LICENSE
```

## How it works
1. **Feature extraction** (`content.js`):
   - URL patterns: IP-in-domain, `@`, long hostname, punycode, excessive hyphens, suspicious TLDs.
   - Transport: `http` vs `https`.
   - DOM signals: password forms, external form actions, iframes, disabled right-click, deceptive keywords, offscreen/hidden inputs.
2. **Scoring** (`model.js`): A logistic regression uses the features to produce a risk score (0–100). Thresholds: 33 (warn), 66 (block/strong warn) — configurable.
3. **UX**:
   - Badge overlay (bottom-right): ✅ Safe, ⚠️ Caution, ⛔ High risk.
   - Popup shows feature contributions and lets you whitelist domains.
   - Options: manage whitelist and thresholds in `chrome.storage.local`.

## Whitelist
- Per **base domain** (e.g., `example.com` covers subdomains).
- Stored locally in `chrome.storage.local`. You control it.

## Privacy
- No remote lookups, telemetry, or data collection.

## Development Notes
- Manifest v3, running `content.js` at `document_idle`.
- Keep weights small and interpretable; adjust in `model.js`.
- Extend features or port to Firefox (Manifest v3 compatibility).

## Demo
- `docs/demo-pages/phish1.html` simulates an external form posting credentials to another origin and uses common phishing phrases.
- `docs/demo-pages/legit1.html` is a clean login form with sane semantics.

## License
MIT
