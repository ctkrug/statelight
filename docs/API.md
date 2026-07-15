# Statelight — public API

## `attach(target, options?)`

The main entry point. Watches `target[options.stateKey]` and mounts a
floating panel that stays in sync.

```js
const handle = attach(machine, {
  stateKey: 'state',    // property to watch — default "state"
  label: 'my machine',  // panel title — defaults to stateKey
  eventName: 'advance',      // optional label attached to every recorded transition
  historyLimit: 50           // optional cap on retained history entries
});
```

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

- Passing a `transitions` map to render the full state graph and highlight
  the live path (currently the panel only shows a linear recent-states
  trail regardless of options).
- Dragging/collapsing the panel.
- Attaching more than one panel to the same page without manual
  positioning.
