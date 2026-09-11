# Research Plan: Empirical Evaluation of Rust-Based JavaScript Bundlers

> **Working Title:** "An Empirical Evaluation of Rust-Based JavaScript Bundlers: Performance, Bundle Quality, and Resource Consumption Across Project Scales"
>
> **Short Title (≤70 chars):** Empirical Evaluation of Rust-Based JavaScript Bundlers
>
> **Author:** Independent Researcher
>
> **Target Venue (Primary):** Software: Practice and Experience (Wiley, Q2, IF ~3.1)
>
> **Target Venue (Backup):** Journal of Systems and Software (Elsevier, Q1, IF ~3.5)
>
> **Started:** September 11, 2026

---

## Status Tracker

| Phase | Description | Status | Completed |
|-------|------------|--------|-----------|
| **Phase 0** | Pre-Research Validation | ✅ DONE | Sep 11, 2026 |
| **Phase 1** | Research Design | ✅ DONE | Sep 11, 2026 |
| **Phase 2** | Implementation (projects, configs, harness) | ✅ DONE | Sep 11, 2026 |
| **Phase 3** | Data Collection & Analysis | 🔲 NOT STARTED | — |
| **Phase 4** | Paper Writing | 🔲 NOT STARTED | — |
| **Phase 5** | Submission & Response | 🔲 NOT STARTED | — |

---

## Phase 0: Pre-Research Validation ✅

### 0.1 Gap Confirmation

**Result: GAP CONFIRMED — Zero peer-reviewed papers exist.**

| Database | Searched For | Result |
|----------|-------------|--------|
| Google Scholar | "Vite" OR "Rspack" OR "Turbopack" OR "esbuild" empirical comparison bundler | 0 peer-reviewed papers |
| DBLP | JavaScript bundler / build tool empirical comparison | 0 papers (only Java Maven/Gradle) |
| ACM Digital Library | JavaScript bundler webpack Vite performance comparison | 0 papers (closest: Lazifier, Jack-in-the-box) |
| IEEE Xplore | JavaScript bundler comparison study | 0 papers (only JS framework comparisons: React/Angular/Vue) |
| Semantic Scholar | JavaScript build tool / module bundler empirical comparison | 0 papers |
| arXiv | JavaScript build tool benchmark | 0 papers (found AI-generated build code for Maven/Gradle only) |

### 0.2 Only Prior Academic Work

**Nguyen, T.A. (2024). "A comparative analysis of Webpack and Vite as build tools for JavaScript." Haaga-Helia UAS, Bachelor's Thesis, 32 pages.**

| Weakness | Our Improvement |
|----------|----------------|
| Only 2 tools (Webpack + Vite) | 5 tools including Rust-based (Rspack, esbuild) |
| No statistical rigor (single runs) | 10+ runs per config, Kruskal-Wallis + Dunn's post-hoc, Cliff's delta |
| Only 1 project scale | 3 scales: Small (50), Medium (500), Large (5000+ modules) |
| No scaling analysis | Regression curves: build_time ~ f(module_count) |
| No resource metrics | Peak RSS, CPU time, disk I/O |
| No replication package | GitHub + Zenodo DOI |
| Outdated (pre-Rolldown Vite) | Vite 8 with Rolldown engine (2026) |
| Bachelor's thesis, not journal | Target: SPE (Q2) or JSS (Q1) |

### 0.3 Reference Papers (Structural Models)

#### Must-Cite (Core — 5 papers)

1. **Nguyen (2024)** — Webpack vs Vite thesis. Only prior work; we extend substantially.
2. **Kalibera & Jones (2013)** — "Rigorous Benchmarking in Reasonable Time." ISMM. Cost/variance model, effect-size confidence intervals.
3. **Georges, Buytaert & Eeckhout (2007)** — "Statistically Rigorous Java Performance Evaluation." OOPSLA. Multi-invocation methodology, startup vs steady-state.
4. **Mohan & Goswami (2025)** — "Node.js vs Java Spring Boot." SPE. DOI:10.1002/spe.3418. **Best structural model** — same venue, same design pattern. 25 pages.
5. **Henning & Hasselbring (2024)** — "Benchmarking Scalability of Stream Processing Frameworks." JSS. DOI:10.1016/j.jss.2023.111879. 740+ hours experiments. **Methodology gold standard.**

#### Should-Cite (Context — 5 papers)

6. **Staicu et al. (2023)** — "Jack-in-the-box: JS Bundling Security." CCS. First empirical study of JS bundling — 40% of websites use bundlers.
7. **Barrett et al. (2017)** — "VM Warmup Blows Hot and Cold." OOPSLA. 43.5% of VM+benchmark pairs don't reach steady state.
8. **Vitek et al. (2024)** — "The Fault in Our Stars." ECOOP. Reproducible experiment design, sampling frame oracles.
9. **Lighthouse Measurements Study (2023)** — 5 consecutive runs + median reduces variability. Directly applicable.
10. **Nejati et al. (2024)** — "Understanding Changes to Build Systems." ASE. Build systems are understudied in SE research.

#### Nice-to-Cite (Broader — 5 papers)

11. **BDUpdater (2026)** — Breaking dependency updates in JS. FSE 2026.
12. **AI-Generated Build Code (2026)** — Maven/Gradle/CMake quality study. MSR 2026.
13. **Polito Torino thesis (2025)** — JS framework CPU benchmarks with Puppeteer + CDP.
14. **PUC Minas VDOM Study (2024)** — React/Vue/Svelte rendering with Lighthouse.
15. **McIntosh et al. (2015)** — Build technology and maintenance. EMSE.

#### Additional Supporting (5 papers)

16. **Šimek (2025)** — "Register vs Stack VMs: JIT." SPE. Validates SPE accepts pure benchmark papers.
17. **Pulido et al. (2026)** — "Energy Efficiency: C, Python, Java." SPE. Recent SPE comparison paper.
18. **ResilienceBench (2024)** — "Declarative Benchmark for Microservice Patterns." SPE. DOI:10.1002/spe.3368.
19. **ConflictBench (2024)** — "Benchmark for Software Merge Tools." JSS preprint. 3 novel metrics.
20. **Jain (1991)** — "The Art of Computer Systems Performance Analysis." Classic benchmarking reference.

### 0.4 Venue Specifications

#### Software: Practice and Experience (SPE) — Primary

| Attribute | Detail |
|-----------|--------|
| Publisher | Wiley |
| Quartile | Q2 (Scopus), Web of Science, DBLP, ACM Guide |
| Impact Factor | ~3.1 (2025) |
| Scope | "Practice and experience with software itself" |
| Paper types | Research Article, Experience Report, Short Communication |
| Page limit | 40 pages (regular), 10 pages (short) |
| Abstract limit | 250 words |
| Short title limit | 70 characters |
| Format | 12pt, single-spaced, Times/Helvetica/Courier |
| Submission system | ScholarOne: mc.manuscriptcentral.com/spe |
| Typical review time | 3–5 months |
| Key guideline | "If no references to SPE/JSS, manuscript likely not suited" |

#### Journal of Systems and Software (JSS) — Backup

| Attribute | Detail |
|-----------|--------|
| Publisher | Elsevier |
| Quartile | Q1 (Scopus) |
| Impact Factor | ~3.5 (2025) |
| Scope | Methods and tools for software development |
| Page limit | No strict limit (typically 20–35 pages) |
| Advantage | Higher quartile; Theodolite paper published here |

### 0.5 Non-Academic Benchmark Data (Sanity Check Reference)

| Source | Tools | Key Data |
|--------|-------|----------|
| rspack-contrib/build-tools-performance | Rspack 2.1, Vite 8.1, Webpack 5.108, Farm, Parcel, esbuild | Rspack: 1097ms cold dev; Vite: 6428ms; Webpack: 5247ms. Vite fastest prod (567ms) |
| rolldown/benchmarks | Rolldown, esbuild, Vite, Rspack, Rollup | 19K modules: Rolldown 1483ms, esbuild 1441ms, Rollup 54,226ms |
| TECHSY blog (2026) | Turbopack, Webpack, Vite | Cal.com: Turbopack 152s vs Webpack 187s. Bundle: Turbopack +117% larger |
| DevToolReviews (2026) | Webpack, Vite, Rspack, Turbopack | HMR: Turbopack 8ms, Vite 12ms, Rspack 25ms, Webpack 420ms |

