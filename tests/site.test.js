import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const siteDir = new URL('../site/', import.meta.url);
const html = readFileSync(new URL('index.html', siteDir), 'utf8');

test('site/index.html only uses relative asset paths', () => {
  const attrs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(attrs.length > 0, 'expected at least one src/href attribute to check');

  for (const value of attrs) {
    const isAbsoluteLocalPath = value.startsWith('/') && !value.startsWith('//');
    assert.ok(!isAbsoluteLocalPath, `expected a relative path, got a leading-slash path: ${value}`);
  }
});

test('site/index.html attaches a real Statelight instance, not a static mockup', () => {
  assert.match(html, /type="module" src="\.\/main\.js"/);

  // Imports the bundled library that ships inside site/ (so the deployed
  // static directory is self-contained) and calls attach() — a real
  // instance, not a hand-written imitation of the panel's markup.
  const mainJs = readFileSync(new URL('main.js', siteDir), 'utf8');
  assert.match(mainJs, /from ['"]\.\/statelight\.js['"]/);
  assert.match(mainJs, /attach\(/);
});

test('site/index.html declares a real favicon and viewport meta', () => {
  assert.match(html, /rel="icon"[^>]*href="\.\/favicon\.svg"/);
  assert.match(html, /name="viewport"/);
});

test('site/index.html declares Open Graph/Twitter metadata and a theme color', () => {
  assert.match(html, /property="og:title" content="[^"]+"/);
  assert.match(html, /property="og:description"[\s\S]*?content="[^"]+"/);
  assert.match(html, /name="twitter:card" content="summary"/);
  assert.match(html, /name="theme-color" content="#0b1220"/);
});

test('site/index.html hides non-functional demo controls until main.js runs', () => {
  assert.match(html, /<html lang="en" class="no-js">/);

  const mainJs = readFileSync(new URL('main.js', siteDir), 'utf8');
  assert.match(mainJs, /classList\.remove\(['"]no-js['"]\)/);
});

test('site/index.html marks the demo label as a live region for screen readers', () => {
  assert.match(html, /<strong id="demo-label" role="status" aria-live="polite">/);
});
