import { buildTransitionGraph, layoutGraph } from './graph.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const NODE_RADIUS = 28;

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
 * @param {object} transitions - shape `{ [state]: { [event]: nextState } }`
 * @returns {null|{ el: SVGSVGElement, destroy: () => void }}
 *   `null` when the transitions map yields no nodes (nothing to draw).
 */
export function createGraphView(transitions) {
  const { nodes, edges } = buildTransitionGraph(transitions);
  if (nodes.length === 0) return null;

  const { positions, width, height } = layoutGraph(nodes, { nodeRadius: NODE_RADIUS });

  const svg = svgEl('svg', {
    class: 'statelight-graph',
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-label': 'Live state transition graph'
  });

  const edgesGroup = svgEl('g', { class: 'statelight-graph__edges' });
  for (const edge of edges) {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    const group = svgEl('g', { class: 'statelight-graph__edge', 'data-edge-id': edge.id });
    group.appendChild(svgEl('path', { class: 'statelight-graph__edge-line', d: straightPath(from, to, NODE_RADIUS) }));
    edgesGroup.appendChild(group);
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
  }

  svg.appendChild(edgesGroup);
  svg.appendChild(nodesGroup);

  return {
    el: svg,
    destroy() {
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
