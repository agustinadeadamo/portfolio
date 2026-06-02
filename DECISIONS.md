# Decisions

Short record of the deliberate choices behind this site — and, just as importantly, what
was _not_ built and why. The reasoning is the point.

## 1. No framework, no build step

A one-page site doesn't need React, a bundler, or a build pipeline. Plain HTML/CSS/JS with
GSAP for motion is the proportional choice: nothing to install, instant deploys, no
dependency surface to maintain. A framework here would be complexity without benefit.

## 2. Color system audited for WCAG AA

Palette is green / neon-yellow / black. The trap with this palette is contrast, so the
rules are explicit:

- Yellow is **never** text on the green or white surfaces (it fails). It's only ever a
  block background with black text (~16:1), or an accent on black.
- Body text is near-black on green (~10:1); the muted olive used for small labels passes
  AA on both green and white.
- The "Live" badge green was darkened to pass AA at small text sizes.
  Contrast and the accessibility score are enforced in CI (see §5), so these aren't just
  claims in a README.

## 3. Motion respects user preferences

Every animation has a `prefers-reduced-motion` fallback that renders the final state with
no movement. Motion is enhancement, never a requirement to read the page.

## 4. The "Ask Agustina" chat is grounded, and the key stays server-side

The chat sends a fixed profile (my real experience) as the system prompt plus the user's
question to an LLM, which generates the answer constrained to that profile — there are no
hand-written canned answers. The Anthropic API key is kept server-side behind a small
`/api/chat` proxy; the browser never sees it. No RAG: the profile is small and fixed, so
it fits entirely in context — a vector store would be unjustified infrastructure.

## 5. CI proves the claims instead of asserting them

GitHub Actions runs on every push: Lighthouse CI (performance + accessibility budgets), a
Prettier formatting check, and a link checker. The accessibility and Web Vitals claims on
this site are things the pipeline verifies, not adjectives.

## 6. What was deliberately left out

No bundler, no unit tests for static markup, no TypeScript build for a few hundred lines of
vanilla JS, no component library / Storybook. For a single static page these would be
cargo-culted complexity. Knowing where to stop is part of the work.

## 7. The chat endpoint: proportional cost & abuse controls

The chat runs on Haiku (cheapest current model — fine for a fixed-profile Q&A), capped
output, per-IP rate limiting, an origin allowlist, and input-size limits. It deliberately
does NOT use a durable rate-limit store (Redis): for a portfolio, an in-memory limit plus
a hard spend cap on the Anthropic account is the proportional backstop. Under normal use
the cost is cents; abuse is bounded by the spend cap.
