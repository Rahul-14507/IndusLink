import React from "react";

export default function LiveFeedIndicator({ active }) {
  return (
    <div className="flex items-center space-x-2 px-3 py-1 bg-surface-muted border border-border rounded-full text-xs font-medium text-ink-muted">
      <span className="relative flex h-2 w-2">
        {active && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${active ? "bg-primary" : "bg-ink-muted/50"}`}></span>
      </span>
      <span>{active ? "Live Feed Ingesting" : "MQTT Connected"}</span>
    </div>
  );
}
