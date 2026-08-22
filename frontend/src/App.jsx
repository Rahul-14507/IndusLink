import React, { useState, useEffect, useMemo } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import { ShieldAlert, BarChart3, Database, Play, Activity, Upload } from "lucide-react";

// Components
import RiskQueueTable from "./components/RiskQueueTable";
import AssetDetailPage from "./components/AssetDetailPage";
import EarlyWarningBanner from "./components/EarlyWarningBanner";
import AuditLogTable from "./components/AuditLogTable";
import DashboardTrends from "./components/DashboardTrends";
import LiveFeedIndicator from "./components/LiveFeedIndicator";
import LandingPage from "./components/LandingPage";
import ImportModal from "./components/ImportModal";

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

function RiskRadarApp({ onLeaveApp }) {
  const [activeTab, setActiveTab] = useState("queue"); // "queue" | "trends" | "audit"
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [auditAssetFilter, setAuditAssetFilter] = useState("");
  const [isPulseActive, setIsPulseActive] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

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

        // Invalidate active safety queries
        qc.invalidateQueries(["risk-queue"]);
        qc.invalidateQueries(["early-warnings"]);
        qc.invalidateQueries(["dashboard-trends"]);
        qc.invalidateQueries(["audit-logs"]);

        // If currently viewing the updated asset, invalidate detail views
        if (selectedAssetId && selectedAssetId.toUpperCase() === score.asset_id.toUpperCase()) {
          qc.invalidateQueries(["asset-detail", selectedAssetId]);
          qc.invalidateQueries(["asset-history", selectedAssetId]);
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
      qc.invalidateQueries(["risk-queue"]);
      qc.invalidateQueries(["early-warnings"]);
      qc.invalidateQueries(["dashboard-trends"]);
      qc.invalidateQueries(["audit-logs"]);
      if (selectedAssetId) {
        qc.invalidateQueries(["asset-detail", selectedAssetId]);
        qc.invalidateQueries(["asset-history", selectedAssetId]);
      }
    },
    onError: (err) => {
      alert(`Failed to trigger safety assessment run: ${err.message}`);
    }
  });

  const handleSelectAsset = (assetId) => {
    setSelectedAssetId(assetId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-ink">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-30 bg-surface border-b border-border shadow-sm px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-black tracking-tight uppercase">RiskRadar</h1>
          </div>
          {/* Mobile-only Live Indicator location next to logo */}
          <div className="flex items-center md:hidden">
            <LiveFeedIndicator active={isPulseActive} />
          </div>
        </div>

        {/* Tab Selection */}
        {!selectedAssetId && (
          <nav className="flex space-x-1 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab("queue")}
              className={`flex-1 md:flex-none text-center px-3 md:px-4 py-2 text-[10px] md:text-xs font-bold uppercase tracking-wider border rounded transition-colors whitespace-nowrap ${
                activeTab === "queue"
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-ink-muted border-border hover:bg-surface-muted"
              }`}
            >
              Risk Queue
            </button>
            <button
              onClick={() => setActiveTab("trends")}
              className={`flex-1 md:flex-none text-center px-3 md:px-4 py-2 text-[10px] md:text-xs font-bold uppercase tracking-wider border rounded transition-colors whitespace-nowrap ${
                activeTab === "trends"
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-ink-muted border-border hover:bg-surface-muted"
              }`}
            >
              Plant Trends
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`flex-1 md:flex-none text-center px-3 md:px-4 py-2 text-[10px] md:text-xs font-bold uppercase tracking-wider border rounded transition-colors whitespace-nowrap ${
                activeTab === "audit"
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-ink-muted border-border hover:bg-surface-muted"
              }`}
            >
              Audit Trail
            </button>
          </nav>
        )}

        {/* Live Indicator & Admin Controls */}
        <div className="flex items-center justify-between md:justify-end space-x-2 md:space-x-4 w-full md:w-auto">
          <div className="hidden md:flex">
            <LiveFeedIndicator active={isPulseActive} />
          </div>

          <button
            onClick={() => setIsImportOpen(true)}
            className="flex-grow md:flex-grow-0 flex items-center justify-center space-x-1.5 px-3 py-2 md:py-1.5 bg-surface hover:bg-surface-muted border border-border text-ink-muted hover:text-ink text-[10px] md:text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-sm"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import CSV</span>
          </button>
          
          <button
            onClick={() => runScoringBatch.mutate()}
            disabled={runScoringBatch.isPending}
            className="flex-grow md:flex-grow-0 flex items-center justify-center space-x-1.5 px-3 py-2 md:py-1.5 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white text-[10px] md:text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-sm"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            <span>{runScoringBatch.isPending ? "Running..." : "Evaluate Safety"}</span>
          </button>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="flex-grow p-4 md:p-6 max-w-7xl w-full mx-auto">
        {selectedAssetId ? (
          /* Detailed Assessment Card View */
          <AssetDetailPage
            assetId={selectedAssetId}
            assetDetail={assetDetail}
            history={assetHistory}
            onBack={() => setSelectedAssetId(null)}
          />
        ) : (
          /* Multi-Tab Operational Views */
          <div>
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
        RiskRadar Safety Predictive-Safety Platform &copy; 2026. All rights reserved.
      </footer>

      {/* CSV Ingestion Dialog Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onIngestSuccess={() => {
          qc.invalidateQueries(["risk-queue"]);
          qc.invalidateQueries(["early-warnings"]);
          qc.invalidateQueries(["dashboard-trends"]);
          qc.invalidateQueries(["audit-logs"]);
          if (selectedAssetId) {
            qc.invalidateQueries(["asset-detail", selectedAssetId]);
            qc.invalidateQueries(["asset-history", selectedAssetId]);
          }
        }}
        apiBase={API_BASE}
      />
    </div>
  );
}

export default function App() {
  const [showApp, setShowApp] = useState(() => {
    return window.location.pathname === "/console";
  });

  const handleEnterApp = () => {
    setShowApp(true);
    window.history.pushState({ path: "/console" }, "", "/console");
  };

  return (
    <QueryClientProvider client={queryClient}>
      {showApp ? (
        <RiskRadarApp />
      ) : (
        <LandingPage onEnterApp={handleEnterApp} />
      )}
    </QueryClientProvider>
  );
}
