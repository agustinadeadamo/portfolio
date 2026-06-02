# agustinadeadamo.com — personal portfolio

Personal site of **Agustina De Adamo** — Frontend & AI Product Engineer.
A single static page, no build step, deployed on Vercel.

**Live:** https://agustinadeadamo.com · **Source:** this repo

## What's interesting here

- **Hand-built, no framework.** Plain HTML/CSS/JS with GSAP for motion — proportional to
  what a one-page site actually needs. No bundler, no dependencies to install.
- **Accessible color system.** Green/yellow/black palette audited for WCAG AA contrast
  (yellow is only ever used as a block background with black text, never as text on the
  green or white surfaces).
- **Reduced-motion aware.** Every animation has a `prefers-reduced-motion` fallback.
- **A grounded "Ask Agustina" chat.** An LLM scoped tightly to real experience; the API
  key is kept server-side via a small proxy endpoint (see below).

## Structure

```
index.html        # markup
css/styles.css    # all styles + design tokens (CSS custom properties)
js/main.js        # GSAP animations + the grounded chat
assets/           # optimized images
```

## Run locally

No build step. Serve the folder with any static server, e.g.:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## The chat ("Ask Agustina")

There are **no hand-written answers**. `js/main.js` holds a `PROFILE` string (real
experience, in my own tone). On each question the browser sends `{ messages, system: PROFILE }`
to `/api/chat`; the model generates the answer constrained to that profile. To change what
it knows or how it sounds, edit `PROFILE` — nothing else.

`api/chat.js` is a Vercel serverless function that injects the Anthropic API key
server-side, so the key never reaches the browser. It needs one environment variable:

```
ANTHROPIC_API_KEY = sk-ant-...         # required (set in Vercel)
CHAT_MODEL         = claude-sonnet-4-6  # optional; claude-haiku-4-5-20251001 is cheaper
```

Locally (`python3 -m http.server`) the chat shows a graceful fallback message because the
serverless function only runs on Vercel — that's expected.

## Quality gates

`.github/workflows/quality.yml` runs on every push: Lighthouse CI (performance +
accessibility budgets in `lighthouserc.json`), a Prettier format check, and a link checker.
The accessibility and Web Vitals claims are verified, not just stated.

## Deploy

Static + one serverless function — import the repo in Vercel (zero config), set
`ANTHROPIC_API_KEY` in Settings → Environment Variables, and deploy. Framework preset:
**Other**; no build command; output directory: root.

© 2026 Agustina De Adamo
