import React, { useState, useRef } from "react";
import { X, UploadCloud, CheckCircle2, AlertOctagon, Loader2, FileText } from "lucide-react";

export default function ImportModal({ isOpen, onClose, onIngestSuccess, apiBase }) {
  if (!isOpen) return null;

  const [dataType, setDataType] = useState("equipment");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | uploading | success | error
  const [result, setResult] = useState(null); // API response payload
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
      } else {
        alert("Please drop a valid .csv file.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile);
      } else {
        alert("Please choose a valid .csv file.");
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setStatus("uploading");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${apiBase || "http://127.0.0.1:8000"}/api/ingest/csv?dataType=${dataType}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        setStatus("success");
        setResult(data);
        if (onIngestSuccess) {
          onIngestSuccess();
        }
      } else {
        setStatus("error");
        setResult(data);
      }
    } catch (err) {
      setStatus("error");
      setResult({
        message: "Network error occurred. Failed to connect to safety server.",
        errors: [err.message]
      });
    }
  };

  const resetForm = () => {
    setFile(null);
    setStatus("idle");
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div 
        className="bg-surface border border-border rounded-2xl shadow-2xl max-w-xl w-full flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-[#1D3225]" />
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Import CSV Telemetry Data</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-ink-muted hover:text-ink p-1 hover:bg-border/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-grow">
          {status === "idle" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* DataType Selector */}
              <div>
                <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-2 font-mono">
                  Select Data Type / Destination Table
                </label>
                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:border-[#1D3225] focus:ring-1 focus:ring-[#1D3225] text-ink font-sans transition-all"
                >
                  <option value="equipment">Equipment Catalog (Add/Modify Assets)</option>
                  <option value="maintenance">Maintenance Logs</option>
                  <option value="inspection">Inspection Reports</option>
                  <option value="incident">Incident Logs</option>
                  <option value="sensor">Sensor Readings (IoT Telemetry)</option>
                </select>
              </div>

              {/* Drag and Drop Zone */}
              <div>
                <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-2 font-mono">
                  Upload CSV File
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    dragActive 
                      ? "border-[#1D3225] bg-[#1D3225]/5" 
                      : file 
                        ? "border-emerald-500 bg-emerald-50/10" 
                        : "border-border hover:bg-surface-muted/50"
                  }`}
                  onClick={handleButtonClick}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <UploadCloud className={`h-10 w-10 mb-3 ${file ? "text-emerald-500 animate-bounce" : "text-ink-muted"}`} />
                  
                  {file ? (
                    <div>
                      <p className="text-sm font-semibold text-ink">{file.name}</p>
                      <p className="text-xs text-ink-muted mt-1">{(file.size / 1024).toFixed(1)} KB · Ready to import</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-ink">Drag and drop your CSV file here, or browse</p>
                      <p className="text-xs text-ink-muted mt-1">Accepts only standard CSV files with matching header columns</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-surface hover:bg-surface-muted text-ink-muted text-xs font-bold font-mono uppercase tracking-wider border border-border rounded-full transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!file}
                  className="flex-grow py-2.5 bg-primary hover:bg-[#15291D] disabled:bg-[#1D3225]/40 text-[#FAF8F5] text-xs font-bold font-mono uppercase tracking-wider rounded-full transition-all shadow-sm"
                >
                  Upload & Import
                </button>
              </div>
            </form>
          )}

          {status === "uploading" && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <div>
                <p className="text-sm font-bold text-ink uppercase tracking-wider">Processing file data</p>
                <p className="text-xs text-ink-muted mt-1">Parsing fields, verifying constraints and recalculating safety scores...</p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-5">
              <div className="flex items-center space-x-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Import Successful</h3>
                  <p className="text-xs text-ink-muted mt-0.5">{result?.message}</p>
                </div>
              </div>

              {/* Ingestion results details */}
              <div className="border border-border rounded-xl bg-surface p-4 text-xs space-y-3">
                <div className="flex justify-between border-b border-border/80 pb-2">
                  <span className="text-ink-muted uppercase font-semibold">Destination dataType</span>
                  <span className="font-bold text-ink capitalize">{dataType}</span>
                </div>
                <div className="flex justify-between border-b border-border/80 pb-2">
                  <span className="text-ink-muted uppercase font-semibold">Total records imported</span>
                  <span className="font-bold text-ink">{result?.count}</span>
                </div>
                <div className="flex justify-between border-b border-border/80 pb-2">
                  <span className="text-ink-muted uppercase font-semibold">Affected Equipment count</span>
                  <span className="font-bold text-ink">{result?.affected_assets?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted uppercase font-semibold">Auto-recalculated safety evaluations</span>
                  <span className="font-bold text-emerald-600">{result?.recalculated_scores || 0}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-[#1D3225] hover:bg-[#15291D] text-white text-xs font-bold font-mono uppercase tracking-wider rounded-full transition-all shadow-sm"
              >
                Close & View Results
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertOctagon className="h-8 w-8 text-risk-high shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Ingestion Rejected</h3>
                  <p className="text-xs text-ink-muted mt-0.5">Database was not modified. Please fix the validation errors below.</p>
                </div>
              </div>

              {/* Error list display */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-ink-muted uppercase tracking-wider">Validation Errors ({result?.errors?.length || 1})</div>
                <div className="bg-[#F6F4EE]/60 border border-border rounded-lg p-3 max-h-56 overflow-y-auto font-mono text-[11px] text-risk-high leading-relaxed space-y-1.5 shadow-inner">
                  {result?.errors && result.errors.length > 0 ? (
                    result.errors.map((err, i) => <div key={i} className="border-b border-border/30 pb-1 last:border-0 last:pb-0">🚨 {err}</div>)
                  ) : (
                    <div>{result?.detail || result?.message || "An unknown parsing error occurred."}</div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={resetForm}
                  className="flex-1 py-2.5 bg-surface hover:bg-surface-muted text-ink-muted text-xs font-bold font-mono uppercase tracking-wider border border-border rounded-full transition-all shadow-sm"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-grow py-2.5 bg-[#1D3225] hover:bg-[#15291D] text-white text-xs font-bold font-mono uppercase tracking-wider rounded-full transition-all shadow-sm"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
