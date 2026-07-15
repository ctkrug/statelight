import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTransitionGraph, edgeIdFor, findActiveEdges, layoutGraph } from '../src/graph.js';

test('buildTransitionGraph extracts one node per referenced state', () => {
  const { nodes } = buildTransitionGraph({
    red: { advance: 'green' },
    green: { advance: 'yellow' },
    yellow: { advance: 'red' }
  });

  assert.deepEqual(nodes, ['red', 'green', 'yellow']);
});

test('buildTransitionGraph adds a node for a target state that never appears as a key', () => {
  const { nodes } = buildTransitionGraph({ idle: { start: 'running' } });

  assert.deepEqual(nodes, ['idle', 'running']);
});

test('buildTransitionGraph produces one edge per state -> event -> nextState entry', () => {
  const { edges } = buildTransitionGraph({
    idle: { start: 'running', reset: 'idle' },
    running: { finish: 'idle' }
  });

  assert.deepEqual(edges, [
    { id: edgeIdFor('idle', 'start', 'running'), from: 'idle', to: 'running', event: 'start' },
    { id: edgeIdFor('idle', 'reset', 'idle'), from: 'idle', to: 'idle', event: 'reset' },
    { id: edgeIdFor('running', 'finish', 'idle'), from: 'running', to: 'idle', event: 'finish' }
  ]);
});

test('buildTransitionGraph returns an empty graph for an empty map', () => {
  assert.deepEqual(buildTransitionGraph({}), { nodes: [], edges: [] });
});

test('buildTransitionGraph defaults to an empty map when called with no argument', () => {
  assert.deepEqual(buildTransitionGraph(), { nodes: [], edges: [] });
});

test('buildTransitionGraph keeps a self-loop as a single edge', () => {
  const { nodes, edges } = buildTransitionGraph({ stuck: { retry: 'stuck' } });

  assert.deepEqual(nodes, ['stuck']);
  assert.equal(edges.length, 1);
  assert.equal(edges[0].from, 'stuck');
  assert.equal(edges[0].to, 'stuck');
});

test('edgeIdFor produces a stable, distinct id per from/event/to combination', () => {
  assert.equal(edgeIdFor('a', 'go', 'b'), 'a::go::b');
  assert.notEqual(edgeIdFor('a', 'go', 'b'), edgeIdFor('a', 'go', 'c'));
});

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

for (const count of [2, 3, 5, 8, 12]) {
  test(`layoutGraph places ${count} nodes with no overlapping circles`, () => {
    const nodes = Array.from({ length: count }, (_, i) => `s${i}`);
    const nodeRadius = 28;
    const { positions, width, height } = layoutGraph(nodes, { nodeRadius });

    assert.equal(positions.size, count);

    const points = nodes.map((id) => positions.get(id));
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        assert.ok(
          distance(points[i], points[j]) >= nodeRadius * 2 - 1e-9,
          `nodes ${i} and ${j} overlap`
        );
      }
      // every node stays within the reported bounds
      assert.ok(points[i].x - nodeRadius >= 0 && points[i].x + nodeRadius <= width);
      assert.ok(points[i].y - nodeRadius >= 0 && points[i].y + nodeRadius <= height);
    }
  });
}

test('layoutGraph handles zero nodes without producing NaN bounds', () => {
  const { positions, width, height } = layoutGraph([]);
  assert.equal(positions.size, 0);
  assert.ok(Number.isFinite(width));
  assert.ok(Number.isFinite(height));
});

test('layoutGraph centers a single node within its bounds', () => {
  const { positions, width, height } = layoutGraph(['only']);
  assert.deepEqual(positions.get('only'), { x: width / 2, y: height / 2 });
});

test('findActiveEdges matches by from/to when no event is on the transition', () => {
  const { edges } = buildTransitionGraph({ idle: { start: 'running' } });

  const matched = findActiveEdges(edges, { from: 'idle', state: 'running', event: null });

  assert.equal(matched.length, 1);
  assert.equal(matched[0].id, edgeIdFor('idle', 'start', 'running'));
});

test('findActiveEdges prefers the exact event match when the pair is ambiguous', () => {
  const { edges } = buildTransitionGraph({
    idle: { start: 'running', reset: 'running' }
  });

  const matched = findActiveEdges(edges, { from: 'idle', state: 'running', event: 'reset' });

  assert.equal(matched.length, 1);
  assert.equal(matched[0].event, 'reset');
});

test('findActiveEdges returns every matching edge when a matching event cannot disambiguate', () => {
  const { edges } = buildTransitionGraph({
    idle: { start: 'running', reset: 'running' }
  });

  const matched = findActiveEdges(edges, { from: 'idle', state: 'running', event: null });

  assert.equal(matched.length, 2);
});

test('findActiveEdges returns an empty list for the initial entry (no from state)', () => {
  const { edges } = buildTransitionGraph({ idle: { start: 'running' } });

  assert.deepEqual(findActiveEdges(edges, { from: null, state: 'idle', event: null }), []);
});

test('findActiveEdges returns an empty list when nothing matches', () => {
  const { edges } = buildTransitionGraph({ idle: { start: 'running' } });

  assert.deepEqual(findActiveEdges(edges, { from: 'running', state: 'done', event: null }), []);
});
