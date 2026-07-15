// Single source of truth for the panel's CSS. Kept as a plain string (not a
// .css file) so it can be injected at runtime with zero build step and,
// separately, written out to dist/statelight.css by scripts/build.js for
// consumers who'd rather link a stylesheet than accept an injected <style>.
// Tokens mirror docs/DESIGN.md; keep the two in sync.
export const PANEL_CSS = `
.statelight-panel {
  --sl-bg: #0b1220;
  --sl-surface-1: #10192e;
  --sl-surface-2: #182544;
  --sl-text: #e7edf7;
  --sl-text-muted: #8fa3c7;
  --sl-accent: #5eead4;
  --sl-accent-support: #f2b632;
  --sl-danger: #fb7185;
  --sl-radius: 6px;
  --sl-space-1: 4px;
  --sl-space-2: 8px;
  --sl-space-3: 12px;
  --sl-space-4: 16px;

  position: fixed;
  right: var(--sl-space-4);
  bottom: var(--sl-space-4);
  z-index: 2147483647;
  width: 280px;
  max-width: calc(100vw - 2 * var(--sl-space-4));
  background: var(--sl-surface-1);
  color: var(--sl-text);
  border: 1px solid var(--sl-surface-2);
  border-radius: var(--sl-radius);
  box-shadow:
    0 0 0 1px rgba(94, 234, 212, 0.08),
    0 12px 32px rgba(0, 0, 0, 0.45);
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  line-height: 1.4;
  overflow: hidden;
}

.statelight-panel__header {
  display: flex;
  align-items: center;
  gap: var(--sl-space-2);
  padding: var(--sl-space-2) var(--sl-space-3);
  background: var(--sl-surface-2);
  border-bottom: 1px solid rgba(94, 234, 212, 0.15);
  cursor: grab;
  touch-action: none;
}

.statelight-panel.is-dragging {
  user-select: none;
}

.statelight-panel.is-dragging .statelight-panel__header {
  cursor: grabbing;
}

.statelight-panel__mark {
  color: var(--sl-accent);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.statelight-panel__label {
  color: var(--sl-text-muted);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.06em;
}

.statelight-panel__toggle {
  display: flex;
  align-items: center;
  gap: var(--sl-space-1);
  margin-left: auto;
  padding: var(--sl-space-1);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--sl-radius);
  color: var(--sl-text-muted);
  cursor: pointer;
  transition: color 160ms ease-out, border-color 160ms ease-out, background 160ms ease-out;
}

.statelight-panel__toggle:hover {
  color: var(--sl-text);
  background: rgba(255, 255, 255, 0.06);
}

.statelight-panel__toggle:focus-visible {
  outline: none;
  border-color: var(--sl-accent);
  box-shadow: 0 0 0 2px rgba(94, 234, 212, 0.25);
}

.statelight-panel__toggle:active {
  transform: scale(0.92);
}

.statelight-panel__toggle-icon {
  display: inline-block;
  transition: transform 160ms ease-out;
}

.statelight-panel.is-collapsed .statelight-panel__toggle-icon {
  transform: rotate(-90deg);
}

.statelight-panel__unread {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sl-accent-support);
  opacity: 0;
  transform: scale(0);
  transition: opacity 160ms ease-out, transform 160ms ease-out;
}

.statelight-panel__unread.is-visible {
  opacity: 1;
  transform: scale(1);
}

.statelight-panel.is-collapsed .statelight-panel__state,
.statelight-panel.is-collapsed .statelight-panel__graph,
.statelight-panel.is-collapsed .statelight-panel__trail {
  display: none;
}

.statelight-panel__state {
  padding: var(--sl-space-3);
  font-size: 18px;
  font-weight: 700;
  color: var(--sl-text);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.statelight-panel__state.is-pulsing {
  animation: statelight-pulse 600ms ease-out;
}

@keyframes statelight-pulse {
  0% {
    text-shadow: 0 0 0 rgba(94, 234, 212, 0);
  }
  20% {
    text-shadow: 0 0 12px rgba(94, 234, 212, 0.85);
  }
  100% {
    text-shadow: 0 0 0 rgba(94, 234, 212, 0);
  }
}

.statelight-panel--graph {
  width: 360px;
}

.statelight-panel__graph {
  padding: var(--sl-space-2) var(--sl-space-3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.statelight-graph {
  display: block;
  width: 100%;
  height: auto;
}

.statelight-graph__node-circle {
  fill: var(--sl-surface-2);
  stroke: var(--sl-text-muted);
  stroke-width: 1.5;
  transition: stroke 160ms ease-out, fill 160ms ease-out;
}

.statelight-graph__node-label {
  fill: var(--sl-text);
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  text-anchor: middle;
  dominant-baseline: middle;
  pointer-events: none;
}

.statelight-graph__node.is-current .statelight-graph__node-circle {
  fill: rgba(94, 234, 212, 0.12);
  stroke: var(--sl-accent);
  stroke-width: 2;
  filter: drop-shadow(0 0 6px rgba(94, 234, 212, 0.65));
}

.statelight-graph__edge-line {
  fill: none;
  stroke: var(--sl-text-muted);
  stroke-width: 1.25;
  opacity: 0.55;
  transition: stroke 160ms ease-out, opacity 160ms ease-out;
}

.statelight-graph__edge-label {
  fill: var(--sl-text-muted);
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9px;
  text-anchor: middle;
  pointer-events: none;
}

.statelight-graph__arrowhead {
  fill: var(--sl-text-muted);
  opacity: 0.55;
}

.statelight-graph__edge.is-active .statelight-graph__edge-line {
  stroke: var(--sl-accent);
  opacity: 1;
  animation: statelight-edge-pulse 600ms ease-out;
}

.statelight-graph__edge.is-active .statelight-graph__arrowhead {
  fill: var(--sl-accent);
  opacity: 1;
}

.statelight-graph__edge.is-active .statelight-graph__edge-label {
  fill: var(--sl-accent);
}

@keyframes statelight-edge-pulse {
  0% {
    filter: drop-shadow(0 0 0 rgba(94, 234, 212, 0));
  }
  20% {
    filter: drop-shadow(0 0 6px rgba(94, 234, 212, 0.85));
  }
  100% {
    filter: drop-shadow(0 0 0 rgba(94, 234, 212, 0));
  }
}

.statelight-panel__trail {
  list-style: none;
  margin: 0;
  padding: var(--sl-space-2) var(--sl-space-3);
  display: flex;
  flex-direction: column;
  gap: var(--sl-space-1);
  color: var(--sl-text-muted);
  max-height: 140px;
  overflow-y: auto;
}

.statelight-panel__trail li {
  padding: var(--sl-space-1) var(--sl-space-2);
  border-radius: var(--sl-radius);
  background: rgba(255, 255, 255, 0.03);
}

.statelight-panel__trail li:first-child {
  color: var(--sl-accent);
  background: rgba(94, 234, 212, 0.08);
}

@media (prefers-reduced-motion: reduce) {
  .statelight-panel__state.is-pulsing,
  .statelight-graph__edge.is-active .statelight-graph__edge-line {
    animation: none;
  }
}
`;
