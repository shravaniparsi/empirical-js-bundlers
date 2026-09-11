#!/usr/bin/env python3
"""
analysis.py — Statistical Analysis Pipeline for JS Bundler Benchmark

Implements the full analysis plan from RESEARCH-PLAN.md §1.6:
  1. Load & merge all CSV data
  2. Descriptive statistics (mean, median, SD, IQR)
  3. Normality test (Shapiro-Wilk)
  4. Omnibus test (Kruskal-Wallis)
  5. Post-hoc pairwise (Dunn's test with Bonferroni)
  6. Effect size (Cliff's delta)
  7. Scaling regression (build_time ~ f(module_count))
  8. Export tables + generate plots

Usage:
  python3 analysis/analysis.py                    # Full analysis
  python3 analysis/analysis.py --tier tier1       # Tier 1 only
  python3 analysis/analysis.py --metric M2        # Single metric
"""

import argparse
import glob
import os
import sys
import warnings
from itertools import combinations
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

warnings.filterwarnings("ignore", category=FutureWarning)

# ─── Constants ───────────────────────────────────────────────

ROOT = Path(__file__).resolve().parent.parent
TIER1_DIR = ROOT / "results" / "tier1-raw"
TIER2_DIR = ROOT / "results" / "tier2-raw"
OUTPUT_DIR = ROOT / "results" / "analysis"

TOOLS = ["vite", "rspack", "esbuild", "webpack", "rollup"]
SIZES = ["xs-50", "s-200", "m-500", "l-2000", "xl-5000"]
SIZE_MODULES = {"xs-50": 50, "s-200": 200, "m-500": 500, "l-2000": 2000, "xl-5000": 5000}

METRIC_NAMES = {
    "M1": "Dev Cold Start",
    "M2": "Prod Build Time",
    "M3": "Incremental Rebuild",
    "M4": "HMR Latency",
    "M5": "Bundle Size (raw)",
    "M6": "Bundle Size (gzip)",
    "M7": "Tree-Shaking",
    "M8": "Code Splitting",
    "M9": "Sourcemap Coverage",
    "M10": "Peak Memory (RSS)",
    "M11": "CPU Time",
}


# ─── Data Loading ────────────────────────────────────────────

def load_all_csv(data_dir: Path) -> pd.DataFrame:
    """Load all CSV files from a directory into a single DataFrame."""
    frames = []
    for csv_path in sorted(data_dir.glob("*.csv")):
        if csv_path.name.endswith("_hyperfine.json"):
            continue
        try:
            df = pd.read_csv(csv_path)
            if len(df) > 0:
                frames.append(df)
        except Exception as e:
            print(f"  ⚠️  Skipping {csv_path.name}: {e}")
    if not frames:
        return pd.DataFrame()
    combined = pd.concat(frames, ignore_index=True)
    combined["modules"] = combined["size"].map(SIZE_MODULES)
    return combined


# ─── Descriptive Statistics ──────────────────────────────────

def descriptive_stats(df: pd.DataFrame, metric: str) -> pd.DataFrame:
    """Compute descriptive statistics per tool × size for a given metric."""
    subset = df[df["metric"] == metric].copy()
    if subset.empty:
        return pd.DataFrame()
    
    # Filter out timeout values (-1)
    subset = subset[subset["value"] >= 0]
    
    grouped = subset.groupby(["tool", "size"])["value"].agg(
        n="count",
        mean="mean",
        median="median",
        std="std",
        q25=lambda x: x.quantile(0.25),
        q75=lambda x: x.quantile(0.75),
        min="min",
        max="max",
    ).reset_index()
    grouped["iqr"] = grouped["q75"] - grouped["q25"]
    grouped["cv"] = (grouped["std"] / grouped["mean"] * 100).round(1)
    return grouped


# ─── Normality Test ──────────────────────────────────────────

