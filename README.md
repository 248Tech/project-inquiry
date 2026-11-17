# project-inquiry

A guided "start a project" contact form for [248Tech](https://248tech.github.io/). Instead of a blank message box, visitors walk through four short steps (what, scope, details, contact) while a live brief fills in beside the form.

**Live:** https://248tech.github.io/project-inquiry/

## Features

- Four-step wizard with keyboard support (`Enter` to continue, `Ctrl+Enter` from the textarea)
- Project-type tiles, feature chips, budget and timeline selectors
- Live "your brief" panel with a completion meter
- Drafts auto-save in the browser, so a refresh doesn't lose anything
- Honeypot field and a minimum-time check to filter basic bots
- Animated node-network background and a success burst (both off under `prefers-reduced-motion`)
- Light and dark themes, works on phones
- No build step, no dependencies: plain HTML, CSS and JS

## Setup

Static files only, so GitHub Pages serves it as-is. Edit `config.js` to choose where submissions go:

| Option | What happens on Send |
| --- | --- |
| `endpoint` (Formspree, Web3Forms, or any JSON POST endpoint) | Brief is posted and emailed to you |
| `email` | Visitor's mail app opens with the brief pre-filled |
| neither | Visitor sees a "Copy my brief" button |

Formspree example:

```js
window.INQUIRY_CONFIG = { endpoint: "https://formspree.io/f/abcdwxyz", accessKey: "", email: "" };
```

Web3Forms example:

```js
window.INQUIRY_CONFIG = { endpoint: "https://api.web3forms.com/submit", accessKey: "your-access-key", email: "" };
```

## Run locally

```sh
npx serve .     # or: python -m http.server
```

## License

MIT
