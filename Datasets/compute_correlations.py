"""
CORA – Correlation Coefficient Computation
============================================
Reads every processed CSV and computes:
  1. Within-dataset Pearson correlation matrices (all numeric columns).
  2. A cross-dataset correlation matrix by merging key series on date
     (daily-frequency and monthly-frequency separately).
  3. Saves everything to  Datasets/correlations/

Run:  python Datasets/compute_correlations.py
"""

import warnings, os
import numpy as np
import pandas as pd
from pathlib import Path

warnings.filterwarnings("ignore", category=FutureWarning)

PROC_DIR = Path(__file__).parent / "processed"
OUT_DIR  = Path(__file__).parent / "correlations"
OUT_DIR.mkdir(exist_ok=True)

# ── 1.  Within-dataset correlation matrices ──────────────────────────────

def within_dataset_correlations():
    """Compute & save a Pearson correlation matrix for every processed CSV."""
    print("\n── Within-dataset correlation matrices ─────────────────────")
    for fp in sorted(PROC_DIR.glob("*.csv")):
        df = pd.read_csv(fp)
        num = df.select_dtypes(include="number")
        if num.shape[1] < 2:
            print(f"  skip {fp.name} (< 2 numeric cols)")
            continue
        corr = num.corr(method="pearson")
        out = OUT_DIR / f"corr_{fp.stem}.csv"
        corr.to_csv(out)
        print(f"  ✓ {fp.name:50s} → {corr.shape[0]}×{corr.shape[1]} matrix")

# ── 2.  Cross-dataset correlation (daily) ────────────────────────────────

def cross_dataset_daily():
    """
    Merge the daily-frequency datasets on date and compute the
    correlation matrix across all key series.
    """
    print("\n── Cross-dataset correlation (daily frequency) ────────────")

    # BSE SENSEX
    bse = pd.read_csv(PROC_DIR / "BSE_SENSEX_processed.csv", parse_dates=["Date"])
    bse.rename(columns={"Date": "date"}, inplace=True)
    bse = bse[["date", "Close", "log_Close", "log_return_Close"]].copy()
    bse.columns = ["date", "bse_close", "log_bse_close", "logret_bse_close"]

    # Daily market data (nifty, s&p500, gold, brent, usd/inr)
    dm = pd.read_csv(PROC_DIR / "daily_market_data_processed.csv", parse_dates=["date"])
    dm_cols = ["date",
               "nifty50_close", "sp500_close", "gold_close", "brent_close", "usd_inr_close",
               "log_nifty50_close", "log_sp500_close", "log_gold_close", "log_brent_close", "log_usd_inr_close",
               "log_return_nifty50_close", "log_return_sp500_close", "log_return_gold_close",
               "log_return_brent_close", "log_return_usd_inr_close"]
    dm = dm[[c for c in dm_cols if c in dm.columns]]

    # Crude oil
    co = pd.read_csv(PROC_DIR / "crude_oil_price_processed.csv", parse_dates=["date"])
    co = co[["date", "price", "log_price", "log_return_price"]].copy()
    co.columns = ["date", "crude_price", "log_crude_price", "logret_crude_price"]
    # Resample to daily (it's monthly – forward fill to daily for join)
    co = co.set_index("date").resample("D").ffill().reset_index()

    # DGS10
    dgs = pd.read_csv(PROC_DIR / "DGS10_processed.csv", parse_dates=["date"])
    dgs = dgs[["date", "DGS10", "log_DGS10", "log_return_DGS10"]]

    # DHHNGSP
    dhh = pd.read_csv(PROC_DIR / "DHHNGSP_processed.csv", parse_dates=["date"])
    dhh = dhh[["date", "DHHNGSP", "log_DHHNGSP", "log_return_DHHNGSP"]]

    # Merge all on date
    merged = bse
    for right in [dm, co, dgs, dhh]:
        merged = pd.merge(merged, right, on="date", how="outer")

    merged.sort_values("date", inplace=True)
    merged.set_index("date", inplace=True)
    merged = merged.ffill().bfill().dropna(axis=1, how="all")

    # ── Pearson correlation on log-level values ──
    log_cols  = [c for c in merged.columns if c.startswith("log_") and "return" not in c]
    logr_cols = [c for c in merged.columns if "log_return" in c or "logret" in c]
    raw_cols  = [c for c in merged.columns if not c.startswith("log") and c not in ["date"]]

    # Raw-level correlation
    corr_raw = merged[raw_cols].corr()
    corr_raw.to_csv(OUT_DIR / "cross_daily_corr_raw.csv")
    print(f"  ✓ cross_daily_corr_raw.csv              {corr_raw.shape[0]}×{corr_raw.shape[1]}")

    # Log-level correlation
    corr_log = merged[log_cols].corr()
    corr_log.to_csv(OUT_DIR / "cross_daily_corr_log.csv")
    print(f"  ✓ cross_daily_corr_log.csv              {corr_log.shape[0]}×{corr_log.shape[1]}")

    # Log-return correlation
    corr_logret = merged[logr_cols].corr()
    corr_logret.to_csv(OUT_DIR / "cross_daily_corr_log_returns.csv")
    print(f"  ✓ cross_daily_corr_log_returns.csv      {corr_logret.shape[0]}×{corr_logret.shape[1]}")

    # Save the merged daily dataset too
    merged.reset_index().to_csv(OUT_DIR / "merged_daily.csv", index=False)
    print(f"  ✓ merged_daily.csv                      {len(merged):,} rows × {len(merged.columns)} cols")

    return merged