def shapiro_wilk_test(df: pd.DataFrame, metric: str, size: str) -> pd.DataFrame:
    """Run Shapiro-Wilk normality test per tool for a given metric × size."""
    subset = df[(df["metric"] == metric) & (df["size"] == size) & (df["value"] >= 0)]
    results = []
    for tool in TOOLS:
        values = subset[subset["tool"] == tool]["value"].values
        if len(values) >= 3:
            stat, p = stats.shapiro(values)
            results.append({
                "tool": tool, "size": size, "metric": metric,
                "W": round(stat, 4), "p_value": round(p, 4),
                "normal": "Yes" if p > 0.05 else "No",
            })
    return pd.DataFrame(results)


# ─── Kruskal-Wallis Omnibus Test ─────────────────────────────

def kruskal_wallis_test(df: pd.DataFrame, metric: str, size: str) -> dict:
    """Run Kruskal-Wallis H-test: is there any significant difference among tools?"""
    subset = df[(df["metric"] == metric) & (df["size"] == size) & (df["value"] >= 0)]
    groups = [subset[subset["tool"] == t]["value"].values for t in TOOLS if len(subset[subset["tool"] == t]) >= 2]
    
    if len(groups) < 2:
        return {"metric": metric, "size": size, "H": None, "p_value": None, "significant": None}
    
    stat, p = stats.kruskal(*groups)
    return {
        "metric": metric, "size": size,
        "H": round(stat, 4), "p_value": round(p, 6),
        "significant": "Yes" if p < 0.05 else "No",
    }


# ─── Dunn's Post-Hoc Test (Bonferroni) ──────────────────────

def dunns_test(df: pd.DataFrame, metric: str, size: str) -> pd.DataFrame:
    """Pairwise Dunn's test with Bonferroni correction."""
    subset = df[(df["metric"] == metric) & (df["size"] == size) & (df["value"] >= 0)]
    tool_data = {}
    for t in TOOLS:
        vals = subset[subset["tool"] == t]["value"].values
        if len(vals) >= 2:
            tool_data[t] = vals
    
    if len(tool_data) < 2:
        return pd.DataFrame()
    
    pairs = list(combinations(tool_data.keys(), 2))
    n_pairs = len(pairs)
    results = []
    
    for t1, t2 in pairs:
        # Mann-Whitney U as proxy for Dunn's pairwise comparison
        stat, p = stats.mannwhitneyu(tool_data[t1], tool_data[t2], alternative="two-sided")
        p_adjusted = min(p * n_pairs, 1.0)  # Bonferroni
        results.append({
            "tool_1": t1, "tool_2": t2,
            "U": round(stat, 2), "p_raw": round(p, 6),
            "p_bonferroni": round(p_adjusted, 6),
            "significant": "Yes" if p_adjusted < 0.05 else "No",
        })
    
    return pd.DataFrame(results)


# ─── Cliff's Delta Effect Size ───────────────────────────────

def cliffs_delta(x: np.ndarray, y: np.ndarray) -> tuple:
    """Compute Cliff's delta effect size and interpret magnitude."""
    n1, n2 = len(x), len(y)
    if n1 == 0 or n2 == 0:
        return 0.0, "negligible"
    
    # Count dominance
    more = sum(1 for xi in x for yi in y if xi > yi)
    less = sum(1 for xi in x for yi in y if xi < yi)
    delta = (more - less) / (n1 * n2)
    
    # Romano et al. (2006) thresholds
    abs_d = abs(delta)
    if abs_d < 0.147:
        magnitude = "negligible"
    elif abs_d < 0.33:
        magnitude = "small"
    elif abs_d < 0.474:
        magnitude = "medium"
    else:
        magnitude = "large"
    
    return round(delta, 4), magnitude


