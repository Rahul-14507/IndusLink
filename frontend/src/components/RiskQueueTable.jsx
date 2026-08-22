import React, { useState, useMemo } from "react";
import { ArrowUpDown, HelpCircle, ShieldAlert } from "lucide-react";
import ScenarioBadge from "./ScenarioBadge";

export default function RiskQueueTable({ queue, onSelectAsset }) {
  const [filterBucket, setFilterBucket] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("priority"); // default is prioritized rank from API
  const [sortAsc, setSortAsc] = useState(true);

  // Extract unique filter choices
  const locations = useMemo(() => {
    const locs = queue.map(x => x.asset_location).filter(Boolean);
    return Array.from(new Set(locs));
  }, [queue]);

  const types = useMemo(() => {
    const ts = queue.map(x => x.asset_type).filter(Boolean);
    return Array.from(new Set(ts));
  }, [queue]);

  // Handle column sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filter & Sort queue list
  const processedData = useMemo(() => {
    let result = [...queue];

    // Filter
    if (filterBucket !== "all") {
      result = result.filter(x => x.bucket.toLowerCase() === filterBucket.toLowerCase());
    }
    if (filterLocation !== "all") {
      result = result.filter(x => x.asset_location === filterLocation);
    }
    if (filterType !== "all") {
      result = result.filter(x => x.asset_type === filterType);
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        x =>
          x.asset_id.toLowerCase().includes(q) ||
          x.asset_name.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortField === "priority") {
      // API already returns correct ranked items. Let's keep it if default, reverse if sortAsc is false.
      if (!sortAsc) result.reverse();
    } else {
      result.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        
        // Handle nested fields
        if (sortField === "final_score") {
          valA = parseFloat(a.final_score);
          valB = parseFloat(b.final_score);
        }

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [queue, filterBucket, filterLocation, filterType, searchQuery, sortField, sortAsc]);

  const getBucketBadge = (bucket) => {
    const b = bucket.toLowerCase();
    if (b === "high") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-risk-high border border-red-200">
          <span className="h-1.5 w-1.5 rounded-full bg-risk-high mr-1.5 animate-pulse"></span>
          HIGH
        </span>
      );
    } else if (b === "medium") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-risk-medium border border-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-risk-medium mr-1.5"></span>
          MEDIUM
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-risk-low border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-risk-low mr-1.5"></span>
          LOW
        </span>
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-surface p-4 border border-border rounded">
        <div>
          <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">Search Asset</label>
          <input
            type="text"
            placeholder="Search name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded focus:outline-none focus:border-primary text-ink"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">Risk Level</label>
          <select
            value={filterBucket}
            onChange={(e) => setFilterBucket(e.target.value)}
            className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded focus:outline-none focus:border-primary text-ink"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">Location</label>
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded focus:outline-none focus:border-primary text-ink"
          >
            <option value="all">All Locations</option>
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">Equipment Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full text-sm px-3 py-1.5 bg-background border border-border rounded focus:outline-none focus:border-primary text-ink"
          >
            <option value="all">All Types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Grid List */}
      <div className="bg-surface border border-border rounded overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left">
            <thead className="bg-surface-muted text-ink-muted text-xs font-semibold uppercase tracking-wider select-none">
              <tr>
                <th 
                  onClick={() => handleSort("asset_name")}
                  className="px-4 py-3 cursor-pointer hover:text-ink hover:bg-border/30 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Equipment Asset</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("asset_type")}
                  className="px-4 py-3 cursor-pointer hover:text-ink hover:bg-border/30 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Type</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("asset_location")}
                  className="px-4 py-3 cursor-pointer hover:text-ink hover:bg-border/30 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Location</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("asset_criticality")}
                  className="px-4 py-3 cursor-pointer hover:text-ink hover:bg-border/30 transition-colors text-center"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Crit.</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("final_score")}
                  className="px-4 py-3 cursor-pointer hover:text-ink hover:bg-border/30 transition-colors text-center"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Risk Score</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort("bucket")}
                  className="px-4 py-3 cursor-pointer hover:text-ink hover:bg-border/30 transition-colors text-center"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Bucket</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3">Flags / Scenarios</th>
                <th className="px-4 py-3">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm text-ink">
              {processedData.length > 0 ? (
                processedData.map((row) => (
                  <tr
                    key={row.asset_id}
                    onClick={() => onSelectAsset(row.asset_id)}
                    className="hover:bg-surface-muted/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink">{row.asset_name}</div>
                      <div className="text-xs text-ink-muted">{row.asset_id}</div>
                    </td>
                    <td className="px-4 py-3 capitalize">{row.asset_type}</td>
                    <td className="px-4 py-3">{row.asset_location}</td>
                    <td className="px-4 py-3 text-center font-medium">
                      <span className="inline-block px-1.5 py-0.5 bg-background border border-border rounded text-xs">
                        {row.asset_criticality}/5
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-base">
                      {parseFloat(row.final_score).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-center">{getBucketBadge(row.bucket)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {row.is_early_warning && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded border border-red-200 bg-red-50 text-risk-high text-xs font-semibold animate-pulse">
                            <ShieldAlert className="h-3 w-3 mr-0.5" /> Early Warning
                          </span>
                        )}
                        {row.matched_scenarios && row.matched_scenarios.length > 0 ? (
                          row.matched_scenarios.map(s => <ScenarioBadge key={s} scenario={s} />)
                        ) : (
                          !row.is_early_warning && <span className="text-xs text-ink-muted">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-ink-muted">
                      <span className="px-2 py-1 bg-surface-muted border border-border rounded">
                        {row.recommended_action.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-ink-muted">
                    No assets match the active search/filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
