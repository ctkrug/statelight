import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const DEMO_HTML = `<!doctype html>
<html class="no-js">
  <body>
    <h1 class="wordmark">State<span class="wordmark__light" id="wordmark-light">light</span></h1>
    <span id="demo-light"></span>
    <strong id="demo-label" role="status" aria-live="polite"></strong>
    <button type="button" id="demo-advance">advance()</button>
    <div id="demo-panel-host"></div>
  </body>
</html>`;

test("the hero demo's main.js attaches a live panel and drives the traffic light", async () => {
  const dom = new JSDOM(DEMO_HTML, { url: 'http://localhost/site/index.html' });
  global.document = dom.window.document;
  global.window = dom.window;

  try {
    await import('../site/main.js');

    assert.equal(
      dom.window.document.documentElement.classList.contains('no-js'),
      false,
      'main.js should clear the no-js class once it runs'
    );
    assert.equal(dom.window.document.getElementById('demo-label').textContent, 'red');
    assert.ok(dom.window.document.querySelector('#demo-panel-host .statelight-panel'));
    assert.ok(
      dom.window.document.getElementById('wordmark-light').classList.contains('is-pulsing'),
      'the wordmark should pulse once on load'
    );

    dom.window.document.getElementById('demo-advance').click();

    assert.equal(dom.window.document.getElementById('demo-label').textContent, 'green');
    assert.equal(
      dom.window.document.querySelector('#demo-panel-host .statelight-panel__state').textContent,
      'green'
    );
  } finally {
    delete global.document;
    delete global.window;
  }
});
