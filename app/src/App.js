import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import PopoutLayout from "./components/PopoutLayout";
import DashboardPage from "./components/pages/DashboardPage";
import HeatmapPage from "./components/pages/HeatmapPage";
import RollingCorrelationPage from "./components/pages/RollingCorrelationPage";
import ClustersPage from "./components/pages/ClustersPage";

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Main window — with sidebar */}
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/heatmap" element={<HeatmapPage />} />
          <Route path="/rolling" element={<RollingCorrelationPage />} />
          <Route path="/clusters" element={<ClustersPage />} />
        </Route>

        {/* Standalone / pop-out windows — no sidebar */}
        <Route element={<PopoutLayout />}>
          <Route path="/standalone/heatmap" element={<HeatmapPage />} />
          <Route path="/standalone/rolling" element={<RollingCorrelationPage />} />
          <Route path="/standalone/clusters" element={<ClustersPage />} />
          <Route path="/standalone/dashboard" element={<DashboardPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
