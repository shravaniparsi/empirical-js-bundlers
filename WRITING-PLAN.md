# Phase 4 Writing Plan — Journal of Systems and Software (JSS)

## JSS Submission Rules Summary

| Rule | Requirement |
|------|------------|
| **Length** | ≤ 36 pages single-column OR ≤ 18 pages double-column |
| **Abstract** | ≤ 250 words, factual, no references |
| **Keywords** | 1–7 English keywords |
| **Highlights** | 3–5 bullet points, each ≤ 85 characters |
| **Review type** | Single-anonymized (authors visible to reviewers) |
| **Figures** | Separate files, editable format |
| **Format** | Elsevier article class (elsarticle.cls), single-column for initial submission |
| **References** | No strict style for initial submission (Elsevier formats on acceptance) |
| **Data statement** | Mandatory — describe data availability |
| **AI disclosure** | Mandatory — declare generative AI use |
| **Competing interests** | Mandatory declaration |
| **Open Science** | JSS Open Science Initiative available (replication package review post-acceptance) |
| **Submission** | Editorial Manager: editorialmanager.com/JSSOFTWARE |
| **Typical review** | 74 days to first decision |

---

## Paper Structure (JSS-Optimized)

Modeled after Theodolite (Henning & Hasselbring, JSS 2024) and ConflictBench (Shen & Meng, JSS 2024).

| # | Section | Est. Pages | Content Summary |
|---|---------|-----------|-----------------|
| — | **Title** | — | "An Empirical Comparison of JavaScript Bundler Performance: Vite, Rspack, esbuild, Webpack, and Rollup" |
| — | **Abstract** | 0.5 | Context → Gap → Method → Key results → Conclusion (≤250 words) |
| — | **Highlights** | — | 5 bullets ≤85 chars each |
| — | **Keywords** | — | JavaScript bundler; build tools; empirical study; performance benchmarking; Vite; Rspack; esbuild |
| 1 | **Introduction** | 1.5 | Motivation, gap, contributions, paper organization |
| 2 | **Background** | 2 | JS module systems, bundler architectures, 5 tools profiled |
| 3 | **Related Work** | 2 | Academic (Nguyen thesis), grey lit (vendor benchmarks), methodology (Kalibera-Jones, Georges et al.) |
| 4 | **Study Design** | 4 | RQs, tool selection, two-tier data strategy, metrics, measurement harness, statistical method |
| 5 | **Results** | 4.5 | RQ1 (build perf), RQ2 (output quality), RQ3 (resources & scaling), Tier 2 validation |
| 6 | **Discussion** | 2.5 | Key findings, practical implications, tier comparison |
| 7 | **Threats to Validity** | 1.5 | Internal, external, construct, conclusion validity |
| 8 | **Conclusion & Future Work** | 0.5 | Summary, recommendations, future directions |
| — | **References** | 1.5 | ~40–50 references |
| — | **Appendix** (if needed) | 1 | Tool version table, extended stats tables |
| | **TOTAL** | **~22** | Within 36-page single-column limit |

---

## Section-by-Section Plan

### Title

**Primary candidate:**
"An Empirical Comparison of JavaScript Bundler Performance Across Project Scales"

**Alternative candidates:**
- "How Fast Is Your Bundler? A Rigorous Empirical Study of Five JavaScript Build Tools"
- "Benchmarking JavaScript Bundlers: A Two-Tier Empirical Study of Vite, Rspack, esbuild, Webpack, and Rollup"

**Decision criteria:** JSS titles tend to be descriptive rather than catchy. Theodolite uses "Benchmarking Scalability of..." — descriptive. ConflictBench uses "ConflictBench: A Benchmark to..." — named artifact. Since we don't have a named tool/benchmark to brand, go with descriptive.

---

### Abstract (≤ 250 words)

**Structure:** Context → Gap → Method → Key Results → Conclusion

