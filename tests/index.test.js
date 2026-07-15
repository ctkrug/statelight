import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

test('attach() mounts a panel and keeps it in sync with state changes', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;

  try {
    const { attach } = await import('../src/index.js');
    const machine = { state: 'idle' };

    const handle = attach(machine, { label: 'demo machine' });

    assert.ok(dom.window.document.querySelector('.statelight-panel'));
    assert.equal(
      dom.window.document.querySelector('.statelight-panel__state').textContent,
      'idle'
    );

    machine.state = 'running';

    assert.equal(
      dom.window.document.querySelector('.statelight-panel__state').textContent,
      'running'
    );
    assert.equal(handle.watcher.history().length, 2);

    handle.detach();

    assert.equal(dom.window.document.querySelector('.statelight-panel'), null);

    // Further mutation is a plain assignment now that the panel is detached.
    machine.state = 'done';
    assert.equal(machine.state, 'done');
  } finally {
    delete global.document;
    delete global.window;
  }
});
