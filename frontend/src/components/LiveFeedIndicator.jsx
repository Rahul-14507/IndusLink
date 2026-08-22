import React from "react";

export default function LiveFeedIndicator({ active, latestReading, compact }) {
  if (compact) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1 bg-surface-muted border border-border rounded-full text-xs font-medium text-ink-muted whitespace-nowrap">
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

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4 px-4 py-2.5 bg-surface border border-border rounded-lg text-xs font-medium text-ink-muted shadow-sm w-full transition-all">
      <div className="flex items-center space-x-2">
        <span className="relative flex h-2.5 w-2.5">
          {active && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${active ? "bg-primary" : "bg-ink-muted/50"}`}></span>
        </span>
        <span className="font-bold text-ink uppercase tracking-wider">
          {active ? "Live Feed Ingesting" : "MQTT Connected"}
        </span>
      </div>
      
      {latestReading && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] border-t md:border-t-0 md:border-l border-border pt-2 md:pt-0 md:pl-4 w-full md:w-auto">
          <span className="bg-primary/5 px-2 py-0.5 rounded border border-primary/20 font-bold text-primary animate-pulse">
            LIVE: {latestReading.assetId}
          </span>
          <span>Temp: <strong className="text-ink font-semibold">{parseFloat(latestReading.temperature || 0).toFixed(1)}°C</strong></span>
          <span>Hum: <strong className="text-ink font-semibold">{parseFloat(latestReading.humidity || 0).toFixed(1)}%</strong></span>
          <span>Press: <strong className="text-ink font-semibold">{parseFloat(latestReading.pressure || 0).toFixed(2)} hPa</strong></span>
          <span className="text-ink-muted/70 font-mono ml-auto md:ml-0">
            ({new Date(latestReading.timestamp).toLocaleTimeString()})
          </span>
        </div>
      )}
    </div>
  );
}
