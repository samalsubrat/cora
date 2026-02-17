import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, ResponsiveContainer, Cell,
} from "recharts";

function formatLabel(col) {
  return col
    .replace(/_/g, " ")
    .replace(/close/gi, "")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/data/dashboard.json`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data)
    return (
      <div className="flex items-center justify-center h-full">
        <span className="material-icons animate-spin text-primary text-3xl">progress_activity</span>
      </div>
    );

  const { kpis, correlationPairs, lastDate } = data;

  const trendIcon = (t) =>
    t === "up" ? "trending_up" : t === "down" ? "trending_down" : "remove";
  const trendStyle = (t) =>
    t === "up"
      ? "text-emerald-500 bg-emerald-50"
      : t === "down"
      ? "text-rose-500 bg-rose-50"
      : "text-slate-400 bg-slate-100";

  const corrColor = (v) =>
    v >= 0.7
      ? "text-rose-600"
      : v >= 0.3
      ? "text-amber-600"
      : v <= -0.7
      ? "text-blue-600"
      : v <= -0.3
      ? "text-cyan-600"
      : "text-slate-500";

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div>
          <nav className="flex items-center text-xs text-slate-500 mb-1">
            <span>CORA</span>
            <span className="material-icons text-sm mx-1">chevron_right</span>
            <span className="text-primary font-medium">Dashboard</span>
          </nav>
          <h2 className="text-lg font-bold text-slate-800">
            Benchmark Analytics Overview
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2 gap-2">
            <span className="material-icons text-slate-400 text-sm">calendar_today</span>
            <span className="text-xs font-medium">Latest: {lastDate}</span>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {kpi.label}
                  </p>
                  <h3 className="text-xl font-bold mt-1">
                    {kpi.value}
                    {kpi.suffix && <span className="text-sm">{kpi.suffix}</span>}
                    {kpi.unit && (
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        {kpi.unit}
                      </span>
                    )}
                  </h3>
                </div>
                <span
                  className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${trendStyle(kpi.trend)}`}
                >
                  <span className="material-icons text-[12px] mr-0.5">
                    {trendIcon(kpi.trend)}
                  </span>
                  {kpi.change}
                </span>
              </div>
              {/* Sparkline */}
              <div className="h-12 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kpi.bars.map((v, i) => ({ v, i }))}>
                    <Bar dataKey="v" radius={[2, 2, 0, 0]}>
                      {kpi.bars.map((_, i) => (
                        <Cell
                          key={i}
                          fill={i === kpi.bars.length - 1 ? "#135bec" : "#135bec33"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Correlation Summary Table */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="material-icons text-primary">analytics</span>
                Top Cross-Asset Correlations
              </h3>
              <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium border border-slate-200">
                Pearson &middot; Monthly
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Asset A</th>
                    <th className="px-6 py-4">Asset B</th>
                    <th className="px-6 py-4 text-right">Correlation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {correlationPairs.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 text-xs text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold">
                        {formatLabel(row.var1)}
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold">
                        {formatLabel(row.var2)}
                      </td>
                      <td
                        className={`px-6 py-3 text-sm font-bold text-right font-mono ${corrColor(row.corr)}`}
                      >
                        {row.corr > 0 ? "+" : ""}
                        {row.corr.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-primary/5 p-6 rounded-xl border border-primary/20">
              <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-4">
                <span className="material-icons text-sm">auto_awesome</span>
                Key Insights
              </h4>
              <div className="space-y-4">
                {correlationPairs.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="material-icons text-amber-500 text-lg">
                      {Math.abs(p.corr) > 0.9 ? "warning_amber" : "info_outline"}
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-bold text-slate-800">
                        {formatLabel(p.var1)} &harr; {formatLabel(p.var2)}:
                      </span>{" "}
                      {Math.abs(p.corr) > 0.9
                        ? "Near-perfect correlation detected. These assets move almost in lockstep."
                        : Math.abs(p.corr) > 0.7
                        ? "Strong correlation – consider hedging implications."
                        : "Moderate correlation – diversification benefits present."}
                      <span className={`font-bold ml-1 ${corrColor(p.corr)}`}>
                        {" "}(r = {p.corr > 0 ? "+" : ""}{p.corr.toFixed(2)})
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h4 className="text-sm font-bold text-slate-800 mb-4">Data Sources</h4>
              <div className="space-y-3 text-xs text-slate-500">
                {[
                  "BSE Sensex \u00b7 daily OHLC",
                  "S&P 500 / Nifty 50 \u00b7 daily market",
                  "Gold & Brent crude \u00b7 daily close",
                  "DGS10 (US 10Y) \u00b7 FRED",
                  "Henry Hub Natural Gas \u00b7 FRED",
                  "USD/INR exchange rate",
                  "US CPI, Unemployment, Fed Funds",
                  "India macro (World Bank)",
                ].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