```
Sentence plan:
1. Context (2 sentences): JS bundlers are critical to web development. No rigorous 
   academic comparison exists.
2. Gap (1 sentence): Existing benchmarks use trivially synthetic projects, lack 
   statistical rigor, and are often vendor-maintained.
3. Method (3 sentences): We compare 5 bundlers across 11 metrics using a two-tier 
   design: Tier 1 = calibrated synthetic projects at 5 scales (50–5,000 modules), 
   Tier 2 = real-world OSS project. Non-parametric statistics: Kruskal-Wallis, 
   Mann-Whitney U with Bonferroni, Cliff's delta. Total: 1,534 valid data points.
4. Key results (4 sentences): 
   - Vite 8 (Rust/Rolldown) fastest at ≥1,500 modules (5.9s at 5,000 modules).
   - esbuild (Go) fastest at small scale (<1,500 modules).
   - All tools scale linearly (R²≥0.97).
   - 27/27 omnibus tests significant, 197/205 pairs show large effect sizes.
5. Conclusion (2 sentences): Tool choice depends on project scale. Tier 2 rankings 
   match Tier 1, validating external generalizability.
```

---

### Highlights (5 bullets, each ≤ 85 characters)

```
1. First rigorous empirical comparison of five JavaScript bundlers     [62 chars]
2. Two-tier design: calibrated synthetic + real-world OSS validation   [63 chars]
3. 1,534 measurements across 11 metrics and 5 project scales          [61 chars]
4. Vite 8 overtakes esbuild at 1,500+ modules; all scale linearly     [64 chars]
5. Full replication package with scripts, data, and analysis code      [63 chars]
```

---

### Section 1: Introduction (~1.5 pages)

**Paragraph plan:**

1. **Opening hook** (¶1): JavaScript bundlers process virtually every line of web application code before it reaches users. Staicu et al. (2023) found 40% of websites use bundlers. The choice of bundler directly impacts developer productivity (build wait times) and end-user experience (bundle size, code splitting). Yet no rigorous academic comparison exists.

2. **Gap** (¶2): The only prior academic work is Nguyen (2024), a Bachelor's thesis comparing only Webpack and Vite on a single project scale with no statistical analysis. The grey literature (vendor benchmarks, blog posts) suffers from three limitations: trivially synthetic components (~5 LOC), vendor maintenance bias, and no statistical rigor.

3. **Our contribution** (¶3): This paper presents the first peer-reviewed empirical comparison of five production-ready JavaScript bundlers — Vite 8, Rspack 2, esbuild 0.28, Webpack 5, and Rollup 4 — across 11 performance metrics and 5 project scales. We introduce a two-tier benchmarking strategy: Tier 1 uses calibrated synthetic projects (50–5,000 modules) for controlled comparison; Tier 2 validates on a real-world open-source project.

4. **Contribution bullets** (enumerated list):
   - C1: Comprehensive empirical dataset — 1,534 valid data points across 5 tools × 5 scales × 11 metrics
   - C2: Two-tier benchmarking strategy combining calibrated synthetic projects with real-world OSS validation
   - C3: Statistically rigorous analysis using non-parametric tests with effect sizes
   - C4: Actionable findings: scale-dependent tool selection, linear scaling law, scalability ceilings
   - C5: Full replication package (scripts, raw data, analysis code)

5. **Paper organization** (¶5): "The remainder of this paper is organized as follows. Section 2 provides background on JavaScript bundling. Section 3 surveys related work. Section 4 describes our study design. Section 5 presents results. Section 6 discusses findings and implications. Section 7 addresses threats to validity. Section 8 concludes."

**Figures/Tables:** None in Introduction.

---

### Section 2: Background (~2 pages)

**Purpose:** Give a reviewer unfamiliar with JS bundlers enough context to evaluate our study.

**Subsections:**

