import { watch } from './statelight.js';
import { createPanel } from './panel.js';

/**
 * Attaches a floating debug panel to a plain-object state machine.
 * The single entry point most consumers need — combines watch() and
 * createPanel() and keeps them wired together for the panel's lifetime.
 *
 * @param {object} target - the object holding the state
 * @param {object} [options]
 * @param {string} [options.stateKey] - property to watch (default "state")
 * @param {string} [options.label] - panel title (defaults to stateKey)
 * @param {object} [options.transitions] - `{ [state]: { [event]: nextState } }`;
 *   when given, the panel renders the full live transition graph instead
 *   of the trail-only view.
 * @param {Element} [options.container] - element to mount the panel into
 *   instead of `document.body`; the panel keeps its own `position: fixed`
 *   styling unless the host page overrides it (e.g. to dock the panel to
 *   a specific container on narrow viewports).
 * @returns {{ detach: () => void, watcher: object, panel: object }}
 */
export function attach(target, options = {}) {
  const { stateKey = 'state', label, transitions, container } = options;
  const watcher = watch(target, stateKey, options);
  const panel = createPanel({ label: label || stateKey, transitions });

  panel.mount(container);
  panel.update({ state: watcher.current, from: null, event: null }, watcher.history());

  const stopListening = watcher.onTransition((entry) => {
    panel.update(entry, watcher.history());
  });

  return {
    watcher,
    panel,
    detach() {
      stopListening();
      watcher.unwatch();
      panel.destroy();
    }
  };
}

export { watch } from './statelight.js';
export { createPanel } from './panel.js';

if (typeof window !== 'undefined') {
  window.Statelight = { attach, watch, createPanel };
}
