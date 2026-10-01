/**
 * Candidate M3 completion gate. This module contains no workload or timing
 * results. A measurement closes only when a success event observed after the
 * edit is paired with output that contains that edit's unique marker.
 */
export class IncrementalCompletionGate {
  #buffer = '';
  #pending = null;
  #successPattern;
  #failurePattern;
  #clock;

  constructor({ successPattern, failurePattern, clock = () => process.hrtime.bigint() }) {
    if (!(successPattern instanceof RegExp) || !(failurePattern instanceof RegExp)) throw new Error('completion patterns must be RegExp instances');
    this.#successPattern = successPattern;
    this.#failurePattern = failurePattern;
    this.#clock = clock;
  }

  arm({ marker, markerPresent, timeoutMs }) {
    if (this.#pending) throw new Error('a completion probe is already armed');
    if (!marker || typeof markerPresent !== 'function' || !Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('invalid completion probe');
    const startedNs = this.#clock();
    let resolveProbe;
    let rejectProbe;
    const promise = new Promise((resolve, reject) => { resolveProbe = resolve; rejectProbe = reject; });
    const timeout = setTimeout(() => {
      const pending = this.#pending;
      if (!pending) return;
      this.#pending = null;
      rejectProbe(new Error(`completion timeout for marker ${marker}; unmatched successes=${pending.unmatchedSuccesses}`));
    }, timeoutMs);
    this.#pending = { marker, markerPresent, startedNs, resolveProbe, rejectProbe, timeout, unmatchedSuccesses: 0, checking: false };
    return { startedNs, promise };
  }

  ingest(chunk) {
    this.#buffer += String(chunk).replaceAll('\r', '\n');
    const lines = this.#buffer.split('\n');
    this.#buffer = lines.pop() ?? '';
    for (const line of lines) this.#consumeLine(line);
  }

  flush() {
    if (this.#buffer) this.#consumeLine(this.#buffer);
    this.#buffer = '';
  }

  cancel(reason = 'completion probe cancelled') {
    const pending = this.#pending;
    if (!pending) return;
    this.#pending = null;
    clearTimeout(pending.timeout);
    pending.rejectProbe(new Error(reason));
  }

  #consumeLine(line) {
    const pending = this.#pending;
    if (!pending) return;
    this.#failurePattern.lastIndex = 0;
    if (this.#failurePattern.test(line)) {
      this.#pending = null;
      clearTimeout(pending.timeout);
      pending.rejectProbe(new Error(`build failure after edit: ${line.trim()}`));
      return;
    }
    this.#successPattern.lastIndex = 0;
    if (!this.#successPattern.test(line) || pending.checking) return;
    pending.checking = true;
    Promise.resolve(pending.markerPresent(pending.marker)).then(present => {
      if (this.#pending !== pending) return;
      pending.checking = false;
      if (!present) {
        pending.unmatchedSuccesses += 1;
        return;
      }
      this.#pending = null;
      clearTimeout(pending.timeout);
      const completedNs = this.#clock();
      pending.resolveProbe({
        marker: pending.marker,
        startedNs: pending.startedNs.toString(),
        completedNs: completedNs.toString(),
        durationMs: Number(completedNs - pending.startedNs) / 1e6,
        unmatchedSuccesses: pending.unmatchedSuccesses,
        completionLine: line.trim()
      });
    }, error => {
      if (this.#pending !== pending) return;
      this.#pending = null;
      clearTimeout(pending.timeout);
      pending.rejectProbe(error);
    });
  }
}

export const incrementalCompletionPatterns = Object.freeze({
  vite: { successPattern: /built in/i, failurePattern: /error during build|build failed/i },
  rspack: { successPattern: /compiled successfully/i, failurePattern: /compiled with \d+ error|failed to compile/i },
  webpack: { successPattern: /compiled successfully/i, failurePattern: /compiled with \d+ error|failed to compile/i },
  esbuild: { successPattern: /build finished \(0 errors\)/i, failurePattern: /build finished \([1-9]\d* errors?\)|build failed/i },
  rollup: { successPattern: /created .+ in /i, failurePattern: /rollup error|\[!\] error/i }
});
