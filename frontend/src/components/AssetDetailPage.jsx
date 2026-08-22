import React from "react";
import { ArrowLeft, Calendar, MapPin, Tag, Wrench, ShieldCheck, AlertCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine
} from "recharts";
import ScenarioBadge from "./ScenarioBadge";

export default function AssetDetailPage({ assetId, assetDetail, history, onBack }) {
  if (!assetDetail) return <div className="p-8 text-center text-ink-muted">Loading asset details...</div>;

  const scoreRecord = assetDetail.latest_score;
  const subScores = scoreRecord ? scoreRecord.sub_scores : {};
  const matchedScenarios = scoreRecord ? scoreRecord.matched_scenarios : [];

  // Format history for line chart
  const chartData = history ? history.map(item => ({
    time: new Date(item.run_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    score: parseFloat(item.final_score),
    timestamp: new Date(item.run_at).getTime()
  })) : [];

  const getSubscoreColor = (val) => {
    if (val >= 70) return "bg-risk-high";
    if (val >= 40) return "bg-risk-medium";
    return "bg-risk-low";
  };

  const getSubscoreLabel = (key) => {
    return key.replace(/_/g, ' ').toUpperCase();
  };

  const getBucketBorder = (bucket) => {
    const b = (bucket || "low").toLowerCase();
    if (b === "high") return "border-risk-high/30 bg-red-50/50 rounded-xl";
    if (b === "medium") return "border-risk-medium/30 bg-amber-50/50 rounded-xl";
    return "border-emerald-200 bg-emerald-50/20 rounded-xl";
  };

  return (
    <div className="space-y-6">
      {/* Header back bar */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 px-4 py-1.5 bg-surface hover:bg-surface-muted border border-border rounded-full text-xs font-bold text-ink-muted hover:text-ink transition-colors font-mono uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to priority list</span>
        </button>
      </div>

      {/* Asset Meta Info Card */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink mb-1">{assetDetail.name}</h2>
          <p className="text-xs text-ink-muted uppercase tracking-wider font-semibold">ID: {assetDetail.asset_id}</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-ink-muted">
          <Tag className="h-4 w-4 text-primary shrink-0" />
          <div>
            <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Type</div>
            <div className="font-medium text-ink capitalize">{assetDetail.type}</div>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-ink-muted">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <div>
            <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Location</div>
            <div className="font-medium text-ink">{assetDetail.location}</div>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-ink-muted">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <div>
            <div className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Installed</div>
            <div className="font-medium text-ink">
              {assetDetail.install_date ? new Date(assetDetail.install_date).toLocaleDateString() : "Unknown"}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Scores and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Sub-scores & Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Risk Score Summary */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-ink-muted uppercase tracking-widest border-b border-border pb-2 mb-4">
              Current Risk Assessment
            </h3>
            {scoreRecord ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-black text-ink">
                      {parseFloat(scoreRecord.final_score).toFixed(1)}
                    </div>
                    <div className="text-xs text-ink-muted font-medium mt-0.5">FINAL SAFETY RISK INDEX</div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded border font-bold text-sm tracking-wider uppercase ${
                      scoreRecord.bucket === "high" ? "bg-red-50 text-risk-high border-risk-high/30" :
                      scoreRecord.bucket === "medium" ? "bg-amber-50 text-risk-medium border-risk-medium/30" :
                      "bg-emerald-50 text-risk-low border-emerald-200"
                    }`}>
                      {scoreRecord.bucket} RISK
                    </span>
                  </div>
                </div>

                {/* Scenarios Badges */}
                {matchedScenarios.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Matched Anomalies</div>
                    <div className="flex flex-wrap gap-1.5">
                      {matchedScenarios.map(s => <ScenarioBadge key={s} scenario={s} />)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-ink-muted text-sm">No risk score available. Run scoring batch.</div>
            )}
          </div>

          {/* Sub-score Bars */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-ink-muted uppercase tracking-widest border-b border-border pb-2 mb-4">
              Sub-Score Breakdown
            </h3>
            {scoreRecord ? (
              <div className="space-y-3">
                {Object.entries(subScores).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-ink">{getSubscoreLabel(key)}</span>
                      <span className="font-bold text-ink-muted">{parseFloat(val).toFixed(0)}/100</span>
                    </div>
                    <div className="w-full bg-surface-muted h-2 rounded-full overflow-hidden border border-border/50">
                      <div
                        className={`h-full ${getSubscoreColor(val)}`}
                        style={{ width: `${val}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-ink-muted text-sm">No details.</div>
            )}
          </div>

          {/* Action Recommendation Card */}
          {scoreRecord && (
            <div className={`border p-5 shadow-sm ${getBucketBorder(scoreRecord.bucket)}`}>
              <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Recommended Operator Action</h4>
              <div className="text-base font-bold text-ink capitalize mb-3 flex items-center">
                <Wrench className="h-4 w-4 mr-2 text-primary" />
                {scoreRecord.recommended_action.replace(/_/g, ' ')}
              </div>
              <button 
                onClick={() => alert(`Operational Ticket Created for: ${scoreRecord.recommended_action.replace(/_/g, ' ').toUpperCase()}`)}
                className="w-full py-2.5 bg-primary hover:bg-[#15291D] text-white font-bold text-xs tracking-wider uppercase rounded-full shadow-sm transition-all font-mono"
              >
                Dispatch Work Order
              </button>
            </div>
          )}
        </div>

        {/* Right column: Explanations & Line Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Explanation Text Card */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-ink-muted uppercase tracking-widest border-b border-border pb-2 mb-4 flex items-center justify-between">
              <span>Safety assessment summary</span>
              <span className="text-[10px] font-medium tracking-normal text-ink-muted normal-case bg-[#F6F4EE] border border-border px-1.5 py-0.5 rounded">
                AI Explained
              </span>
            </h3>
            {scoreRecord ? (
              <div className="p-4 bg-[#F6F4EE]/60 border border-border/80 rounded-lg italic text-ink/90 text-sm leading-relaxed font-sans shadow-inner">
                {scoreRecord.explanation_text ? (
                  `"${scoreRecord.explanation_text}"`
                ) : (
                  <span className="text-ink-muted font-normal">
                    Plain language explanation is unavailable (verify GROQ_API_KEY environment variable or check if Groq rate limits are exceeded). The deterministic rule scoring remained fully operational. Match status: {matchedScenarios.join(", ") || "No scenario rules triggered."}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-ink-muted text-sm italic">Not scored.</div>
            )}
          </div>

          {/* Real-time Telemetry Grid */}
          {scoreRecord && scoreRecord.sensor_data && (
            <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-ink-muted uppercase tracking-widest border-b border-border pb-2 mb-4">
                Real-Time Telemetry Feed
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(scoreRecord.sensor_data).map(([metric, data]) => {
                  const val = parseFloat(data.value);
                  const isMinBreach = data.safe_min !== null && val < data.safe_min;
                  const isMaxBreach = data.safe_max !== null && val > data.safe_max;
                  const isBreaching = isMinBreach || isMaxBreach;
                  
                  return (
                    <div 
                      key={metric} 
                      className={`p-4 rounded-lg border transition-colors ${
                        isBreaching 
                          ? "border-risk-high/30 bg-red-50/20" 
                          : "border-border bg-[#F6F4EE]/40"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">{metric}</span>
                        {isBreaching ? (
                          <span className="px-1.5 py-0.5 bg-risk-high text-white text-[8px] font-bold uppercase rounded animate-pulse">
                            Breach
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] font-bold uppercase rounded">
                            Nominal
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-black text-ink mt-2">
                        {val.toFixed(metric === "pressure" ? 2 : 1)}
                        <span className="text-xs font-semibold text-ink-muted ml-1">
                          {metric === "temperature" ? "°C" : metric === "humidity" ? "%" : metric === "pressure" ? "hPa" : ""}
                        </span>
                      </div>
                      <div className="text-[10px] text-ink-muted mt-2 font-medium">
                        Safe: {data.safe_min !== null ? data.safe_min.toFixed(0) : "N/A"} - {data.safe_max !== null ? data.safe_max.toFixed(0) : "N/A"}
                      </div>
                      <div className="text-[9px] text-ink-muted/70 font-mono mt-1">
                        Updated: {new Date(data.ts).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Historical Trend Chart */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-ink-muted uppercase tracking-widest border-b border-border pb-2 mb-4">
              Historical safety trend
            </h3>
            {chartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E3DFD5" />
                    <XAxis dataKey="time" stroke="#3B4C41" fontSize={10} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#3B4C41" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FAF8F5",
                        border: "1px solid #E3DFD5",
                        fontFamily: "Inter, sans-serif",
                        fontSize: "12px",
                        color: "#1D3225"
                      }}
                    />
                    
                    {/* Horizontal zone bands */}
                    <ReferenceArea y1={0} y2={40} fill="#10B981" fillOpacity={0.03} />
                    <ReferenceArea y1={40} y2={70} fill="#D97706" fillOpacity={0.03} />
                    <ReferenceArea y1={70} y2={100} fill="#C0392B" fillOpacity={0.03} />

                    {/* Reference threshold lines */}
                    <ReferenceLine y={40} stroke="#D97706" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <ReferenceLine y={70} stroke="#C0392B" strokeDasharray="3 3" strokeOpacity={0.5} />

                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#1D3225"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 1 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] uppercase font-bold text-ink-muted mt-3">
                  <div className="flex items-center"><span className="h-2 w-2 bg-risk-low/20 mr-1 border border-risk-low/30"></span> Low Risk (0-40)</div>
                  <div className="flex items-center"><span className="h-2 w-2 bg-risk-medium/20 mr-1 border border-risk-medium/30"></span> Med Risk (40-70)</div>
                  <div className="flex items-center"><span className="h-2 w-2 bg-risk-high/20 mr-1 border border-risk-high/30"></span> High Risk (70-100)</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-ink-muted text-sm">
                No history data found for this equipment asset.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
