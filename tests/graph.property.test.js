import test from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { buildTransitionGraph, edgeIdFor, findActiveEdges, layoutGraph } from '../src/graph.js';

// A small alphabet keeps generated identifiers readable in failure output
// while still exercising punctuation (including "::" itself) that a real
// state/event name could plausibly contain.
const nameArb = fc.stringMatching(/^[a-zA-Z0-9_:]{1,6}$/);

const transitionsArb = fc.dictionary(
  nameArb,
  fc.dictionary(nameArb, nameArb, { maxKeys: 4 }),
  { maxKeys: 6 }
);

test('property: buildTransitionGraph never produces duplicate node ids', () => {
  fc.assert(
    fc.property(transitionsArb, (transitions) => {
      const { nodes } = buildTransitionGraph(transitions);
      assert.equal(new Set(nodes).size, nodes.length);
    })
  );
});

test('property: every edge endpoint in buildTransitionGraph is a known node', () => {
  fc.assert(
    fc.property(transitionsArb, (transitions) => {
      const { nodes, edges } = buildTransitionGraph(transitions);
      const nodeSet = new Set(nodes);
      for (const edge of edges) {
        assert.ok(nodeSet.has(edge.from), `from "${edge.from}" should be a known node`);
        assert.ok(nodeSet.has(edge.to), `to "${edge.to}" should be a known node`);
      }
    })
  );
});

test('property: buildTransitionGraph produces exactly one edge per state -> event entry', () => {
  fc.assert(
    fc.property(transitionsArb, (transitions) => {
      const expectedEdgeCount = Object.values(transitions).reduce(
        (total, events) => total + Object.keys(events).length,
        0
      );
      const { edges } = buildTransitionGraph(transitions);
      assert.equal(edges.length, expectedEdgeCount);
    })
  );
});

test('property: edgeIdFor is injective — equal ids imply equal (from, event, to) triples', () => {
  const tripleArb = fc.tuple(nameArb, nameArb, nameArb);
  fc.assert(
    fc.property(tripleArb, tripleArb, (a, b) => {
      const sameId = edgeIdFor(...a) === edgeIdFor(...b);
      const sameTriple = a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
      assert.equal(sameId, sameTriple);
    })
  );
});

test('property: layoutGraph never overlaps two node circles, for any node count', () => {
  fc.assert(
    fc.property(fc.uniqueArray(nameArb, { minLength: 2, maxLength: 40 }), (nodes) => {
      const nodeRadius = 28;
      const { positions } = layoutGraph(nodes, { nodeRadius });
      const points = [...positions.values()];
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dist = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
          assert.ok(
            dist >= nodeRadius * 2 - 1e-9,
            `nodes ${i} and ${j} overlap: distance ${dist} < diameter ${nodeRadius * 2}`
          );
        }
      }
    })
  );
});

test('property: findActiveEdges results always satisfy from/to matching the live entry', () => {
  fc.assert(
    fc.property(transitionsArb, fc.option(nameArb), fc.option(nameArb), fc.option(nameArb), (transitions, from, state, event) => {
      const { edges } = buildTransitionGraph(transitions);
      const matches = findActiveEdges(edges, { from, state, event });
      for (const edge of matches) {
        assert.equal(edge.from, String(from));
        assert.equal(edge.to, String(state));
      }
    })
  );
});
