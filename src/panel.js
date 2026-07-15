import { PANEL_CSS } from './styles.js';
import { createGraphView } from './graph-view.js';
import { safeGet, safeSet } from './storage.js';
import { makeDraggable } from './drag.js';

const PANEL_CLASS = 'statelight-panel';
const STYLE_ID = 'statelight-styles';
const TRAIL_LENGTH = 6;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = PANEL_CSS;
  document.head.appendChild(style);
}

/**
 * Renders the floating debug panel: current state, a recent-transition
 * trail, and (in a later story) the live transition-graph diagram.
 *
 * @param {object} [options]
 * @param {string} [options.label] - panel title, usually the watched key
 * @param {object} [options.transitions] - `{ [state]: { [event]: nextState } }`;
 *   when given, renders the full transition graph instead of falling back
 *   to the linear trail-only view.
 * @returns {{ el: HTMLElement, mount: (parent?: Element) => object, update: Function, destroy: () => void }}
 */
export function createPanel({ label = 'State Machine', transitions } = {}) {
  if (typeof document === 'undefined') {
    throw new Error('Statelight.createPanel requires a DOM environment');
  }

  ensureStyles();

  const root = document.createElement('div');
  root.className = PANEL_CLASS;
  root.innerHTML = `
    <div class="statelight-panel__header">
      <span class="statelight-panel__mark">&#9670; Statelight</span>
      <span class="statelight-panel__label"></span>
      <button type="button" class="statelight-panel__toggle" aria-expanded="true">
        <span class="statelight-panel__unread" aria-hidden="true"></span>
        <span class="statelight-panel__toggle-icon" aria-hidden="true">&#9662;</span>
      </button>
    </div>
    <div class="statelight-panel__state"></div>
    <div class="statelight-panel__graph"></div>
    <ul class="statelight-panel__trail"></ul>
  `;

  const labelEl = root.querySelector('.statelight-panel__label');
  const stateEl = root.querySelector('.statelight-panel__state');
  const graphEl = root.querySelector('.statelight-panel__graph');
  const trailEl = root.querySelector('.statelight-panel__trail');
  const toggleEl = root.querySelector('.statelight-panel__toggle');
  labelEl.textContent = label;

  // Namespaced by label since that's the only per-machine identifier
  // attach() options provide; two panels sharing a default label will
  // share collapsed state, which is an acceptable edge case for a
  // dev-tool panel.
  const collapseStorageKey = `statelight:${label}:collapsed`;
  let collapsed = safeGet(collapseStorageKey) === '1';

  function setCollapsed(value) {
    collapsed = value;
    root.classList.toggle('is-collapsed', collapsed);
    toggleEl.setAttribute('aria-expanded', String(!collapsed));
    toggleEl.setAttribute('aria-label', collapsed ? 'Expand panel' : 'Collapse panel');
    if (!collapsed) toggleEl.querySelector('.statelight-panel__unread').classList.remove('is-visible');
  }

  setCollapsed(collapsed);
  toggleEl.addEventListener('click', () => {
    setCollapsed(!collapsed);
    safeSet(collapseStorageKey, collapsed ? '1' : '0');
  });

  const positionStorageKey = `statelight:${label}:position`;
  const headerEl = root.querySelector('.statelight-panel__header');
  const drag = makeDraggable(headerEl, root, {
    exclude: '.statelight-panel__toggle',
    onDragEnd(position) {
      safeSet(positionStorageKey, JSON.stringify(position));
    }
  });

  const savedPosition = safeGet(positionStorageKey);
  if (savedPosition) {
    try {
      const { left, top } = JSON.parse(savedPosition);
      if (Number.isFinite(left) && Number.isFinite(top)) drag.setPosition(left, top);
    } catch {
      // Malformed/foreign data under this key — ignore and keep the default position.
    }
  }

  // Only mount a graph container when there's an actual graph to show —
  // an empty <div> left in the DOM for the zero-config trail-only case
  // would be an "empty graph container", which the wow-moment story
  // explicitly rules out.
  const graphView = transitions ? createGraphView(transitions) : null;
  if (graphView) {
    root.classList.add('statelight-panel--graph');
    graphEl.appendChild(graphView.el);
  } else {
    graphEl.remove();
  }

  function update(entry, history) {
    stateEl.textContent = String(entry.state);

    // Restart the pulse animation even if the same class was already applied.
    stateEl.classList.remove('is-pulsing');
    void stateEl.offsetWidth;
    stateEl.classList.add('is-pulsing');

    if (graphView) graphView.highlight(entry);
    if (collapsed) toggleEl.querySelector('.statelight-panel__unread').classList.add('is-visible');

    trailEl.innerHTML = '';
    history
      .slice(-TRAIL_LENGTH)
      .reverse()
      .forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item.event ? `${item.state} · ${item.event}` : String(item.state);
        trailEl.appendChild(li);
      });
  }

  return {
    el: root,
    mount(parent = document.body) {
      parent.appendChild(root);
      return this;
    },
    update,
    destroy() {
      drag.destroy();
      graphView?.destroy();
      root.remove();
    }
  };
}
