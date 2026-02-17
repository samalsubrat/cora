"""
CORA – Raw-dataset preprocessing
=================================
For every raw CSV this script:
  1. Parses dates and numeric columns.
  2. Handles missing / placeholder values (., empty, NaN).
  3. Computes **log-transformed** values for all numeric columns
     (natural log).  For price / index series it also computes
     **log-returns**  ln(Xt / Xt-1).
  4. Forward-fills then backward-fills any remaining NaN gaps
     and drops rows that are still incomplete.
  5. Saves cleaned DataFrames to  Datasets/processed/

Run:  python Datasets/preprocess.py
"""

import os, sys
import numpy as np
import pandas as pd
from pathlib import Path

RAW_DIR   = Path(__file__).parent / "raw"
OUT_DIR   = Path(__file__).parent / "processed"
OUT_DIR.mkdir(exist_ok=True)

# ── helpers ──────────────────────────────────────────────────────────────
def coerce_numeric(df, cols=None):
    """Convert selected columns (default: all non-date) to float."""
    if cols is None:
        cols = df.select_dtypes(exclude=["datetime64[ns]", "datetime64[ns, UTC]"]).columns
    for c in cols:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    return df

def add_log_values(df, cols):
    """Add ln(x) columns for every numeric column in *cols*."""
    for c in cols:
        valid = df[c] > 0
        df[f"log_{c}"] = np.nan
        df.loc[valid, f"log_{c}"] = np.log(df.loc[valid, c])
    return df

def add_log_returns(df, cols):
    """Add ln(Xt/Xt-1) columns for every numeric column in *cols*."""
    for c in cols:
        ratio = df[c] / df[c].shift(1)
        valid = ratio > 0
        df[f"log_return_{c}"] = np.nan
        df.loc[valid, f"log_return_{c}"] = np.log(ratio[valid])
    return df

def fill_missing(df):
    """Forward-fill → backward-fill → drop anything still NaN."""
    num_cols = df.select_dtypes(include="number").columns
    df[num_cols] = df[num_cols].ffill().bfill()
    return df

def summarise(name, df):
    """Print a compact summary after processing."""
    n_missing = df.isnull().sum().sum()
    print(f"  ✓ {name:45s}  rows={len(df):>7,}  cols={len(df.columns):>3}  NaN_remaining={n_missing}")

# ── per-dataset loaders / processors ─────────────────────────────────────

def process_bse_sensex():
    fp = RAW_DIR / "BSE SENSEX.csv"
    df = pd.read_csv(fp)
    df["Date"] = pd.to_datetime(df["Date"], format="mixed", dayfirst=True)
    df.sort_values("Date", inplace=True)
    df.reset_index(drop=True, inplace=True)
    price_cols = ["Open", "High", "Low", "Close"]
    df = coerce_numeric(df, price_cols)
    df = add_log_values(df, price_cols)
    df = add_log_returns(df, price_cols)
    df = fill_missing(df)
    summarise("BSE_SENSEX", df)
    df.to_csv(OUT_DIR / "BSE_SENSEX_processed.csv", index=False)
    return df

def process_cpi():
    fp = RAW_DIR / "CPI_dataset.csv"
    # File has an unusual structure – first row has metadata in the header
    df = pd.read_csv(fp, header=None)
    # row 0 is: consumer_price_index_item, month_of_forecast, year_of_forecast, year_being_forecast
    # The actual data rows are: item, month, year_of_forecast, year_being_forecast, attribute, value
    # Let's assign column names
    df.columns = ["item", "month", "year_of_forecast", "year_being_forecast", "attribute", "value"]
    # Drop the header row if present
    df = df[df["item"].str.strip() != "consumer_price_index_item"].copy()
    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    df["year_of_forecast"] = pd.to_numeric(df["year_of_forecast"], errors="coerce")
    df["year_being_forecast"] = pd.to_numeric(df["year_being_forecast"], errors="coerce")
    # For CPI we take the midpoint forecasts and pivot by item
    mid = df[df["attribute"].str.contains("Mid point", case=False, na=False)].copy()
    mid = mid.dropna(subset=["value"])
    # Create a date proxy from month + year_of_forecast
    month_map = {m: i for i, m in enumerate(
        ["January","February","March","April","May","June",
         "July","August","September","October","November","December"], 1)}
    mid["month_num"] = mid["month"].str.strip().map(month_map)
    mid["date"] = pd.to_datetime(
        mid["year_of_forecast"].astype(int).astype(str) + "-" +
        mid["month_num"].astype(int).astype(str).str.zfill(2) + "-01",
        errors="coerce"
    )
    pivot = mid.pivot_table(index="date", columns="item", values="value", aggfunc="mean")
    pivot.sort_index(inplace=True)
    # Log-transform the absolute values (they are % changes so shift by a constant to make positive)
    for c in pivot.columns:
        shifted = pivot[c] - pivot[c].min() + 1  # ensure > 0
        pivot[f"log_{c}"] = np.log(shifted)
    pivot = pivot.ffill().bfill()
    pivot.reset_index(inplace=True)
    summarise("CPI_dataset", pivot)
    pivot.to_csv(OUT_DIR / "CPI_processed.csv", index=False)
    return pivot

