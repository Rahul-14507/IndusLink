import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function DashboardTrends({ trends }) {
  if (!trends) return <div className="p-8 text-center text-ink-muted">Loading trends dashboard...</div>;

  const { risk_by_type, risk_by_location, action_backlog } = trends;

  const SCADA_COLORS = ["#0E7C7B", "#0E7C7B/80", "#0E7C7B/50"];

  return (
    <div className="space-y-8">
      {/* Risk Aggregates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk by Type */}
        <div className="bg-surface border border-border rounded p-6 shadow-sm">
          <h3 className="text-xs font-bold text-ink-muted uppercase tracking-widest border-b border-border pb-2 mb-4">
            Risk Distribution by Equipment Type
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={risk_by_type} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E6E3" />
                <XAxis dataKey="type" stroke="#5B6660" fontSize={10} tickLine={false} />
                <YAxis stroke="#5B6660" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E6E3",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    color: "#1F2A24"
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="low" stackId="a" fill="#2E8B57" name="Low Risk" />
                <Bar dataKey="medium" stackId="a" fill="#E8871E" name="Medium Risk" />
                <Bar dataKey="high" stackId="a" fill="#C0392B" name="High Risk" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk by Location */}
        <div className="bg-surface border border-border rounded p-6 shadow-sm">
          <h3 className="text-xs font-bold text-ink-muted uppercase tracking-widest border-b border-border pb-2 mb-4">
            Risk Distribution by Plant Location
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={risk_by_location} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E6E3" />
                <XAxis dataKey="location" stroke="#5B6660" fontSize={10} tickLine={false} />
                <YAxis stroke="#5B6660" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E6E3",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    color: "#1F2A24"
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="low" stackId="a" fill="#2E8B57" name="Low Risk" />
                <Bar dataKey="medium" stackId="a" fill="#E8871E" name="Medium Risk" />
                <Bar dataKey="high" stackId="a" fill="#C0392B" name="High Risk" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Action Backlog Bar Chart */}
      <div className="bg-surface border border-border rounded p-6 shadow-sm max-w-4xl mx-auto">
        <h3 className="text-xs font-bold text-ink-muted uppercase tracking-widest border-b border-border pb-2 mb-4">
          Action Backlog Workload Counts
        </h3>
        <div className="h-64 w-full">
          {action_backlog && action_backlog.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={action_backlog}
                margin={{ top: 10, right: 10, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E6E3" horizontal={false} />
                <XAxis type="number" stroke="#5B6660" fontSize={10} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="action" type="category" stroke="#5B6660" fontSize={9} tickLine={false} width={150} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E6E3",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    color: "#1F2A24"
                  }}
                />
                <Bar dataKey="count" fill="#0E7C7B" radius={[0, 4, 4, 0]} name="Backlog Volume">
                  {action_backlog.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#0E7C7B" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16 text-ink-muted text-sm">
              All recommended operator actions are currently clear.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
