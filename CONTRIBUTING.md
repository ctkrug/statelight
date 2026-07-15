# Contributing

This is a small, single-maintainer library — issues and PRs are welcome but
kept lightweight.

## Setup

```sh
npm install
npm test      # node:test, no build required
npm run build # bundles src/ into dist/ with esbuild
```

## Guidelines

- No runtime dependencies in `src/` — the shipped bundle stays
  dependency-free. `esbuild`/`jsdom` are dev-only.
- Every new behavior needs a `node:test` covering it; DOM-touching code
  uses `jsdom` (see `tests/panel.test.js` for the pattern).
- Follow the direction and tokens in `docs/DESIGN.md` for anything visual.
- Keep the single-file bundle (`dist/statelight.min.js`) under 3kb
  gzipped — check with `gzip -c dist/statelight.min.js | wc -c` after
  `npm run build`.
