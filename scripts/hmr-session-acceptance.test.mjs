#!/usr/bin/env node
import assert from 'node:assert/strict';
import { acceptHmrUpdate, acceptReloadDetector } from './hmr-session-acceptance.mjs';

const valid = {
  markerObserved: true,
  documentPreserved: true,
  statePreserved: true,
  navigations: 0,
  settled: true,
  browserErrors: 0,
  durationMs: 12.5,
};
assert.equal(acceptHmrUpdate(valid), true);
const rejects = [
  ['marker', { markerObserved: false }, /marker was not observed/],
  ['reload', { documentPreserved: false }, /full-page reload/],
  ['state', { statePreserved: false }, /state loss/],
  ['navigation', { navigations: 1 }, /navigation count/],
  ['settle', { settled: false }, /settle check/],
  ['browser error', { browserErrors: 1 }, /browser emitted/],
  ['duration', { durationMs: -1 }, /invalid update duration/],
];
for (const [name, change, pattern] of rejects) {
  assert.throws(() => acceptHmrUpdate({ ...valid, ...change }), pattern, name);
}
assert.equal(acceptReloadDetector({ navigationObserved: true, documentReplaced: true }), true);
assert.throws(() => acceptReloadDetector({ navigationObserved: false, documentReplaced: true }), /positive control/);
assert.throws(() => acceptReloadDetector({ navigationObserved: true, documentReplaced: false }), /positive control/);
console.log('M4 acceptance negative controls passed');
