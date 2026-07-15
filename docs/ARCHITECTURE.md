# Statelight — architecture

A map of the codebase for anyone (human or a later BUILD/QA run) picking
this up cold. See `docs/VISION.md` for *why*, `docs/API.md` for the public
surface, and `docs/DESIGN.md` for the visual language.

## Module map

```
src/
  statelight.js   watch(target, key, options) — the core primitive.
                   Object.defineProperty-instruments a single property,
                   records history, notifies subscribers. No DOM.
  graph.js         Pure, DOM-free graph logic:
                     buildTransitionGraph(transitions) -> { nodes, edges }
                     layoutGraph(nodes, opts)           -> circular auto-layout
                     findActiveEdges(edges, entry)      -> which edge(s) just fired
                   Kept separate from rendering so it's unit-testable
                   without jsdom and reusable if the panel ever needs a
                   second renderer (e.g. canvas).
  graph-view.js    createGraphView(transitions) — SVG rendering built on
                   top of graph.js. Returns { el, highlight(entry), destroy() }
                   or null when the map is empty. Owns the pulse-timeout
                   lifecycle for the active edge/node.
  panel.js         createPanel(options) — the floating DOM panel: header
                   (label, collapse toggle, drag handle), current-state
                   text, the graph (when transitions is passed — wraps
                   graph-view.js), and the recent-transition trail. Injects
                   styles.js's CSS into <head> once per page. Owns
                   collapse/drag/multi-machine-cascade wiring and their
                   localStorage persistence (via storage.js).
  drag.js          makeDraggable(handleEl, targetEl, opts) — generic
                   pointer-drag repositioning, viewport-clamped. No
                   panel-specific knowledge; panel.js wires it to the
                   header and persists the result.
  storage.js       safeGet/safeSet — a localStorage wrapper that no-ops
                   instead of throwing on opaque origins/privacy mode.
                   Persistence (collapsed state, dragged position) is a
                   pure enhancement, so a failure here must never crash
                   the host page.
  styles.js        PANEL_CSS — single source of truth for the panel's and
                   graph's CSS, injected at runtime and also written to
                   dist/statelight.css by the build for anyone who'd rather
                   self-host a stylesheet. Tokens mirror docs/DESIGN.md.
  index.js         attach(target, options) — the public entry point.
                   Wires watch() + createPanel() together and returns
                   { watcher, panel, detach() }. Also assigns
                   window.Statelight for bare <script> tag consumers.
```

## Data flow (the wow moment)

```
attach(machine, { transitions })
  -> watch(machine, 'state')                 instruments the property
  -> createPanel({ transitions })
       -> createGraphView(transitions)
            -> buildTransitionGraph(transitions)   nodes + edges (once)
            -> layoutGraph(nodes)                   circular positions (once)
            -> renders <svg> nodes/edges            (once, static)

machine.state = 'green'                       (consumer code, unmodified)
  -> watcher's setter fires
       -> records { state, from, event, at } in history
       -> notifies attach()'s listener
            -> panel.update(entry, history)
                 -> updates state text + trail
                 -> graphView.highlight(entry)
                      -> findActiveEdges(edges, entry)   from/to (+ event) match
                      -> toggles is-current / is-active classes
                      -> CSS glow animation runs; class clears after 600ms
                         or immediately if a newer transition supersedes it
```

The graph's *shape* (nodes/edges/layout) is computed once at `attach()`
time from the static `transitions` map — only the highlight state changes
per transition, so there's no per-transition DOM rebuild.

## Panel ergonomics (epic 2)

- **Collapse/expand:** a real `<button>` in the header toggles the
  `is-collapsed` class (CSS hides state/graph/trail) and an unread dot;
  state is namespaced `statelight:${label}:collapsed` in localStorage.
- **Drag:** `makeDraggable()` is wired to the whole header with the toggle
  button excluded (`exclude: '.statelight-panel__toggle'`), so the two
  gestures can't fight over the same pointerdown. Position is namespaced
  `statelight:${label}:position` in localStorage; a saved position wins
  over the default corner on the next mount.
- **Multi-machine cascade:** panels that *don't* have a saved position
  claim a module-level "stack slot" (`panel.js`'s `claimStackSlot`/
  `releaseStackSlot`) and offset the `--sl-stack-offset` CSS var by one
  header-height per slot, so several `attach()`ed panels fan out instead
  of sitting exactly on top of one another. Slots release on `destroy()`
  and are reused LIFO by the next panel that needs the default position.

## Rendering notes

- Everything DOM-related uses plain `document.createElement` /
  `createElementNS` — no template engine, no virtual DOM.
- `graph-view.js` gives each `<svg>` instance's arrowhead `<marker>` a
  unique id (`sl-N-arrow`) so multiple `attach()` calls on one page don't
  collide on the same `url(#...)` reference (needed for epic 2.3 —
  multi-machine support).
- Self-transitions (`from === to`) get a small looped path instead of a
  degenerate zero-length line.

## Build & test

- `npm test` — `node --test tests/`, using `jsdom` for anything DOM-facing.
  `src/graph.js` and its tests have no DOM dependency at all.
- `npm run build` (`scripts/build.js`) — `esbuild` bundles `src/index.js`
  into `dist/statelight.js` (ESM) and `dist/statelight.min.js` (minified
  IIFE for a bare `<script>` tag), and writes `dist/statelight.css` from
  `styles.js` for self-hosting consumers.
- CI (`.github/workflows/ci.yml`) runs both on push.

## Known trade-off

`docs/VISION.md` targets under 3kb gzipped for `dist/statelight.min.js`.
Shipping the transition graph, collapse/drag, and multi-machine cascade
(SVG rendering, drag.js, storage.js, and their CSS) has grown the gzipped
bundle to ~5kb. `PANEL_CSS` in `styles.js` is the largest single
contributor — it's an unminified template string, since esbuild's minifier
doesn't touch string literal contents. The most direct way to claw this
back without cutting features: hand-compact `PANEL_CSS` (strip
comments/whitespace) or move it to a real `.css` file processed by a small
CSS minifier at build time. Worth a dedicated pass if the budget needs to
hold strictly; not attempted here to keep this run focused on feature
completeness.
