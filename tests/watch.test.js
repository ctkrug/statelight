import test from 'node:test';
import assert from 'node:assert/strict';
import { watch } from '../src/statelight.js';

test('watch tracks the initial state and subsequent property mutations', () => {
  const machine = { state: 'idle' };
  const watcher = watch(machine, 'state');

  assert.equal(watcher.current, 'idle');

  machine.state = 'running';

  assert.equal(watcher.current, 'running');
  assert.equal(machine.state, 'running');
  assert.equal(watcher.history().length, 2);
});

test('onTransition notifies listeners with from/to/event data', () => {
  const machine = { state: 'idle' };
  const watcher = watch(machine, 'state', { eventName: 'start' });
  const seen = [];
  watcher.onTransition((entry) => seen.push(entry));

  machine.state = 'running';

  assert.equal(seen.length, 1);
  assert.equal(seen[0].from, 'idle');
  assert.equal(seen[0].state, 'running');
  assert.equal(seen[0].event, 'start');
});

test('assigning the same state value does not record a transition', () => {
  const machine = { state: 'idle' };
  const watcher = watch(machine, 'state');

  machine.state = 'idle';

  assert.equal(watcher.history().length, 1);
});

test('historyLimit caps the retained history length', () => {
  const machine = { state: 0 };
  const watcher = watch(machine, 'state', { historyLimit: 2 });

  machine.state = 1;
  machine.state = 2;
  machine.state = 3;

  const history = watcher.history();
  assert.equal(history.length, 2);
  assert.equal(history[history.length - 1].state, 3);
});

test('historyLimit: 0 still caps history instead of falling back to unbounded growth', () => {
  const machine = { state: 0 };
  const watcher = watch(machine, 'state', { historyLimit: 0 });

  for (let i = 1; i <= 5; i++) machine.state = i;

  const history = watcher.history();
  assert.ok(
    history.length <= 1,
    `historyLimit: 0 should not silently mean "unlimited" (got length ${history.length})`
  );
  assert.equal(history[history.length - 1].state, 5);
});

test('unwatch restores a plain writable property', () => {
  const machine = { state: 'idle' };
  const watcher = watch(machine, 'state');
  watcher.unwatch();

  machine.state = 'done';

  assert.equal(machine.state, 'done');
  assert.equal(watcher.history().length, 1);
});

test('watch throws for a missing key', () => {
  assert.throws(() => watch({}, 'state'), TypeError);
});

test('watch throws for a non-object target', () => {
  assert.throws(() => watch(null, 'state'), TypeError);
});