**2.1 JavaScript Module Systems** (0.5 page)
- Evolution: scripts → CommonJS → AMD → ES Modules (ESM)
- Why bundling is needed: browser compatibility, optimization, tree-shaking
- Modern browser ESM support vs. production bundling needs

**2.2 Bundler Architectures** (0.5 page)
- Three paradigms: fully-bundled (Webpack, esbuild), unbundled-dev (Vite), hybrid (Rspack)
- Language matters: JavaScript (Webpack, Rollup) vs. Go (esbuild) vs. Rust (Vite/Rolldown, Rspack)
- Key concepts: HMR, tree-shaking, code splitting, sourcemaps

**2.3 Tools Under Study** (1 page)
- Table: 5 tools with version, language, architecture, npm downloads, rationale
- Brief profile of each tool (2–3 sentences each)
- Why each was included and what architectural approach it represents

**Figures/Tables:**
- Table 1: Tool comparison matrix (version, language, architecture, downloads, key feature)
- Figure 1: Architectural diagram showing the three bundler paradigms

---

### Section 3: Related Work (~2 pages)

**Subsections:**

**3.1 Academic Studies of Build Tools** (0.5 page)
- Nguyen (2024): Webpack vs Vite thesis — limitations
- McIntosh et al. (2015): build technology and maintenance
- Nejati et al. (2024): understanding changes to build systems
- Gap: no peer-reviewed multi-tool JS bundler comparison

**3.2 Grey Literature and Vendor Benchmarks** (0.5 page)
- rspack-contrib/build-tools-performance (Rspack team → bias risk)
- rolldown/benchmarks (Vite team → bias risk)
- Tech Insider, DEV Community blog comparisons
- Limitations: trivial components, no stats, vendor bias

**3.3 Performance Benchmarking Methodology** (0.5 page)
- Kalibera & Jones (2013): rigorous benchmarking, variance analysis
- Georges, Buytaert & Eeckhout (2007): statistically rigorous Java performance
- Henning & Hasselbring (2024): Theodolite — scalability benchmarking method (JSS)
- Barrett et al. (2017): VM warmup, steady-state detection
- How our methodology follows these standards

**3.4 Positioning Our Work** (0.5 page)
- Table comparing our study vs existing benchmarks across key dimensions
- What makes our study different: scale, rigor, independence, two-tier design

**Figures/Tables:**
- Table 2: Comparison of existing JS bundler benchmarks vs our study

---

### Section 4: Study Design (~4 pages)

**Most critical section for JSS reviewers.** Follows Theodolite's approach of systematic benchmark design.

**4.1 Research Questions** (0.5 page)
- RQ1: Build performance across scales (M1–M4)
- RQ2: Output quality and delivery efficiency (M5–M9)
- RQ3: Resource consumption and scaling behavior (M10–M12)
- Each RQ with motivation and sub-questions

**4.2 Tool Selection** (0.5 page)
- Inclusion criteria (5 criteria)
- Selected tools table (from Section 2.3, reference back)
- Excluded tools with rationale (Turbopack, Parcel, Farm, Bun, SWC)

**4.3 Two-Tier Benchmarking Strategy** (1 page) ← **KEY NOVELTY — emphasize**
- Rationale: why neither pure synthetic nor pure real-world works alone
- Tier 1: Calibrated Synthetic Projects
  - Generator design: seeded PRNG, 8 component templates, 50–150 LOC each
  - 5 scales: 50, 200, 500, 2,000, 5,000 modules
  - Table: project specifications (modules, routes, LOC, imports, dead code)
  - Calibration: which component features exercise which metrics
- Tier 2: Real-World OSS Validation
  - Selection criteria and candidate evaluation
  - Bulletproof React: 102 TSX files, MIT, React+TS+Tailwind
  - Adaptation process for all 5 bundlers

**4.4 Metrics** (0.5 page)
- Table: 11 metrics (M1–M11) with name, unit, measurement method, tool coverage
- M12 (scaling regression) derived from M2

