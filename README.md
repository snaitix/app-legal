# App Legal

One set of Privacy Policy, Terms of Use and Support pages for every app, served via GitHub Pages.
The pages are rendered from `apps.json`, in English and Russian.

| Page | URL |
| --- | --- |
| Privacy Policy | `https://snaitix.github.io/app-legal/privacy.html?app=<slug>` |
| Terms of Use | `https://snaitix.github.io/app-legal/terms.html?app=<slug>` |
| Support | `https://snaitix.github.io/app-legal/support.html?app=<slug>` |
| All three | `https://snaitix.github.io/app-legal/?app=<slug>` |

Language follows the browser; force it with `&lang=en` or `&lang=ru`.

## Adding an app

Add an entry to `apps` in `apps.json` and push — no build step.

```json
"my-app": {
  "name": "My App",
  "accent": "#1F7A5C",
  "accentDark": "#3FAE86",
  "updated": "2026-10-11",
  "tagline": { "en": "…", "ru": "…" },
  "about": { "en": "…", "ru": "…" },
  "data": {
    "storage": "device",
    "account": false,
    "analytics": false,
    "ads": false,
    "subscriptions": true,
    "permissions": ["camera", "notifications"]
  },
  "thirdParties": [{ "name": "Firebase (Google)", "purpose": { "en": "…", "ru": "…" } }],
  "privacyNotes": { "en": ["…"], "ru": ["…"] },
  "termsNotes": { "en": ["…"], "ru": ["…"] },
  "faq": [{ "q": { "en": "…", "ru": "…" }, "a": { "en": "…", "ru": "…" } }]
}
```

- `data.storage`: `device` (nothing leaves the device) or `cloud`.
- `data.permissions`: any of `camera`, `photos`, `files`, `notifications`, `biometrics`, `location`,
  `microphone`, `contacts`, `tracking`.
- `thirdParties`, `privacyNotes`, `termsNotes`, `faq`, `accentDark` and a per-app `contact` are optional.
- Bump `updated` whenever the text that applies to the app changes.

The `data` block must describe what the app really does — the policy text is generated from it.

Local preview: `python3 -m http.server` in the repo root, then open `http://localhost:8000/?app=receipt-vault`.
