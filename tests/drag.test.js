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

function pointerEvent(win, type, opts) {
  return new win.PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, ...opts });
}

test('dragging the handle moves the target by the pointer delta', async () => {
  await withDom(async (dom) => {
    const { makeDraggable } = await import('../src/drag.js');
    const handle = dom.window.document.createElement('div');
    const target = dom.window.document.createElement('div');
    target.getBoundingClientRect = () => ({ left: 100, top: 50, right: 200, bottom: 150, width: 100, height: 100 });
    dom.window.document.body.append(handle, target);

    makeDraggable(handle, target);

    handle.dispatchEvent(pointerEvent(dom.window, 'pointerdown', { clientX: 100, clientY: 50 }));
    handle.dispatchEvent(pointerEvent(dom.window, 'pointermove', { clientX: 140, clientY: 90 }));

    assert.equal(target.style.left, '140px');
    assert.equal(target.style.top, '90px');
    assert.equal(target.style.right, 'auto');
    assert.equal(target.style.bottom, 'auto');
    assert.ok(target.classList.contains('is-dragging'));
  });
});

test('drag position is clamped so the target stays fully on-screen', async () => {
  await withDom(async (dom) => {
    dom.window.innerWidth = 300;
    dom.window.innerHeight = 200;
    const { makeDraggable } = await import('../src/drag.js');
    const handle = dom.window.document.createElement('div');
    const target = dom.window.document.createElement('div');
    Object.defineProperty(target, 'offsetWidth', { value: 100 });
    Object.defineProperty(target, 'offsetHeight', { value: 80 });
    target.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 80 });
    dom.window.document.body.append(handle, target);

    makeDraggable(handle, target);

    handle.dispatchEvent(pointerEvent(dom.window, 'pointerdown', { clientX: 0, clientY: 0 }));
    // Drag far past the bottom-right and top-left edges of the viewport.
    handle.dispatchEvent(pointerEvent(dom.window, 'pointermove', { clientX: 1000, clientY: 1000 }));
    assert.equal(target.style.left, '200px'); // 300 - 100
    assert.equal(target.style.top, '120px'); // 200 - 80

    handle.dispatchEvent(pointerEvent(dom.window, 'pointermove', { clientX: -1000, clientY: -1000 }));
    assert.equal(target.style.left, '0px');
    assert.equal(target.style.top, '0px');
  });
});

test('pointerdown on an excluded descendant does not start a drag', async () => {
  await withDom(async (dom) => {
    const { makeDraggable } = await import('../src/drag.js');
    const handle = dom.window.document.createElement('div');
    const button = dom.window.document.createElement('button');
    button.className = 'toggle';
    handle.appendChild(button);
    const target = dom.window.document.createElement('div');
    target.getBoundingClientRect = () => ({ left: 0, top: 0, width: 0, height: 0 });
    dom.window.document.body.append(handle, target);

    makeDraggable(handle, target, { exclude: '.toggle' });

    button.dispatchEvent(pointerEvent(dom.window, 'pointerdown', { clientX: 10, clientY: 10 }));
    handle.dispatchEvent(pointerEvent(dom.window, 'pointermove', { clientX: 50, clientY: 50 }));

    assert.equal(target.style.left, '');
    assert.equal(target.classList.contains('is-dragging'), false);
  });
});

test('pointerup calls onDragEnd with the final position and stops the drag', async () => {
  await withDom(async (dom) => {
    const { makeDraggable } = await import('../src/drag.js');
    const handle = dom.window.document.createElement('div');
    const target = dom.window.document.createElement('div');
    let rect = { left: 0, top: 0, width: 0, height: 0 };
    target.getBoundingClientRect = () => rect;
    dom.window.document.body.append(handle, target);

    const ends = [];
    makeDraggable(handle, target, { onDragEnd: (pos) => ends.push(pos) });

    handle.dispatchEvent(pointerEvent(dom.window, 'pointerdown', { clientX: 0, clientY: 0 }));
    rect = { left: 30, top: 20, width: 0, height: 0 };
    handle.dispatchEvent(pointerEvent(dom.window, 'pointerup', { clientX: 30, clientY: 20 }));

    assert.equal(ends.length, 1);
    assert.deepEqual(ends[0], { left: 30, top: 20 });
    assert.equal(target.classList.contains('is-dragging'), false);
  });
});

test('destroy() removes all pointer listeners so further drags are inert', async () => {
  await withDom(async (dom) => {
    const { makeDraggable } = await import('../src/drag.js');
    const handle = dom.window.document.createElement('div');
    const target = dom.window.document.createElement('div');
    target.getBoundingClientRect = () => ({ left: 0, top: 0, width: 0, height: 0 });
    dom.window.document.body.append(handle, target);

    const drag = makeDraggable(handle, target);
    drag.destroy();

    handle.dispatchEvent(pointerEvent(dom.window, 'pointerdown', { clientX: 0, clientY: 0 }));
    handle.dispatchEvent(pointerEvent(dom.window, 'pointermove', { clientX: 50, clientY: 50 }));

    assert.equal(target.style.left, '');
  });
});
