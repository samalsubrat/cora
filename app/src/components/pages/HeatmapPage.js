import React, { useState, useEffect, useMemo } from "react";

function formatLabel(col) {
  return col
    .replace(/^log_return_/, "")
    .replace(/^log_/, "")
    .replace(/^logret_/, "")
    .replace(/_/g, " ")
    .replace(/close/gi, "")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function getCellColor(value) {
  if (value === 1.0) return "bg-red-600 text-white";
  if (value >= 0.8) return "bg-red-400 text-white";
  if (value >= 0.6) return "bg-red-300 text-white";
  if (value >= 0.35) return "bg-red-200 text-slate-700";
  if (value >= 0.15) return "bg-red-100 text-slate-600";
  if (value <= -0.8) return "bg-blue-400 text-white";
  if (value <= -0.55) return "bg-blue-300 text-white";
  if (value <= -0.3) return "bg-blue-200 text-slate-700";
  if (value <= -0.1) return "bg-blue-100 text-slate-600";
  return "bg-slate-50 text-slate-400";
}

const DATA_SOURCES = [
  { key: "daily_raw", label: "Daily Raw" },
  { key: "daily_log", label: "Daily Log" },
  { key: "daily_log_returns", label: "Daily Log-Returns" },
  { key: "monthly_raw", label: "Monthly Raw" },
  { key: "monthly_log", label: "Monthly Log" },
  { key: "monthly_log_returns", label: "Monthly Log-Returns" },
];

export default function HeatmapPage() {
  const [source, setSource] = useState("monthly_raw");
  const [heatmaps, setHeatmaps] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      DATA_SOURCES.map((s) =>
        fetch(`${process.env.PUBLIC_URL}/data/heatmap_${s.key}.json`)
          .then((r) => r.json())
          .then((d) => [s.key, d])
      )
    )
      .then((results) => {
        const map = {};
        results.forEach(([k, v]) => (map[k] = v));
        setHeatmaps(map);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const current = heatmaps[source];

  const insights = useMemo(() => {
    if (!current) return [];
    const { assets, matrix } = current;
    let best = { corr: -2 }, worst = { corr: 2 }, neutral = { corr: 2 };
    for (let i = 0; i < assets.length; i++) {
      for (let j = i + 1; j < assets.length; j++) {
        const v = matrix[i][j];
        if (v > best.corr) best = { a: assets[i], b: assets[j], corr: v };
        if (v < worst.corr) worst = { a: assets[i], b: assets[j], corr: v };
        if (Math.abs(v) < Math.abs(neutral.corr))
          neutral = { a: assets[i], b: assets[j], corr: v };
      }
    }
    return [
      {
        icon: "arrow_upward", iconBg: "bg-red-100", iconColor: "text-red-600",
        title: "Highest Correlation",
        bold: `${formatLabel(best.a)} vs ${formatLabel(best.b)} (${best.corr.toFixed(2)})`,
        text: " — these assets show the strongest positive co-movement in this dataset.",
      },
      {
        icon: "arrow_downward", iconBg: "bg-blue-100", iconColor: "text-blue-600",
        title: "Strongest Inverse",
        bold: `${formatLabel(worst.a)} vs ${formatLabel(worst.b)} (${worst.corr.toFixed(2)})`,
        text: " — significant negative correlation, useful for hedging.",
      },
      {
        icon: "insights", iconBg: "bg-primary/10", iconColor: "text-primary",
        title: "Most Neutral",
        bold: `${formatLabel(neutral.a)} vs ${formatLabel(neutral.b)} (${neutral.corr.toFixed(2)})`,
        text: " — near-zero correlation, excellent for portfolio diversification.",
      },
    ];
  }, [current]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <span className="material-icons animate-spin text-primary text-3xl">progress_activity</span>
      </div>
    );

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
        <div>
          <div className="flex items-center text-xs text-slate-400 gap-2 mb-1">
            <span>Analytics</span>
            <span className="material-icons text-[10px]">chevron_right</span>
            <span>Benchmarking</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Cross-Asset Correlation Heatmap
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg flex-wrap gap-0.5">
            {DATA_SOURCES.map((s) => (
              <button
                key={s.key}
                onClick={() => setSource(s.key)}
                className={`px-3 py-1 text-xs font-semibold rounded transition-all whitespace-nowrap ${
                  source === s.key
                    ? "bg-white shadow-sm text-primary"
                    : "text-slate-600"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Legend */}
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-700">
              {DATA_SOURCES.find((s) => s.key === source)?.label} Correlation Matrix
            </span>
            <span className="text-xs text-slate-400 italic">
              {current?.assets.length} assets &middot; Pearson coefficient
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-tighter text-slate-400 mb-2">
                Correlation Scale
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-blue-600">-1.0</span>
                <div className="w-48 h-2 rounded-full bg-gradient-to-r from-blue-600 via-slate-50 to-red-600 border border-slate-100" />
                <span className="text-[10px] font-bold text-red-600">+1.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        {current && (
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <div style={{ minWidth: Math.max(600, current.assets.length * 80) }}>
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `140px repeat(${current.assets.length}, 1fr)`,
                }}
              >
                {/* Top-left empty */}
                <div className="h-14" />
                {/* Column headers */}
                {current.assets.map((a) => (
                  <div
                    key={`col-${a}`}
                    className="h-14 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase tracking-tighter text-center px-1"
                  >
                    {formatLabel(a)}
                  </div>
                ))}
                {/* Rows */}
                {current.matrix.map((row, ri) => (
                  <React.Fragment key={`row-${ri}`}>
                    <div className="flex items-center pr-2 justify-end text-[10px] font-bold text-slate-500 uppercase tracking-tighter text-right leading-tight">
                      {formatLabel(current.assets[ri])}
                    </div>
                    {row.map((val, ci) => (
                      <div
                        key={`${ri}-${ci}`}
                        className={`h-14 flex items-center justify-center rounded text-xs font-bold transition-transform hover:scale-105 hover:z-10 cursor-pointer ${getCellColor(val)}`}
                        title={`${formatLabel(current.assets[ri])} vs ${formatLabel(current.assets[ci])}: ${val.toFixed(4)}`}
                      >
                        {val.toFixed(2)}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Insight Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.map((item) => (
            <div key={item.title} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 ${item.iconBg} rounded-lg flex items-center justify-center ${item.iconColor}`}>
                  <span className="material-icons">{item.icon}</span>
                </div>
                <h3 className="font-bold text-slate-800">{item.title}</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                <span className="font-bold text-slate-800">{item.bold}</span>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
