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

  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const formatActionTick = (val) => {
    const formatted = val.replace(/_/g, ' ');
    if (isMobile && formatted.length > 12) {
      return formatted.substring(0, 10) + "..";
    }
    return formatted;
  };

  return (
    <div className="space-y-8">
      {/* Risk Aggregates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk by Type */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-ink-muted uppercase tracking-widest border-b border-border pb-2 mb-4">
            Risk Distribution by Equipment Type
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={risk_by_type} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3DFD5" />
                <XAxis dataKey="type" stroke="#3B4C41" fontSize={10} tickLine={false} />
                <YAxis stroke="#3B4C41" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FAF8F5",
                    border: "1px solid #E3DFD5",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    color: "#1D3225"
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="low" stackId="a" fill="#10B981" name="Low Risk" />
                <Bar dataKey="medium" stackId="a" fill="#D97706" name="Medium Risk" />
                <Bar dataKey="high" stackId="a" fill="#C0392B" name="High Risk" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk by Location */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-ink-muted uppercase tracking-widest border-b border-border pb-2 mb-4">
            Risk Distribution by Plant Location
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={risk_by_location} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3DFD5" />
                <XAxis dataKey="location" stroke="#3B4C41" fontSize={10} tickLine={false} />
                <YAxis stroke="#3B4C41" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FAF8F5",
                    border: "1px solid #E3DFD5",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    color: "#1D3225"
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="low" stackId="a" fill="#10B981" name="Low Risk" />
                <Bar dataKey="medium" stackId="a" fill="#D97706" name="Medium Risk" />
                <Bar dataKey="high" stackId="a" fill="#C0392B" name="High Risk" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Action Backlog Bar Chart */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm max-w-4xl mx-auto">
        <h3 className="text-xs font-bold text-ink-muted uppercase tracking-widest border-b border-border pb-2 mb-4">
          Action Backlog Workload Counts
        </h3>
        <div className="h-64 w-full">
          {action_backlog && action_backlog.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={action_backlog}
                margin={{ top: 10, right: 10, left: isMobile ? -35 : 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E3DFD5" horizontal={false} />
                <XAxis type="number" stroke="#3B4C41" fontSize={10} tickLine={false} allowDecimals={false} />
                <YAxis
                  dataKey="action"
                  type="category"
                  stroke="#3B4C41"
                  fontSize={isMobile ? 8 : 9}
                  tickLine={false}
                  width={isMobile ? 70 : 150}
                  tickFormatter={formatActionTick}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FAF8F5",
                    border: "1px solid #E3DFD5",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "12px",
                    color: "#1D3225"
                  }}
                />
                <Bar dataKey="count" fill="#1D3225" radius={[0, 4, 4, 0]} name="Backlog Volume">
                  {action_backlog.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#1D3225" />
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
