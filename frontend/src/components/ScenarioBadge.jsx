import React from "react";

const SCENARIO_LABELS = {
  silent_degradation: { label: "Silent Degradation", styles: "bg-orange-50 text-orange-800 border-orange-200" },
  repeat_offender: { label: "Repeat Offender", styles: "bg-red-50 text-red-800 border-red-200" },
  blind_spot: { label: "Blind Spot", styles: "bg-amber-50 text-amber-800 border-amber-200" },
  compounding_stress: { label: "Compounding Stress", styles: "bg-red-100 text-red-900 border-red-300 font-semibold animate-pulse" },
};

export default function ScenarioBadge({ scenario }) {
  const meta = SCENARIO_LABELS[scenario] || { label: scenario, styles: "bg-surface-muted text-ink-muted border-border" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${meta.styles}`}>
      {meta.label}
    </span>
  );
}
