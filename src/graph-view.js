import { buildTransitionGraph, findActiveEdges, layoutGraph } from './graph.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const NODE_RADIUS = 28;
const SELF_LOOP_RADIUS = 16;
const HIGHLIGHT_MS = 600;
let instanceCounter = 0;

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) {
    el.setAttribute(name, value);
  }
  return el;
}

/**
 * Renders the live transition-graph diagram: one node per state and one
 * edge per state -> event -> nextState entry. Pure DOM/SVG — the graph
 * shape and node positions come from `graph.js`.
 *
 * The most recently traversed edge (and the now-current node) get an
 * `is-active` / `is-current` class for {@link HIGHLIGHT_MS} so the shared
 * blueprint pulse language can render the live glow — see `highlight()`.
 *
 * @param {object} transitions - shape `{ [state]: { [event]: nextState } }`
 * @returns {null|{ el: SVGSVGElement, highlight: (entry: object) => void, destroy: () => void }}
 *   `null` when the transitions map yields no nodes (nothing to draw).
 */
export function createGraphView(transitions) {
  const { nodes, edges } = buildTransitionGraph(transitions);
  if (nodes.length === 0) return null;

  const { positions, width, height } = layoutGraph(nodes, { nodeRadius: NODE_RADIUS });
  const instanceId = `sl-${instanceCounter++}`;

  const svg = svgEl('svg', {
    class: 'statelight-graph',
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-label': 'Live state transition graph'
  });

  // A marker id must be unique per <svg> so multiple panels on one page
  // (attach() called for several machines) don't collide on the same
  // `url(#...)` reference.
  const defs = svgEl('defs');
  const arrow = svgEl('marker', {
    id: `${instanceId}-arrow`,
    viewBox: '0 0 10 10',
    refX: 9,
    refY: 5,
    markerWidth: 7,
    markerHeight: 7,
    orient: 'auto-start-reverse'
  });
  arrow.appendChild(svgEl('path', { d: 'M0,0 L10,5 L0,10 z', class: 'statelight-graph__arrowhead' }));
  defs.appendChild(arrow);
  svg.appendChild(defs);

  const edgeEls = new Map();
  const nodeEls = new Map();

  const edgesGroup = svgEl('g', { class: 'statelight-graph__edges' });
  for (const edge of edges) {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    const isSelfLoop = edge.from === edge.to;
    const group = svgEl('g', { class: 'statelight-graph__edge', 'data-edge-id': edge.id });
    group.appendChild(
      svgEl('path', {
        class: 'statelight-graph__edge-line',
        d: isSelfLoop ? selfLoopPath(from, NODE_RADIUS) : straightPath(from, to, NODE_RADIUS),
        'marker-end': `url(#${instanceId}-arrow)`
      })
    );

    if (edge.event) {
      const label = svgEl('text', {
        class: 'statelight-graph__edge-label',
        x: isSelfLoop ? from.x : (from.x + to.x) / 2,
        y: isSelfLoop ? from.y - NODE_RADIUS - SELF_LOOP_RADIUS * 2 - 4 : (from.y + to.y) / 2 - 6
      });
      label.textContent = edge.event;
      group.appendChild(label);
    }

    edgesGroup.appendChild(group);
    edgeEls.set(edge.id, group);
  }

  const nodesGroup = svgEl('g', { class: 'statelight-graph__nodes' });
  for (const id of nodes) {
    const { x, y } = positions.get(id);
    const group = svgEl('g', { class: 'statelight-graph__node', 'data-node-id': id });
    group.appendChild(svgEl('circle', { class: 'statelight-graph__node-circle', cx: x, cy: y, r: NODE_RADIUS }));
    const label = svgEl('text', { class: 'statelight-graph__node-label', x, y });
    label.textContent = String(id);
    group.appendChild(label);
    nodesGroup.appendChild(group);
    nodeEls.set(id, group);
  }

  svg.appendChild(edgesGroup);
  svg.appendChild(nodesGroup);

  let currentNodeEl = null;
  const activeTimers = new Map();

  function clearActiveEdges() {
    for (const [id, timerId] of activeTimers) {
      clearTimeout(timerId);
      edgeEls.get(id)?.classList.remove('is-active');
    }
    activeTimers.clear();
  }

  /**
   * Marks `entry.state`'s node as current and pulses the edge(s) that
   * transition traversed. Clears any still-pending highlight from a prior
   * call immediately, so only the most recent transition is ever lit.
   */
  function highlight(entry) {
    if (currentNodeEl) currentNodeEl.classList.remove('is-current');
    currentNodeEl = nodeEls.get(entry.state) || null;
    if (currentNodeEl) currentNodeEl.classList.add('is-current');

    clearActiveEdges();
    for (const edge of findActiveEdges(edges, entry)) {
      const el = edgeEls.get(edge.id);
      if (!el) continue;
      el.classList.add('is-active');
      activeTimers.set(
        edge.id,
        setTimeout(() => {
          el.classList.remove('is-active');
          activeTimers.delete(edge.id);
        }, HIGHLIGHT_MS)
      );
    }
  }

  return {
    el: svg,
    highlight,
    destroy() {
      clearActiveEdges();
      svg.remove();
    }
  };
}

function straightPath(from, to, nodeRadius) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  return `M${from.x + ux * nodeRadius},${from.y + uy * nodeRadius} L${to.x - ux * nodeRadius},${to.y - uy * nodeRadius}`;
}

// A self-transition (from === to) has no second point to draw a line
// toward, so it's rendered as a small loop arcing above the node instead.
function selfLoopPath({ x, y }, nodeRadius) {
  const top = y - nodeRadius;
  const loopTop = top - SELF_LOOP_RADIUS * 2;
  return `M${x - nodeRadius * 0.6},${top} C${x - nodeRadius * 0.6},${loopTop} ${x + nodeRadius * 0.6},${loopTop} ${x + nodeRadius * 0.6},${top}`;
}
