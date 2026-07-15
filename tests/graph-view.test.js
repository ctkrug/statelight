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

test('createGraphView is an SVG element sized from the layout', async () => {
  await withDom(async () => {
    const { createGraphView } = await import('../src/graph-view.js');
    const view = createGraphView({ idle: { start: 'running' } });

    assert.equal(view.el.tagName.toLowerCase(), 'svg');
    assert.match(view.el.getAttribute('viewBox'), /^0 0 \d+(\.\d+)? \d+(\.\d+)?$/);

    view.destroy();
  });
});
