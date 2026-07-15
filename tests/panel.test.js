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

// A real (non-opaque-origin) URL so localStorage-backed persistence tests
// can actually read/write instead of exercising storage.js's no-op path.
async function withPersistentDom(run) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
  global.document = dom.window.document;
  global.window = dom.window;
  global.localStorage = dom.window.localStorage;
  try {
    return await run(dom);
  } finally {
    delete global.document;
    delete global.window;
    delete global.localStorage;
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

test('createPanel labels a trail entry with its event when one is set', async () => {
  await withDom(async (dom) => {
    const { createPanel } = await import('../src/panel.js');
    const panel = createPanel({ label: 'demo' });
    panel.mount(dom.window.document.body);

    panel.update({ state: 'running', from: 'idle', event: 'start' }, [
      { state: 'idle', event: null },
      { state: 'running', event: 'start' }
    ]);

    const trailItems = [...panel.el.querySelectorAll('.statelight-panel__trail li')].map(
      (li) => li.textContent
    );
    assert.deepEqual(trailItems, ['running · start', 'idle']);

    panel.destroy();
  });
});

test('createPanel without a transitions option leaves no graph container in the DOM', async () => {
  await withDom(async (dom) => {
    const { createPanel } = await import('../src/panel.js');
    const panel = createPanel({ label: 'demo' });
    panel.mount(dom.window.document.body);

    assert.equal(panel.el.querySelector('.statelight-panel__graph'), null);
    assert.equal(panel.el.querySelector('.statelight-graph'), null);

    panel.destroy();
  });
});

test('clicking the toggle collapses the panel and hides its content', async () => {
  await withDom(async (dom) => {
    const { createPanel } = await import('../src/panel.js');
    const panel = createPanel({ label: 'demo' });
    panel.mount(dom.window.document.body);

    const toggle = panel.el.querySelector('.statelight-panel__toggle');
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(panel.el.classList.contains('is-collapsed'), false);

    toggle.dispatchEvent(new dom.window.Event('click', { bubbles: true }));

    assert.equal(panel.el.classList.contains('is-collapsed'), true);
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');

    toggle.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
    assert.equal(panel.el.classList.contains('is-collapsed'), false);
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');

    panel.destroy();
  });
});

test('a transition while collapsed shows an unread indicator, cleared on expand', async () => {
  await withDom(async (dom) => {
    const { createPanel } = await import('../src/panel.js');
    const panel = createPanel({ label: 'demo' });
    panel.mount(dom.window.document.body);

    const toggle = panel.el.querySelector('.statelight-panel__toggle');
    const unread = panel.el.querySelector('.statelight-panel__unread');
    toggle.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
    assert.equal(unread.classList.contains('is-visible'), false);

    panel.update({ state: 'running' }, [{ state: 'idle' }, { state: 'running' }]);
    assert.equal(unread.classList.contains('is-visible'), true);

    toggle.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
    assert.equal(unread.classList.contains('is-visible'), false);

    panel.destroy();
  });
});

test('collapsed state persists across panels sharing a label via localStorage', async () => {
  await withPersistentDom(async (dom) => {
    const { createPanel } = await import('../src/panel.js');
    const first = createPanel({ label: 'persisted-demo' });
    first.mount(dom.window.document.body);
    first.el.querySelector('.statelight-panel__toggle').dispatchEvent(
      new dom.window.Event('click', { bubbles: true })
    );
    assert.ok(first.el.classList.contains('is-collapsed'));
    first.destroy();

    const second = createPanel({ label: 'persisted-demo' });
    second.mount(dom.window.document.body);
    assert.ok(second.el.classList.contains('is-collapsed'));

    second.destroy();
  });
});

test('createPanel with a transitions option renders the graph and highlights on update', async () => {
  await withDom(async (dom) => {
    const { createPanel } = await import('../src/panel.js');
    const panel = createPanel({
      label: 'demo',
      transitions: { idle: { start: 'running' } }
    });
    panel.mount(dom.window.document.body);

    assert.ok(panel.el.querySelector('.statelight-graph'));
    assert.equal(panel.el.querySelectorAll('.statelight-graph__node').length, 2);

    panel.update({ state: 'running', from: 'idle', event: 'start' }, [
      { state: 'idle' },
      { state: 'running' }
    ]);

    assert.ok(
      panel.el.querySelector('[data-node-id="running"]').classList.contains('is-current')
    );
    assert.ok(panel.el.querySelector('[data-edge-id]').classList.contains('is-active'));

    panel.destroy();
  });
});
