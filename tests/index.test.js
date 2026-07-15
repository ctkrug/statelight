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

test('attach() with a transitions map lights up the traversed edge as the machine moves', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;

  try {
    const { attach } = await import('../src/index.js');
    const machine = { state: 'red' };
    const transitions = {
      red: { advance: 'green' },
      green: { advance: 'yellow' },
      yellow: { advance: 'red' }
    };

    const handle = attach(machine, { label: 'traffic light', transitions, eventName: 'advance' });

    const graph = dom.window.document.querySelector('.statelight-graph');
    assert.ok(graph, 'the graph should render for the wow-moment path');
    assert.equal(graph.querySelectorAll('.statelight-graph__node').length, 3);

    machine.state = 'green';

    const activeEdge = graph.querySelector('[data-edge-id="red::advance::green"]');
    assert.ok(activeEdge.classList.contains('is-active'));
    assert.ok(
      graph.querySelector('[data-node-id="green"]').classList.contains('is-current')
    );

    handle.detach();
    assert.equal(dom.window.document.querySelector('.statelight-graph'), null);
  } finally {
    delete global.document;
    delete global.window;
  }
});

test('attaching two machines produces independent panels; detaching one leaves the other intact', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;

  try {
    const { attach } = await import('../src/index.js');
    const machineA = { state: 'idle' };
    const machineB = { state: 'idle' };

    const handleA = attach(machineA, { label: 'machine-a' });
    const handleB = attach(machineB, { label: 'machine-b' });

    assert.equal(dom.window.document.querySelectorAll('.statelight-panel').length, 2);

    handleA.detach();
    assert.equal(dom.window.document.querySelectorAll('.statelight-panel').length, 1);

    machineB.state = 'running';
    assert.equal(
      handleB.panel.el.querySelector('.statelight-panel__state').textContent,
      'running'
    );
    assert.equal(handleB.watcher.history().length, 2);

    handleB.detach();
    assert.equal(dom.window.document.querySelectorAll('.statelight-panel').length, 0);
  } finally {
    delete global.document;
    delete global.window;
  }
});

test('attach() mounts into a custom container when options.container is given', async () => {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="host"></div></body></html>'
  );
  global.document = dom.window.document;
  global.window = dom.window;

  try {
    const { attach } = await import('../src/index.js');
    const machine = { state: 'idle' };
    const host = dom.window.document.getElementById('host');

    const handle = attach(machine, { label: 'hosted machine', container: host });
    const panelEl = host.querySelector('.statelight-panel');

    assert.ok(panelEl, 'the panel should be a descendant of the given container');
    assert.equal(panelEl.parentElement, host, 'the panel should mount directly into the container');

    handle.detach();
    assert.equal(host.querySelectorAll('.statelight-panel').length, 0);
  } finally {
    delete global.document;
    delete global.window;
  }
});

test('attach() falls back to document.body when options.container is an explicit null (e.g. a failed querySelector)', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;

  try {
    const { attach } = await import('../src/index.js');
    const machine = { state: 'idle' };
    const missing = dom.window.document.querySelector('#does-not-exist');

    const handle = attach(machine, { label: 'orphaned container', container: missing });

    assert.ok(
      dom.window.document.body.querySelector('.statelight-panel'),
      'a null container should fall back to document.body instead of throwing'
    );

    handle.detach();
  } finally {
    delete global.document;
    delete global.window;
  }
});

test('a long session of attach()/detach() cycles leaves no panel or style-tag buildup', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;

  try {
    const { attach } = await import('../src/index.js');
    const transitions = { idle: { go: 'running' }, running: { stop: 'idle' } };

    for (let i = 0; i < 50; i++) {
      const machine = { state: 'idle' };
      const handle = attach(machine, { label: 'cycle-test', transitions });
      machine.state = 'running';
      machine.state = 'idle';
      handle.detach();
    }

    assert.equal(dom.window.document.querySelectorAll('.statelight-panel').length, 0);
    // ensureStyles() must stay idempotent across every cycle, not append a
    // fresh <style> per attach() — that would grow <head> without bound
    // over a long dev session.
    assert.equal(dom.window.document.querySelectorAll('#statelight-styles').length, 1);
  } finally {
    delete global.document;
    delete global.window;
  }
});
