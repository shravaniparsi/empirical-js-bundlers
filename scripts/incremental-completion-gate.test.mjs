#!/usr/bin/env node
import assert from 'node:assert/strict';
import { IncrementalCompletionGate, incrementalCompletionPatterns } from './incremental-completion-gate.mjs';

const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

// A success emitted before the edit is stale and cannot close a later probe.
let markerVisible = false;
let clock = 1_000_000_000n;
const gate = new IncrementalCompletionGate({ ...incrementalCompletionPatterns.webpack, clock: () => (clock += 1_000_000n) });
gate.ingest('webpack compiled successfully\n');
const probe = gate.arm({ marker: 'edit-1', markerPresent: async () => markerVisible, timeoutMs: 1000 });
let settled = false;
probe.promise.finally(() => { settled = true; });
await pause(10);
assert.equal(settled, false);

// A post-edit success for output without the marker is recorded but ignored.
gate.ingest('webpack compiled successfully\n');
await pause(10);
assert.equal(settled, false);
markerVisible = true;
gate.ingest('webpack compiled successfully\n');
const accepted = await probe.promise;
assert.equal(accepted.marker, 'edit-1');
assert.equal(accepted.unmatchedSuccesses, 1);
assert.ok(accepted.durationMs > 0);

// Chunk boundaries cannot manufacture or lose a completion line.
const chunked = new IncrementalCompletionGate({ ...incrementalCompletionPatterns.vite });
const chunkedProbe = chunked.arm({ marker: 'edit-2', markerPresent: async () => true, timeoutMs: 1000 });
chunked.ingest('bu');
chunked.ingest('ilt in 25ms\n');
assert.equal((await chunkedProbe.promise).completionLine, 'built in 25ms');

// Successful compilations with warnings are terminal; warnings are retained as
// evidence but must not be mistaken for a timeout or an error.
const warned = new IncrementalCompletionGate({ ...incrementalCompletionPatterns.webpack });
const warnedProbe = warned.arm({ marker: 'edit-warning', markerPresent: async () => true, timeoutMs: 1000 });
warned.ingest('webpack 5.111.1 compiled with 1 warning in 48580 ms\n');
assert.match((await warnedProbe.promise).completionLine, /1 warning/);

// A failed build rejects immediately even if an older output contains a marker.
const failed = new IncrementalCompletionGate({ ...incrementalCompletionPatterns.rspack });
const failedProbe = failed.arm({ marker: 'edit-3', markerPresent: async () => true, timeoutMs: 1000 });
failed.ingest('Rspack compiled with 2 errors\n');
await assert.rejects(failedProbe.promise, /build failure after edit/);

// A marker-check error and a timeout both fail closed.
const markerError = new IncrementalCompletionGate({ ...incrementalCompletionPatterns.rollup });
const markerErrorProbe = markerError.arm({ marker: 'edit-4', markerPresent: async () => { throw new Error('output unreadable'); }, timeoutMs: 1000 });
markerError.ingest('created dist in 12ms\n');
await assert.rejects(markerErrorProbe.promise, /output unreadable/);

const timedOut = new IncrementalCompletionGate({ ...incrementalCompletionPatterns.esbuild });
const timedOutProbe = timedOut.arm({ marker: 'edit-5', markerPresent: async () => false, timeoutMs: 20 });
timedOut.ingest('build finished (0 errors)\n');
await assert.rejects(timedOutProbe.promise, /completion timeout.*unmatched successes=1/);

console.log('incremental completion gate negative controls passed');
