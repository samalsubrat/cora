# Dataset Sources

This file lists raw dataset sources and minimal metadata for files stored in `Datasets/raw/`.

Per-dataset template (fill missing fields after inspection):
- Title: short dataset name
- Source / URL: original link
- Local file: filename in `Datasets/raw/`
- Date range / frequency: e.g. 2010-01-01 — 2024-12-31; daily/monthly
- Format / encoding: CSV / UTF-8, etc.
- Primary columns: key column names and brief meanings
- License / citation: terms of use or how to cite
- Retrieved: YYYY-MM-DD (who/command used)
- Preprocessing: any cleaning already applied (NA handling, resampling)
- Known issues: gaps, duplicates, suspicious values

Entries (preliminary — please run the short inspection commands below to fill missing fields):

- Title: BSE SENSEX
	- Source / URL: https://www.kaggle.com/datasets/maheshmani13/bse-sensex-10-year-stock-price
	- Local file: BSE SENSEX.csv
	- Date range / frequency: unknown — inspect file
	- Format / encoding: CSV
	- Primary columns: see file
	- License / citation: check Kaggle dataset page
	- Retrieved: unknown
	- Preprocessing: raw

- Title: CPI (Consumer Price Index)
	- Source / URL: https://www.kaggle.com/datasets/hrish4/cpi-inflation-analysis-and-forecasting
	- Local file: CPI_dataset.csv
	- Date range / frequency: unknown — inspect file
	- Format / encoding: CSV
	- Primary columns: see file
	- License / citation: check Kaggle dataset page
	- Retrieved: unknown
	- Preprocessing: raw

- Title: Crude oil price
	- Source / URL: https://www.kaggle.com/datasets/sc231997/crude-oil-price
	- Local file: crude-oil-price.csv
	- Date range / frequency: unknown — inspect file
	- Format / encoding: CSV
	- Primary columns: see file
	- License / citation: check Kaggle dataset page
	- Retrieved: unknown
	- Preprocessing: raw

- Title: Natural Gas (FRED DHHNGSP)
	- Source / URL: https://fred.stlouisfed.org/series/DHHNGSP
	- Local file: DHHNGSP.csv
	- Date range / frequency: unknown — inspect file
	- Format / encoding: CSV
	- Primary columns: see file
	- License / citation: FRED terms (check site)
	- Retrieved: unknown
	- Preprocessing: raw

- Title: Henry Hub Natural Gas Spot Price
	- Source / URL: https://www.kaggle.com/datasets/ishikagupta4568/henry-hub-ng-prices?resource=download
	- Local file: Henry_Hub_Natural_Gas_Spot_Price.csv
	- Date range / frequency: unknown — inspect file
	- Format / encoding: CSV
	- Primary columns: see file
	- License / citation: check Kaggle dataset page
	- Retrieved: unknown
	- Preprocessing: raw

- Title: Exchange Rates
	- Source / URL: https://www.kaggle.com/datasets/ruchi798/currency-exchange-rates
	- Local file: exchange_rates.csv
	- Date range / frequency: unknown — inspect file
	- Format / encoding: CSV
	- Primary columns: see file
	- License / citation: check Kaggle dataset page
	- Retrieved: unknown
	- Preprocessing: raw

- Title: Market Yield (10-year)
	- Source / URL: https://www.kaggle.com/datasets/ruchi798/currency-exchange-rates
	- Local file: DGS10.csv
	- Date range / frequency: unknown — inspect file
	- Format / encoding: CSV
	- Primary columns: see file
	- License / citation: check source
	- Retrieved: unknown
	- Preprocessing: raw

- Title: India macro (World Bank)
	- Source / URL: https://www.kaggle.com/datasets/ankitmitrawork/india-macroeconomic-indicators-19912024-wb-api
	- Local file: india_macro_worldbank.csv
	- Date range / frequency: unknown — inspect file
	- Format / encoding: CSV
	- Primary columns: see file
	- License / citation: check World Bank / Kaggle
	- Retrieved: unknown
	- Preprocessing: raw

- Title: Monthly macro data (project-specific)
	- Source / URL: (project dataset / unknown)
	- Local file: monthly_macro_data.csv
	- Date range / frequency: unknown — inspect file
	- Format / encoding: CSV
	- Primary columns: see file
	- License / citation: unknown
	- Retrieved: unknown
	- Preprocessing: raw

- Title: Daily market data (project-specific)
	- Source / URL: (project dataset / unknown)
	- Local file: daily_market_data.csv
	- Date range / frequency: unknown — inspect file
	- Format / encoding: CSV
	- Primary columns: see file
	- License / citation: unknown
	- Retrieved: unknown
	- Preprocessing: raw

Quick commands to inspect and fill fields (run from repo root):

Python (pandas) — prints head, columns and attempts to find a date column range:
```python
import pandas as pd
fn = 'Datasets/raw/BSE SENSEX.csv'
df = pd.read_csv(fn, low_memory=False)
print(df.head())
print(df.columns.tolist())
for c in df.columns:
		if 'date' in c.lower():
				try:
						s = pd.to_datetime(df[c], errors='coerce')
						print(c, s.min(), s.max())
				except Exception:
						pass
```

Bash (head, wc):
```bash
head -n 5 Datasets/raw/BSE\ SENSEX.csv
wc -c Datasets/raw/BSE\ SENSEX.csv  # file size
```

How you can help me finish this:
- I can automatically inspect all CSVs and fill `Date range`, `Format`, `Primary columns`, and `size` fields — shall I do that now?