### 0.6 Reflexion Gate — PASSED ✅

**Gap Statement:**
> There is no peer-reviewed academic paper comparing modern JavaScript build tools. The only academic work is a Bachelor's thesis (Nguyen 2024) limited to 2 tools, 1 project scale, and no statistical analysis. Our study will be the first rigorous empirical comparison, covering 5 tools, 3 project scales, 10+ metrics, proper statistical methods (Kruskal-Wallis, Cliff's delta), and a full replication package. The study is directly aligned with the scope of SPE ("practice and experience with software") and follows methodology established by Kalibera-Jones (2013) and Georges et al. (2007).

---

## Phase 1: Research Design ✅ COMPLETE

### 1.1 Research Questions ✅

**RQ1: How do modern JavaScript bundlers compare in build performance across different project scales?**

| Sub-RQ | Question | Metric |
|--------|----------|--------|
| RQ1.1 | What is the cold development server startup time? | Dev cold start (ms) |
| RQ1.2 | What is the production build time? | Prod build time (ms) |
| RQ1.3 | How fast is incremental rebuilding after a single file change? | Incremental rebuild (ms) |
| RQ1.4 | What is the hot module replacement latency? | HMR latency (ms) |

> Motivation: Build speed directly impacts developer productivity — the #1 reason teams migrate bundlers, yet no rigorous comparison exists.

**RQ2: How does bundler choice affect output quality and delivery efficiency?**

| Sub-RQ | Question | Metric |
|--------|----------|--------|
| RQ2.1 | What is the production bundle size? | Raw size (bytes) + gzipped (bytes) |
| RQ2.2 | How effective is tree-shaking at eliminating dead code? | % unused code removed |
| RQ2.3 | How granular is code splitting? | Number of output chunks |
| RQ2.4 | Are generated sourcemaps accurate? | Sourcemap validation pass rate (%) |

> Motivation: A fast bundler producing bloated output is a false economy. Bundle size and splitting quality directly affect end-user load times.

**RQ3: How do resource consumption and scaling behavior differ across bundlers?**

| Sub-RQ | Question | Metric |
|--------|----------|--------|
| RQ3.1 | What is the peak memory consumption? | Peak RSS (MB) |
| RQ3.2 | What is the CPU time consumed? | User + System CPU time (s) |
| RQ3.3 | How does build time scale as project size increases? | Regression: build_time = f(module_count) |

> Motivation: Resource usage determines viability in CI/CD (memory limits), developer laptops (8-32GB), and monorepos. Scaling predicts future pain.

### 1.2 Tool Selection (Independent Variable) ✅

We select 5 tools spanning 3 architectural categories, ensuring a balanced comparison across implementation languages and bundling paradigms.

#### Selection Criteria
1. **Open source** and installable via npm
2. **Standalone** — usable outside a specific framework (excludes Turbopack)
3. **Production-ready** — stable release with production build support
4. **Significant adoption** — npm weekly downloads ≥100K or backed by major organization
5. **Distinct architecture** — each tool represents a different technical approach

#### Selected Tools

| Tool | Version Policy | Language | Architecture | Rationale |
|------|---------------|----------|-------------|-----------|
| **Vite 8.x** (Rolldown) | Pin latest stable at experiment start | Rust (Rolldown) + JS | Unbundled dev (native ESM) + Rust-compiled prod | Market leader (~16M npm weekly downloads). Represents the "new default" for greenfield projects. Vite 8 replaced both esbuild (dev) and Rollup (prod) with Rolldown — a fundamental architectural shift worth studying. |
| **Rspack 2.x** | Pin latest stable | Rust | Fully bundled (webpack-compatible API) | ByteDance-backed. Drop-in Webpack replacement strategy. Represents the "migrate existing Webpack projects to Rust" path. Tests whether API compatibility comes at a performance cost. |
| **esbuild 0.28.x** | Pin latest stable | Go | Fully bundled, minimal plugin API | Speed pioneer — first tool to prove 10-100× speedups were possible. Written in Go (not Rust) — provides a cross-language comparison. Limited plugin ecosystem tests the "raw speed vs. extensibility" tradeoff. |
| **Webpack 5.x** (SWC loader) | Pin latest stable | JavaScript + Rust (SWC) | Fully bundled, legacy architecture | Incumbent. Used by ~86% of developers (State of JS 2025) but only ~14% satisfaction. SWC loader gives it the best-case scenario (Rust-accelerated transforms). Acts as the **baseline control**. |
| **Rollup 4.x** | Pin latest stable | JavaScript | Fully bundled, ESM-native | Vite's former production engine. Pure JS implementation. Acts as the **second baseline** — shows the performance floor of a pure-JS bundler without Rust/Go acceleration. |

#### Excluded Tools (with documented rationale)

| Tool | Reason for Exclusion |
|------|---------------------|
| **Turbopack** | No stable standalone production build. Only works as Next.js internal dev-mode bundler. Including it would violate our apples-to-apples methodology (cannot test prod builds). Will be noted as future work. |
| **Parcel 2.x** | Viable tool but overlaps architecturally with Vite (both use unbundled dev). Excluded to keep the study focused at 5 tools. Could be added in a replication study. |
| **Farm** | Relatively new Rust-based tool (~2K GitHub stars). Insufficient adoption to justify inclusion over the 5 selected tools. |
| **Bun bundler** | Runtime-integrated bundler (not standalone npm package). Different execution model makes comparison unfair. |
| **SWC (standalone)** | Primarily a transpiler/compiler, not a full bundler with code-splitting, HMR, etc. |

#### Version Pinning Protocol
- All tool versions locked in `package.json` on **Day 1 of experiments**
- Exact versions recorded in replication package
- Node.js version: latest LTS at experiment start
- npm version: ships with Node.js LTS

### 1.3 Benchmark Data Strategy: Two-Tier Design ✅

> **Key insight from Reflexion analysis:** Existing benchmark repos (rstackjs/build-tools-performance, rolldown/benchmarks, etc.) all use trivially synthetic components (~5 lines of empty JSX). Meanwhile, purely real-world projects cannot be fairly ported to all 5 bundlers due to bundler-specific APIs. Our solution is a **two-tier design** that satisfies both internal validity (controlled comparison) and external validity (real-world generalizability).

| Tier | Purpose | Role in Paper | What |
|------|---------|--------------|------|
| **Tier 1: Calibrated Synthetic** | Internal validity + Scaling | **Primary data** — answers all 3 RQs. Used for statistical analysis, scaling curves, controlled comparison. | 5 project sizes (50, 200, 500, 2000, 5000 modules) generated via deterministic script with **realistic component patterns** |
| **Tier 2: Real-World OSS** | External validity | **Validation data** — confirms synthetic results generalize. Reported in Discussion section. | 2-3 real open-source React apps configured for all 5 tools |

#### Why Not Fork Existing Benchmark Repos?

| Existing Repo | Why We Can't Just Fork It |
|---------------|--------------------------|
| **rstackjs/build-tools-performance** | Components are trivial shells (~5 lines). Maintained by **Rspack team** — reviewers will question neutrality. Only 3 runs, averaged (no statistical rigor). |
| **rolldown/benchmarks** | Maintained by **Rolldown/Vite team** — same bias concern. Limited to module resolution only. |
| **s1owjke/js-bundler-benchmark** | Only tests initial load time. No tree-shaking, no sourcemaps, no memory. |
| **originjs/js-bundler-benchmark** | Outdated tools (Webpack 4 era). Dead project (last commit 2022). |

> **Decision:** We build our own benchmark projects from scratch. However, we borrow proven **measurement techniques** from existing repos (e.g., Puppeteer HMR timing from rstackjs) and cite them as community baselines for sanity-checking our results.

---

#### Tier 1: Calibrated Synthetic Projects (Primary Data)

All Tier 1 projects use **React 19** (most popular frontend framework — controls for framework variable). All use **TypeScript** (industry standard, exercises bundler TS support). Source code is **identical** across all 5 tool configurations — only bundler config files differ.

