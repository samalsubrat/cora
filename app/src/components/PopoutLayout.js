import React from "react";
import { Outlet } from "react-router-dom";

/**
 * Minimal layout for pop-out windows — no sidebar, just the page content
 * with a small draggable title-bar area.
 */
export default function PopoutLayout() {
  return (
    <div className="flex flex-col h-screen bg-background-light font-display text-slate-900 antialiased">
      {/* Compact title bar with a back-to-main hint */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 select-none"
           style={{ WebkitAppRegion: "drag" }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <span className="material-icons text-white text-sm">insights</span>
          </div>
          <span className="text-xs font-bold tracking-tight text-slate-600 uppercase">
            CORA — Detached View
          </span>
        </div>
      </div>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
