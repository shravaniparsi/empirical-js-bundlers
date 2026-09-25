# Expanded application selection — recorded before candidate builds

The target population for this stage is independently maintained, open-source React client applications. SSR frameworks, backend performance and non-React frameworks are outside this deliberately narrower comparison. Neither star count nor benchmark speed is an inclusion criterion. This is purposive diversity sampling, not a systematic or representative sample of all web applications.

Include applications with an inspectable upstream revision and license, a complete dependency graph, meaningful browser interactions, and a client that can be exercised locally without personal accounts or production services. Preserve upstream source and lockfiles; record all build adapters and any functional scope restrictions. Use the same source and application dependency resolution for every tool within an application. Any failure to port remains in the screening record and must not disappear because its performance is inconvenient.

Candidates screened in this stage:

- Memos (`usememos/memos`): independently maintained note-taking application; adds Markdown, routing and service-client code to the workload mix. Investigate a locally controlled API/backend and acceptance covering read/create/edit behavior.
- Excalidraw (`excalidraw/excalidraw`): independently maintained interactive whiteboard; adds canvas rendering, editing state and a larger application/package graph. Investigate deterministic local drawing/edit/export acceptance without collaboration services.
- React Shopping Cart (`jeffersonRibeiro/react-shopping-cart`): screened as a small reference/demo application. It is not a replacement for production-application diversity and will not be promoted merely because it is easier to port.

The existing adapted Bulletproof React fixture remains a reference/starter workload, with that limitation stated explicitly. Do not describe a set composed only of starter/demo projects as broad production replication.

Promotion gates: pinned revision and source/license receipt; source/module/dependency inventory; documented transformations shared across tools; reproducible exact tool-specific locks with equal application dependencies; all five build and output-contract gates; meaningful offline/local-service browser acceptance. Build feasibility and correctness checks are not performance measurements and do not augment the publication-authoritative corpus.