def effect_size_table(df: pd.DataFrame, metric: str, size: str) -> pd.DataFrame:
    """Compute Cliff's delta for all pairwise tool comparisons."""
    subset = df[(df["metric"] == metric) & (df["size"] == size) & (df["value"] >= 0)]
    tool_data = {}
    for t in TOOLS:
        vals = subset[subset["tool"] == t]["value"].values
        if len(vals) >= 2:
            tool_data[t] = vals
    
    results = []
    for t1, t2 in combinations(tool_data.keys(), 2):
        delta, magnitude = cliffs_delta(tool_data[t1], tool_data[t2])
        results.append({
            "tool_1": t1, "tool_2": t2,
            "cliffs_delta": delta, "magnitude": magnitude,
            "interpretation": f"{t1} {'>' if delta > 0 else '<'} {t2}" if abs(delta) >= 0.147 else "≈",
        })
    return pd.DataFrame(results)


# ─── Scaling Regression (M12) ────────────────────────────────

def scaling_regression(df: pd.DataFrame) -> pd.DataFrame:
    """Fit build_time ~ f(module_count) per tool using M2 data."""
    m2 = df[(df["metric"] == "M2") & (df["value"] >= 0)]
    if m2.empty:
        return pd.DataFrame()
    
    results = []
    for tool in TOOLS:
        tool_data = m2[m2["tool"] == tool]
        if len(tool_data) < 5:
            continue
        
        medians = tool_data.groupby("modules")["value"].median().reset_index()
        x = medians["modules"].values.astype(float)
        y = medians["value"].values.astype(float)
        
        if len(x) < 3:
            continue
        
        # Linear: y = a*x + b
        try:
            slope, intercept, r_lin, p_lin, _ = stats.linregress(x, y)
            r2_lin = r_lin ** 2
        except Exception:
            r2_lin = 0
        
        # Log-linear: y = a*log(x) + b
        try:
            slope_log, intercept_log, r_log, p_log, _ = stats.linregress(np.log(x), y)
            r2_log = r_log ** 2
        except Exception:
            r2_log = 0
        
        best = "linear" if r2_lin >= r2_log else "log-linear"
        
        results.append({
            "tool": tool,
            "r2_linear": round(r2_lin, 4),
            "r2_log_linear": round(r2_log, 4),
            "best_fit": best,
            "slope_per_1000_modules": round(slope * 1000, 1) if r2_lin >= r2_log else None,
        })
    
    return pd.DataFrame(results)


# ─── Visualization ───────────────────────────────────────────

