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

  const mainJs = readFileSync(new URL('main.js', siteDir), 'utf8');
  assert.match(mainJs, /from ['"]\.\.\/src\/index\.js['"]/);
  assert.match(mainJs, /attach\(/);
});

test('site/index.html declares a real favicon and viewport meta', () => {
  assert.match(html, /rel="icon"[^>]*href="\.\/favicon\.svg"/);
  assert.match(html, /name="viewport"/);
});
