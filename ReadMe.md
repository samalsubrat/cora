# Correlation-Based Benchmark Analysis  
## Phase-wise Task Checklist

This document outlines the **execution phases and key tasks** for building the
Correlation-Based Benchmark Analysis system for Energy Commodities.



## Phase 0 — Concept & Design
- [ ] Finalize project scope and non-goals
- [ ] Confirm commodities: Natural Gas & LNG
- [ ] Define KPIs for correlation accuracy and visualization
- [ ] Lock system architecture
- [ ] Create design and assumptions document



## Phase 1 — Data Acquisition
- [ ] Identify public benchmark data sources
- [ ] Download and store raw time-series datasets
- [ ] Standardize date and value columns
- [ ] Validate data completeness and frequency
- [ ] Document data sources



## Phase 2 — Data Preprocessing
- [ ] Align benchmark time-series by date
- [ ] Handle missing values (fill/interpolate)
- [ ] Inspect and handle outliers
- [ ] Apply Z-score normalization
- [ ] Validate normalized datasets



## Phase 3 — Correlation Engine
- [ ] Implement rolling 36-month window logic
- [ ] Compute Pearson correlations
- [ ] Add optional Spearman correlation
- [ ] Store time-indexed correlation matrices
- [ ] Validate correlation outputs



## Phase 4 — Benchmark Grouping
- [ ] Convert correlation values to distance metrics
- [ ] Implement hierarchical clustering
- [ ] Generate cluster labels per time window
- [ ] Analyze cluster stability over time
- [ ] Validate grouping accuracy



## Phase 5 — Visualization
- [ ] Create correlation heatmaps
- [ ] Create clustered heatmaps
- [ ] Plot rolling correlation trends
- [ ] Visualize cluster evolution
- [ ] Enable chart export functionality



## Phase 6 — Backend API
- [ ] Set up FastAPI backend
- [ ] Implement benchmark listing endpoint
- [ ] Implement correlation retrieval endpoint
- [ ] Implement cluster retrieval endpoint
- [ ] Add API documentation



## Phase 7 — Electron Desktop App
- [ ] Set up Electron project
- [ ] Integrate FastAPI backend locally
- [ ] Build interactive UI components
- [ ] Add export and filtering features
- [ ] Package cross-platform desktop app



## Phase 8 — Testing & QA
- [ ] Test correlation correctness
- [ ] Stress test with large datasets
- [ ] Validate behavior with missing/noisy data
- [ ] Test UI responsiveness and stability
- [ ] Fix identified issues



## Phase 9 — Documentation & Iteration
- [ ] Write system and math documentation
- [ ] Create user guide
- [ ] Collect internal feedback
- [ ] Identify improvements for next version
- [ ] Finalize project handover



## Status
**Current Phase:** ⬜ Not Started  
**Overall Progress:** 0%


