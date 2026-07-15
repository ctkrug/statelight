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
  panel.js         createPanel(options) — the floating DOM panel: header,
                   current-state text, the graph (when transitions is
                   passed — wraps graph-view.js), and the recent-transition
                   trail. Injects styles.js's CSS into <head> once per page.
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
The transition-graph feature (SVG rendering + its CSS) pushed the gzipped
bundle to ~3.6kb. Worth revisiting in a later pass (e.g. minifying the
`PANEL_CSS` template string) if the budget needs to hold strictly.