##### What "Calibrated Synthetic" Means

Existing benchmark repos generate components like this (trivial shell, ~5 lines):
```jsx
// ❌ rstackjs/build-tools-performance — trivially synthetic
export default function Component42() {
  return <div>Component 42</div>;
}
```

Our **calibrated components** mirror real-world development patterns (~50-150 lines):
```tsx
// ✅ Our benchmark — realistic patterns that exercise the bundler
import { useState, useCallback, useMemo } from 'react';
import { pick } from 'lodash-es';
import { formatDate } from '../utils/date';
import type { Product } from '../types';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  onSelect: (id: string) => void;
  isHighlighted?: boolean;
}

export default function ProductCard({ product, onSelect, isHighlighted }: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const summary = useMemo(
    () => pick(product, ['name', 'price', 'category']),
    [product]
  );

  const handleClick = useCallback(() => {
    onSelect(product.id);
    setIsExpanded(prev => !prev);
  }, [product.id, onSelect]);

  return (
    <div className={isHighlighted ? styles.highlighted : styles.card} onClick={handleClick}>
      <h3 className={styles.title}>{summary.name}</h3>
      <span className={styles.price}>${summary.price}</span>
      <span className={styles.date}>{formatDate(product.createdAt)}</span>
      {isExpanded && (
        <div className={styles.details}>
          <p>{product.description}</p>
          <span className={styles.category}>{summary.category}</span>
        </div>
      )}
    </div>
  );
}
```

##### Why Calibration Matters for Each Metric

| Component Feature | What It Exercises | Metric Affected |
|-------------------|-------------------|-----------------|
| React hooks (`useState`, `useCallback`, `useMemo`) | JSX transform, minification, scope analysis | M1, M2 (build time) |
| Named imports from `lodash-es` (`pick`, `debounce`) | Tree-shaking algorithm | M7 (tree-shaking effectiveness) |
| CSS Modules (`.module.css` per component) | CSS pipeline, PostCSS, module resolution | M2, M5 (bundle size) |
| TypeScript interfaces + generics | TS transpilation pipeline | M1, M2, M11 (CPU time) |
| Conditional rendering (`{isExpanded && ...}`) | AST complexity, dead-code analysis | M5, M6 (bundle size) |
| Inter-component imports (2-3 siblings) | Dependency graph traversal, chunking | M8 (code splitting) |
| `React.lazy()` route imports (Medium+) | Dynamic import handling, chunk boundaries | M8 (code splitting) |
| 50-150 lines per component (vs 5-line stubs) | Realistic file I/O load, parse time | M1, M2, M10 (peak memory) |
| Event handlers + callbacks | Scope hoisting, function inlining | M5, M6 (bundle size) |

##### Component Generation Template Categories

The generation script (`generate-project.ts`) produces components from **8 template categories** to ensure variety:

| Category | % of Components | Key Features |
|----------|----------------|-------------|
| **Data Display** (cards, lists, tables) | 25% | `useMemo`, mapped arrays, conditional styles |
| **Form Controls** (inputs, selects, checkboxes) | 15% | `useState`, `useCallback`, controlled inputs, `zod` validation |
| **Layout** (containers, grids, sidebars) | 15% | Children props, responsive CSS, clsx |
| **Navigation** (tabs, breadcrumbs, menus) | 10% | `react-router-dom`, `useNavigate`, lazy imports |
| **Feedback** (modals, toasts, alerts) | 10% | `createPortal`, `useEffect` cleanup, transitions |
| **Data Fetching** (loaders, error boundaries) | 10% | `useEffect`, async patterns, Suspense boundaries |
| **Charts/Viz** (wrappers for recharts) | 10% | Heavy third-party deps, `useMemo` for data transforms |
| **Utility** (HOCs, context providers, hooks) | 5% | Re-exports, generics, composition patterns |

##### Project Size Specifications

| Size | Name | Modules | Routes | Third-Party Deps | CSS Files | Total Source Files | Represents |
|------|------|---------|--------|------------------|-----------|--------------------|-----------|
| **XS** | TaskBoard-50 | 50 | 1 (no routing) | `lodash-es`, `date-fns`, `clsx` | 50 | ~70 | Startup prototype |
| **S** | TaskBoard-200 | 200 | 4 (lazy-loaded) | + `react-router-dom` | 200 | ~280 | Small production app |
| **M** | ShopDash-500 | 500 | 12 (lazy-loaded) | + `zustand`, `recharts`, `react-hook-form`, `zod` | 500 | ~700 | Typical mid-size SPA |
| **L** | ShopDash-2000 | 2,000 | 20 (lazy-loaded) | + `@tanstack/react-query`, `immer` | 2,000 | ~3,000 | Large application |
| **XL** | MegaRepo-5000 | 5,000 | 50 (lazy-loaded) | Same as L | 5,000 | ~7,500 | Enterprise monorepo |

> **Note:** XS, S, L are new intermediate sizes added for RQ3 (scaling regression, M12). All 5 sizes share the same generation script with different `--size` parameter.

##### Dependency Graph Design

| Property | Specification | Purpose |
|----------|--------------|---------|
| **Chain depth** | Max 15 import levels deep | Stresses recursive resolution |
| **Fan-out** | Hub components imported by 20+ parents | Tests shared-chunk deduplication |
| **Cross-feature imports** | 10% of imports cross feature folders | Tests chunk boundary decisions |
| **Circular imports** | Zero (prevented by generation script) | Avoids confounding — circulars break some tools |
| **Dead modules** | 5% of generated modules are imported nowhere | Tests tree-shaking of whole-module dead code |

---

#### Tier 2: Real-World OSS Projects (Validation Data)

##### Purpose

Tier 2 answers: **"Do the performance rankings from our controlled synthetic benchmarks hold in the wild?"** If Rspack is 3× faster than Webpack on Tier 1 synthetic projects, is it also faster on a real codebase? Any divergence is itself an interesting finding worth reporting.

##### Selection Criteria

Real-world projects must satisfy ALL of:
1. **Pure React + TypeScript** — no meta-framework (no Next.js, Remix, Astro, Gatsby)
2. **No bundler-specific APIs** — no `import.meta.glob` (Vite), no `require.context` (Webpack)
3. **Standard CSS** — CSS Modules, Tailwind, or plain CSS (all tools support these)
4. **MIT or permissive license** — must allow derivative works and publication
5. **200-1000 components** — large enough to be meaningful, small enough to configure for all 5 tools
6. **Active project** — last commit within 6 months (verifiable, not abandoned)

##### Candidate Projects (to be finalized in Phase 2 after feasibility testing)

| Candidate | Components | License | Why It Fits | Risk |
|-----------|-----------|---------|-------------|------|
| **Excalidraw** (excalidraw/excalidraw) | ~400+ | MIT | Pure React, no meta-framework, canvas-heavy (tests different bundler code paths), widely recognized | Originally uses Vite — porting to esbuild/Rollup may need shims |
| **React Admin** (marmelab/react-admin) | ~800+ | MIT | Pure React, massive ecosystem, the gold standard React OSS app | Very large — may need to use a subset (demo app) |
| **Ant Design Pro** (ant-design/ant-design-pro) | ~300+ | MIT | Enterprise dashboard, React + TypeScript, well-structured | Uses UmiJS internally — extraction needed |

##### Tier 2 Protocol

1. **Fork** the project at a specific commit SHA (pinned for reproducibility)
2. **Audit** for bundler-specific APIs → document and replace with standard equivalents
3. **Minimize changes** — every source modification documented in `TIER2-CHANGES.md`
4. **Write configs** for all 5 tools; accept that some tools may fail (this is a finding, not a flaw)
5. **Run only M2 (prod build) and M5-M6 (bundle size)** — subset of metrics sufficient for validation
6. **Report separately** in Discussion section ("§6.2 External Validity: Real-World Confirmation")

##### What If a Tool Fails on a Real-World Project?

This is expected and informative. We report it as:
> "esbuild could not build Excalidraw due to lack of support for [specific feature]. This illustrates the tradeoff between raw speed and ecosystem compatibility."

Partial failures strengthen the paper — they show we tested boundary conditions, not just happy paths.

---

#### Project Design Principles (Both Tiers)

