import React, { useState, useEffect, useMemo } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import { ShieldAlert, BarChart3, Database, Play, Activity, Upload, Cpu } from "lucide-react";

// Components
import RiskQueueTable from "./components/RiskQueueTable";
import AssetDetailPage from "./components/AssetDetailPage";
import EarlyWarningBanner from "./components/EarlyWarningBanner";
import AuditLogTable from "./components/AuditLogTable";
import DashboardTrends from "./components/DashboardTrends";
import LiveFeedIndicator from "./components/LiveFeedIndicator";
import LandingPage from "./components/LandingPage";
import ImportModal from "./components/ImportModal";
import PairingModal from "./components/PairingModal";

// API Base URL
const API_BASE = "http://127.0.0.1:8000";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// --- Client-Side Routing Utilities ---
export function parseRoute() {
  const path = window.location.pathname;
  if (path === "/" || path === "") {
    return { page: "landing" };
  }
  if (path.startsWith("/console")) {
    const parts = path.split("/").filter(Boolean); // e.g. ["console", "trends"] or ["console", "asset", "BOILER-01"]
    if (parts.length === 1) {
      return { page: "console", tab: "queue" };
    }
    if (parts[1] === "trends") {
      return { page: "console", tab: "trends" };
    }
    if (parts[1] === "audit") {
      return { page: "console", tab: "audit" };
    }
    if (parts[1] === "asset" && parts[2]) {
      return { page: "console", assetId: parts[2] };
    }
    return { page: "console", tab: "queue" };
  }
  return { page: "landing" };
}

