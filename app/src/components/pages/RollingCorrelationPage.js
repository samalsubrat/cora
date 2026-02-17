import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from "recharts";

function formatLabel(col) {
  return col
    .replace(/_/g, " ")
    .replace(/close/gi, "")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export default function RollingCorrelationPage() {
  const [data, setData] = useState(null);
  const [pairIdx, setPairIdx] = useState(0);
  const [window, setWindow] = useState("60D");

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/data/rolling_correlations.json`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const pair = data?.pairs?.[pairIdx];
  const series = useMemo(() => (pair ? pair[window] || [] : []), [pair, window]);

  const currentCorr = pair?.current ?? 0;
  const strength =
    Math.abs(currentCorr) >= 0.7
      ? "Strong"
      : Math.abs(currentCorr) >= 0.3
      ? "Moderate"
      : "Weak";
  const strengthColor =
    Math.abs(currentCorr) >= 0.7
      ? "text-green-500 bg-green-50"
      : Math.abs(currentCorr) >= 0.3
      ? "text-amber-500 bg-amber-50"
      : "text-slate-400 bg-slate-100";

  if (!data)
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
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            CORA Analytics
          </p>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Rolling Correlation Analysis
          </h1>
        </div>
      </header>

      <div className="p-8 space-y-8">
        {/* Selection & Metric */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row items-end space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Asset Pair
              </label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                value={pairIdx}
                onChange={(e) => setPairIdx(Number(e.target.value))}
              >
                {data.pairs.map((p, i) => (
                  <option key={i} value={i}>
                    {formatLabel(p.a)} / {formatLabel(p.b)}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-auto">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Window
              </label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {["30D", "60D", "90D", "180D"].map((w) => (
                  <button
                    key={w}
                    onClick={() => setWindow(w)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                      window === w
                        ? "bg-white shadow-sm text-primary"
                        : "text-slate-600"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Metric Card */}
          <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Current Correlation
              </p>
              <div className="flex items-baseline space-x-2">
                <h2 className="text-4xl font-extrabold text-primary">
                  {currentCorr.toFixed(2)}
                </h2>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center ${strengthColor}`}
                >
                  <span className="material-icons text-[14px] mr-1">
                    {Math.abs(currentCorr) >= 0.7 ? "trending_up" : "remove"}
                  </span>
                  {strength}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">60-day trailing window</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-icons text-primary text-3xl">analytics</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-bold text-slate-700">
                {window} Rolling Correlation
              </span>
              <div className="flex items-center space-x-1 bg-white px-3 py-1 rounded-md border border-slate-200">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs font-medium text-slate-600">
                  {pair ? `${formatLabel(pair.a)} / ${formatLabel(pair.b)}` : ""}
                </span>
              </div>
            </div>
            <span className="text-xs text-slate-400">
              {series.length} data points (weekly)
            </span>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(d) => d.slice(0, 7)}
                  interval="preserveStartEnd"
                  minTickGap={60}
                />
                <YAxis
                  domain={[-1, 1]}
                  ticks={[-1, -0.5, 0, 0.5, 1]}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#94a3b8", fontWeight: 700 }}
                  formatter={(v) => [v.toFixed(4), "Correlation"]}
                />
                <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={2} />
                <ReferenceLine
                  y={0.7}
                  stroke="#22c55e"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <ReferenceLine
                  y={-0.7}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <Line
                  type="monotone"
                  dataKey="corr"
                  stroke="#135bec"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Benchmark Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pair &&
            [pair.a, pair.b].map((asset, idx) => (
              <div key={asset} className="bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                  <span className="material-icons text-primary text-lg mr-2">
                    description
                  </span>
                  Benchmark {idx === 0 ? "A" : "B"}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Series</span>
                    <span className="font-semibold">{formatLabel(asset)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Column Key</span>
                    <span className="font-semibold px-2 py-0.5 bg-slate-50 rounded font-mono text-[10px]">
                      {asset}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Data Points ({window})</span>
                    <span className="font-semibold">{series.length} weeks</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
