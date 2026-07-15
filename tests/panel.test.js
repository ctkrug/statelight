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

test('createPanel renders the current state and a reversed trail', async () => {
  await withDom(async (dom) => {
    const { createPanel } = await import('../src/panel.js');
    const panel = createPanel({ label: 'demo' });
    panel.mount(dom.window.document.body);

    panel.update(
      { state: 'running', from: 'idle', event: null },
      [{ state: 'idle' }, { state: 'running' }]
    );

    assert.equal(panel.el.querySelector('.statelight-panel__label').textContent, 'demo');
    assert.equal(panel.el.querySelector('.statelight-panel__state').textContent, 'running');

    const trailItems = [...panel.el.querySelectorAll('.statelight-panel__trail li')].map(
      (li) => li.textContent
    );
    assert.deepEqual(trailItems, ['running', 'idle']);

    panel.destroy();
  });
});

test('createPanel caps the rendered trail at six most recent entries', async () => {
  await withDom(async (dom) => {
    const { createPanel } = await import('../src/panel.js');
    const panel = createPanel();
    panel.mount(dom.window.document.body);

    const history = Array.from({ length: 10 }, (_, i) => ({ state: i }));
    panel.update({ state: 9 }, history);

    assert.equal(panel.el.querySelectorAll('.statelight-panel__trail li').length, 6);

    panel.destroy();
  });
});

test('createPanel throws outside a DOM environment', async () => {
  const { createPanel } = await import('../src/panel.js');
  assert.throws(() => createPanel(), /requires a DOM environment/);
});
