import { PANEL_CSS } from './styles.js';
import { createGraphView } from './graph-view.js';

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
    </div>
    <div class="statelight-panel__state"></div>
    <div class="statelight-panel__graph"></div>
    <ul class="statelight-panel__trail"></ul>
  `;

  const labelEl = root.querySelector('.statelight-panel__label');
  const stateEl = root.querySelector('.statelight-panel__state');
  const graphEl = root.querySelector('.statelight-panel__graph');
  const trailEl = root.querySelector('.statelight-panel__trail');
  labelEl.textContent = label;

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
      graphView?.destroy();
      root.remove();
    }
  };
}
