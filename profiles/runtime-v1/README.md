# Runtime policy v1

The confirmatory study runtime is frozen at Node.js `24.14.0`. This exact patch version already passed the complete Memos and Excalidraw five-tool correctness suites. The Node.js Release Working Group lists Node 24 (Krypton) as Active LTS on the decision date, entering maintenance on 2026-10-20 and reaching end of life on 2028-04-30.

The runtime choice does not make earlier Node 22 checks transferable. The common-runtime workflow therefore repeats every accepted production-v1 synthetic cell, all five Bulletproof React production cells, and all six development-v1 synthetic HMR cells on Node 24.14.0. The existing Memos and Excalidraw evidence already records this exact runtime.

These runs establish correctness and comparability prerequisites only. They collect no performance timings and remain `publicationEligible: false`. Any later runtime change requires a new versioned policy and a complete correctness revalidation before publication-eligible measurements continue.

The authoritative lifecycle source is the [Node.js Release Working Group schedule](https://github.com/nodejs/Release).
