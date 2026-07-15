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
