const PANEL_CLASS = 'statelight-panel';
const TRAIL_LENGTH = 6;

/**
 * Renders the floating debug panel: current state, a recent-transition
 * trail, and (in a later story) the live transition-graph diagram.
 *
 * @param {object} [options]
 * @param {string} [options.label] - panel title, usually the watched key
 * @returns {{ el: HTMLElement, mount: (parent?: Element) => object, update: Function, destroy: () => void }}
 */
export function createPanel({ label = 'State Machine' } = {}) {
  if (typeof document === 'undefined') {
    throw new Error('Statelight.createPanel requires a DOM environment');
  }

  const root = document.createElement('div');
  root.className = PANEL_CLASS;
  root.innerHTML = `
    <div class="statelight-panel__header">
      <span class="statelight-panel__mark">&#9670; Statelight</span>
      <span class="statelight-panel__label"></span>
    </div>
    <div class="statelight-panel__state"></div>
    <ul class="statelight-panel__trail"></ul>
  `;

  const labelEl = root.querySelector('.statelight-panel__label');
  const stateEl = root.querySelector('.statelight-panel__state');
  const trailEl = root.querySelector('.statelight-panel__trail');
  labelEl.textContent = label;

  function update(entry, history) {
    stateEl.textContent = String(entry.state);

    // Restart the pulse animation even if the same class was already applied.
    stateEl.classList.remove('is-pulsing');
    void stateEl.offsetWidth;
    stateEl.classList.add('is-pulsing');

    trailEl.innerHTML = '';
    history
      .slice(-TRAIL_LENGTH)
      .reverse()
      .forEach((item) => {
        const li = document.createElement('li');
        li.textContent = String(item.state);
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
      root.remove();
    }
  };
}