**4.5 Measurement Harness** (0.5 page)
- Machine specification (single machine, controlled environment)
- Tools: hyperfine (M2, M10, M11), Puppeteer+CDP (M1, M4), build --watch (M3)
- Run counts: 10 (production metrics), 20 (dev/watch metrics)
- Warm-up handling: no explicit warm-up, median as primary statistic

**4.6 Statistical Analysis** (0.5 page)
- Pipeline: Shapiro-Wilk → Kruskal-Wallis → Mann-Whitney U (Bonferroni) → Cliff's delta
- Why non-parametric: 64% of groups non-normal (Shapiro-Wilk)
- Effect size interpretation: negligible/small/medium/large thresholds
- Scaling regression: linear vs log-linear model comparison

**Figures/Tables:**
- Table 3: Tier 1 project specifications (5 sizes × 7 columns)
- Table 4: Metrics definition (11 rows × 5 columns)
- Table 5: Component template distribution (8 templates × 3 columns)
- Figure 2: Two-tier benchmarking strategy diagram

---

### Section 5: Results (~4.5 pages)

**Structure:** One subsection per RQ. Each starts by restating the RQ, then presents data.

**5.1 RQ1: Build Performance** (1.5 pages)
- **M2 (Production build time):** Main results table (5 tools × 5 sizes), key findings
  - Crossover finding: esbuild fastest at <1,500 modules, Vite fastest at ≥1,500
  - Figure: Line chart of M2 vs project scale (5 lines, 5 data points each)
- **M1 (Dev cold start):** Limited to Vite/Webpack (Rspack all timeout), brief discussion
- **M3 (Incremental rebuild):** 3 sizes × 4 tools, watch-mode timeout finding at xl-5000
- **M4 (HMR latency):** 2 sizes × 3 tools, Rspack consistently fastest
- Box: "Finding 1: Tool selection for build speed depends on project scale..."

**5.2 RQ2: Output Quality** (1 page)
- **M5/M6 (Bundle size raw/gzip):** Table, all tools produce similar sizes at same scale
- **M7 (Tree-shaking effectiveness):** Percentage comparison across tools
- **M8 (Code splitting):** Chunk count comparison
- **M9 (Sourcemap coverage):** Brief note on validation pass rates
- Box: "Finding 2: Output quality differences are smaller than build speed differences..."

