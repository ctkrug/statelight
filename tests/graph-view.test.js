import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

async function withDom(run) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  try {
    return await run(dom);
  } finally {
    delete global.document;
    delete global.window;
  }
}

test('createGraphView renders one node and one edge per transition entry', async () => {
  await withDom(async () => {
    const { createGraphView } = await import('../src/graph-view.js');
    const view = createGraphView({ red: { advance: 'green' }, green: { advance: 'red' } });

    const nodeIds = [...view.el.querySelectorAll('.statelight-graph__node')].map((n) =>
      n.getAttribute('data-node-id')
    );
    assert.deepEqual(nodeIds.sort(), ['green', 'red']);
    assert.equal(view.el.querySelectorAll('.statelight-graph__edge').length, 2);

    view.destroy();
  });
});

test('createGraphView returns null for an empty transitions map (no empty container)', async () => {
  await withDom(async () => {
    const { createGraphView } = await import('../src/graph-view.js');
    assert.equal(createGraphView({}), null);
    assert.equal(createGraphView(undefined), null);
  });
});

test('createGraphView node labels display the state name', async () => {
  await withDom(async () => {
    const { createGraphView } = await import('../src/graph-view.js');
    const view = createGraphView({ idle: { start: 'running' } });

    const labels = [...view.el.querySelectorAll('.statelight-graph__node-label')].map(
      (el) => el.textContent
    );
    assert.deepEqual(labels.sort(), ['idle', 'running']);

    view.destroy();
  });
});

test('createGraphView labels each edge with its triggering event', async () => {
  await withDom(async () => {
    const { createGraphView } = await import('../src/graph-view.js');
    const view = createGraphView({ idle: { start: 'running' } });

    const label = view.el.querySelector('.statelight-graph__edge-label');
    assert.equal(label.textContent, 'start');

    view.destroy();
  });
});

test('createGraphView gives each panel instance its own unique arrow marker id', async () => {
  await withDom(async () => {
    const { createGraphView } = await import('../src/graph-view.js');
    const viewA = createGraphView({ idle: { start: 'running' } });
    const viewB = createGraphView({ idle: { start: 'running' } });

    const markerIdA = viewA.el.querySelector('marker').id;
    const markerIdB = viewB.el.querySelector('marker').id;

    assert.notEqual(markerIdA, markerIdB);
    assert.match(
      viewA.el.querySelector('.statelight-graph__edge-line').getAttribute('marker-end'),
      new RegExp(`#${markerIdA}\\)$`)
    );

    viewA.destroy();
    viewB.destroy();
  });
});

test('createGraphView renders a self-transition as a loop with a non-degenerate path', async () => {
  await withDom(async () => {
    const { createGraphView } = await import('../src/graph-view.js');
    const view = createGraphView({ stuck: { retry: 'stuck' } });

    const path = view.el.querySelector('.statelight-graph__edge-line').getAttribute('d');
    assert.match(path, /^M[\d.]+,[\d.]+ C/);

    const label = view.el.querySelector('.statelight-graph__edge-label');
    assert.equal(label.textContent, 'retry');

    view.destroy();
  });
});

test('highlight() marks the current node and the traversed edge as active', async () => {
  await withDom(async () => {
    const { createGraphView } = await import('../src/graph-view.js');
    const view = createGraphView({ idle: { start: 'running' } });

    view.highlight({ from: 'idle', state: 'running', event: 'start' });

    assert.ok(view.el.querySelector('[data-node-id="running"]').classList.contains('is-current'));
    assert.ok(
      view.el.querySelector('[data-edge-id]').classList.contains('is-active'),
      'the idle -> running edge should be active'
    );

    view.destroy();
  });
});

test('highlight() marks the current node and edge for a numeric-valued live entry', async () => {
  await withDom(async () => {
    const { createGraphView } = await import('../src/graph-view.js');
    const view = createGraphView({ 0: { go: 1 }, 1: { go: 0 } });

    // A watcher on an integer-enum state machine reports raw numbers, not
    // the stringified keys the transitions map's node ids are built from.
    view.highlight({ from: 0, state: 1, event: 'go' });

    assert.ok(
      view.el.querySelector('[data-node-id="1"]').classList.contains('is-current'),
      'the node for state 1 should be marked current even though the live entry is a number'
    );
    assert.ok(
      view.el.querySelector('[data-edge-id]').classList.contains('is-active'),
      'the 0 -> 1 edge should light up for a numeric transition'
    );

    view.destroy();
  });
});

test('highlight() clears the previous highlight when a new transition fires', async () => {
  await withDom(async () => {
    const { createGraphView } = await import('../src/graph-view.js');
    const view = createGraphView({
      idle: { start: 'running' },
      running: { finish: 'idle' }
    });

    view.highlight({ from: 'idle', state: 'running', event: 'start' });
    const firstEdge = view.el.querySelector('[data-edge-id="idle::start::running"]');
    assert.ok(firstEdge.classList.contains('is-active'));

    view.highlight({ from: 'running', state: 'idle', event: 'finish' });
    const secondEdge = view.el.querySelector('[data-edge-id="running::finish::idle"]');

    assert.equal(firstEdge.classList.contains('is-active'), false);
    assert.ok(secondEdge.classList.contains('is-active'));
    assert.equal(view.el.querySelector('[data-node-id="running"]').classList.contains('is-current'), false);
    assert.ok(view.el.querySelector('[data-node-id="idle"]').classList.contains('is-current'));

    view.destroy();
  });
});

test('destroy() cancels any pending highlight timer', async () => {
  await withDom(async () => {
    const { createGraphView } = await import('../src/graph-view.js');
    const view = createGraphView({ idle: { start: 'running' } });

    view.highlight({ from: 'idle', state: 'running', event: 'start' });
    // Should not throw and should not leave a dangling timer running past destroy.
    assert.doesNotThrow(() => view.destroy());
  });
});

test('createGraphView is an SVG element sized from the layout', async () => {
  await withDom(async () => {
    const { createGraphView } = await import('../src/graph-view.js');
    const view = createGraphView({ idle: { start: 'running' } });

    assert.equal(view.el.tagName.toLowerCase(), 'svg');
    assert.match(view.el.getAttribute('viewBox'), /^0 0 \d+(\.\d+)? \d+(\.\d+)?$/);

    view.destroy();
  });
});