1. **Identical source code** — only `vite.config.ts` / `rspack.config.ts` / `webpack.config.js` etc. differ
2. **Realistic patterns** — components use hooks, props, conditional rendering, event handlers (not empty shells)
3. **Tree-shaking testable** — each project imports only `pick` and `debounce` from `lodash-es` (rest should be eliminated)
4. **Code-splitting testable** — Medium/Large projects have lazy-loaded routes
5. **Deterministic generation** (Tier 1) — all sizes generated from `generate-project.ts` with `--size N --seed 42`, committed to repo
6. **No framework lock-in** — pure React, no Next.js/Remix/Gatsby (those add framework-specific build logic)
7. **Pinned dependencies** (Tier 2) — fork at exact commit SHA, lock all package versions

### 1.4 Metrics (Dependent Variables) ✅

#### Table 1: Complete Metrics Specification

| # | Metric | Definition | RQ | Tool | Command / Method | Unit | Precision |
|---|--------|-----------|-----|------|-----------------|------|-----------|
| M1 | Dev cold start | Time from `dev` command to "ready" message, no cache | RQ1.1 | `hyperfine --warmup 0 --runs 10 --prepare 'rm -rf node_modules/.cache .vite dist'` | `hyperfine` wrapping dev command; parse "ready in Xms" from stdout | ms | ±1ms |
| M2 | Prod build time | Wall-clock time for production build, no cache | RQ1.2 | `hyperfine --warmup 0 --runs 10 --prepare 'rm -rf dist node_modules/.cache'` | `hyperfine` wrapping build command | ms | ±1ms |
| M3 | Incremental rebuild | Time from file save to rebuild complete (1 component, add a `console.log`) | RQ1.3 | Custom Node.js script: `fs.writeFile` → listen for build-complete event | Timestamp delta via build tool output or filesystem watcher | ms | ±5ms |
| M4 | HMR latency | Time from file change to browser DOM update | RQ1.4 | Puppeteer + Chrome DevTools Protocol: inject timestamp at file-write, capture `Performance.mark` in browser | Write timestamp → CDP `Runtime.evaluate` checks for update | ms | ±5ms |
| M5 | Bundle size (raw) | Total size of all files in `dist/` after prod build | RQ2.1 | `find dist -type f -exec cat {} + \| wc -c` | Sum of all output file sizes | bytes | exact |
| M6 | Bundle size (gzip) | Total gzipped size of JS files in `dist/` | RQ2.1 | `find dist -name '*.js' -exec gzip -9 -c {} + \| wc -c` | Each JS file gzipped individually, sizes summed | bytes | exact |
| M7 | Tree-shaking | % of lodash-es eliminated: `1 - (actual_lodash_in_bundle / full_lodash_size)` | RQ2.2 | `source-map-explorer` on bundle output; search for lodash-es contribution | Compare lodash-es bytes in bundle vs. full package size | % | ±0.1% |
| M8 | Code splitting | Number of JS output files (chunks) in `dist/` | RQ2.3 | `find dist -name '*.js' \| wc -l` | Count of .js files in dist | count | exact |
| M9 | Sourcemap accuracy | Whether source positions map back correctly | RQ2.4 | `sourcemap-validator` npm package on all `.js.map` files | Run validator, record pass/fail + error count per file | pass/fail + error count | exact |
| M10 | Peak memory (RSS) | Maximum resident set size during build | RQ3.1 | GNU `time -v` (Linux) or `command time -l` (macOS) wrapping build | Extract "Maximum resident set size" from stderr | MB | ±1MB |
| M11 | CPU time | Total user + system CPU time consumed | RQ3.2 | GNU `time -v` or `command time -l` wrapping build | Extract "User time" + "System time" from stderr | seconds | ±0.01s |
| M12 | Scaling curve | Build time as function of module count (50, 200, 500, 2000, 5000) | RQ3.3 | Run M2 at each of 5 project sizes (all generated by `generate-project.ts --size N`) | Fit regression: linear, log-linear, polynomial | regression model | R² reported |

#### Metric Collection Notes
- **M1 (Dev cold start)** and **M4 (HMR latency)**: Applicable only to tools with **native dev server + HMR support**: Vite, Rspack, Webpack. esbuild (`--serve`) and Rollup (no dev server) lack native HMR — this asymmetry is itself a finding reported under RQ1: *"Tool selection involves a tradeoff between raw build speed and developer-experience features such as HMR."*
- **M3 (Incremental rebuild)**: Measured via `--watch` mode, which **all 5 tools support**. This remains a full 5-tool comparison.
- **M1-M2**: `hyperfine` handles warm-up, repetitions, and statistical summary automatically. Export raw JSON for our own analysis.
- **M3-M4**: These are the most measurement-sensitive. We'll record 20 runs (not 10) to account for higher variance in HMR/incremental metrics.
- **M5-M9**: Deterministic (same code → same output). Run once per tool×scale, verify with a second run.
- **M10-M11**: Collected simultaneously with M2 (wrap prod build in `time`).
- **M12**: Uses the same M2 data across all 5 Tier 1 project sizes (50, 200, 500, 2000, 5000). No separate runs needed.

#### Dev Server Feature Matrix

| Tool | Dev Server | HMR | Watch Mode | M1 Applicable | M3 Applicable | M4 Applicable |
|------|-----------|-----|-----------|----------------|----------------|----------------|
| Vite | ✅ Native | ✅ Native | ✅ | ✅ | ✅ | ✅ |
| Rspack | ✅ `@rspack/dev-server` | ✅ Native | ✅ | ✅ | ✅ | ✅ |
| Webpack | ✅ `webpack-dev-server` | ✅ Native | ✅ | ✅ | ✅ | ✅ |
| esbuild | ⚠️ `--serve` (static only) | ❌ None | ✅ `--watch` | ❌ N/A | ✅ (watch) | ❌ N/A |
| Rollup | ❌ None native | ❌ None | ✅ `--watch` | ❌ N/A | ✅ (watch) | ❌ N/A |

> **Impact on data points:** M1 and M4 drop from 5→3 tools. M3 remains 5 tools (watch mode is universal). This reduces Tier 1 total by ~200 data points but produces a methodologically cleaner comparison. The feature gap is reported as a finding, not hidden as a limitation.

### 1.5 Experimental Protocol ✅

#### Hardware Specification (record on Day 1)

```
Machine:       [exact model]
CPU:           [model, cores, threads, base/boost clock]
RAM:           [size, type, speed]
Storage:       [SSD model, read/write speeds]
OS:            [name, version, kernel]
Node.js:       [exact version]
npm:           [exact version]
```

#### Environment Isolation Checklist (before EVERY benchmark session)

- [ ] Reboot machine
- [ ] Close all applications except terminal
- [ ] Disable Spotlight indexing / filesystem watchers (`sudo mdutil -a -i off` on macOS)
- [ ] Disable automatic updates
- [ ] Disconnect from network (airplane mode) — network calls would add noise
- [ ] Kill background daemons: Docker, Slack, browser sync, cloud storage
- [ ] Verify CPU thermal state (wait 2 min after boot)
- [ ] Verify no other user processes (`ps aux | wc -l` should be minimal)

#### Execution Protocol (pseudocode)

