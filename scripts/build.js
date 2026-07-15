import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { PANEL_CSS } from '../src/styles.js';

await mkdir('dist', { recursive: true });

// ESM build for `import { attach } from '.../dist/statelight.js'`.
await build({
  entryPoints: ['src/index.js'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/statelight.js',
  target: ['es2019']
});

// Minified IIFE for a bare <script src="..."> tag; src/index.js assigns
// window.Statelight itself, so no globalName wrapper is needed here.
await build({
  entryPoints: ['src/index.js'],
  bundle: true,
  format: 'iife',
  minify: true,
  outfile: 'dist/statelight.min.js',
  target: ['es2019']
});

await writeFile('dist/statelight.css', PANEL_CSS.trimStart());

// Minified ESM copy the landing page imports directly. site/ is deployed as
// a standalone static directory, so its demo can't reach up into ../src; it
// imports this self-contained bundle instead, keeping the live demo running
// the real library rather than a mockup.
await build({
  entryPoints: ['src/index.js'],
  bundle: true,
  format: 'esm',
  minify: true,
  outfile: 'site/statelight.js',
  target: ['es2019']
});

console.log('Build complete: dist/statelight.{js,min.js,css}, site/statelight.js');
