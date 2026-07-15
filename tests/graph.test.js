import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTransitionGraph, edgeIdFor } from '../src/graph.js';

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
