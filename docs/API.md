# Statelight — public API

## `attach(target, options?)`

The main entry point. Watches `target[options.stateKey]` and mounts a
floating panel that stays in sync.

```js
const handle = attach(machine, {
  stateKey: 'state',    // property to watch — default "state"
  label: 'my machine',  // panel title — defaults to stateKey
  eventName: 'advance',      // optional label attached to every recorded transition
  historyLimit: 50,          // optional cap on retained history entries
  transitions: {              // optional — upgrades the panel to a full graph view
    idle: { start: 'running' },
    running: { pause: 'paused', stop: 'idle' },
    paused: { resume: 'running', stop: 'idle' }
  }
});
```

When `options.transitions` is set, the panel renders one node per state
referenced in the map and one edge per `state -> event -> nextState` entry,
auto-laid-out on a circle sized so nodes never overlap (works for any
number of states, comfortably up to ~12 before it gets visually busy). The
edge and node touched by the most recent transition pulse for 600ms.
Without `transitions`, the panel falls back to the trail-only view — no
graph container is rendered.

Returns `{ watcher, panel, detach() }`. Call `detach()` to unmount the
panel and restore `target[stateKey]` to a plain writable property.

### Panel ergonomics

- **Collapse/expand:** click the toggle button (▾) in the header to shrink
  the panel to just its header. A dot lights up on the toggle if a
  transition happens while collapsed; expanding clears it. State persists
  across a reload via `localStorage`, namespaced by `label`.
- **Drag to reposition:** drag the header (anywhere but the toggle button)
  to move the panel; it's clamped so it always stays fully on-screen.
  Position persists the same way as collapsed state.
- **Multiple machines:** call `attach()` once per machine — each gets its
  own independent panel. Panels left at their default position cascade
  diagonally so each one's header stays visible; drag any of them to fully
  separate it. `detach()` only ever affects its own panel/watcher.

## `watch(target, key, options?)`

The lower-level primitive `attach()` is built on. Instruments the property
without rendering anything — useful for headless logging or a custom UI.

```js
const watcher = watch(machine, 'state');
watcher.current;              // current value
watcher.history();            // array of { state, from, at, event }
watcher.onTransition(fn);     // subscribe; returns an unsubscribe function
watcher.unwatch();            // restore a plain property
```

## `createPanel(options?)`

The DOM renderer `attach()` uses internally. Exposed for anyone who wants
to drive the panel from their own event source instead of `watch()`.

```js
const panel = createPanel({ label: 'my machine' });
panel.mount(parentEl);                    // defaults to document.body
panel.update({ state: 'running' }, history); // history: array of { state }
panel.destroy();
```

## Not yet implemented (see `docs/BACKLOG.md`)

- Packaging/distribution polish (tarball install check, entry-point audit)
  and the interactive landing page — see epic 3 in `docs/BACKLOG.md`.
