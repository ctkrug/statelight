---
title: "Statelight: a live debug panel for the state machines you wrote by hand"
published: false
tags: javascript, webdev, debugging, opensource
---

Most of the state machines I write never touch a library. There is a `state`
field on some object, a `switch` that decides what happens next, and that is
the whole design. It works right up until a bug lives three transitions deep,
and then I am adding `console.log(this.state)` in six places trying to figure
out how I got somewhere I did not expect to be.

Statelight is the tool I wanted for that moment. You give it the object, it
shows the current state in a floating panel, and if you hand it a transition
map it draws the graph and lights up each edge as the machine moves through it.
No library to adopt, no build step, one script tag.

Here is the whole integration:

```js
import { attach } from 'https://cdn.jsdelivr.net/npm/statelight/dist/statelight.js';

const machine = { state: 'idle' };

attach(machine, {
  transitions: {
    idle: { start: 'running' },
    running: { stop: 'idle' }
  }
});

machine.state = 'running'; // panel updates, idle -> running lights up
```

## Watching a property without asking you to change your code

The constraint I set was that your code should not change. You keep writing
`machine.state = 'running'`, and Statelight sees it. That rules out an
event-emitter API or a `setState()` method, because both of those make you
rewrite your call sites.

The answer is `Object.defineProperty`. Statelight swaps the watched property
for a transparent getter/setter: the getter returns the current value, the
setter records the transition and then stores it. Reads and writes behave
exactly as before. `detach()` puts a plain writable property back.

That design has one sharp edge I had to guard: if you `watch()` the same
property twice without detaching, the second call would install a setter that
closes over its own `current` variable, and the first watcher's `unwatch()`
would later revert the property to *its* stale value and quietly destroy the
second watcher. So a second watch on the same object/key now throws instead of
silently corrupting state. It is tracked with a `WeakMap<object, Set<key>>` so
it never leaks the target.

## The bug that broke the whole point of the tool

The feature Statelight exists for is the live highlight, and for a while it was
broken for a specific and common case: numeric states.

The transition graph is built from your map with `Object.entries`. What I had
missed is that `Object.entries` stringifies object *keys* but leaves the
*values* untouched. So in `{ 0: { advance: 1 } }`, the node built from the key
`'0'` is the string `"0"`, but the node built from the target value `1` is the
number `1`. They looked identical on screen and were two different nodes
internally, so when the live watcher reported a transition into `1`, nothing
matched and nothing lit up.

The fix is boring and correct: normalize every node id and every live state
value through `String()` at the boundaries, in exactly two places. The lesson I
keep relearning is that "it renders fine" is not the same as "the identifiers
match."

## Laying out the graph without a physics engine

I did not want a force-directed layout for what is usually a handful of states,
so nodes go on a circle. The only real question is how big the circle has to be
so the node circles never overlap. The chord between two adjacent nodes is
`2 * r * sin(pi / n)`, so I solve for the radius that keeps that chord at least
one node diameter, plus a small margin so an edge and its arrowhead have room.
No overlap detection, no packing pass, correct for any node count.

## What I would do differently

The watcher only knows a single event label for the whole machine, not which
per-edge event fired, so when two edges share the same from/to pair it lights
both. Threading the specific event through the setter would fix it, but it
would also push more bookkeeping onto the consumer, and I would rather keep the
"assign to a property" contract clean.

The code is MIT licensed and about 3kb. Live demo and source:

- Demo: https://apps.charliekrug.com/statelight
- Repo: https://github.com/ctkrug/statelight

If you hand-roll state machines, I would love to hear where this helps and
where it falls over.