def process_crude_oil():
    fp = RAW_DIR / "crude-oil-price.csv"
    df = pd.read_csv(fp)
    df["date"] = pd.to_datetime(df["date"], format="mixed", utc=True)
    df["date"] = df["date"].dt.tz_localize(None)
    df.sort_values("date", inplace=True)
    df.reset_index(drop=True, inplace=True)
    num_cols = ["price", "percentChange", "change"]
    df = coerce_numeric(df, num_cols)
    df = add_log_values(df, ["price"])
    df = add_log_returns(df, ["price"])
    df = fill_missing(df)
    summarise("crude_oil_price", df)
    df.to_csv(OUT_DIR / "crude_oil_price_processed.csv", index=False)
    return df

def process_daily_market():
    fp = RAW_DIR / "daily_market_data.csv"
    df = pd.read_csv(fp)
    df["date"] = pd.to_datetime(df["date"], format="mixed")
    df.sort_values("date", inplace=True)
    df.reset_index(drop=True, inplace=True)
    num_cols = [c for c in df.columns if c != "date"]
    df = coerce_numeric(df, num_cols)
    # Separate close-price columns for log-returns
    close_cols = [c for c in num_cols if "close" in c.lower()]
    df = add_log_values(df, close_cols)
    df = add_log_returns(df, close_cols)
    df = fill_missing(df)
    summarise("daily_market_data", df)
    df.to_csv(OUT_DIR / "daily_market_data_processed.csv", index=False)
    return df

def process_dgs10():
    fp = RAW_DIR / "DGS10.csv"
    df = pd.read_csv(fp)
    df.rename(columns={"observation_date": "date"}, inplace=True)
    df["date"] = pd.to_datetime(df["date"], format="mixed")
    df["DGS10"] = pd.to_numeric(df["DGS10"], errors="coerce")
    df.sort_values("date", inplace=True)
    df.reset_index(drop=True, inplace=True)
    df = add_log_values(df, ["DGS10"])
    df = add_log_returns(df, ["DGS10"])
    df = fill_missing(df)
    summarise("DGS10", df)
    df.to_csv(OUT_DIR / "DGS10_processed.csv", index=False)
    return df

def process_dhhngsp():
    fp = RAW_DIR / "DHHNGSP.csv"
    df = pd.read_csv(fp)
    df.rename(columns={"observation_date": "date"}, inplace=True)
    df["date"] = pd.to_datetime(df["date"], format="mixed")
    df["DHHNGSP"] = pd.to_numeric(df["DHHNGSP"], errors="coerce")
    df.sort_values("date", inplace=True)
    df.reset_index(drop=True, inplace=True)
    df = add_log_values(df, ["DHHNGSP"])
    df = add_log_returns(df, ["DHHNGSP"])
    df = fill_missing(df)
    summarise("DHHNGSP (Henry Hub daily)", df)
    df.to_csv(OUT_DIR / "DHHNGSP_processed.csv", index=False)
    return df

def process_exchange_rates():
    fp = RAW_DIR / "exchange_rates.csv"
    df = pd.read_csv(fp)
    # Columns: unnamed index, Country/Currency, currency, value, date
    if df.columns[0].startswith("Unnamed") or df.columns[0] == "":
        df = df.iloc[:, 1:]  # drop the row-index column
    df["date"] = pd.to_datetime(df["date"], format="mixed", dayfirst=True)
    df["value"] = pd.to_numeric(df["value"], errors="coerce")
    df.sort_values(["currency", "date"], inplace=True)
    df.reset_index(drop=True, inplace=True)
    # Pivot to wide: one column per currency
    pivot = df.pivot_table(index="date", columns="currency", values="value", aggfunc="mean")
    pivot.sort_index(inplace=True)
    # Log values & log returns for every currency
    cur_cols = list(pivot.columns)
    for c in cur_cols:
        valid = pivot[c] > 0
        pivot[f"log_{c}"] = np.nan
        pivot.loc[valid, f"log_{c}"] = np.log(pivot.loc[valid, c])
    for c in cur_cols:
        ratio = pivot[c] / pivot[c].shift(1)
        valid = ratio > 0
        pivot[f"log_return_{c}"] = np.nan
        pivot.loc[valid, f"log_return_{c}"] = np.log(ratio[valid])
    pivot = pivot.ffill().bfill()
    pivot.reset_index(inplace=True)
    summarise("exchange_rates", pivot)
    pivot.to_csv(OUT_DIR / "exchange_rates_processed.csv", index=False)
    return pivot

