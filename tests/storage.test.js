import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

test('safeGet/safeSet round-trip through a real localStorage', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
  global.window = dom.window;
  global.localStorage = dom.window.localStorage;

  try {
    const { safeGet, safeSet } = await import('../src/storage.js');
    assert.equal(safeGet('sl-test-key'), null);
    safeSet('sl-test-key', 'hello');
    assert.equal(safeGet('sl-test-key'), 'hello');
  } finally {
    delete global.window;
    delete global.localStorage;
  }
});

test('safeGet returns null and safeSet no-ops when accessing localStorage throws', async () => {
  // Mirrors what real browsers do for an opaque origin/privacy mode: the
  // localStorage getter itself throws on access, before any method call.
  Object.defineProperty(global, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('localStorage is not available for opaque origins');
    }
  });

  try {
    const { safeGet, safeSet } = await import('../src/storage.js');
    assert.doesNotThrow(() => safeSet('sl-test-key', 'hello'));
    assert.equal(safeGet('sl-test-key'), null);
  } finally {
    delete global.localStorage;
  }
});

test('safeGet returns null when localStorage does not exist at all', async () => {
  const { safeGet, safeSet } = await import('../src/storage.js');
  assert.equal(safeGet('sl-test-key'), null);
  assert.doesNotThrow(() => safeSet('sl-test-key', 'x'));
});
