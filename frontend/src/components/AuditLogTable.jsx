import React, { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Search } from "lucide-react";

export default function AuditLogTable({ auditLogs, onFilterAsset, activeAssetFilter }) {
  const [expandedRows, setExpandedRows] = useState([]);
  const [searchAsset, setSearchAsset] = useState(activeAssetFilter || "");

  const toggleRow = (id) => {
    if (expandedRows.includes(id)) {
      setExpandedRows(expandedRows.filter(x => x !== id));
    } else {
      setExpandedRows([...expandedRows, id]);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onFilterAsset(searchAsset.trim());
  };

  const formatJSON = (obj) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="space-y-4">
      {/* Log Search Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="flex space-x-2 bg-surface p-4 border border-border rounded shadow-sm">
        <div className="relative flex-grow max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-ink-muted" />
          </span>
          <input
            type="text"
            placeholder="Filter audit log by Asset ID (e.g. BOILER-01)..."
            value={searchAsset}
            onChange={(e) => setSearchAsset(e.target.value)}
            className="w-full text-sm pl-9 pr-3 py-2 bg-background border border-border rounded focus:outline-none focus:border-primary text-ink"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-sm font-semibold rounded transition-colors uppercase tracking-wider"
        >
          Apply Filter
        </button>
        {activeAssetFilter && (
          <button
            type="button"
            onClick={() => {
              setSearchAsset("");
              onFilterAsset("");
            }}
            className="px-3 py-2 bg-surface hover:bg-surface-muted text-ink-muted text-sm border border-border rounded font-medium"
          >
            Clear
          </button>
        )}
      </form>

      {/* Log Viewer Table */}
      <div className="bg-surface border border-border rounded overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-border text-left">
          <thead className="bg-surface-muted text-ink-muted text-xs font-semibold uppercase tracking-wider select-none">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3">Timestamp (UTC)</th>
              <th className="px-4 py-3">Asset ID</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Bucket</th>
              <th className="px-4 py-3">Matched Scenarios</th>
              <th className="px-4 py-3">Deterministic Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm font-mono text-ink">
            {auditLogs && auditLogs.length > 0 ? (
              auditLogs.map((log) => {
                const isExpanded = expandedRows.includes(log.id);
                return (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() => toggleRow(log.id)}
                      className="hover:bg-surface-muted/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-center">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-ink-muted" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-ink-muted" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {new Date(log.run_at).toISOString().replace("T", " ").substring(0, 19)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary">{log.asset_id}</td>
                      <td className="px-4 py-3 font-bold">{parseFloat(log.final_score).toFixed(1)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${
                          log.bucket === "high" ? "bg-red-50 text-risk-high border-risk-high/20" :
                          log.bucket === "medium" ? "bg-amber-50 text-risk-medium border-risk-medium/30" :
                          "bg-emerald-50 text-risk-low border-emerald-200"
                        }`}>
                          {log.bucket}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-muted">
                        {log.matched_scenarios && log.matched_scenarios.length > 0
                          ? log.matched_scenarios.join(", ")
                          : "none"}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-muted uppercase font-bold tracking-wider">
                        {log.recommended_action.replace(/_/g, " ")}
                      </td>
                    </tr>
                    
                    {/* Expanded JSON details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="7" className="bg-surface-muted/30 px-6 py-4 border-t border-b border-border/80">
                          <div className="flex items-center space-x-2 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                            <FileText className="h-4 w-4" />
                            <span>Audit Snapshot JSON Payload (Record ID: {log.id})</span>
                          </div>
                          <pre className="bg-surface border border-border/85 rounded p-4 overflow-x-auto text-xs text-ink leading-relaxed font-mono shadow-inner max-h-96">
                            {formatJSON({
                              record_id: log.id,
                              asset_id: log.asset_id,
                              run_at: log.run_at,
                              final_score: parseFloat(log.final_score),
                              bucket: log.bucket,
                              recommended_action: log.recommended_action,
                              sub_scores: log.sub_scores,
                              matched_scenarios: log.matched_scenarios,
                              explanation_structured: log.explanation_structured,
                              explanation_text: log.explanation_text,
                              is_early_warning: log.is_early_warning
                            })}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-ink-muted">
                  No audit logs found. Try clearing filters or trigger a scoring run.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
