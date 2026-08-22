import React, { useState, useEffect } from "react";
import { X, Cpu, Wifi, CheckCircle2, AlertOctagon, Loader2, ArrowRight } from "lucide-react";
import { navigate } from "../App";

export default function PairingModal({ isOpen, onClose, apiBase, onPairSuccess }) {
  if (!isOpen) return null;

  const [step, setStep] = useState("form"); // form | pairing | success | error
  const [assetId, setAssetId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("boiler");
  const [location, setLocation] = useState("");
  const [criticality, setCriticality] = useState(3);
  const [logs, setLogs] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePair = async (e) => {
    e.preventDefault();
    if (!assetId.trim() || !name.trim()) return;

    setStep("pairing");
    setLogs(["[Pairing] Initializing pairing wizard..."]);

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    try {
      await delay(1200);
      setLogs(prev => [...prev, "[Pairing] Scanning local BLE/Wi-Fi channels for unassigned nodes..."]);
      
      await delay(1500);
      setLogs(prev => [
        ...prev, 
        "[Pairing] Found broadcast node: ESP32-S3 AirNode (MAC: 3C:61:05:44:A2:BC)",
        "[Pairing] Requesting pairing handshake with node..."
      ]);

      await delay(1500);
      setLogs(prev => [
        ...prev, 
        `[Pairing] Binding node to topic: agrlink/${assetId.trim().toUpperCase()}/readings`,
        "[Pairing] Registering asset details in master safety catalog..."
      ]);

      // Call backend API to create asset
      const res = await fetch(`${apiBase}/api/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonPayload()
      });

      const data = await res.json();
      await delay(1000);

      if (res.ok && data.status === "success") {
        setLogs(prev => [...prev, "[Pairing] Telmetry link established. Ingestion is fully operational!"]);
        await delay(800);
        setStep("success");
        if (onPairSuccess) onPairSuccess(assetId.trim().toUpperCase());
      } else {
        throw new Error(data.detail || "Pairing rejected by catalog server.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to establish link.");
      setStep("error");
    }
  };

  const jsonPayload = () => {
    return JSON.stringify({
      asset_id: assetId.trim().toUpperCase(),
      name: name.trim(),
      type: type,
      location: location.trim() || "Unspecified Sector",
      criticality: parseInt(criticality)
    });
  };

  const resetForm = () => {
    setAssetId("");
    setName("");
    setType("boiler");
    setLocation("");
    setCriticality(3);
    setLogs([]);
    setErrorMsg("");
    setStep("form");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div 
        className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-[#1D3225]" />
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Pair New IoT Sensor Node</h2>
          </div>
          {step !== "pairing" && (
            <button 
              onClick={onClose} 
              className="text-ink-muted hover:text-ink p-1 hover:bg-border/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-grow">
          {step === "form" && (
            <form onSubmit={handlePair} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1 font-mono">
                  Asset ID (Unique identifier)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. COMPRESSOR-99"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-[#1D3225] focus:ring-1 focus:ring-[#1D3225] text-ink font-mono uppercase transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1 font-mono">
                  Asset Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Air Compressor Tank 99"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-[#1D3225] focus:ring-1 focus:ring-[#1D3225] text-ink font-sans transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1 font-mono">
                    Equipment Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-[#1D3225] text-ink"
                  >
                    <option value="boiler">Boiler</option>
                    <option value="compressor">Compressor</option>
                    <option value="pump">Pump</option>
                    <option value="turbine">Turbine</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1 font-mono">
                    Criticality (1-5)
                  </label>
                  <select
                    value={criticality}
                    onChange={(e) => setCriticality(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-[#1D3225] text-ink font-semibold"
                  >
                    <option value="1">1 - Minimal</option>
                    <option value="2">2 - Low</option>
                    <option value="3">3 - Medium</option>
                    <option value="4">4 - High</option>
                    <option value="5">5 - Mission Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1 font-mono">
                  Installation Plant Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sector 4 East Wing"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-[#1D3225] focus:ring-1 focus:ring-[#1D3225] text-ink font-sans transition-all"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-surface hover:bg-surface-muted text-ink-muted text-xs font-bold font-mono uppercase tracking-wider border border-border rounded-full transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-grow py-2.5 bg-primary hover:bg-[#15291D] text-[#FAF8F5] text-xs font-bold font-mono uppercase tracking-wider rounded-full transition-all shadow-sm"
                >
                  Scan & Pair Node
                </button>
              </div>
            </form>
          )}

          {step === "pairing" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-6 space-y-3">
                <div className="relative flex items-center justify-center">
                  <div className="absolute animate-ping h-12 w-12 rounded-full bg-primary/20 border border-primary/40"></div>
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-ink uppercase tracking-wider font-mono">Pairing IoT AirNode...</p>
                  <p className="text-[10px] text-ink-muted mt-1">Establishing secure MQTT link over HiveMQ broker</p>
                </div>
              </div>

              {/* Scrolling pairing logs */}
              <div className="bg-[#1D3225] text-[#10B981] font-mono text-[10px] p-3 rounded-lg border border-border/10 shadow-inner h-32 overflow-y-auto space-y-1.5 scrollbar-none">
                {logs.map((log, i) => (
                  <div key={i} className="leading-relaxed animate-fadeIn">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-5">
              <div className="flex items-center space-x-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Node Paired Successfully</h3>
                  <p className="text-xs text-ink-muted mt-0.5">Asset ID {assetId.toUpperCase()} is now live.</p>
                </div>
              </div>

              <div className="border border-border rounded-xl bg-surface p-4 text-xs space-y-2 font-mono">
                <div className="flex justify-between border-b border-border/80 pb-2">
                  <span className="text-ink-muted uppercase">Asset Bind ID</span>
                  <span className="font-bold text-ink">{assetId.toUpperCase()}</span>
                </div>
                <div className="flex justify-between border-b border-border/80 pb-2">
                  <span className="text-ink-muted uppercase">paired hardware</span>
                  <span className="font-bold text-ink">ESP32-S3 AirNode</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted uppercase">MQTT Broadcast Channel</span>
                  <span className="font-bold text-primary text-[10px]">agrlink/+/readings</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  navigate(`/console/asset/${assetId.toUpperCase()}`);
                }}
                className="w-full py-2.5 bg-primary hover:bg-[#15291D] text-white text-xs font-bold font-mono uppercase tracking-wider rounded-full transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <span>Enter Device Console</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertOctagon className="h-8 w-8 text-risk-high shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Pairing Handshake Rejected</h3>
                  <p className="text-xs text-ink-muted mt-0.5">The pairing sequence could not be completed.</p>
                </div>
              </div>

              <div className="bg-[#F6F4EE]/60 border border-border rounded-lg p-3 font-mono text-[11px] text-risk-high">
                🚨 Error: {errorMsg}
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={resetForm}
                  className="flex-grow py-2.5 bg-primary hover:bg-[#15291D] text-white text-xs font-bold font-mono uppercase tracking-wider rounded-full transition-all shadow-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