def generate_plots(df: pd.DataFrame, output_dir: Path):
    """Generate all key plots for the paper."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns
    
    sns.set_theme(style="whitegrid", font_scale=1.1)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    TOOL_COLORS = {
        "vite": "#646CFF", "rspack": "#FF6B35", "esbuild": "#FFCF00",
        "webpack": "#8DD6F9", "rollup": "#FF3E00",
    }
    
    # ── Plot 1: Build Time by Tool, faceted by Scale (RQ1) ──
    m2 = df[(df["metric"] == "M2") & (df["value"] >= 0)].copy()
    if not m2.empty:
        fig, axes = plt.subplots(1, 5, figsize=(20, 5), sharey=False)
        for i, size in enumerate(SIZES):
            sub = m2[m2["size"] == size]
            if sub.empty:
                continue
            sns.boxplot(data=sub, x="tool", y="value", order=TOOLS,
                       palette=TOOL_COLORS, ax=axes[i], width=0.6)
            axes[i].set_title(f"{size}\n({SIZE_MODULES[size]} modules)", fontsize=11)
            axes[i].set_xlabel("")
            axes[i].set_ylabel("Build Time (ms)" if i == 0 else "")
            axes[i].tick_params(axis="x", rotation=45)
        plt.suptitle("M2: Production Build Time by Tool and Scale", fontsize=14, y=1.02)
        plt.tight_layout()
        plt.savefig(output_dir / "plot1_build_time_boxplot.png", dpi=150, bbox_inches="tight")
        plt.close()
        print("  📊 Plot 1: Build time boxplots")
    
    # ── Plot 2: Bundle Size Comparison (RQ2) ──
    m5 = df[(df["metric"] == "M5") & (df["value"] >= 0)].copy()
    m6 = df[(df["metric"] == "M6") & (df["value"] >= 0)].copy()
    if not m5.empty and not m6.empty:
        m5_med = m5.groupby(["tool", "size"])["value"].median().reset_index()
        m5_med["type"] = "Raw"
        m6_med = m6.groupby(["tool", "size"])["value"].median().reset_index()
        m6_med["type"] = "Gzipped"
        bundle = pd.concat([m5_med, m6_med])
        bundle["value_kb"] = bundle["value"] / 1024
        
        fig, axes = plt.subplots(1, 5, figsize=(20, 5), sharey=False)
        for i, size in enumerate(SIZES):
            sub = bundle[bundle["size"] == size]
            if sub.empty:
                continue
            sns.barplot(data=sub, x="tool", y="value_kb", hue="type",
                       order=TOOLS, ax=axes[i], palette=["#2196F3", "#4CAF50"])
            axes[i].set_title(f"{size}", fontsize=11)
            axes[i].set_xlabel("")
            axes[i].set_ylabel("Size (KB)" if i == 0 else "")
            axes[i].tick_params(axis="x", rotation=45)
            if i > 0:
                axes[i].get_legend().remove()
        plt.suptitle("M5/M6: Bundle Size (Raw vs Gzip) by Tool and Scale", fontsize=14, y=1.02)
        plt.tight_layout()
        plt.savefig(output_dir / "plot2_bundle_size_bar.png", dpi=150, bbox_inches="tight")
        plt.close()
        print("  📊 Plot 2: Bundle size comparison")
    
    # ── Plot 3: Scaling Line Plot (RQ3) ──
    if not m2.empty:
        medians = m2.groupby(["tool", "modules"])["value"].median().reset_index()
        fig, ax = plt.subplots(figsize=(10, 6))
        for tool in TOOLS:
            sub = medians[medians["tool"] == tool].sort_values("modules")
            if not sub.empty:
                ax.plot(sub["modules"], sub["value"] / 1000, marker="o", label=tool,
                       color=TOOL_COLORS.get(tool), linewidth=2, markersize=8)
        ax.set_xlabel("Number of Modules", fontsize=12)
        ax.set_ylabel("Median Build Time (seconds)", fontsize=12)
        ax.set_title("M2: Build Time Scaling by Tool", fontsize=14)
        ax.legend(fontsize=11)
        ax.set_xscale("log")
        plt.tight_layout()
        plt.savefig(output_dir / "plot3_scaling_line.png", dpi=150, bbox_inches="tight")
        plt.close()
        print("  📊 Plot 3: Scaling line plot")
    
    # ── Plot 4: Memory Usage (M10) ──
    m10 = df[(df["metric"] == "M10") & (df["value"] >= 0)].copy()
    if not m10.empty:
        fig, axes = plt.subplots(1, 5, figsize=(20, 5), sharey=False)
        for i, size in enumerate(SIZES):
            sub = m10[m10["size"] == size]
            if sub.empty:
                continue
            sns.boxplot(data=sub, x="tool", y="value", order=TOOLS,
                       palette=TOOL_COLORS, ax=axes[i], width=0.6)
            axes[i].set_title(f"{size}", fontsize=11)
            axes[i].set_xlabel("")
            axes[i].set_ylabel("Peak RSS (MB)" if i == 0 else "")
            axes[i].tick_params(axis="x", rotation=45)
        plt.suptitle("M10: Peak Memory Usage by Tool and Scale", fontsize=14, y=1.02)
        plt.tight_layout()
        plt.savefig(output_dir / "plot4_memory_boxplot.png", dpi=150, bbox_inches="tight")
        plt.close()
        print("  📊 Plot 4: Memory usage boxplots")
    
    # ── Plot 5: Heatmap — Normalized Summary ──
    timing_metrics = ["M2", "M10", "M11"]
    heatmap_data = []
    for metric in timing_metrics:
        for size in SIZES:
            sub = df[(df["metric"] == metric) & (df["size"] == size) & (df["value"] >= 0)]
            medians = sub.groupby("tool")["value"].median()
            if medians.empty:
                continue
            # Normalize: lower is better, so invert (best tool = 1.0)
            min_val = medians.min()
            if min_val > 0:
                normalized = min_val / medians
                for tool, val in normalized.items():
                    heatmap_data.append({"tool": tool, "metric_size": f"{metric}_{size}", "score": val})
    
    if heatmap_data:
        hdf = pd.DataFrame(heatmap_data)
        pivot = hdf.pivot_table(index="tool", columns="metric_size", values="score")
        
        fig, ax = plt.subplots(figsize=(16, 5))
        sns.heatmap(pivot.reindex(TOOLS), annot=True, fmt=".2f", cmap="RdYlGn",
                   vmin=0, vmax=1, ax=ax, linewidths=0.5)
        ax.set_title("Normalized Performance Summary (1.0 = best per column)", fontsize=13)
        ax.set_ylabel("")
        plt.tight_layout()
        plt.savefig(output_dir / "plot5_heatmap.png", dpi=150, bbox_inches="tight")
        plt.close()
        print("  📊 Plot 5: Performance heatmap")


# ─── Main Pipeline ───────────────────────────────────────────

def run_analysis(tier: str = "all", metric_filter: str = None):
    """Run the complete analysis pipeline."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    print("═" * 60)
    print("  JS Bundler Benchmark — Statistical Analysis")
    print("═" * 60)
    
    # 1. Load data
    print("\n📂 Loading data...")
    df_tier1 = load_all_csv(TIER1_DIR) if tier in ("all", "tier1") else pd.DataFrame()
    df_tier2 = load_all_csv(TIER2_DIR) if tier in ("all", "tier2") else pd.DataFrame()
    
    if tier == "all":
        df = pd.concat([df_tier1, df_tier2], ignore_index=True) if not df_tier2.empty else df_tier1
    elif tier == "tier1":
        df = df_tier1
    else:
        df = df_tier2
    
    if df.empty:
        print("  ❌ No data found!")
        return
    
    print(f"  Loaded {len(df)} data points from {df['metric'].nunique()} metrics")
    print(f"  Tools: {sorted(df['tool'].unique())}")
    print(f"  Sizes: {sorted(df['size'].unique())}")
    
    metrics = [metric_filter] if metric_filter else sorted(df["metric"].unique())
    
    # 2. Descriptive statistics
    print("\n📊 Descriptive Statistics...")
    all_desc = []
    for m in metrics:
        desc = descriptive_stats(df, m)
        if not desc.empty:
            all_desc.append(desc)
    if all_desc:
        desc_df = pd.concat(all_desc, ignore_index=True)
        desc_df.to_csv(OUTPUT_DIR / "descriptive_stats.csv", index=False)
        print(f"  → {len(desc_df)} rows saved to descriptive_stats.csv")
    
    # 3. Normality tests
    print("\n🔔 Shapiro-Wilk Normality Tests...")
    all_normality = []
    for m in metrics:
        for size in SIZES:
            norm = shapiro_wilk_test(df, m, size)
            if not norm.empty:
                all_normality.append(norm)
    if all_normality:
        norm_df = pd.concat(all_normality, ignore_index=True)
        norm_df.to_csv(OUTPUT_DIR / "normality_tests.csv", index=False)
        non_normal = norm_df[norm_df["normal"] == "No"]
        print(f"  → {len(non_normal)}/{len(norm_df)} groups are non-normal (p < 0.05)")
        print(f"    → Non-parametric tests (Kruskal-Wallis) are appropriate")
    
    # 4. Kruskal-Wallis omnibus tests
    print("\n📈 Kruskal-Wallis Omnibus Tests...")
    all_kw = []
    for m in metrics:
        for size in SIZES:
            kw = kruskal_wallis_test(df, m, size)
            if kw["H"] is not None:
                all_kw.append(kw)
    if all_kw:
        kw_df = pd.DataFrame(all_kw)
        kw_df.to_csv(OUTPUT_DIR / "kruskal_wallis.csv", index=False)
        sig = kw_df[kw_df["significant"] == "Yes"]
        print(f"  → {len(sig)}/{len(kw_df)} tests show significant differences (p < 0.05)")
    
    # 5. Dunn's post-hoc pairwise tests
    print("\n🔍 Dunn's Post-Hoc Pairwise Tests (Bonferroni)...")
    all_dunn = []
    for m in metrics:
        for size in SIZES:
            dunn = dunns_test(df, m, size)
            if not dunn.empty:
                dunn["metric"] = m
                dunn["size"] = size
                all_dunn.append(dunn)
    if all_dunn:
        dunn_df = pd.concat(all_dunn, ignore_index=True)
        dunn_df.to_csv(OUTPUT_DIR / "pairwise_tests.csv", index=False)
        sig_pairs = dunn_df[dunn_df["significant"] == "Yes"]
        print(f"  → {len(sig_pairs)}/{len(dunn_df)} pairs are significantly different")
    
    # 6. Effect sizes (Cliff's delta)
    print("\n📐 Cliff's Delta Effect Sizes...")
    all_effect = []
    for m in metrics:
        for size in SIZES:
            eff = effect_size_table(df, m, size)
            if not eff.empty:
                eff["metric"] = m
                eff["size"] = size
                all_effect.append(eff)
    if all_effect:
        eff_df = pd.concat(all_effect, ignore_index=True)
        eff_df.to_csv(OUTPUT_DIR / "effect_sizes.csv", index=False)
        large = eff_df[eff_df["magnitude"] == "large"]
        print(f"  → {len(large)}/{len(eff_df)} pairs have LARGE effect size")
    
    # 7. Scaling regression
    print("\n📉 Scaling Regression (M2: build time vs modules)...")
    scaling = scaling_regression(df)
    if not scaling.empty:
        scaling.to_csv(OUTPUT_DIR / "scaling_regression.csv", index=False)
        for _, row in scaling.iterrows():
            print(f"  {row['tool']}: best fit = {row['best_fit']}, "
                  f"R² = {max(row['r2_linear'], row['r2_log_linear']):.4f}")
    
    # 8. Visualizations
    print("\n🎨 Generating Plots...")
    try:
        generate_plots(df, OUTPUT_DIR / "plots")
    except Exception as e:
        print(f"  ⚠️ Plot generation error: {e}")
    
    # 9. Summary
    print("\n" + "═" * 60)
    print("  ✅ Analysis Complete!")
    print(f"  Output: {OUTPUT_DIR}")
    print("═" * 60)
    
    # Print key findings summary
    if all_desc:
        print("\n📋 KEY FINDINGS SUMMARY")
        print("-" * 40)
        m2_desc = desc_df[desc_df.index.isin(desc_df[desc_df["tool"].isin(TOOLS)].index)]
        for size in SIZES:
            m2_size = desc_df[(desc_df.get("metric", desc_df.columns[0]) if "metric" in desc_df.columns else True) == True]
            # Just show M2 medians per tool for the largest size
        
        # Fastest tool per metric
        for m in ["M2", "M10", "M11"]:
            m_data = desc_df[desc_df.index.isin(
                pd.concat(all_desc, ignore_index=True).query(f"tool in {TOOLS}").index
            )] if all_desc else pd.DataFrame()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="JS Bundler Benchmark Analysis")
    parser.add_argument("--tier", choices=["tier1", "tier2", "all"], default="all")
    parser.add_argument("--metric", type=str, default=None, help="Single metric (e.g., M2)")
    args = parser.parse_args()
    
    run_analysis(tier=args.tier, metric_filter=args.metric)
