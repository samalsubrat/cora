"""
CORA – Export processed data to JSON for the React/Electron app.
================================================================
Reads processed CSVs + correlation matrices and writes JSON files
to  app/public/data/  so the frontend can fetch them directly.

Run:  python Datasets/export_to_json.py
"""

import json, warnings
import numpy as np
import pandas as pd
from pathlib import Path

warnings.filterwarnings("ignore")

PROC_DIR = Path(__file__).parent / "processed"
CORR_DIR = Path(__file__).parent / "correlations"
OUT_DIR  = Path(__file__).parent.parent / "app" / "public" / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)

def save_json(obj, name):
    fp = OUT_DIR / name
    with open(fp, "w") as f:
        json.dump(obj, f, default=str, allow_nan=False)
    print(f"  ✓ {name}")

# ── 1. Dashboard KPIs ────────────────────────────────────────────────────

def export_dashboard():
    mm = pd.read_csv(PROC_DIR / "monthly_macro_data_processed.csv", parse_dates=["date"])
    mm.sort_values("date", inplace=True)

    # Latest row
    latest = mm.iloc[-1]
    prev   = mm.iloc[-2]

    def pct_change(cur, prv):
        if prv == 0: return 0
        return round(((cur - prv) / abs(prv)) * 100, 2)

    kpis = []
    kpi_defs = [
        ("Nifty 50",       "nifty50_close",  "",        "INR"),
        ("S&P 500",        "sp500_close",    "",        "USD"),
        ("Gold",           "gold_close",     "",        "USD/oz"),
        ("Brent Crude",    "brent_close",    "",        "USD/bbl"),
        ("USD/INR",        "usd_inr_close",  "",        ""),
        ("US CPI Index",   "us_cpi_index",   "",        ""),
        ("US 10Y Yield",   "us_10y_yield",   "%",       ""),
        ("Fed Funds Rate", "us_fed_funds_rate", "%",    ""),
    ]

    # Sparkline: last 12 months normalised to 0-100
    for label, col, suffix, unit in kpi_defs:
        vals = mm[col].tail(12).tolist()
        mn, mx = min(vals), max(vals)
        bars = [int(((v - mn) / (mx - mn)) * 100) if mx > mn else 50 for v in vals]
        ch = pct_change(latest[col], prev[col])
        trend = "up" if ch > 0.05 else ("down" if ch < -0.05 else "flat")
        kpis.append({
            "label": label,
            "value": round(float(latest[col]), 2),
            "unit": unit,
            "suffix": suffix,
            "change": f"{'+' if ch > 0 else ''}{ch}%",
            "trend": trend,
            "bars": bars,
        })

    # Top correlation pairs from monthly raw
    corr = pd.read_csv(CORR_DIR / "cross_monthly_corr_raw.csv", index_col=0)
    mask = np.triu(np.ones(corr.shape, dtype=bool), k=1)
    pairs = corr.where(mask).stack().reset_index()
    pairs.columns = ["var1", "var2", "corr"]
    pairs["abs_corr"] = pairs["corr"].abs()
    top = pairs.nlargest(20, "abs_corr")

    corr_pairs = []
    for _, row in top.iterrows():
        c = float(row["corr"])
        corr_pairs.append({
            "var1": row["var1"],
            "var2": row["var2"],
            "corr": round(c, 4),
        })

    save_json({"kpis": kpis, "correlationPairs": corr_pairs, "lastDate": str(latest["date"].date())}, "dashboard.json")

# ── 2. Heatmap data ──────────────────────────────────────────────────────

def export_heatmap():
    for label, fname in [
        ("daily_raw",        "cross_daily_corr_raw.csv"),
        ("daily_log",        "cross_daily_corr_log.csv"),
        ("daily_log_returns","cross_daily_corr_log_returns.csv"),
        ("monthly_raw",      "cross_monthly_corr_raw.csv"),
        ("monthly_log",      "cross_monthly_corr_log.csv"),
        ("monthly_log_returns","cross_monthly_corr_log_returns.csv"),
    ]:
        fp = CORR_DIR / fname
        if not fp.exists():
            continue
        corr = pd.read_csv(fp, index_col=0)
        assets = list(corr.columns)
        matrix = corr.values.tolist()
        # Round values
        matrix = [[round(v, 4) if not np.isnan(v) else 0 for v in row] for row in matrix]
        save_json({"assets": assets, "matrix": matrix, "label": label}, f"heatmap_{label}.json")

# ── 3. Rolling correlation time-series ───────────────────────────────────