def process_henry_hub_annual():
    fp = RAW_DIR / "Henry_Hub_Natural_Gas_Spot_Price.csv"
    df = pd.read_csv(fp, skiprows=4)  # skip the 4-line header block
    df.columns = ["Year", "price"]
    df["Year"] = pd.to_numeric(df["Year"], errors="coerce")
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df.dropna(subset=["Year"], inplace=True)
    df.sort_values("Year", inplace=True)
    df.reset_index(drop=True, inplace=True)
    df = add_log_values(df, ["price"])
    df = add_log_returns(df, ["price"])
    df = fill_missing(df)
    summarise("Henry_Hub_annual", df)
    df.to_csv(OUT_DIR / "Henry_Hub_annual_processed.csv", index=False)
    return df

def process_india_macro():
    fp = RAW_DIR / "india_macro_worldbank.csv"
    df = pd.read_csv(fp)
    df.rename(columns={"year": "Year"}, inplace=True)
    num_cols = [c for c in df.columns if c != "Year"]
    df = coerce_numeric(df, num_cols)
    df.sort_values("Year", inplace=True)
    df.reset_index(drop=True, inplace=True)
    # Some series can be negative (current_account, gdp_growth) – log only strictly positive ones
    pos_cols = [c for c in num_cols if (df[c] > 0).all()]
    df = add_log_values(df, pos_cols)
    df = add_log_returns(df, pos_cols)
    # For cols that can be negative, shift to positive then log
    neg_cols = [c for c in num_cols if c not in pos_cols]
    for c in neg_cols:
        shifted = df[c] - df[c].min() + 1
        df[f"log_{c}_shifted"] = np.log(shifted)
    df = fill_missing(df)
    summarise("india_macro_worldbank", df)
    df.to_csv(OUT_DIR / "india_macro_worldbank_processed.csv", index=False)
    return df

def process_monthly_macro():
    fp = RAW_DIR / "monthly_macro_data.csv"
    df = pd.read_csv(fp)
    df["date"] = pd.to_datetime(df["date"], format="mixed")
    df.sort_values("date", inplace=True)
    df.reset_index(drop=True, inplace=True)
    num_cols = [c for c in df.columns if c != "date"]
    df = coerce_numeric(df, num_cols)
    close_cols = [c for c in num_cols if "close" in c.lower() or "index" in c.lower() or "yield" in c.lower() or "rate" in c.lower()]
    price_cols = [c for c in num_cols if "close" in c.lower()]
    other_num = [c for c in num_cols if c not in close_cols]
    # Log values on all positive numeric series
    all_pos = [c for c in num_cols if (df[c].dropna() > 0).all()]
    df = add_log_values(df, all_pos)
    df = add_log_returns(df, price_cols if price_cols else all_pos[:5])
    # Shifted-log for any column that can be negative/zero
    neg_cols = [c for c in num_cols if c not in all_pos]
    for c in neg_cols:
        min_val = df[c].min()
        shifted = df[c] - min_val + 1
        df[f"log_{c}_shifted"] = np.log(shifted)
    df = fill_missing(df)
    summarise("monthly_macro_data", df)
    df.to_csv(OUT_DIR / "monthly_macro_data_processed.csv", index=False)
    return df

# ── master pipeline ──────────────────────────────────────────────────────

def main():
    print("=" * 80)
    print("CORA – Preprocessing raw datasets")
    print("=" * 80)
    print(f"  Raw  dir : {RAW_DIR.resolve()}")
    print(f"  Output   : {OUT_DIR.resolve()}")
    print("-" * 80)

    process_bse_sensex()
    process_cpi()
    process_crude_oil()
    process_daily_market()
    process_dgs10()
    process_dhhngsp()
    process_exchange_rates()
    process_henry_hub_annual()
    process_india_macro()
    process_monthly_macro()

    print("-" * 80)
    n_files = len(list(OUT_DIR.glob("*.csv")))
    print(f"  Done – {n_files} processed files written to {OUT_DIR.resolve()}")
    print("=" * 80)

if __name__ == "__main__":
    main()
