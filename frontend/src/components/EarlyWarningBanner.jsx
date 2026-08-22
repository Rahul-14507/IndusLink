import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function EarlyWarningBanner({ warnings, onSelectAsset }) {
  const [dismissed, setDismissed] = useState([]);

  const activeWarnings = warnings.filter(w => !dismissed.includes(w.asset_id));

  if (activeWarnings.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {activeWarnings.map((w) => (
        <div
          key={w.asset_id}
          className="flex items-start justify-between p-4 bg-amber-50 border-l-4 border-accent rounded shadow-sm text-ink"
        >
          <div className="flex space-x-3">
            <AlertTriangle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">
                Early Warning Alarm: {w.asset_name} ({w.asset_id})
              </p>
              <p className="text-xs text-ink-muted mt-1">
                Risk score increased to <strong className="text-ink">{parseFloat(w.final_score).toFixed(1)}</strong> ({w.bucket.toUpperCase()} risk). 
                Recommended Action: <strong className="text-ink">{w.recommended_action.replace(/_/g, ' ').toUpperCase()}</strong>.
              </p>
              <button
                onClick={() => onSelectAsset(w.asset_id)}
                className="text-xs text-primary font-medium hover:underline mt-2 inline-block"
              >
                Inspect Asset Details &rarr;
              </button>
            </div>
          </div>
          <button
            onClick={() => setDismissed([...dismissed, w.asset_id])}
            className="text-ink-muted hover:text-ink transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
