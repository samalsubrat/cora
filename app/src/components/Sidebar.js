import React from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { icon: "dashboard", label: "Dashboard", to: "/" },
  { icon: "grid_on", label: "Correlation Heatmap", to: "/heatmap" },
  { icon: "show_chart", label: "Rolling Correlation", to: "/rolling" },
  { icon: "bubble_chart", label: "Clusters", to: "/clusters" },
];

/** Open a component in a separate Electron window */
function openInNewWindow(route, title) {
  if (window.electronAPI?.openWindow) {
    console.log("[CORA] Opening in new window:", route, title);
    window.electronAPI.openWindow({ route, title, width: 1100, height: 750 });
  } else {
    console.warn("[CORA] electronAPI not available — are you running inside Electron?");
    alert("Pop-out windows require Electron. Make sure you are running the app via 'npm start' (not just the React dev server).");
  }
}

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-full">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <span className="material-icons text-white text-lg">insights</span>
          </div>
          <h1 className="font-bold text-xl tracking-tight text-slate-800 uppercase">
            CORA
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <div key={item.to} className="flex items-center group">
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <span className="material-icons text-sm">{item.icon}</span>
              {item.label}
            </NavLink>

            {/* Pop-out button */}
            <button
              onClick={() => openInNewWindow(item.to === "/" ? "/dashboard" : item.to, `CORA — ${item.label}`)}
              className="ml-1 p-1.5 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-primary transition-all"
              title={`Open ${item.label} in new window`}
            >
              <span className="material-icons text-[16px]">open_in_new</span>
            </button>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
            SK
          </div>
          <div>
            <p className="text-xs font-bold truncate">Satyam Kumar</p>
            <p className="text-[10px] text-slate-500">Tel Dukandaar</p>
          </div>
          <span className="material-icons text-slate-400 ml-auto text-sm cursor-pointer hover:text-slate-600">
            settings
          </span>
        </div>
      </div>
    </aside>
  );
}