export const navigate = (url) => {
  window.history.pushState(null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export function useCurrentRoute() {
  const [route, setRoute] = useState(parseRoute());

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseRoute());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return route;
}

function RiskRadarApp({ onLeaveApp, currentRoute }) {
  const activeTab = currentRoute.tab || "queue";
  const selectedAssetId = currentRoute.assetId || null;
  const [auditAssetFilter, setAuditAssetFilter] = useState("");
  const [isPulseActive, setIsPulseActive] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [latestLiveReading, setLatestLiveReading] = useState(null);

  const qc = useQueryClient();

  // --- WebSocket Real-Time Invalidation ---
  useEffect(() => {
    // Determine websocket server IP
    const wsUrl = `ws://127.0.0.1:8000/ws/live-risk`;
    console.log("Connecting to WebSocket:", wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const score = JSON.parse(event.data);
        console.log("WebSocket real-time update received:", score);
        
        // Pulse live indicator
        setIsPulseActive(true);
        setTimeout(() => setIsPulseActive(false), 1200);

        if (score.sensor_data) {
          setLatestLiveReading({
            assetId: score.asset_id,
            timestamp: score.run_at,
            temperature: score.sensor_data.temperature,
            humidity: score.sensor_data.humidity,
            pressure: score.sensor_data.pressure
          });
        }

        // Invalidate active safety queries
        qc.invalidateQueries({ queryKey: ["risk-queue"] });
        qc.invalidateQueries({ queryKey: ["early-warnings"] });
        qc.invalidateQueries({ queryKey: ["dashboard-trends"] });
        qc.invalidateQueries({ queryKey: ["audit-logs"] });

        // If currently viewing the updated asset, invalidate detail views
        if (selectedAssetId && selectedAssetId.toUpperCase() === score.asset_id.toUpperCase()) {
          qc.invalidateQueries({ queryKey: ["asset-detail", selectedAssetId] });
          qc.invalidateQueries({ queryKey: ["asset-history", selectedAssetId] });
        }
      } catch (err) {
        console.error("Error parsing WS event data:", err);
      }
    };

    ws.onerror = (err) => {
      console.warn("WebSocket experienced an error. Telemetry stream falling back to polling.", err);
    };

    return () => {
      ws.close();
    };
  }, [qc, selectedAssetId]);

  // --- API Queries ---
  
  // 1. Priority Ranked Risk Queue
  const { data: queue = [], isLoading: isQueueLoading } = useQuery({
    queryKey: ["risk-queue"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/risk-queue`);
      if (!res.ok) throw new Error("Failed to fetch risk queue");
      return res.json();
    }
  });

  // 2. Early Warnings
  const { data: warnings = [] } = useQuery({
    queryKey: ["early-warnings"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/early-warnings`);
      if (!res.ok) throw new Error("Failed to fetch warnings");
      return res.json();
    }
  });

  // 3. Trends Aggregates
  const { data: trends, isLoading: isTrendsLoading } = useQuery({
    queryKey: ["dashboard-trends"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/dashboard/trends`);
      if (!res.ok) throw new Error("Failed to fetch trends");
      return res.json();
    }
  });

  // 4. Paginated Audit Logs
  const { data: auditLogs = [], isLoading: isAuditLoading } = useQuery({
    queryKey: ["audit-logs", auditAssetFilter],
    queryFn: async () => {
      const url = auditAssetFilter 
        ? `${API_BASE}/api/audit-log?asset_id=${encodeURIComponent(auditAssetFilter)}&limit=100`
        : `${API_BASE}/api/audit-log?limit=100`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    }
  });

  // 5. Selected Asset Detail
  const { data: assetDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ["asset-detail", selectedAssetId],
    queryFn: async () => {
      if (!selectedAssetId) return null;
      const res = await fetch(`${API_BASE}/api/assets/${selectedAssetId}`);
      if (!res.ok) throw new Error("Failed to fetch asset details");
      return res.json();
    },
    enabled: !!selectedAssetId
  });

  // 6. Selected Asset Score History
  const { data: assetHistory } = useQuery({
    queryKey: ["asset-history", selectedAssetId],
    queryFn: async () => {
      if (!selectedAssetId) return null;
      const res = await fetch(`${API_BASE}/api/assets/${selectedAssetId}/history`);
      if (!res.ok) throw new Error("Failed to fetch asset history");
      return res.json();
    },
    enabled: !!selectedAssetId
  });

  // --- Admin Mutations ---

  // Trigger batch scoring run
  const runScoringBatch = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/score/run`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to trigger run");
      return res.json();
    },
    onSuccess: (data) => {
      alert(`Safety run finished. Processed ${data.scored_successfully}/${data.total_assets} equipment assets.`);
      qc.invalidateQueries({ queryKey: ["risk-queue"] });
      qc.invalidateQueries({ queryKey: ["early-warnings"] });
      qc.invalidateQueries({ queryKey: ["dashboard-trends"] });
      qc.invalidateQueries({ queryKey: ["audit-logs"] });
      if (selectedAssetId) {
        qc.invalidateQueries({ queryKey: ["asset-detail", selectedAssetId] });
        qc.invalidateQueries({ queryKey: ["asset-history", selectedAssetId] });
      }
    },
    onError: (err) => {
      alert(`Failed to trigger safety assessment run: ${err.message}`);
    }
  });

  const handleSelectAsset = (assetId) => {
    navigate("/console/asset/" + assetId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-ink bg-grid-warm pt-4">
      {/* Top Banner Navigation */}
      <header className="sticky top-4 z-30 mx-auto w-[92%] max-w-7xl bg-[#FAF8F5]/85 backdrop-blur-md border border-border px-5 py-2.5 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300">
        <div className="flex items-center justify-between w-full lg:w-auto">
          <div 
            onClick={onLeaveApp} 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-85 transition-opacity"
            title="Back to Landing Page"
          >
            <div className="bg-[#1D3225]/5 border border-[#1D3225]/20 p-2 rounded-lg shadow-sm">
              <ShieldAlert className="h-5 w-5 text-[#1D3225]" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest text-[#1D3225] font-mono leading-none">INDUSLINK</h1>
              <p className="text-[9px] text-[#3B4C41] tracking-widest font-mono mt-0.5 uppercase">// PREDICTIVE CONSOLE</p>
            </div>
          </div>
          {/* Mobile-only Live Indicator location next to logo */}
          <div className="flex items-center lg:hidden">
            <LiveFeedIndicator active={isPulseActive} />
          </div>
        </div>

        {/* Tab Selection */}
        {!selectedAssetId && (
          <nav className="flex space-x-1.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 font-mono">
            <button
              onClick={() => navigate("/console")}
              className={`flex-1 lg:flex-none text-center px-4 py-2 text-[10px] font-bold uppercase tracking-wider border rounded-full transition-all whitespace-nowrap ${
                activeTab === "queue"
                  ? "bg-[#1D3225] text-[#FAF8F5] border-[#1D3225] shadow-sm"
                  : "bg-[#FAF8F5]/50 text-[#3B4C41] border-border hover:bg-[#FAF8F5]"
              }`}
            >
              Risk Queue
            </button>
            <button
              onClick={() => navigate("/console/trends")}
              className={`flex-1 lg:flex-none text-center px-4 py-2 text-[10px] font-bold uppercase tracking-wider border rounded-full transition-all whitespace-nowrap ${
                activeTab === "trends"
                  ? "bg-[#1D3225] text-[#FAF8F5] border-[#1D3225] shadow-sm"
                  : "bg-[#FAF8F5]/50 text-[#3B4C41] border-border hover:bg-[#FAF8F5]"
              }`}
            >
              Plant Trends
            </button>
            <button
              onClick={() => navigate("/console/audit")}
              className={`flex-1 lg:flex-none text-center px-4 py-2 text-[10px] font-bold uppercase tracking-wider border rounded-full transition-all whitespace-nowrap ${
                activeTab === "audit"
                  ? "bg-[#1D3225] text-[#FAF8F5] border-[#1D3225] shadow-sm"
                  : "bg-[#FAF8F5]/50 text-[#3B4C41] border-border hover:bg-[#FAF8F5]"
              }`}
            >
              Audit Trail
            </button>
          </nav>
        )}

        {/* Live Indicator & Admin Controls */}
        <div className="flex items-center justify-between lg:justify-end space-x-2 lg:space-x-3 w-full lg:w-auto">
          <div className="hidden lg:flex">
            <LiveFeedIndicator active={isPulseActive} compact={true} />
          </div>

          <button
            onClick={() => setIsPairingOpen(true)}
            className="flex-grow lg:flex-grow-0 flex items-center justify-center space-x-1.5 px-4 py-2 bg-white/60 hover:bg-white border border-border text-[#3B4C41] hover:text-[#1D3225] text-[10px] font-bold font-mono uppercase tracking-wider rounded-full transition-all shadow-sm whitespace-nowrap"
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Pair Sensor Node</span>
          </button>

          <button
            onClick={() => setIsImportOpen(true)}
            className="flex-grow lg:flex-grow-0 flex items-center justify-center space-x-1.5 px-4 py-2 bg-white/60 hover:bg-white border border-border text-[#3B4C41] hover:text-[#1D3225] text-[10px] font-bold font-mono uppercase tracking-wider rounded-full transition-all shadow-sm whitespace-nowrap"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import CSV</span>
          </button>
          
          <button
            onClick={() => runScoringBatch.mutate()}
            disabled={runScoringBatch.isPending}
            className="flex-grow lg:flex-grow-0 flex items-center justify-center space-x-1.5 px-4 py-2 bg-[#1D3225] hover:bg-[#15291D] disabled:bg-[#1D3225]/50 text-[#FAF8F5] text-[10px] font-bold font-mono uppercase tracking-wider rounded-full transition-all shadow-sm whitespace-nowrap"
          >
            <Play className="h-3.5 w-3.5 fill-[#FAF8F5]" />
            <span>{runScoringBatch.isPending ? "Running..." : "Evaluate Safety"}</span>
          </button>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="flex-grow p-4 md:p-6 max-w-7xl w-full mx-auto space-y-4">
        {latestLiveReading && (
          <div className="animate-fadeIn">
            <LiveFeedIndicator active={isPulseActive} latestReading={latestLiveReading} />
          </div>
        )}
        {selectedAssetId ? (
          /* Detailed Assessment Card View */
          <div key={`detail-${selectedAssetId}`} className="animate-page-change">
            <AssetDetailPage
              assetId={selectedAssetId}
              assetDetail={assetDetail}
              history={assetHistory}
              onBack={() => navigate("/console")}
            />
          </div>
        ) : (
          /* Multi-Tab Operational Views */
          <div key={`tab-${activeTab}`} className="animate-page-change">
            {activeTab === "queue" && (
              <div className="space-y-4">
                {/* Priority Early Warning Banner */}
                <EarlyWarningBanner warnings={warnings} onSelectAsset={handleSelectAsset} />

                {/* Priority Ranking Grid */}
                <div className="bg-surface p-6 border border-border rounded shadow-sm space-y-4">
                  <div className="border-b border-border pb-3 flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Prioritized Risk Queue</h2>
                      <p className="text-xs text-ink-muted mt-0.5">Flagged equipment assets ranked by scoring index severity</p>
                    </div>
                    <span className="px-2 py-0.5 bg-surface-muted border border-border text-[10px] text-ink-muted font-bold rounded uppercase">
                      Total Flagged: {queue.length}
                    </span>
                  </div>
                  {isQueueLoading ? (
                    <div className="text-center py-12 text-ink-muted">Loading queue data...</div>
                  ) : (
                    <RiskQueueTable queue={queue} onSelectAsset={handleSelectAsset} />
                  )}
                </div>
              </div>
            )}

            {activeTab === "trends" && (
              <div className="bg-surface p-6 border border-border rounded shadow-sm space-y-4">
                <div className="border-b border-border pb-3">
                  <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Safety Status Dashboard</h2>
                  <p className="text-xs text-ink-muted mt-0.5">Aggregated risk distributions and backlogged recommendations</p>
                </div>
                {isTrendsLoading ? (
                  <div className="text-center py-12 text-ink-muted">Loading trends data...</div>
                ) : (
                  <DashboardTrends trends={trends} />
                )}
              </div>
            )}

            {activeTab === "audit" && (
              <div className="bg-surface p-6 border border-border rounded shadow-sm space-y-4">
                <div className="border-b border-border pb-3">
                  <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Audit LogTrail</h2>
                  <p className="text-xs text-ink-muted mt-0.5">Historical safety run logs with full JSON snapshot snapshots</p>
                </div>
                {isAuditLoading ? (
                  <div className="text-center py-12 text-ink-muted">Loading audit trail...</div>
                ) : (
                  <AuditLogTable
                    auditLogs={auditLogs}
                    onFilterAsset={setAuditAssetFilter}
                    activeAssetFilter={auditAssetFilter}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer copyright */}
      <footer className="bg-surface border-t border-border py-4 px-6 text-center text-xs text-ink-muted">
        IndusLink Predictive-Safety Platform &copy; 2026. All rights reserved.
      </footer>

      {/* CSV Ingestion Dialog Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onIngestSuccess={() => {
          qc.invalidateQueries({ queryKey: ["risk-queue"] });
          qc.invalidateQueries({ queryKey: ["early-warnings"] });
          qc.invalidateQueries({ queryKey: ["dashboard-trends"] });
          qc.invalidateQueries({ queryKey: ["audit-logs"] });
          if (selectedAssetId) {
            qc.invalidateQueries({ queryKey: ["asset-detail", selectedAssetId] });
            qc.invalidateQueries({ queryKey: ["asset-history", selectedAssetId] });
          }
        }}
        apiBase={API_BASE}
      />

      {/* IoT Pairing Modal */}
      <PairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        apiBase={API_BASE}
        onPairSuccess={(newAssetId) => {
          qc.invalidateQueries({ queryKey: ["risk-queue"] });
          qc.invalidateQueries({ queryKey: ["early-warnings"] });
          qc.invalidateQueries({ queryKey: ["dashboard-trends"] });
          qc.invalidateQueries({ queryKey: ["audit-logs"] });
        }}
      />
    </div>
  );
}

export default function App() {
  const route = useCurrentRoute();

  return (
    <QueryClientProvider client={queryClient}>
      {route.page === "console" ? (
        <RiskRadarApp 
          onLeaveApp={() => navigate("/")} 
          currentRoute={route}
        />
      ) : (
        <LandingPage onEnterApp={() => navigate("/console")} />
      )}
    </QueryClientProvider>
  );
}