# ── 3.  Cross-dataset correlation (monthly) ──────────────────────────────

def cross_dataset_monthly():
    """
    Use the monthly_macro_data (which already has nifty, s&p, gold, brent,
    usd/inr, CPI, unemployment, fed-funds, 10y yield) and merge in
    additional monthly series.
    """
    print("\n── Cross-dataset correlation (monthly frequency) ──────────")

    mm = pd.read_csv(PROC_DIR / "monthly_macro_data_processed.csv", parse_dates=["date"])

    # Bring in crude oil (already monthly)
    co = pd.read_csv(PROC_DIR / "crude_oil_price_processed.csv", parse_dates=["date"])
    co = co[["date", "price", "log_price", "log_return_price"]].copy()
    co.columns = ["date", "crude_price", "log_crude_price", "logret_crude_price"]
    co["date"] = co["date"].dt.to_period("M").dt.to_timestamp()

    # DHHNGSP – resample to monthly mean
    dhh = pd.read_csv(PROC_DIR / "DHHNGSP_processed.csv", parse_dates=["date"])
    dhh_m = dhh.set_index("date")[["DHHNGSP","log_DHHNGSP"]].resample("MS").mean().reset_index()
    dhh_m.rename(columns={"date": "date"}, inplace=True)

    # DGS10 – resample to monthly mean
    dgs = pd.read_csv(PROC_DIR / "DGS10_processed.csv", parse_dates=["date"])
    dgs_m = dgs.set_index("date")[["DGS10","log_DGS10"]].resample("MS").mean().reset_index()

    # BSE – resample to monthly last close
    bse = pd.read_csv(PROC_DIR / "BSE_SENSEX_processed.csv", parse_dates=["Date"])
    bse.rename(columns={"Date": "date"}, inplace=True)
    bse_m = bse.set_index("date")[["Close","log_Close"]].resample("MS").last().reset_index()
    bse_m.columns = ["date", "bse_close", "log_bse_close"]

    # Normalize monthly_macro date to month-start too
    mm["date"] = mm["date"].dt.to_period("M").dt.to_timestamp()

    merged = mm
    for right in [co, dhh_m, dgs_m, bse_m]:
        merged = pd.merge(merged, right, on="date", how="outer")
    merged.sort_values("date", inplace=True)
    merged.set_index("date", inplace=True)
    merged = merged.ffill().bfill().dropna(axis=1, how="all")

    num = merged.select_dtypes(include="number")
    log_cols  = [c for c in num.columns if c.startswith("log") and "return" not in c and "shifted" not in c]
    raw_cols  = [c for c in num.columns if not c.startswith("log")]
    logr_cols = [c for c in num.columns if "return" in c.lower() or "change" in c.lower()]

    corr_raw = num[raw_cols].corr()
    corr_raw.to_csv(OUT_DIR / "cross_monthly_corr_raw.csv")
    print(f"  ✓ cross_monthly_corr_raw.csv            {corr_raw.shape[0]}×{corr_raw.shape[1]}")

    corr_log = num[log_cols].corr() if log_cols else pd.DataFrame()
    if not corr_log.empty:
        corr_log.to_csv(OUT_DIR / "cross_monthly_corr_log.csv")
        print(f"  ✓ cross_monthly_corr_log.csv            {corr_log.shape[0]}×{corr_log.shape[1]}")

    if logr_cols:
        corr_logret = num[logr_cols].corr()
        corr_logret.to_csv(OUT_DIR / "cross_monthly_corr_log_returns.csv")
        print(f"  ✓ cross_monthly_corr_log_returns.csv    {corr_logret.shape[0]}×{corr_logret.shape[1]}")

    merged.reset_index().to_csv(OUT_DIR / "merged_monthly.csv", index=False)
    print(f"  ✓ merged_monthly.csv                    {len(merged):,} rows × {len(merged.columns)} cols")

    return merged