```
TOOLS = [vite, rspack, esbuild, webpack, rollup]
SCALES = [xs-50, s-200, m-500, l-2000, xl-5000]  # 5 Tier 1 sizes
MODES = [dev, prod]
RUNS = 10  # (20 for M3/M4 due to higher variance)

for tool in TOOLS:
  for scale in SCALES:
    for mode in MODES:

      # Phase A: Preparation
      cd projects/{scale}
      checkout {tool} config branch  # git branch per config
      npm install                     # fresh install
      verify_build_works(tool, mode)  # sanity check

      # Phase B: Cold build measurement (M1 or M2)
      for run in 1..RUNS:
        clear_cache()               # rm -rf dist .vite node_modules/.cache
        metrics = run_with_timing(tool, mode)  # hyperfine + time -v
        record(tool, scale, mode, run, metrics) → CSV

      # Phase C: Incremental rebuild (M3) — dev mode, ALL 5 tools (via --watch)
      if mode == dev:
        start_watch_or_dev(tool)      # dev server (Vite/Rspack/Webpack) or --watch (esbuild/Rollup)
        wait_for_ready()
        for run in 1..20:
          modify_single_file()      # append console.log to Component42.tsx
          t = measure_rebuild_time()
          revert_file()
          record_incremental(tool, scale, run, t) → CSV
        stop_watch_or_dev()

      # Phase D: HMR latency (M4) — dev mode, ONLY tools with native HMR (Vite/Rspack/Webpack)
      if mode == dev AND tool.has_hmr:  # skip esbuild, rollup
        start_dev_server(tool)
        launch_puppeteer_browser()
        wait_for_page_load()
        for run in 1..20:
          inject_timestamp()
          modify_component_jsx()    # change a string in Component42
          t = measure_dom_update()  # CDP Performance.mark delta
          revert_file()
          record_hmr(tool, scale, run, t) → CSV
        close_browser()
        stop_dev_server()

      # Phase E: Output quality (M5-M9) — only for prod mode
      if mode == prod:
        build_once(tool)
        measure_bundle_size(raw, gzip) → CSV
        measure_tree_shaking() → CSV
        count_chunks() → CSV
        validate_sourcemaps() → CSV
```

#### Experiment Matrix Summary

##### Tier 1: Calibrated Synthetic (Primary)

| Measurement | Tools | Scales | Modes | Runs | Total data points |
|------------|-------|--------|-------|------|-------------------|
| M1 (dev cold start) | 3† | 5 | dev | 10 | 150 |
| M2 (prod build time) | 5 | 5 | prod | 10 | 250 |
| M3 (incremental rebuild) | 5 | 3‡ | dev | 20 | 300 |
| M4 (HMR latency) | 3† | 3‡ | dev | 20 | 180 |
| M5-M6 (bundle size) | 5 | 5 | prod | 2 (verify) | 50 |
| M7 (tree-shaking) | 5 | 5 | prod | 2 | 50 |
| M8 (code splitting) | 5 | 5 | prod | 2 | 50 |
| M9 (sourcemap) | 5 | 5 | prod | 2 | 50 |
| M10 (peak memory) | 5 | 5 | prod | 10 | 250 |
| M11 (CPU time) | 5 | 5 | prod | 10 | 250 |
| M12 (scaling) | 5 | 5 sizes | prod | 10 | 250 (= M2 data) |
| **Tier 1 Total** | | | | | **~1,830 data points** |

> †M1/M4: Only Vite, Rspack, Webpack (tools with native dev server + HMR). esbuild/Rollup N/A — reported as finding.
> ‡M3/M4: Measured at 3 scales (XS=50, M=500, XL=5000) due to time cost of dev server start/stop per run.

##### Tier 2: Real-World OSS (Validation)

| Measurement | Tools | Projects | Runs | Total data points |
|------------|-------|----------|------|-------------------|
| M2 (prod build time) | 5* | 2-3 | 10 | 100-150 |
| M5-M6 (bundle size) | 5* | 2-3 | 2 | 20-30 |
| M10 (peak memory) | 5* | 2-3 | 10 | 100-150 |
| **Tier 2 Total** | | | | **~220-330 data points** |

> *Some tools may fail on real-world projects — partial results reported as findings.

**Grand Total: ~2,050–2,160 data points**

#### Estimated Execution Time
- **Tier 1 Cold builds (M2)**: ~3–5 seconds avg × 250 runs = ~15 min
- **Tier 1 Dev server starts (M1, 3 tools)**: ~2–6 seconds avg × 150 runs = ~10 min
- **Tier 1 Incremental (M3, 5 tools)**: ~100ms avg × 300 runs = ~3 min (plus overhead)
- **Tier 1 HMR (M4, 3 tools)**: ~100ms avg × 180 runs = ~2 min (plus overhead)
- **Tier 1 Scaling (5 sizes × 5 tools × 10 runs)**: ~3 hours (large builds are slow)
- **Tier 2 Prod builds**: ~5-30 seconds avg × 150 runs = ~30-60 min
- **Total: ~5–7 hours of automated execution** (can split across 2 overnight runs)

### 1.6 Statistical Analysis Plan ✅

#### Software
- **R 4.x** with packages: `dplyr`, `ggplot2`, `dunn.test`, `effsize`, `car`, `nortest`
- All analysis scripts committed to replication package (`analysis/analysis.R`)

#### Analysis Pipeline (per RQ, per project scale)

| Step | What | R Function | Notes |
|------|------|-----------|-------|
| 1 | **Descriptive statistics** | `group_by(tool) %>% summarise(mean, median, sd, IQR, min, max)` | Report all 6 summary stats — reviewers want to see distributions, not just means |
| 2 | **Normality test** | `shapiro.test()` per group | If p > 0.05, data is plausibly normal. Performance data is almost never normal — expect to use non-parametric tests. |
| 3 | **Omnibus test** | `kruskal.test()` (non-parametric) | Tests H₀: all 5 tools have the same distribution. If p < α → at least one differs. |
| 4 | **Post-hoc pairwise** | `dunn.test(method="bonferroni")` | 10 pairwise comparisons (5 choose 2). Bonferroni corrects for multiple testing. Reports which specific pairs differ. |
| 5 | **Effect size** | `cliff.delta()` from `effsize` package | Non-parametric effect size. Interpretation: \|d\| < 0.147 = negligible, < 0.33 = small, < 0.474 = medium, ≥ 0.474 = large. |
| 6 | **Scaling regression** (RQ3 only) | `nls()` or `lm()` with log transform | Fit: linear (y = ax + b), log-linear (y = a·log(x) + b), polynomial (y = ax² + bx + c). Compare by R² and AIC. |

#### Significance Level
- **α = 0.05** for all tests
- After Bonferroni correction for 10 pairwise comparisons: effective α = 0.005 per comparison
- Always report **exact p-values** (not just "p < 0.05")

