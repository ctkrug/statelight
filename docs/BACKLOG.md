# Statelight — backlog

Stories are implemented in order within an epic; epics are implemented in
order. Every story's acceptance criteria must be independently verifiable
by a later BUILD/QA run — no vibes-based "works well."

## Epic 1 — Live transition graph (the wow moment)

### [x] 1.1 Render the transition graph and light up the live path — **WOW MOMENT**

The demo: pass a `transitions` map to `attach()` and the panel draws every
state as a node, every event as an edge, and glows the edge just traversed
as the machine moves through it live.

- [x] Passing `options.transitions` (shape: `{ [state]: { [event]: nextState } }`)
      renders one node per state referenced in the map and one edge per
      `state -> event -> nextState` entry.
- [x] The edge for the most recent transition gets a visible highlight
      (the existing cyan pulse language) for at least 600ms after it fires;
      the previous highlight clears.
- [x] Calling `attach()` without a `transitions` option falls back to the
      current linear trail view with no error and no empty graph container.

### [x] 1.2 Label trail entries and edges with the triggering event

- [x] When a transition's `event` is set (via `options.eventName` or a
      future per-call override), the trail entry and the corresponding
      graph edge display the event name alongside the state name.
- [x] Transitions with no event set render state-only, with no empty
      label element left in the DOM.

### [x] 1.3 Auto-layout the graph for up to ~12 states without overlap

- [x] A `transitions` map covering 2 to 12 distinct states renders with no
      two node bounding boxes overlapping at the panel's default width.
- [x] Re-rendering after a new transition (or a resized panel) does not
      leave stale/duplicate edge elements in the DOM.

### [x] 1.4 Design polish — graph matches the blueprint direction

- [x] Nodes and edges use the tokens and glow/pulse language defined in
      `docs/DESIGN.md` (no ad hoc colors introduced for the graph).
- [x] The idle (non-active) state of nodes/edges is legible against
      `--sl-surface-1` at the panel's default width — verified by eye at
      1x and squint-test contrast.

## Epic 2 — Panel ergonomics

### [x] 2.1 Collapse/expand the panel

- [x] Clicking the collapse toggle in the header switches the panel
      between full view and a header-only collapsed state. (Deviation from
      the original "clicking the header toggles" wording: the header is
      also the 2.2 drag handle, so a dedicated toggle button avoids the
      classic click-vs-drag ambiguity bug rather than needing a
      move-distance threshold to disambiguate the two gestures.)
- [x] While collapsed, a new transition shows an unread indicator (e.g. a
      dot) on the header.
- [x] Collapsed/expanded state persists across a page reload via
      `localStorage`.

### [x] 2.2 Drag to reposition the panel

- [x] Dragging the header moves the panel anywhere within the viewport
      (clamped so it can't be dragged fully off-screen).
- [x] The dragged position persists across a page reload via
      `localStorage`.
- [x] Dragging the header does not trigger text selection on the page
      behind it.

### [x] 2.3 Support multiple machines on one page

- [x] Calling `attach()` on two different target objects produces two
      independent panels that do not visually overlap by default. Panels
      at their default (never-dragged) position cascade diagonally by one
      header-height per panel — each header stays fully visible/clickable
      even when a later panel partially covers the body behind it, the
      same pattern OS-level cascading windows use. Dragging any panel
      fully separates it.
- [x] Calling `detach()` on one handle removes only its panel and leaves
      the other machine's panel and watcher fully functional.

### [x] 2.4 Design polish — themed states for every new control

- [x] The collapse toggle and drag handle each have distinct hover,
      focus-visible, and active states per `docs/DESIGN.md` — no naked
      default button/cursor styling.
- [x] Keyboard users can reach and activate the collapse toggle (drag is
      mouse/touch-only, which is acceptable for a dev-tool panel, but
      collapse must not be mouse-only) — it's a real `<button>`.

## Epic 3 — Distribution & demo site

### [ ] 3.1 Package is installable and importable from a built tarball

- [ ] `npm pack` followed by installing the resulting tarball into a
      scratch project and `import`-ing `attach` from it succeeds with no
      missing-file errors.
- [ ] The published `main`/`module`/`unpkg` entry points in `package.json`
      all resolve to files actually included in the `files` allowlist.

### [ ] 3.2 Interactive landing page at `site/`

- [ ] `site/index.html` uses only relative asset paths (no leading `/`)
      and renders correctly when served from a non-root subpath.
- [ ] The hero is a real, running Statelight instance attached to an
      example machine on the page — not a screenshot, gif, or static
      mockup.
- [ ] The page matches `docs/DESIGN.md`'s tokens and layout intent at
      390px, 768px, and 1440px with no horizontal scroll or overlap.

### [ ] 3.3 Design polish — full design self-review on the landing page

- [ ] Every item in the design standard's D3 self-review checklist
      (resize/squint/tab-through/click-every-control) is verified and
      noted as checked in the QA run's STATUS `memory` field.
- [ ] No anti-generic-ban item (D2) is present: real fonts loaded, no
      unstyled native controls, no placeholder copy, a real favicon.
