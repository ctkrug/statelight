# Statelight

[![CI](https://github.com/ctkrug/statelight/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/statelight/actions/workflows/ci.yml)

A floating debug panel for hand-rolled JavaScript state machines. Drop in one
`<script>` tag next to any plain-object state machine — no framework, no
build step, no library lock-in — and watch its current state and transition
path light up live as your app runs.

## Why

Most side projects and small apps don't reach for XState or a full FSM
library — they just write a `state` field and a chunk of `if`/`switch` logic.
That's fine, until you're three levels deep in a bug and have no visibility
into what state you're actually in or how you got there. Existing FSM
visualizers assume you're already bought into their library and their build
pipeline. Statelight assumes nothing except "you have an object with a state
property somewhere."

## What it does

- Watches a plain JavaScript object's state property (via a transparent
  getter/setter — your code doesn't change) and renders a floating panel
  showing the current state.
- Records the transition history and, when you optionally hand it your
  transition map, draws the full state graph and lights up the live path as
  you move through it.
- Zero dependencies, framework-agnostic, and small enough to not think about
  — the shipped bundle targets under 3kb gzipped.

## Planned features

- [x] Core `watch()` primitive: transparent state-property instrumentation
      with transition history, usable standalone in Node or the browser.
- [x] Floating panel UI: current state and recent-transition trail.
- [x] Optional transition-map graph rendering with a live-highlighted path.
- [x] Panel ergonomics: collapse/expand, drag to reposition, persisted via
      `localStorage`.
- [x] Multi-machine support — `attach()` more than one state machine on
      the same page; panels cascade by default and detach independently.
- [x] Public demo site with an interactive example machine — see `site/`.

See [`docs/VISION.md`](docs/VISION.md) for the full design rationale and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for the build plan.

## Demo site

`site/index.html` is a landing page with a real, running Statelight
instance as its hero — not a screenshot. It imports the library straight
from `../src/`, so serve the **repo root** (not the `site/` folder alone,
which would 404 on that `../` import) and open `/site/`:

```sh
npx serve .
# then open http://localhost:3000/site/
```

(`file://` won't work either way — the page uses ES module imports.)

## Usage

```html
<script type="module">
  import { attach } from 'https://cdn.jsdelivr.net/npm/statelight/dist/statelight.js';

  const machine = { state: 'idle' };

  attach(machine, {
    label: 'traffic light',
    transitions: {
      idle: { start: 'running' },
      running: { pause: 'paused', stop: 'idle' },
      paused: { resume: 'running', stop: 'idle' }
    }
  });

  // Anywhere in your own code:
  machine.state = 'running'; // panel updates and lights up idle -> running
</script>
```

No React, no Vue, no npm install required — `attach()` works on any plain
object with a mutable state property.

## Stack

Vanilla JavaScript (ES modules), zero runtime dependencies. `esbuild` bundles
the library for distribution; `node:test` plus `jsdom` cover unit tests.

## Development

```sh
npm install
npm test      # run the unit test suite
npm run build # bundle src/ into dist/
```

## License

MIT — see [`LICENSE`](LICENSE).
