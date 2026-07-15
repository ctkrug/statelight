/**
 * Instruments a plain object's state property with a transparent
 * getter/setter so external code that assigns `target[key] = next`
 * keeps working unmodified while every transition is recorded.
 *
 * @param {object} target - the object holding the state (e.g. your hand-rolled machine)
 * @param {string} key - the property name to watch (default call sites use "state")
 * @param {object} [options]
 * @param {string} [options.eventName] - label attached to every recorded transition
 * @param {number} [options.historyLimit] - cap on retained history entries
 * @returns {{
 *   current: *,
 *   history: () => Array<object>,
 *   onTransition: (fn: (entry: object) => void) => (() => void),
 *   unwatch: () => void
 * }}
 */
// target -> Set<key> of properties currently instrumented by watch(), so a
// second watch() call on the same target/key can fail loudly instead of
// silently taking over the accessor — the first watcher's closure would
// otherwise go stale, and its unwatch() would later revert the property to
// that stale value and destroy the second watcher's instrumentation.
const watchedKeys = new WeakMap();

export function watch(target, key, options = {}) {
  if (target == null || typeof target !== 'object') {
    throw new TypeError('Statelight.watch: target must be an object');
  }
  if (!(key in target)) {
    throw new TypeError(`Statelight.watch: target has no property "${key}"`);
  }
  let keysForTarget = watchedKeys.get(target);
  if (keysForTarget?.has(key)) {
    throw new Error(`Statelight.watch: "${key}" is already being watched on this object — call unwatch() first`);
  }
  if (!keysForTarget) {
    keysForTarget = new Set();
    watchedKeys.set(target, keysForTarget);
  }
  keysForTarget.add(key);

  const listeners = new Set();
  let current = target[key];
  const history = [{ state: current, from: null, at: now(), event: null }];

  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    get() {
      return current;
    },
    set(next) {
      const prev = current;
      current = next;
      if (next === prev) return;

      const entry = { state: next, from: prev, at: now(), event: options.eventName || null };
      history.push(entry);
      // >= 0, not truthy: a caller passing historyLimit: 0 means "keep no
      // backlog", not "no limit" — the previous truthy check treated 0 the
      // same as omitted and grew history without bound.
      if (options.historyLimit >= 0) {
        while (history.length > Math.max(options.historyLimit, 1)) history.shift();
      }
      for (const listener of listeners) listener(entry);
    }
  });

  return {
    get current() {
      return current;
    },
    history() {
      return history.slice();
    },
    onTransition(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    unwatch() {
      Object.defineProperty(target, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: current
      });
      listeners.clear();
      keysForTarget.delete(key);
    }
  };
}

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
