/**
 * A localStorage wrapper that degrades to a no-op instead of throwing.
 * `localStorage` is unavailable (or throws on access) in a handful of real
 * environments Statelight has to run in without crashing the host page:
 * privacy/incognito modes in some browsers, sandboxed iframes, and opaque
 * origins (e.g. `about:blank`, `file://` in some engines, or a test DOM
 * with no URL). Persistence here is a pure enhancement — the panel is
 * fully functional without it — so a failed read/write silently no-ops
 * rather than surfacing as a console error a consumer didn't cause.
 */
export function safeGet(key) {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(key, value) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  } catch {
    // no-op — see module doc
  }
}
