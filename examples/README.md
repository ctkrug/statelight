# Examples

Both examples load `../src/index.js` directly as a native ES module — no
build step, no server framework required. Serve the repo root with any
static file server and open the page:

```sh
npx serve .
# then visit /examples/demo.html or /examples/traffic-light.html
```

(Opening the files with `file://` won't work — ES module imports require
`http://`.)

- **`demo.html`** — the smallest possible integration: a plain object, two
  buttons, and `attach()`.
- **`traffic-light.html`** — the wow moment: a visible traffic light driven
  by the same handful of lines of state-machine code shown on the page,
  with the Statelight panel tracking it live.

See also [`site/`](../site/) for the public landing page, which embeds
this same traffic-light demo as its hero.
