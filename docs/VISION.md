# Statelight — vision

## The problem

Most small apps and side projects don't reach for a formal state-machine
library. They write a `state` field on a plain object and a pile of
`if`/`switch` logic around it, because pulling in XState (or similar) for a
three-state UI toggle is overkill. That's a reasonable choice — until
something goes wrong. Debugging "why is my UI stuck" or "why did this
transition fire twice" with nothing but `console.log` and guesswork is
tedious, and existing state-machine visualizers all assume you're already
bought into their library, their event format, and often a build pipeline.

There's no tool for the much larger population of hand-rolled, ad-hoc state
machines that make up most real-world JS code.

## Who it's for

JS/TS developers — framework-agnostic, so this covers vanilla DOM code,
React/Vue/Svelte components, Node services, games, anything with a `state`
field somewhere — who want live visibility into a state machine they wrote
themselves, without adopting a library or a build step just to get a
debugger.

## The core idea

Statelight instruments a plain JavaScript object's state property using
`Object.defineProperty`, so it becomes observable without requiring the
consuming code to change at all. Whatever already does `machine.state = x`
keeps working unmodified; Statelight just also notices. A floating panel
renders the current state and the transition history live, and — given an
optional transition map — draws the full state graph and highlights the
path as it's walked.

This is deliberately the opposite of how most instrumentation works: no
event bus to publish to, no adapter to write per-library, no decorator or
wrapper function required. If your state lives on a plain object property,
Statelight can watch it.

## Key design decisions

- **Getter/setter instrumentation, not polling.** `Object.defineProperty`
  gives synchronous, exact-transition detection with no timer overhead and
  no missed intermediate states.
- **The transition map is optional.** Without one, the panel still shows
  current state and a recent-transition trail — useful on its own. With
  one, it upgrades to a full graph diagram with the live path lit up. This
  keeps the zero-config path genuinely zero-config.
- **No dependencies, ever, in the shipped bundle.** `esbuild` and `jsdom`
  are dev-only tooling. What ships to a `<script>` tag is plain JS + a
  runtime-injected `<style>` — nothing to `npm install` to use it.
- **Injected styles, not a stylesheet link.** A second required `<link>` tag
  would break the "one script tag" pitch, so the panel's CSS lives as a
  string in `src/styles.js` and is injected into `<head>` on first mount.
  A prebuilt `dist/statelight.css` is still produced for anyone who'd
  rather self-host and override it.
- **Size budget: under 3kb gzipped for the single-file bundle.** This is a
  debugging aid meant to sit in a project indefinitely, not a dependency
  anyone should think twice about adding.

## What "v1 done" looks like

- Drop `dist/statelight.min.js` next to any plain-object state machine and
  call `Statelight.attach(machine)` (or `import { attach }` as an ES
  module) — a floating panel appears showing the live state.
- Optionally pass a `transitions` map and the panel renders the full state
  graph, lighting up the active edge as the machine moves through it.
- The panel is collapsible, draggable, and supports watching more than one
  machine on the same page without the panels overlapping.
- A published demo site (`apps.charliekrug.com/statelight`) with an
  interactive example machine, so the wow moment is one link away with no
  setup.
- Full test coverage of the watch/panel/graph logic and a CI pipeline that
  blocks merges on red tests or a broken build.
