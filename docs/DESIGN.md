# Statelight — design direction

## 1. Aesthetic direction

**Blueprint/technical.** Statelight is a schematic-diagram tool for the
shape of your code's logic, so the product and its marketing page look like
an oscilloscope readout on dark technical paper: a deep navy "circuit
board" background, a cyan signal trace that lights up on every transition,
monospace labels on every state name. Chosen deliberately over the more
common "dark gray cards + one accent" default — the blueprint framing
reinforces the product's actual value (making an invisible signal visible)
rather than being decoration.

## 2. Tokens

| Token | Value | Use |
|---|---|---|
| `--sl-bg` | `#0b1220` | page/app background |
| `--sl-surface-1` | `#10192e` | panel body, cards |
| `--sl-surface-2` | `#182544` | panel header, raised surfaces |
| `--sl-text` | `#e7edf7` | primary text |
| `--sl-text-muted` | `#8fa3c7` | secondary text, labels |
| `--sl-accent` | `#5eead4` (cyan) | live signal: active state, active edge, links |
| `--sl-accent-support` | `#f2b632` (amber) | secondary emphasis: idle/waiting states, warnings |
| `--sl-success` | `#34d399` | success states (e.g. "green" in the traffic-light demo) |
| `--sl-danger` | `#fb7185` | error/danger states |

**Type pairing:** Display — **Space Grotesk** (wordmark, page headings).
UI/labels — **JetBrains Mono** (panel chrome, state names, code samples) —
monospace reinforces the "reading a signal trace" feel. Both from Google
Fonts with system-monospace/system-sans fallbacks.

**Spacing:** 4px base unit — 4/8/12/16/24/32/48.

**Corner radius:** 6px (small — schematic, not soft/toy-like).

**Shadow/glow:** `0 0 12px rgba(94,234,212,0.35)` cyan glow on the active
state/edge; panels get a subtle dark drop shadow (`0 12px 32px rgba(0,0,0,0.45)`)
plus a 1px inset cyan hairline, not a soft blur — reads as a lit instrument
panel, not a floating card.

**Motion:** UI transitions 160ms ease-out. A transition "fires" as a 600ms
pulse (glow ramps up over ~120ms, decays over the remainder) — matches the
existing `.statelight-panel__state.is-pulsing` animation in `src/styles.js`.

## 3. Layout intent

**The hero is the live diagram itself** — on the landing page, that's an
interactive example machine (traffic light or similar) with its Statelight
panel visibly attached and lighting up as a visitor clicks through it. Not
a screenshot: a real, running instance.

- **1440×900 desktop:** two-column hero — left column (~55%) is the
  wordmark, one-sentence pitch, and the `<script>` install snippet; right
  column (~45%) is the live interactive demo with its panel attached,
  against the grid/blueprint background pattern. Below the fold: a
  three-step "how it works" strip and the feature list from the README.
- **390×844 phone:** stacks to a single column — pitch and snippet first,
  demo below it, full width, panel repositioned to not overlap the demo's
  interactive controls (panel docks to the bottom of the demo container
  rather than `position: fixed` to the viewport corner on narrow screens).

## 4. Signature detail

An animated wordmark: "State**light**" where the second half briefly
pulses with the cyan glow on page load and again on every demo
interaction, echoing the panel's own pulse animation — the brand mark
performs the exact effect the product provides.

## 5. Juice plan

Statelight is a developer instrument, not a game — there's no win state or
score to celebrate, so the full games/toys checklist (SFX list, particles,
win overlay) doesn't apply. The equivalent "feel good to use" bar here is:

- Every transition produces a visible pulse within one frame of the
  property write (already implemented: `is-pulsing` class + forced reflow
  in `src/panel.js`).
- The landing page's live demo responds to input in <100ms with the same
  pulse choreography as the real product, so the demo *is* an accurate
  preview, not a mockup.
- `prefers-reduced-motion` disables the pulse animation while keeping the
  state text update instant (already handled in `src/styles.js`).
- No sound — a persistent devtool panel is not the place for audio
  feedback, and it would be actively annoying in a real debugging session.

## Notes for later runs

- The state-graph diagram (nodes + edges, live-highlighted path) is not
  built yet — it's `docs/BACKLOG.md` Epic 2. When it lands, edges use the
  same cyan glow language as the state pulse so the two features read as
  one system.
- `site/` (the landing page, built at CLOSEOUT) must reuse these exact
  tokens — do not introduce a second palette for marketing vs. product.
