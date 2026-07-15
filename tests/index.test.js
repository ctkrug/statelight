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