#### Handling Outliers
1. Detect using **IQR method**: outlier if value < Q1 - 1.5×IQR or > Q3 + 1.5×IQR
2. Investigate root cause (GC pause? background process leak?)
3. If root cause is identifiable and external to the tool → remove with documented justification
4. If root cause is inherent to the tool → keep (it's a valid data point)
5. Report analysis both **with and without outliers** (sensitivity analysis)

#### Reporting Format (in paper)
For each RQ subsection:
```
"For the Large project, production build times differed significantly across
tools (Kruskal-Wallis χ²(4) = X.XX, p < 0.001). Post-hoc analysis revealed
that Vite (Mdn = X ms) was significantly faster than Webpack (Mdn = Y ms)
with a large effect size (Cliff's δ = 0.XX, p < 0.001), while the difference
between Vite and Rspack was not significant (p = 0.XX, Cliff's δ = 0.XX)."
```

#### Key Plots

| Plot | Type | RQ | X-axis | Y-axis | Facet |
|------|------|-----|--------|--------|-------|
| P1 | Box plot | RQ1 | Tool | Build time (ms) | Project scale (Small/Med/Large) |
| P2 | Box plot | RQ1 | Tool | HMR latency (ms) | Project scale |
| P3 | Grouped bar | RQ2 | Tool | Bundle size (KB) | Raw vs Gzipped (color) × Scale (facet) |
| P4 | Stacked bar | RQ2 | Tool | Tree-shaking (% removed) | Project scale |
| P5 | Bar | RQ2 | Tool | Chunk count | Project scale |
| P6 | Box plot | RQ3 | Tool | Peak memory (MB) | Project scale |
| P7 | Line plot | RQ3 | Module count (log) | Build time (log) | Tool (color) |
| P8 | Heatmap | All | Tool | Metric | Normalized score (color: green=best) |

### 1.7 Threats to Validity (Draft) ✅

#### Internal Validity (cause-effect relationship)

| Threat | Description | Mitigation |
|--------|-------------|-----------|
| **Measurement noise** | Background processes, OS scheduling, GC pauses can affect timing | Environment isolation protocol (§1.5). 10-20 repetitions. Report median + IQR, not just mean. |
| **Configuration bias** | One tool's config may be more optimized than another's | All configs follow each tool's official "getting started" / recommended setup. No custom optimization tricks. Configs published in replication package for scrutiny. |
| **Warm-cache leakage** | Filesystem cache or Node.js module cache may persist between runs | Explicit cache clearing (`rm -rf`) before every cold run. Verify with `sync && echo 3 > /proc/sys/vm/drop_caches` on Linux (if possible) or reboot between tool switches. |

#### External Validity (generalizability)

| Threat | Description | Mitigation |
|--------|-------------|-----------|
| **Single machine** | Results may not generalize to different hardware (ARM vs x86, different RAM, HDD vs SSD) | Document hardware precisely. Discuss as limitation. Optionally run a supplementary experiment on a second machine (Linux CI runner) if time permits. |
| **React only** | Results may differ for Vue, Svelte, Angular projects | React is the most popular framework (>60% market share). Controls for framework variable. Discuss generalization in Section 7. Future work: multi-framework. |
| **Synthetic projects** | Generated components may not reflect real-world code patterns | **Two-tier mitigation**: (1) Tier 1 uses "calibrated synthetic" components with realistic patterns — hooks, state, props, CSS Modules, conditional rendering, 50-150 LOC each (vs. trivial 5-line shells in existing benchmarks). (2) Tier 2 validates against 2-3 real-world OSS projects (§1.3). If Tier 1 and Tier 2 rankings agree, synthetic results are externally validated. If they diverge, the divergence is itself a finding reported in Discussion. |
| **Tier 2 porting fidelity** | Adapting real-world projects to 5 bundlers may introduce config-specific biases | All source changes documented in `TIER2-CHANGES.md`. Only bundler config files differ. Partial tool failures treated as legitimate findings (illustrate compatibility-vs-speed tradeoffs). |

#### Construct Validity (do metrics capture what we intend?)

| Threat | Description | Mitigation |
|--------|-------------|-----------|
| **Build time ≠ developer experience** | Build time is one factor of DX; others include error messages, documentation, plugin ecosystem | Explicitly scope our study to measurable performance metrics. Acknowledge DX is broader. |
| **HMR measurement precision** | Browser-side measurement via CDP adds overhead; the measurement itself perturbs timing | Use lightweight CDP calls. Report measurement overhead. Compare against tool's self-reported HMR time as cross-check. |

### 1.8 Reflexion Gate — Data Strategy ✅ PASSED

#### Act
Evaluated 4 approaches: (A) Pure Synthetic, (B) Real-World OSS Only, (C) Fork Existing Benchmark Repo, (D) Hybrid Multi-Tier. Examined 6 existing benchmark repos in detail.

#### Evaluate
- **A fails** external validity — reviewers will question whether trivial components represent real builds.
- **B is impractical** — bundler-specific APIs (`import.meta.glob`, `require.context`) prevent fair porting; confounding variables uncontrollable.
- **C is insufficient** — components are trivial shells, vendor bias risk, no statistical rigor, undermines novelty claim.
- **D is strongest** — combines controlled internal validity (Tier 1) with real-world external validity (Tier 2).

#### Reflect (Self-Correction)
1. **Original design (3 purely synthetic projects) was inadequate.** Same weakness as every existing benchmark repo. A reviewer familiar with "Beyond Synthetic Benchmarks" (2025) would reject.
2. **"Calibrated" is key — not just "more runs."** The innovation is NOT doing more repetitions on trivial components; it's building components that actually exercise bundler subsystems (JSX transform, tree-shaking, CSS pipeline, TS transpilation, chunk splitting).
3. **Tier 2 doesn't need to be comprehensive.** Even 1-2 real projects with partial tool coverage is enough to validate or challenge synthetic rankings. Partial failures are findings.
4. **5 sizes instead of 3** — needed for meaningful regression in M12. Three points can't distinguish linear from log-linear scaling.

#### Revise
Adopted Two-Tier Data Strategy (§1.3 updated). Key changes from original design:
- 3 project sizes → 5 project sizes (50, 200, 500, 2000, 5000)
- Trivial component shells → 8 calibrated template categories (50-150 LOC each)
- No external validation → Tier 2 with 2-3 real-world OSS projects
- ~1,570 data points → ~2,300 data points
- Added `TIER2-CHANGES.md` and `tier2-validation.R` to replication package

### 1.9 Reflexion Gate — Phase 1 ✅ PASSED

#### Checklist Evaluation

- [x] Every RQ maps to ≥2 metrics — RQ1: 4 metrics (M1-M4), RQ2: 5 metrics (M5-M9), RQ3: 3 metrics (M10-M12)
- [x] Every metric has a measurement tool, command, unit, and precision — Table 1 complete
- [x] All tools use production-recommended config — documented in §1.2
- [x] Turbopack exclusion justified and documented — §1.2 "Excluded Tools" table
- [x] Three project scales cover the practical range — 50 (startup) → 500 (mid-size) → 5000 (enterprise)
- [x] Statistical analysis pre-specified — Kruskal-Wallis + Dunn's + Cliff's delta, α=0.05
- [x] Outlier handling documented — IQR method + sensitivity analysis
- [x] Threats identified with mitigations — 3 internal, 3 external, 2 construct
- [x] Experiment is reproducible — pseudocode protocol, environment checklist, replication package structure

#### Self-Assessment

> Phase 1 delivers a complete, pre-registered experimental design. The 3 RQs are precise, measurable, and map cleanly to 12 metrics. The 5-tool selection spans three architectural categories (Rust, Go, JS) with documented inclusion/exclusion criteria. The three project scales cover the full range from startup to enterprise. The statistical plan follows Kalibera-Jones methodology with non-parametric tests appropriate for performance data. All 8 threats are identified with concrete mitigations. The design is ready for implementation in Phase 2.

- [ ] Every RQ maps to ≥2 metrics
- [ ] Every metric has a tool and unit
- [ ] All tools use production-recommended config
- [ ] Turbopack exclusion justified and documented
- [ ] Three project scales cover the practical range

---

## Phase 2: Implementation 🔲

> _Benchmark projects, bundler configs, measurement harness._

### 2.1 Week-by-Week Plan

| Week | Deliverable |
|------|------------|
| Week 4 | `generate-project.ts` script: 8 component templates, parametric sizing |
| Week 5a | Generate all 5 Tier 1 project sizes (50, 200, 500, 2000, 5000) |
| Week 5b | 25 bundler configurations (5 tools × 5 sizes), verify all build successfully |
| Week 6a | Tier 2 feasibility: fork 3 candidate OSS projects, test which can build on all 5 tools |
| Week 6b | Finalize 2-3 Tier 2 projects, document all source changes in `TIER2-CHANGES.md` |
| Week 7a | Measurement harness (shell scripts, Puppeteer HMR, CSV collection) |
| Week 7b | Dry run on smallest projects, sanity check, fix measurement bugs |

### 2.2 Replication Package Structure

```
benchmark-repo/
├── tier1-synthetic/                # Calibrated synthetic projects
│   ├── generate-project.ts         # Deterministic generator script
│   ├── templates/                  # 8 component template categories
│   │   ├── data-display.ts
│   │   ├── form-control.ts
│   │   ├── layout.ts
│   │   ├── navigation.ts
│   │   ├── feedback.ts
│   │   ├── data-fetching.ts
│   │   ├── chart-viz.ts
│   │   └── utility.ts
│   ├── projects/
│   │   ├── xs-50/                  # TaskBoard-50
│   │   ├── s-200/                  # TaskBoard-200
│   │   ├── m-500/                  # ShopDash-500
│   │   ├── l-2000/                 # ShopDash-2000
│   │   └── xl-5000/                # MegaRepo-5000
│   └── configs/                    # 25 configs (5 tools × 5 sizes)
│       ├── vite/
│       ├── rspack/
│       ├── esbuild/
│       ├── webpack/
│       └── rollup/
├── tier2-realworld/                # Real-world OSS projects
│   ├── excalidraw/                 # (or final selections)
│   │   ├── TIER2-CHANGES.md        # Every source mod documented
│   │   ├── configs/                # 5 bundler configs
│   │   └── src/                    # Forked source (pinned commit SHA)
│   └── react-admin-demo/
│       ├── TIER2-CHANGES.md
│       ├── configs/
│       └── src/
├── scripts/
│   ├── run-benchmark.sh            # Master orchestrator
│   ├── measure-hmr.ts              # Puppeteer + CDP HMR measurement
│   ├── collect-metrics.ts          # CSV aggregation
│   ├── clear-cache.sh              # Pre-run cleanup
│   └── validate-sourcemaps.ts      # M9 measurement
├── results/
│   ├── tier1-raw/                  # CSVs from Tier 1 runs
│   ├── tier2-raw/                  # CSVs from Tier 2 runs
│   └── processed/                  # Merged analysis-ready data
├── analysis/
│   ├── analysis.R                  # Full statistical pipeline
│   ├── tier2-validation.R          # Tier 1 vs Tier 2 comparison
│   └── plots/                      # Generated figures for paper
├── HARDWARE.md                     # Machine specs, recorded Day 1
└── README.md                       # Setup instructions, reproduction guide
```

### 2.3 Reflexion Gate — Phase 2

- [ ] `generate-project.ts` produces all 5 sizes deterministically (same seed → same output)
- [ ] Generated components are 50-150 LOC each (not trivial shells — spot-check 10 random files)
- [ ] All 8 template categories present in generated projects (verify distribution)
- [ ] All 5 tools build all 5 Tier 1 project sizes successfully
- [ ] At least 2 Tier 2 real-world projects build on ≥3 tools (document any failures)
- [ ] Metrics captured correctly (spot-check 3 random runs per tier)
- [ ] `hyperfine` variance is not suspiciously low (no caching bug)
- [ ] `TIER2-CHANGES.md` documents every source modification to real-world projects

---

## Phase 3: Data Collection & Analysis 🔲

> _300+ runs, statistical analysis, plots._

### 3.1 Experiment Matrix

- **Tier 1:** 5 tools × 5 scales × 10 reps × 2 modes (dev + prod) = **500+ runs minimum**
- **Tier 2:** 5 tools × 2-3 projects × 10 reps × prod only = **100-150 runs**
- **Grand total:** ~2,300 data points
- Estimated execution: ~3–4 days automated overnight

### 3.2 Analysis Pipeline

1. Descriptive stats: mean, median, SD, IQR
2. Normality: Shapiro-Wilk
3. Omnibus: Kruskal-Wallis
4. Post-hoc: Dunn's test (Bonferroni)
5. Effect size: Cliff's delta
6. Scaling: regression build_time ~ f(module_count)
7. Visualization: box plots, line plots, heatmap

### 3.3 Key Plots

| Plot | RQ |
|------|-----|
| Box plot: build time by tool, faceted by scale | RQ1 |
| Box plot: HMR latency by tool | RQ1 |
| Bar chart: bundle size (raw vs gzip) by tool × scale | RQ2 |
| Line plot: build time vs module count per tool | RQ3 |
| Heatmap: tool × metric summary (normalized) | All |

### 3.4 Reflexion Gate — Phase 3

- [ ] Statistical power sufficient (increase to 20-30 runs if needed)
- [ ] Outliers investigated with documented justification
- [ ] Surprising results investigated, not ignored
- [ ] Tier 1 results compared against blog benchmarks for sanity
- [ ] Tier 2 rankings compared against Tier 1 rankings — agreement/divergence documented
- [ ] If rankings diverge between tiers, root cause investigated (config issue? project-specific feature?)

---

## Phase 4: Paper Writing 🔲

> _16–20 pages following SPE conventions._

### 4.1 Paper Structure

| Section | Est. Pages |
|---------|-----------|
| 1. Introduction | 1.5 |
| 2. Background | 2 |
| 3. Related Work | 2 |
| 4. Study Design (incl. Two-Tier Data Strategy) | 4 |
| 5. Results (Tier 1: Calibrated Synthetic) | 4 |
| 6. Discussion (incl. §6.2 Tier 2 External Validation) | 3 |
| 7. Threats to Validity | 1 |
| 8. Conclusion & Future Work | 0.5 |
| **Total** | **~18** |

### 4.2 Writing Order

1. Study Design → 2. Results → 3. Discussion → 4. Threats → 5. Related Work → 6. Background → 7. Introduction → 8. Abstract

### 4.3 Reflexion Gate — Phase 4

**Self-Review Checklist:**
- [ ] Every claim backed by a number in a table
- [ ] Every table/figure referenced in text
- [ ] RQs restated before each Results subsection
- [ ] Effect sizes alongside p-values
- [ ] ≥3 internal + ≥2 external threats addressed
- [ ] Replication package URL included
- [ ] No "we believe" or "it is obvious"
- [ ] Paper length within 40-page limit

**Pre-Submission Hostile Reviewer Simulation:**

| Criticism | Defense |
|-----------|---------|
| "Why not Turbopack?" | No stable standalone prod build. Scoping in Section 3. |
| "Only 10 runs" | Power analysis. Increase to 30 if needed. |
| "Synthetic projects" | Two-tier design: Tier 1 uses calibrated synthetic components (50-150 LOC, hooks, state, CSS Modules — not trivial shells). Tier 2 validates on 2-3 real-world OSS projects. Rankings compared in Discussion. |
| "Config differences" | All follow official docs. Published in replication package. |
| "One machine only" | Acknowledged. Future work: multi-platform. |
| "rstackjs repo is biased (Rspack team)" | We build our own projects from scratch. rstackjs cited only as community baseline for sanity-checking. |
| "Components are generated, not realistic" | 8 template categories, 50-150 LOC each, with hooks/state/CSS/TS generics. Calibration table in §1.3 maps each feature to the metric it exercises. |

---

## Phase 5: Submission & Response 🔲

### 5.1 Pre-Submission Checklist

- [ ] Zenodo deposit → DOI → added to paper
- [ ] ORCID created
- [ ] Grammarly + native speaker review
- [ ] Internal review by 1–2 colleagues

### 5.2 Submission Tiers

| Attempt | Venue | Turnaround |
|---------|-------|-----------|
| 1st | SPE (Wiley) | 3–5 months |
| 2nd | JSS (Elsevier) | 3–5 months |
| 3rd | PeerJ Computer Science | 2–3 months |

### 5.3 R&R Response Rules

- Point-by-point response document
- Quote → Change → Page/Line reference
- Tone: grateful, never defensive
- Respond within 4–6 weeks

---

## Timeline

```
Week  1       ████ Phase 0: Validate gap ✅
Week  2-3     ████████ Phase 1: Research design
Week  4-7     ████████████████ Phase 2: Build projects + harness
Week  8-10    ████████████ Phase 3: Run experiments + analysis
Week 11-15    ████████████████████ Phase 4: Write paper
Week 16       ████ Phase 5a: Polish + submit
Week 17-22    ░░░░░░░░░░░░░░░░░░░░░░ Waiting for review
Week 23-26    ████████████████ Phase 5b: Revision (if R&R)
```

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Sep 11, 2026 | Selected Topic 1 (Build Tools) over Topic 2 (Migration Bench) and Topic 3 (Vibe-Code Evolution) | Fastest path to publication, widest gap, highest solo feasibility |
| Sep 11, 2026 | Primary venue: SPE | Scope match ("practice and experience"), recent comparable papers accepted (Node.js vs Spring Boot 2025), 40-page limit sufficient |
| Sep 11, 2026 | Excluded Turbopack | No stable standalone production build as of 2026, Next.js-only, dev-mode-only |
| Sep 11, 2026 | Statistical method: Kruskal-Wallis + Cliff's delta | Non-parametric (performance data rarely normal), follows Kalibera-Jones methodology |
| Sep 11, 2026 | React 19 + TypeScript as benchmark framework | Most popular framework (controls variable), TypeScript tests bundler TS support |
| Sep 11, 2026 | 20 runs for HMR/incremental metrics (vs 10 for cold builds) | Higher variance in sub-second measurements needs more samples |
| Sep 11, 2026 | esbuild included despite being Go (not Rust) | Provides cross-language comparison; speed pioneer; validates whether Rust specifically matters |
| Sep 11, 2026 | Parcel excluded to keep at 5 tools | Overlaps architecturally with Vite; can be added in replication study |
| Sep 11, 2026 | **Two-tier data strategy adopted** | Reflexion analysis of 6 existing benchmark repos revealed: (1) all use trivially synthetic components (~5 LOC), (2) some maintained by tool vendors (bias risk), (3) no statistical rigor. Pure real-world projects are impractical (bundler-specific APIs prevent fair porting). Two-tier design gives internal validity (Tier 1: calibrated synthetic) + external validity (Tier 2: real-world OSS). Follows Theodolite (JSS 2024) pattern of synthetic workloads grounded in realistic use cases. |
| Sep 11, 2026 | Expanded from 3 to 5 project sizes (50, 200, 500, 2000, 5000) | 5 data points needed for meaningful regression curve fitting (M12). 3 points cannot distinguish linear from log-linear from polynomial scaling. |
| Sep 11, 2026 | "Calibrated synthetic" component specification | Differentiation from existing benchmarks: our components are 50-150 LOC with hooks, state, CSS Modules, TS generics, conditional rendering. 8 template categories ensure variety. Each feature mapped to the specific metric it exercises. |
| Sep 11, 2026 | Rejected "fork rstackjs" approach | rstackjs maintained by Rspack team (bias), components are trivial shells (5 LOC), only 3 runs averaged (not rigorous). Better to build from scratch with our own design. Cite rstackjs as community baseline only. |
| Sep 11, 2026 | M1/M4 limited to 3 tools (Vite, Rspack, Webpack) | esbuild has no native HMR; Rollup has no dev server. Forcing dev servers via community plugins would violate "official config" principle and add confounding variables. Feature gap reported as RQ1 finding: *"tool selection involves speed-vs-DX-features tradeoff."* M3 (incremental rebuild) still covers all 5 tools via universal `--watch` mode. |
| Sep 11, 2026 | M3 uses `build --watch` (not dev server) | Pilot testing revealed dev server stdout doesn't reliably emit rebuild patterns when no browser is connected. `vite build --watch`, `rspack build --watch`, `webpack --watch` all emit clear "built in Xms" / "compiled successfully" patterns to stdout, giving precise incremental rebuild timing. |
| Sep 11, 2026 | Tier 2 reduced to 1 project (Bulletproof React) | Evaluated 5 candidates. Excalidraw (monorepo + SVG plugins + WASM) would require disproportionate adaptation work vs. research value gained. Bulletproof React (102 files, MIT, React+TS+Tailwind) is a clean SPA that builds with all 5 tools. Reports Tier 2 as "validation probe" rather than full replication. |
| Sep 11, 2026 | Phase 2 sealed after pilot run validation | Pilot tested M1-M11 on xs-50 (Vite, Rspack, esbuild, Webpack). All metrics produce valid CSV. Notable pilot findings: esbuild 3× faster than Vite/Rspack on M2 (xs-50); Webpack has fastest incremental rebuild (~80ms vs Vite ~420ms). |

---

## Phase 2 Implementation — Completed Sep 11, 2026

### §2.1 Tier 1 Synthetic Projects

**Generator:** `tier1-synthetic/generate-project.ts` — 2,250 LOC, deterministic (seed=42, Mulberry32 PRNG).

**Generated projects** (in `tier1-synthetic/projects/`):

| Size | Components | LOC | Imports | Dead modules | Routes | Disk |
|------|-----------|-----|---------|-------------|--------|------|
| xs-50 | 50 | ~8,135 | 80 | 2 | 0 | 448 KB |
| s-200 | 200 | ~32,209 | 369 | 10 | 4 | 1.7 MB |
| m-500 | 500 | ~79,605 | 898 | 25 | 12 | 4.1 MB |
| l-2000 | 2,000 | ~319,647 | 3,647 | 100 | 20 | 17 MB |
| xl-5000 | 5,000 | ~801,736 | 9,301 | 250 | 50 | 41 MB |

### §2.2 Bundler Configurations

5 configs in `configs/<tool>/`, each with:
- `deps.json` (devDependencies + scripts)
- Config file (vite.config.ts, rspack.config.cjs, build.mjs, webpack.config.cjs, rollup.config.mjs)

Key design decisions documented in earlier Decision Log entries (CSS module handling, CJS config naming, plugin ordering).

### §2.3 Workspaces

`scripts/setup-all-workspaces.sh` creates 25 isolated workspaces (5 tools × 5 sizes) in `tier1-synthetic/workspaces/<tool>/<size>/`. Each has its own package.json, config, and node_modules. Total: ~3.7 GB.

### §2.4 Measurement Harness

| Script | Purpose |
|--------|---------|
| `scripts/run-single.sh` | Runs ONE benchmark: tool × size × metric → CSV |
| `scripts/run-all.sh` | Orchestrates all 233 Tier 1 benchmark jobs |
| `scripts/measure-incremental.ts` | M3: watch-mode incremental rebuild timing |
| `scripts/measure-hmr.ts` | M4: Puppeteer + CDP HMR latency |
| `scripts/clear-cache.sh` | Removes all bundler caches before cold runs |

### §2.5 Tier 2 Real-World Project

**Bulletproof React** (alan2207/bulletproof-react, MIT):
- 102 TSX/TS source files, React 18 + TypeScript + Tailwind CSS
- Production deps: @radix-ui, @tanstack/react-query, react-router, zustand, zod
- Adapted: MSW mocking stubbed, non-build deps stripped, `@/*` alias configured per tool
- All 5 tools verified: Vite (7.3s), Rspack (1.58s), esbuild (fast), Webpack (12s), Rollup (7.7s)

### §2.6 Pilot Run Results (xs-50 validation)

| Metric | Tool | Value | Notes |
|--------|------|-------|-------|
| M2 (prod build) | Vite | 1,020–1,872 ms | |
| M2 (prod build) | Rspack | 1,095–1,991 ms | |
| M2 (prod build) | esbuild | 384–456 ms | ~3× faster |
| M1 (dev cold start) | Vite | 999–1,211 ms | |
| M3 (incremental) | Vite | 27–454 ms | |
| M3 (incremental) | Webpack | 79–132 ms | Fastest incremental |
| M5 (bundle raw) | Vite | 311,635 bytes | |
| M6 (bundle gzip) | esbuild | 90,106 bytes | |
| M10 (peak RSS) | Vite | 232.8–237.6 MB | |
| M11 (CPU time) | esbuild | 0.84–0.94 s | |

All metrics produce valid, parseable CSV with schema: `tool,size,metric,run,value,unit,timestamp`.

### §2.8 Phase 2 Reflexion Gate

**Act:** Built complete benchmark infrastructure — synthetic generator (5 sizes), 5 bundler configs, 25 Tier 1 workspaces, measurement harness (11 metrics), 1 Tier 2 real-world project, pilot validation.

**Evaluate:**
- ✅ All 25 Tier 1 workspaces build successfully (5 tools × 5 sizes)
- ✅ All 5 tools build Tier 2 project (Bulletproof React)
- ✅ Pilot run validates all 11 metrics (M1-M11) produce clean CSV data
- ✅ M3 fix: `build --watch` mode more reliable than dev server for incremental measurement
- ⚠️ Only 1 Tier 2 project instead of planned 2-3 (Excalidraw too complex to adapt)
- ⚠️ Vite version mismatch: Tier 1 uses Vite 8.x, BP-React has Vite 5.x (fixable by upgrading workspace)

**Reflect:** The infrastructure is solid. The pilot data already shows meaningful differentiation (esbuild 3× faster than Vite/Rspack on M2). Having only 1 Tier 2 project is a minor limitation — the paper can frame it as a "validation probe" with acknowledgment that additional real-world replication strengthens findings. The Vite version mismatch in Tier 2 should be fixed before data collection.

**Revise:** Phase 2 is sealed. Before Phase 3 data collection: (1) upgrade Tier 2 BP-React Vite workspace to Vite 8.x, (2) ensure all Tier 2 workspaces use same dependency versions as Tier 1, (3) clear all pilot data from results/tier1-raw/ before the real run.

---

## Notes & Ideas

- Consider adding **energy consumption** metric (aligns with Pulido et al. SPE 2026 paper on energy efficiency)
- Possible supplementary experiment: run on second machine (Linux) for external validity
- Consider releasing a **companion blog post** after acceptance for practitioner audience
