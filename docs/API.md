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

- Dragging/collapsing the panel.
- Attaching more than one panel to the same page without manual
  positioning.