def export_rolling():
    merged = pd.read_csv(CORR_DIR / "merged_daily.csv", parse_dates=["date"])
    merged.sort_values("date", inplace=True)
    merged.set_index("date", inplace=True)

    # Identify close-price columns
    close_cols = [c for c in merged.columns if c.endswith("_close") and not c.startswith("log")]
    if not close_cols:
        close_cols = [c for c in merged.columns if "close" in c.lower() or "price" in c.lower() or "DGS10" in c or "DHHNGSP" in c]
        close_cols = [c for c in close_cols if not c.startswith("log")]

    # Compute rolling correlations for all unique pairs, multiple windows
    windows = {"30D": 30, "60D": 60, "90D": 90, "180D": 180}
    all_pairs = []
    pair_labels = []

    for i in range(len(close_cols)):
        for j in range(i + 1, len(close_cols)):
            a, b = close_cols[i], close_cols[j]
            pair_labels.append(f"{a} / {b}")
            pair_data = {"pair": f"{a} / {b}", "a": a, "b": b}
            for wlabel, wsize in windows.items():
                roll = merged[a].rolling(wsize).corr(merged[b])
                # Downsample to weekly for lighter JSON
                roll_w = roll.resample("W").last().dropna()
                pair_data[wlabel] = [
                    {"date": str(d.date()), "corr": round(float(v), 4)}
                    for d, v in roll_w.items()
                    if np.isfinite(v)
                ]
            # Current correlation (latest 60-day)
            cur = merged[a].tail(60).corr(merged[b])
            pair_data["current"] = round(float(cur), 4) if np.isfinite(cur) else 0
            all_pairs.append(pair_data)

    save_json({"pairs": all_pairs, "assets": close_cols}, "rolling_correlations.json")

# ── 4. Cluster data ─────────────────────────────────────────────────────

def export_clusters():
    from scipy.cluster.hierarchy import linkage, fcluster
    from scipy.spatial.distance import squareform

    corr = pd.read_csv(CORR_DIR / "cross_monthly_corr_raw.csv", index_col=0)
    # Distance = 1 - |corr|
    dist = 1 - corr.abs()
    np.fill_diagonal(dist.values, 0)
    # Make symmetric & fix tiny floating-point negatives
    dist = (dist + dist.T) / 2
    dist = dist.clip(lower=0)

    condensed = squareform(dist.values)
    Z = linkage(condensed, method="ward")
    n_clusters = 3
    labels = fcluster(Z, t=n_clusters, criterion="maxclust")

    assets = list(corr.columns)
    clusters = []
    colors = ["primary", "amber", "emerald"]
    names = ["Equity & Currency Linked", "Commodity Linked", "Macro / Rates Linked"]

    for cid in range(1, n_clusters + 1):
        members = [assets[i] for i, l in enumerate(labels) if l == cid]
        # Avg intra-cluster correlation
        sub = corr.loc[members, members]
        mask = np.triu(np.ones(sub.shape, dtype=bool), k=1)
        avg_corr = float(sub.where(mask).stack().mean()) if len(members) > 1 else 1.0

        clusters.append({
            "id": cid,
            "name": names[cid - 1] if cid <= len(names) else f"Cluster {cid}",
            "color": colors[cid - 1] if cid <= len(colors) else "slate",
            "avgCorr": round(avg_corr, 4),
            "members": members,
        })

    # Dendrogram data (simplified)
    dendro = {
        "merge": Z[:, :2].astype(int).tolist(),
        "distances": [round(d, 4) for d in Z[:, 2].tolist()],
        "counts": Z[:, 3].astype(int).tolist(),
    }

    save_json({"clusters": clusters, "dendrogram": dendro, "assets": assets}, "clusters.json")

# ── 5. Within-dataset correlations (for per-dataset heatmaps) ────────────

def export_within_dataset():
    results = {}
    for fp in sorted(CORR_DIR.glob("corr_*_processed.csv")):
        corr = pd.read_csv(fp, index_col=0)
        name = fp.stem.replace("corr_", "").replace("_processed", "")
        assets = list(corr.columns)
        matrix = [[round(v, 4) if not np.isnan(v) else 0 for v in row] for row in corr.values.tolist()]
        results[name] = {"assets": assets, "matrix": matrix}

    save_json(results, "within_dataset_correlations.json")

# ── main ─────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("CORA – Exporting data to app/public/data/")
    print("=" * 60)
    export_dashboard()
    export_heatmap()
    export_rolling()
    export_clusters()
    export_within_dataset()
    n = len(list(OUT_DIR.glob("*.json")))
    print(f"\n  Done – {n} JSON files in {OUT_DIR.resolve()}")

if __name__ == "__main__":
    main()
