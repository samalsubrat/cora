import React, { useState, useEffect } from "react";

function formatLabel(col) {
  return col
    .replace(/_/g, " ")
    .replace(/close/gi, "")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

const COLORS = {
  primary: {
    badgeBg: "bg-primary", headerBg: "bg-primary/5", borderColor: "border-primary/20",
    textColor: "text-primary", dot: "bg-blue-500",
  },
  amber: {
    badgeBg: "bg-amber-500", headerBg: "bg-amber-500/5", borderColor: "border-amber-500/20",
    textColor: "text-amber-500", dot: "bg-amber-500",
  },
  emerald: {
    badgeBg: "bg-emerald-500", headerBg: "bg-emerald-500/5", borderColor: "border-emerald-500/20",
    textColor: "text-emerald-500", dot: "bg-emerald-500",
  },
  slate: {
    badgeBg: "bg-slate-500", headerBg: "bg-slate-500/5", borderColor: "border-slate-500/20",
    textColor: "text-slate-500", dot: "bg-slate-500",
  },
};

export default function ClustersPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/data/clusters.json`)
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

  const { clusters, dendrogram } = data;

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
            <span>CORA Analytics</span>
            <span className="material-icons text-[12px]">chevron_right</span>
            <span className="text-primary/70">Cluster Groupings</span>
          </nav>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Correlation-Based Cluster Groupings
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Ward hierarchical clustering &middot; {clusters.length} clusters &middot; {data.assets.length} assets
          </span>
        </div>
      </header>

      <div className="p-8">
        <p className="text-slate-500 mb-8">
          Assets grouped by correlation similarity using hierarchical clustering (Ward linkage)
          on monthly raw Pearson correlations.
        </p>

        {/* Cluster Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clusters.map((cluster) => {
            const cs = COLORS[cluster.color] || COLORS.slate;
            return (
              <div
                key={cluster.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Cluster Header */}
                <div className={`p-6 border-b border-slate-100 ${cs.headerBg}`}>
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${cs.badgeBg} text-white uppercase tracking-wider`}
                    >
                      Cluster {cluster.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {cluster.members.length} assets
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{cluster.name}</h3>

                  <div className={`bg-white rounded-lg p-4 border ${cs.borderColor} shadow-sm mt-4`}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Avg Intra-Cluster Corr
                      </span>
                      <span className={`text-2xl font-black ${cs.textColor}`}>
                        {cluster.avgCorr.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`${cs.badgeBg} h-full rounded-full`}
                        style={{ width: `${Math.abs(cluster.avgCorr) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Members */}
                <div className="p-6 flex-grow">
                  <div className="space-y-3">
                    {cluster.members.map((member, idx) => (
                      <React.Fragment key={member}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${cs.dot}`} />
                            <span className="font-bold text-sm">
                              {formatLabel(member)}
                            </span>
                          </div>
                        </div>
                        {idx < cluster.members.length - 1 && (
                          <div className="h-[1px] bg-slate-100" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Cohesion
                  </span>
                  <span className={`text-[10px] font-bold ${cs.textColor} flex items-center gap-1`}>
                    {Math.abs(cluster.avgCorr) >= 0.7
                      ? "HIGH"
                      : Math.abs(cluster.avgCorr) >= 0.4
                      ? "MODERATE"
                      : "LOW"}
                    <span className="material-icons text-[12px]">
                      {Math.abs(cluster.avgCorr) >= 0.7
                        ? "verified"
                        : Math.abs(cluster.avgCorr) >= 0.4
                        ? "warning"
                        : "info"}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dendrogram Info */}
        <div className="mt-12 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">Dendrogram Merge Steps</h3>
              <p className="text-xs text-slate-400 font-medium">
                Ward linkage merge order (lower distance = more similar)
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Step
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Merged A
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Merged B
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                    Distance
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                    New Size
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dendrogram.merge.map((m, i) => {
                  const labelFor = (idx) =>
                    idx < data.assets.length
                      ? formatLabel(data.assets[idx])
                      : `Node ${idx}`;
                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-xs text-slate-400 font-mono">
                        {i + 1}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium">
                        {labelFor(m[0])}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium">
                        {labelFor(m[1])}
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-right">
                        {dendrogram.distances[i].toFixed(4)}
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-right">
                        {dendrogram.counts[i]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[200px]">
            <span className="material-icons text-4xl text-primary/20 mb-2">hub</span>
            <p className="text-slate-400 text-sm font-medium text-center">
              {clusters.length} clusters identified from {data.assets.length} assets
              using Ward hierarchical clustering on monthly Pearson correlations.
            </p>
          </div>
          <div className="bg-primary rounded-xl p-6 text-white flex flex-col justify-between overflow-hidden relative shadow-lg">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <span className="material-icons text-6xl">auto_graph</span>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">
                Clustering Summary
              </h4>
              <p className="text-lg font-bold leading-snug">
                {clusters.reduce((a, c) => a + c.members.length, 0)} assets across{" "}
                {clusters.length} groups with avg inter-cluster distance of{" "}
                {(
                  dendrogram.distances.reduce((a, b) => a + b, 0) /
                  dendrogram.distances.length
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