**5.3 RQ3: Resource Consumption & Scaling** (1.5 pages)
- **M10 (Peak memory RSS):** Table + line chart across scales
  - esbuild lowest across all scales (Go's efficient memory model)
  - esbuild anomaly at s-200 > m-500 (Go GC behavior — documented)
- **M11 (CPU time):** Table, Vite/esbuild lowest, Rollup/Webpack highest
- **M12 (Scaling regression):** 
  - ALL tools scale linearly (R²≥0.97)
  - Slope table: Vite +954ms/1000 modules vs Webpack +22,770ms/1000 modules
  - Figure: Scaling regression plot with 5 fitted lines
- Box: "Finding 3: Build time scales linearly, not logarithmically..."

**5.4 Tier 2: External Validation** (0.5 page)
- Bulletproof React results: rankings match Tier 1 for M2, M10, M11
- Table: Tier 1 (s-200) vs Tier 2 (bp-react) ranking comparison
- Minor M11 swap (vite↔rspack, 0.27s gap) — within noise

**Figures/Tables:**
- Table 6: M2 descriptive statistics (median, IQR) — 5 tools × 6 sizes
- Table 7: Kruskal-Wallis and pairwise significance summary
- Table 8: M5–M9 output quality metrics
- Table 9: M10/M11 resource consumption
- Table 10: Scaling regression coefficients (R², slope, best fit)
- Table 11: Tier 1 vs Tier 2 ranking comparison
- Figure 3: M2 production build time vs project scale (line chart)
- Figure 4: M10 peak memory vs project scale (line chart)
- Figure 5: Scaling regression with fitted lines

---

### Section 6: Discussion (~2.5 pages)

**6.1 Key Findings Summary** (0.5 page)
- 6 numbered findings from Results, synthesized
- "No clear winner" — depends on project scale and priorities

**6.2 Practical Implications** (1 page) ← **Crucial for JSS's "practice" focus**
- **Decision framework for practitioners:**
  - Small projects (<500 modules): esbuild (fastest build, lowest memory)
  - Medium projects (500–2,000): Vite (competitive build, best DX with HMR)
  - Large projects (>2,000): Vite (fastest build, Rust parallelism)
  - Webpack migration: Rspack as drop-in replacement (8.3× faster)
  - Budget-constrained CI: esbuild (lowest memory footprint)
- Table: Decision matrix (project size × priority → recommended tool)

**6.3 Architectural Insights** (0.5 page)
- Rust vs Go vs JavaScript: performance implications of implementation language
- Vite 8's Rolldown unification: quantified benefit of single-bundler architecture
- Rollup's scalability ceiling: TDZ analysis as a concrete limitation
- Watch-mode degradation: industry-wide gap at enterprise scale

**6.4 Comparison with Vendor Benchmarks** (0.5 page)
- Our results vs rspack-contrib/build-tools-performance
- Our results vs Rolldown official benchmarks
- Where grey literature matches/diverges from our findings
- Why vendor benchmarks underestimate differences (trivial projects)

**Figures/Tables:**
- Table 12: Practitioner decision matrix
- Table 13: Our results vs vendor benchmark comparison

---

### Section 7: Threats to Validity (~1.5 pages)

Follow standard 4-category structure (Wohlin et al., 2012):

**7.1 Internal Validity** (0.4 page)
- Single machine: controlled but non-generalizable to different hardware
- Run 1 cold-start effect: documented, median is robust
- Measurement noise: hyperfine provides statistical summary, we use 10+ runs

**7.2 External Validity** (0.4 page)
- Synthetic projects: two-tier design + tier comparison mitigates
- Single real-world project: acknowledged, future work to add more
- React+TypeScript only: most popular framework, but results may differ for Vue/Angular
- Tool versions pinned: results reflect specific versions at experiment time

**7.3 Construct Validity** (0.4 page)
- Metric selection: 11 metrics cover speed, quality, resources — but not DX, error messages, plugin ecosystem
- HMR measurement via console patterns: may miss sub-component updates
- Tree-shaking metric via dead code percentage: different tools may count differently

**7.4 Conclusion Validity** (0.3 page)
- Non-parametric tests: appropriate given non-normality
- Bonferroni correction: conservative — may miss small effects
- 17/205 non-significant pairs: all between adjacent-ranked tools, not a concern

---

### Section 8: Conclusion & Future Work (~0.5 page)

**Conclusion** (1 paragraph):
- Summarize what we did, key findings, practical takeaway

**Future Work** (enumerated):
1. Multi-platform benchmarking (Linux CI, ARM, cloud)
2. Turbopack when standalone production build is available
3. Longitudinal study tracking version-to-version improvements
4. Framework diversity: Vue, Angular, Svelte benchmarks
5. Additional Tier 2 projects for stronger external validity
6. Developer experience metrics (error message quality, config complexity)

---

## Writing Order

| Phase | Sections | Why This Order |
|-------|----------|---------------|
| 1 | §4 Study Design | Backbone — everything references this |
| 2 | §5 Results | Flows directly from §4 |
| 3 | §6 Discussion | Interprets §5 |
| 4 | §7 Threats to Validity | Anticipates reviewer objections |
| 5 | §3 Related Work | Positioning requires knowing what we found |
| 6 | §2 Background | Foundation for reader context |
| 7 | §1 Introduction | Written last so it accurately promises what we deliver |
| 8 | Abstract + Highlights | Compress the whole paper into 250 words + 5 bullets |

---

## Figures & Tables Inventory

| ID | Type | Section | Content |
|----|------|---------|---------|
| Table 1 | Table | §2.3 | Tool comparison matrix (5 tools × 6 columns) |
| Table 2 | Table | §3.4 | Our study vs existing benchmarks |
| Table 3 | Table | §4.3 | Tier 1 project specifications (5 sizes) |
| Table 4 | Table | §4.4 | Metric definitions (11 metrics) |
| Table 5 | Table | §4.3 | Component template distribution |
| Table 6 | Table | §5.1 | M2 descriptive stats (5 tools × 6 sizes) |
| Table 7 | Table | §5.1 | Significance summary (KW + pairwise) |
| Table 8 | Table | §5.2 | M5–M9 output quality metrics |
| Table 9 | Table | §5.3 | M10/M11 resource metrics |
| Table 10 | Table | §5.3 | Scaling regression coefficients |
| Table 11 | Table | §5.4 | Tier 1 vs Tier 2 ranking comparison |
| Table 12 | Table | §6.2 | Practitioner decision matrix |
| Table 13 | Table | §6.4 | Our results vs vendor benchmarks |
| Fig. 1 | Figure | §2.2 | Bundler architecture paradigms |
| Fig. 2 | Figure | §4.3 | Two-tier benchmarking strategy diagram |
| Fig. 3 | Figure | §5.1 | M2 build time vs project scale (line chart) |
| Fig. 4 | Figure | §5.3 | M10 memory vs project scale (line chart) |
| Fig. 5 | Figure | §5.3 | Scaling regression with fitted lines |

**Total: 13 tables + 5 figures = 18 visual elements**

---

## Hostile Reviewer Defense (Updated for JSS)

| Likely Criticism | Pre-emptive Defense | Where Addressed |
|-----------------|---------------------|-----------------|
| "Why not Turbopack?" | No stable standalone prod build; scoped out with rationale | §4.2 + §8 Future Work |
| "Only 10 runs per metric" | 27/27 KW significant with n=10. M3/M4 use 20 runs. Power sufficient. | §4.6 |
| "Synthetic projects aren't realistic" | Two-tier design: Tier 1 calibrated (50–150 LOC, 8 templates), Tier 2 validates on real OSS. Rankings match. | §4.3 + §5.4 |
| "Different tool configs = unfair" | All follow official documentation. Configs in replication package. | §4.2 + replication pkg |
| "Single machine" | Controlled environment. Acknowledged in threats. Future work: multi-platform. | §7.1 + §8 |
| "Vendor benchmarks already exist" | All vendor-maintained → bias risk. Trivial components. No statistical rigor. We are independent. | §3.2 |
| "Only React/TypeScript" | Most popular framework (controls variable). Acknowledged. Future work: Vue, Angular. | §7.2 |
| "Bonferroni is too conservative" | 188/205 still significant. Conservative = fewer false positives = stronger claims. | §7.4 |
| "esbuild memory anomaly suspicious" | Genuine finding: tight std, consistent across runs, Go GC behavior documented. | §5.3 + §6.3 |

---

## JSS-Specific Checklist (Pre-Submission)

- [ ] Abstract ≤ 250 words
- [ ] 5 highlights, each ≤ 85 characters
- [ ] 1–7 keywords
- [ ] Data availability statement included
- [ ] Generative AI use declaration
- [ ] Competing interests statement
- [ ] All claims backed by evidence (JSS requirement)
- [ ] Replication package URL (Zenodo DOI)
- [ ] Open Science Initiative participation indicated
- [ ] References include JSS/EMSE papers (shows venue awareness)
- [ ] ≤ 36 single-column pages
- [ ] Every figure/table referenced in text
- [ ] Every RQ has explicit answer in Results
- [ ] Effect sizes alongside p-values throughout