# ── 4.  Annual cross-dataset correlation ─────────────────────────────────

def cross_dataset_annual():
    """Merge annual-frequency datasets (india_macro, henry_hub)."""
    print("\n── Cross-dataset correlation (annual frequency) ───────────")

    im = pd.read_csv(PROC_DIR / "india_macro_worldbank_processed.csv")
    hh = pd.read_csv(PROC_DIR / "Henry_Hub_annual_processed.csv")
    hh.columns = ["Year", "henry_hub_price", "log_henry_hub", "logret_henry_hub"]

    merged = pd.merge(im, hh, on="Year", how="outer").sort_values("Year")
    merged.set_index("Year", inplace=True)
    merged = merged.ffill().bfill()

    num = merged.select_dtypes(include="number")
    corr = num.corr()
    corr.to_csv(OUT_DIR / "cross_annual_corr.csv")
    merged.reset_index().to_csv(OUT_DIR / "merged_annual.csv", index=False)
    print(f"  ✓ cross_annual_corr.csv                 {corr.shape[0]}×{corr.shape[1]}")
    print(f"  ✓ merged_annual.csv                     {len(merged):,} rows × {len(merged.columns)} cols")

# ── 5.  Pretty-print top correlations ────────────────────────────────────

def print_top_correlations(corr, title, n=15):
    """Print the top-N strongest (absolute) off-diagonal correlations."""
    # Get upper triangle (no diagonal)
    mask = np.triu(np.ones(corr.shape, dtype=bool), k=1)
    pairs = corr.where(mask).stack().reset_index()
    pairs.columns = ["var1", "var2", "corr"]
    pairs["abs_corr"] = pairs["corr"].abs()
    top = pairs.nlargest(n, "abs_corr")

    print(f"\n  Top-{n} correlations – {title}")
    print(f"  {'var1':40s} {'var2':40s} {'r':>8s}")
    print("  " + "-" * 90)
    for _, row in top.iterrows():
        print(f"  {row['var1']:40s} {row['var2']:40s} {row['corr']:+8.4f}")

# ── main ─────────────────────────────────────────────────────────────────

def main():
    print("=" * 80)
    print("CORA – Correlation Coefficient Computation")
    print("=" * 80)

    within_dataset_correlations()
    daily_merged   = cross_dataset_daily()
    monthly_merged = cross_dataset_monthly()
    cross_dataset_annual()

    # Show highlights
    print("\n" + "=" * 80)
    print("KEY FINDINGS")
    print("=" * 80)

    # Daily log-return correlations
    cr = pd.read_csv(OUT_DIR / "cross_daily_corr_log_returns.csv", index_col=0)
    print_top_correlations(cr, "Daily log-returns (cross-dataset)")

    # Monthly raw correlations
    cr = pd.read_csv(OUT_DIR / "cross_monthly_corr_raw.csv", index_col=0)
    print_top_correlations(cr, "Monthly raw values (cross-dataset)")

    # Annual
    cr = pd.read_csv(OUT_DIR / "cross_annual_corr.csv", index_col=0)
    print_top_correlations(cr, "Annual (India macro + Henry Hub)", n=10)

    n_files = len(list(OUT_DIR.glob("*.csv")))
    print(f"\n  Done – {n_files} correlation files written to {OUT_DIR.resolve()}")
    print("=" * 80)

if __name__ == "__main__":
    main()
