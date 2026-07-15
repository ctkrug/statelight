/**
 * Pure, DOM-free graph logic for the live transition-graph view. Kept
 * separate from rendering so the extraction/layout/matching logic can be
 * unit-tested without a DOM environment.
 */

/**
 * Extracts the node/edge set implied by a transitions map, in the shape
 * `{ [state]: { [event]: nextState } }`.
 *
 * @param {object} [transitions]
 * @returns {{ nodes: string[], edges: Array<{ id: string, from: string, to: string, event: string }> }}
 */
export function buildTransitionGraph(transitions = {}) {
  const nodes = [];
  const seen = new Set();
  const edges = [];

  function addNode(id) {
    if (seen.has(id)) return;
    seen.add(id);
    nodes.push(id);
  }

  for (const [from, events] of Object.entries(transitions)) {
    addNode(from);
    for (const [event, to] of Object.entries(events)) {
      addNode(to);
      edges.push({ id: edgeIdFor(from, event, to), from, to, event });
    }
  }

  return { nodes, edges };
}

/**
 * Builds the stable identifier used to key an edge's DOM element and to
 * match a live transition back to the edge it traversed.
 */
export function edgeIdFor(from, event, to) {
  return `${from}::${event}::${to}`;
}

const DEFAULT_NODE_RADIUS = 28;
const DEFAULT_PADDING = 24;

/**
 * Places nodes evenly around a circle whose radius is derived from the
 * node count so that no two node circles ever overlap, for any node count
 * — the chord between adjacent nodes on the circle is guaranteed to be at
 * least one node diameter. This keeps the layout correct up to (and well
 * beyond) the ~12-state case the graph view targets, with no packing
 * heuristics or overlap-detection passes required.
 *
 * @param {string[]} nodes
 * @param {object} [options]
 * @param {number} [options.nodeRadius] - px radius of a rendered node circle
 * @param {number} [options.padding] - px gap between the layout and its bounds
 * @returns {{ positions: Map<string, {x: number, y: number}>, width: number, height: number }}
 */
export function layoutGraph(nodes, { nodeRadius = DEFAULT_NODE_RADIUS, padding = DEFAULT_PADDING } = {}) {
  const positions = new Map();
  const count = nodes.length;
  const minSize = nodeRadius * 2 + padding * 2;

  if (count === 0) {
    return { positions, width: minSize, height: minSize };
  }

  if (count === 1) {
    positions.set(nodes[0], { x: minSize / 2, y: minSize / 2 });
    return { positions, width: minSize, height: minSize };
  }

  // Minimum circle radius such that the chord between two adjacent nodes
  // (2 * r * sin(pi / n)) is at least one node diameter.
  const circleRadius = Math.max(nodeRadius / Math.sin(Math.PI / count), nodeRadius * 1.5);
  const size = circleRadius * 2 + nodeRadius * 2 + padding * 2;
  const center = size / 2;

  nodes.forEach((id, index) => {
    const angle = (2 * Math.PI * index) / count - Math.PI / 2;
    positions.set(id, {
      x: center + circleRadius * Math.cos(angle),
      y: center + circleRadius * Math.sin(angle)
    });
  });

  return { positions, width: size, height: size };
}
