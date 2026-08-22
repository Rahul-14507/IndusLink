import React from "react";
import {
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  Cpu,
  Layers,
  Terminal,
  Check,
  Wifi,
  Database,
  Activity,
  Play,
  FileText,
  AlertTriangle,
  ExternalLink
} from "lucide-react";

export default function LandingPage({ onEnterApp }) {
  // Navigation helper for smooth scrolling
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#080B0D] text-zinc-100 font-mono antialiased relative selection:bg-accent selection:text-white">
      {/* Decorative Grid Overlay for Industrial Vibe */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f1418_1px,transparent_1px),linear-gradient(to_bottom,#0f1418_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Banner & Navigation */}
      <header className="sticky top-0 z-50 bg-[#080B0D]/90 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-red-950/50 border border-red-800 p-1.5 animate-pulse">
            <ShieldAlert className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-widest text-zinc-100 uppercase">INDUSLINK</h1>
            <p className="text-[10px] text-zinc-500 tracking-wider font-sans -mt-0.5">PREDICTIVE SAFETY CONSOLE</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-6 text-xs text-zinc-400 font-sans font-medium">
          <button onClick={() => scrollToSection("core-loop")} className="hover:text-zinc-100 transition-colors uppercase tracking-wider">Pipeline</button>
          <button onClick={() => scrollToSection("differentiators")} className="hover:text-zinc-100 transition-colors uppercase tracking-wider">Differentiators</button>
          <button onClick={() => scrollToSection("demo")} className="hover:text-zinc-100 transition-colors uppercase tracking-wider">Demo</button>
          <button onClick={() => scrollToSection("architecture")} className="hover:text-zinc-100 transition-colors uppercase tracking-wider">Architecture</button>
          <button onClick={() => scrollToSection("iot")} className="hover:text-zinc-100 transition-colors uppercase tracking-wider">IoT-Sim</button>
        </nav>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 border border-emerald-900/40 bg-emerald-950/10 px-2.5 py-1 text-[10px] text-emerald-500 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>SYS_READY // SECURE</span>
          </div>
          <button
            onClick={onEnterApp}
            className="flex items-center space-x-2 px-4 py-1.5 bg-accent hover:bg-accent/90 text-white text-xs font-bold uppercase tracking-widest border border-amber-500 transition-colors hover:shadow-[0_0_15px_rgba(232,135,30,0.3)]"
          >
            <span>LAUNCH CONSOLE</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* 1. Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto border-x border-zinc-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center space-x-2 border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-[11px] text-zinc-400 uppercase tracking-widest">
              <span className="text-accent">//</span>
              <span>HACKATHON DEPLOYMENT &bull; EXPLAINABLE AI</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tighter text-white uppercase leading-none">
              Safety Checks Today <br/>
              Are <span className="text-red-500 underline decoration-red-950 underline-offset-8">Reactive</span>
            </h1>

            <p className="text-zinc-400 text-sm sm:text-base font-sans leading-relaxed max-w-2xl">
              Periodic manual inspections and reviewing log records <span className="text-zinc-200 font-semibold font-mono text-xs bg-zinc-900 px-1 border border-zinc-800">POST-INCIDENT</span> fail to protect workers. 
              IndusLink shifts the paradigm by continuously feeding historical audits, maintenance logs, and sensor streams into a deterministic evaluation engine to preempt failures before they occur.
            </p>

            <div className="p-4 border-l-2 border-accent bg-amber-950/10 border-y border-r border-amber-900/20 max-w-3xl">
              <p className="text-xs text-zinc-300 font-sans italic leading-relaxed">
                "RiskRadar flags critical industrial assets showing signs of silent degradation, translates mathematical risks into clear human-understandable recommendations, and ranks issues by risk severity."
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={onEnterApp}
                className="px-6 py-3 bg-accent hover:bg-accent/90 text-white text-xs font-bold uppercase tracking-widest border border-amber-500 transition-colors flex items-center space-x-2"
              >
                <span>ENTER THE CONTROL ROOM</span>
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollToSection("core-loop")}
                className="px-6 py-3 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 text-zinc-300 hover:text-zinc-100 text-xs font-bold uppercase tracking-widest transition-colors"
              >
                SEE PIPELINE FLOW
              </button>
            </div>
          </div>

          {/* Right Column: Console Graphic Mockup */}
          <div className="lg:col-span-4 border border-zinc-800 bg-zinc-950/60 p-6 space-y-4 shadow-xl relative overflow-hidden">
            {/* Top diagnostic line */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-[10px] text-zinc-500">
              <span>DEVICE_CHECK: OK</span>
              <span className="font-mono text-red-500">CRITICAL_BLOCKED: 03</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center bg-zinc-900/60 p-2 border border-zinc-850">
                <span className="text-xs text-zinc-400">PUMP-014 (Pressure)</span>
                <span className="px-2 py-0.5 bg-red-950 border border-red-800 text-[10px] text-red-400 font-bold uppercase tracking-wide">HIGH_RISK</span>
              </div>
              <div className="flex justify-between items-center bg-zinc-900/60 p-2 border border-zinc-850">
                <span className="text-xs text-zinc-400">TURBINE-08 (Vibration)</span>
                <span className="px-2 py-0.5 bg-amber-950 border border-amber-800 text-[10px] text-amber-400 font-bold uppercase tracking-wide">WARN_RISK</span>
              </div>
              <div className="flex justify-between items-center bg-zinc-900/60 p-2 border border-zinc-850">
                <span className="text-xs text-zinc-400">COMPRESSOR-02 (Temp)</span>
                <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-500 font-bold uppercase tracking-wide">OK</span>
              </div>
            </div>

            <div className="bg-zinc-900/30 p-3 border border-zinc-850 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span>SCENARIO IDENTIFIED:</span>
                <span className="text-amber-500">SILENT_DEGRADATION</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 border border-zinc-800">
                <div className="bg-gradient-to-r from-amber-500 to-red-500 h-full w-[85%]" />
              </div>
            </div>

            {/* Bottom mini-terminal feed */}
            <div className="bg-black/80 border border-zinc-900 p-3 font-mono text-[9px] text-emerald-500 space-y-1 overflow-hidden h-28 select-none">
              <p className="text-zinc-500">&gt; npm run start:broker</p>
              <p>[sys] mqtt sub connected to riskradar/#</p>
              <p>[sys] payload rx: {"{"}PUMP-014: 82.4 psi{"}"}</p>
              <p className="text-amber-400">[eval] running scenario matcher...</p>
              <p className="text-red-400">[alarm] PUMP-014 score jumped +14% (High Risk)</p>
              <p className="text-emerald-400 animate-pulse">&gt; waiting telemetry feed...</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Loop Diagram Section */}
      <section id="core-loop" className="py-20 border-t border-zinc-900 bg-[#06080A] px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs text-accent uppercase tracking-widest font-bold">// OPERATIONS PIPELINE</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-tight">The Core Data Loop</h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-sans">
              Unlike generic anomaly models, IndusLink passes structured, deterministic scores through an LLM to generate verifiable audits and ranks action paths.
            </p>
          </div>

          {/* Horizontal Steps (Vertical on mobile) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative">
            {/* Step 1 */}
            <div className="border border-zinc-800 bg-zinc-900/20 p-5 space-y-3 relative group">
              <div className="absolute top-3 right-3 text-xs text-zinc-700 font-black">01</div>
              <div className="bg-zinc-900 p-2 inline-block border border-zinc-800 text-zinc-400">
                <Wifi className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">1. Data Convergence</h3>
              <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                Ingests historical CSV spreadsheets and live MQTT sensor telemetry streams into the exact same database format.
              </p>
            </div>

            {/* Step 2 */}
            <div className="border border-zinc-800 bg-zinc-900/20 p-5 space-y-3 relative group">
              <div className="absolute top-3 right-3 text-xs text-zinc-700 font-black">02</div>
              <div className="bg-zinc-900 p-2 inline-block border border-zinc-800 text-zinc-400">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">2. Scoring Engine</h3>
              <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                Evaluates 5 base sub-scores (maintenance, incidents, sensors, inspections, stale data) and flags custom risk scenarios.
              </p>
            </div>

            {/* Step 3 */}
            <div className="border border-zinc-800 bg-zinc-900/20 p-5 space-y-3 relative group">
              <div className="absolute top-3 right-3 text-xs text-zinc-700 font-black">03</div>
              <div className="bg-zinc-900 p-2 inline-block border border-zinc-800 text-zinc-400">
                <Terminal className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">3. Explainable Logic</h3>
              <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                Sub-scores are processed by an LLM to generate plain-text explanations, strictly constrained to numerical facts only.
              </p>
            </div>

            {/* Step 4 */}
            <div className="border border-zinc-800 bg-zinc-900/20 p-5 space-y-3 relative group">
              <div className="absolute top-3 right-3 text-xs text-zinc-700 font-black">04</div>
              <div className="bg-zinc-900 p-2 inline-block border border-zinc-800 text-zinc-400">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">4. Priority Ranking</h3>
              <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                Sorts flagged equipment by risk. Ties are broken by asset criticality and historical incident severity to optimize inspector resources.
              </p>
            </div>

            {/* Step 5 */}
            <div className="border border-zinc-800 bg-zinc-900/20 p-5 space-y-3 relative group">
              <div className="absolute top-3 right-3 text-xs text-zinc-700 font-black">05</div>
              <div className="bg-zinc-900 p-2 inline-block border border-zinc-800 text-zinc-400">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">5. Actionable Output</h3>
              <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                Outputs immediate recommendations (inspect, maintain, calibrate, monitor) and appends everything to an audit database.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Differentiators Grid Section */}
      <section id="differentiators" className="py-20 border-t border-zinc-900 px-6 max-w-7xl mx-auto border-x border-zinc-900">
        <div className="space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-800 pb-6">
            <div>
              <span className="text-xs text-accent uppercase tracking-widest font-bold">// SYSTEM ATTRIBUTES</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-tight mt-1">Why IndusLink is Different</h2>
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm font-sans max-w-md">
              We built this console explicitly for safety engineers who cannot afford to act on "black-box" decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Diff 1 */}
            <div className="border border-zinc-800 bg-zinc-900/10 p-5 space-y-3">
              <div className="text-red-500 border border-red-900/40 bg-red-950/15 w-8 h-8 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="text-xs font-bold uppercase text-zinc-200">Explainable Scoring</h3>
              <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                Uses deterministic, expert-defined formulas and scenario checks, not opaque machine learning. Every score matches predefined calculations.
              </p>
            </div>

            {/* Diff 2 */}
            <div className="border border-zinc-800 bg-zinc-900/10 p-5 space-y-3">
              <div className="text-amber-500 border border-amber-900/40 bg-amber-950/15 w-8 h-8 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="text-xs font-bold uppercase text-zinc-200">Targeted Actions</h3>
              <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                Rather than just flagging anomaly scores, the tool outputs specific operational workflows (inspect / calibrate / repair / monitor).
              </p>
            </div>

            {/* Diff 3 */}
            <div className="border border-zinc-800 bg-zinc-900/10 p-5 space-y-3">
              <div className="text-emerald-500 border border-emerald-900/40 bg-emerald-950/15 w-8 h-8 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="text-xs font-bold uppercase text-zinc-200">Resource Ranking</h3>
              <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                Addresses inspector constraints directly. Out of 1,000 assets, the system bubble-sorts the most dangerous assets to the top automatically.
              </p>
            </div>

            {/* Diff 4 */}
            <div className="border border-zinc-800 bg-zinc-900/10 p-5 space-y-3">
              <div className="text-sky-500 border border-sky-900/40 bg-sky-950/15 w-8 h-8 flex items-center justify-center font-bold text-sm">
                04
              </div>
              <h3 className="text-xs font-bold uppercase text-zinc-200">Locked-in Audit Trail</h3>
              <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                Saves a complete snapshot of raw variables, intermediate scores, final classifications, and LLM text to ensure auditability.
              </p>
            </div>

            {/* Diff 5 */}
            <div className="border border-zinc-800 bg-zinc-900/10 p-5 space-y-3">
              <div className="text-indigo-500 border border-indigo-900/40 bg-indigo-950/15 w-8 h-8 flex items-center justify-center font-bold text-sm">
                05
              </div>
              <h3 className="text-xs font-bold uppercase text-zinc-200">Noisy-Data Tolerance</h3>
              <p className="text-zinc-400 text-[11px] font-sans leading-relaxed">
                Gracefully digests duplicate readings, silent periods, and missing records. Outdated inputs trigger an explicit "blind spot" risk boost.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Demo Preview Section */}
      <section id="demo" className="py-20 border-t border-zinc-900 bg-[#06080A] px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs text-accent uppercase tracking-widest font-bold">// CONSOLE WALKTHROUGH</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-tight">System Demo Preview</h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-sans">
              Review how a single asset moves from raw telemetry to prioritised intervention.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Asset card journey (mock console component) */}
            <div className="lg:col-span-6 border border-zinc-800 bg-[#0B0F12] p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 tracking-wider">SELECTED ASSET ID</span>
                    <h4 className="text-sm font-black text-white">PUMP-014</h4>
                  </div>
                  <div className="px-2.5 py-1 bg-red-950/50 border border-red-800 text-red-500 text-[10px] font-bold tracking-widest uppercase">
                    HIGH RISK // SCORE: 87.5
                  </div>
                </div>

                {/* Subscores */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#080B0D] p-2.5 border border-zinc-850">
                    <p className="text-[9px] text-zinc-500">MAINTENANCE DELAY</p>
                    <p className="text-xs font-bold text-red-400 font-mono">92 / 100 (OVERDUE)</p>
                  </div>
                  <div className="bg-[#080B0D] p-2.5 border border-zinc-850">
                    <p className="text-[9px] text-zinc-500">SENSOR ANOMALIES</p>
                    <p className="text-xs font-bold text-amber-400 font-mono">45 / 100 (STRESS)</p>
                  </div>
                  <div className="bg-[#080B0D] p-2.5 border border-zinc-850">
                    <p className="text-[9px] text-zinc-500">HISTORICAL INCIDENTS</p>
                    <p className="text-xs font-bold text-emerald-400 font-mono">15 / 100 (STABLE)</p>
                  </div>
                  <div className="bg-[#080B0D] p-2.5 border border-zinc-850">
                    <p className="text-[9px] text-zinc-500">INSPECTION STALENESS</p>
                    <p className="text-xs font-bold text-red-400 font-mono">90 / 100 (CRITICAL)</p>
                  </div>
                </div>

                {/* Scenarios matched */}
                <div className="bg-amber-950/15 border border-amber-900/30 p-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-amber-500 uppercase tracking-wide">
                    <span>Matched Scenario</span>
                    <span>SILENT_DEGRADATION</span>
                  </div>
                  <p className="text-zinc-400 text-[10px] font-sans leading-relaxed">
                    Triggered because pressure sensor shows upward drift without a corresponding inspection or preventive overhaul in 60 days.
                  </p>
                </div>

                {/* LLM Explanation */}
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">AI Explanation (Claude Grounded)</span>
                  <div className="bg-zinc-900/40 border border-zinc-800 p-3 text-[11px] font-sans text-zinc-300 leading-relaxed">
                    "Reciprocating Water Pump pressure sensor has drifted upwards by 14% over 14 days. Combined with overdue maintenance (3 weeks) and no recent inspection (60 days), this matches the Silent Degradation signature. Raw calculation maps to High Risk due to compounding indicators."
                  </div>
                </div>

                {/* Recommended Action */}
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Recommended Intervention</span>
                  <div className="border border-zinc-800 bg-[#080B0D] p-3 text-[11px] text-emerald-400 font-semibold flex items-start space-x-2">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>SCHEDULE IMMEDIATE INSPECTION & VALVE CALIBRATION</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-850 pt-4 flex justify-between items-center text-[10px] text-zinc-500">
                <span>AUDIT_ID: AUD-832049</span>
                <span>LOGGED_AT: 2026-08-22T14:23:11</span>
              </div>
            </div>

            {/* Media/GIF Placeholder Frame */}
            <div className="lg:col-span-6 border border-zinc-800 bg-zinc-950 p-1 flex flex-col justify-between shadow-xl">
              <div className="bg-[#0A0E10] border border-zinc-900 flex-grow flex flex-col items-center justify-center p-8 text-center relative overflow-hidden min-h-[300px]">
                {/* Simulated Scope Lines */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,124,123,0.08)_0%,transparent_70%)] pointer-events-none" />
                <div className="absolute w-full h-[1px] bg-zinc-800 top-[30%] left-0" />
                <div className="absolute w-full h-[1px] bg-zinc-800 top-[70%] left-0" />
                <div className="absolute h-full w-[1px] bg-zinc-800 left-[30%] top-0" />
                <div className="absolute h-full w-[1px] bg-zinc-800 left-[70%] top-0" />

                <div className="relative z-10 space-y-4">
                  <div className="inline-flex p-3 bg-zinc-900 border border-zinc-800 text-zinc-400">
                    <Play className="h-6 w-6 text-zinc-500 fill-zinc-650" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Walkthrough Media Placeholder</h4>
                    <p className="text-zinc-500 text-[10px] font-sans mt-1 max-w-sm mx-auto">
                      This container is reserved for a GIF or video demonstrating live telemetry updates and inspector details in the console app.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-[#080B0D] p-3 text-center border-t border-zinc-900">
                <button
                  onClick={onEnterApp}
                  className="inline-flex items-center space-x-2 text-xs font-bold text-accent hover:underline uppercase tracking-widest"
                >
                  <span>TEST CONSOLE DEMO NOW</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Architecture Snapshot Section */}
      <section id="architecture" className="py-20 border-t border-zinc-900 px-6 max-w-7xl mx-auto border-x border-zinc-900">
        <div className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs text-accent uppercase tracking-widest font-bold">// UNDER THE HOOD</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-tight">System Architecture</h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-sans">
              Deliberately separate, independent system layers built for safety, transparency, and validation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Layer 1 */}
            <div className="border border-zinc-800 bg-[#0B0F12] p-6 space-y-4">
              <div className="flex items-center space-x-3 text-red-500">
                <Cpu className="h-5 w-5" />
                <h3 className="text-xs font-bold uppercase tracking-wider">1. Rules & Scenarios</h3>
              </div>
              <p className="text-zinc-400 text-xs font-sans leading-relaxed">
                Deterministic calculation of raw sub-scores and scenario logic written in pure Python. No stochastic code makes the risk judgment.
              </p>
              <div className="border border-zinc-850 p-2.5 bg-black/40 text-[9px] text-zinc-500 font-mono leading-tight">
                def matches_silent_degradation(sensor_trend, maint_overdue):<br/>
                &nbsp;&nbsp;return sensor_trend &gt; 0.1 and maint_overdue &gt; 21
              </div>
            </div>

            {/* Layer 2 */}
            <div className="border border-zinc-800 bg-[#0B0F12] p-6 space-y-4">
              <div className="flex items-center space-x-3 text-amber-500">
                <Layers className="h-5 w-5" />
                <h3 className="text-xs font-bold uppercase tracking-wider">2. Claude Explainer</h3>
              </div>
              <p className="text-zinc-400 text-xs font-sans leading-relaxed">
                Claude API translates structured evaluation results into plain-text reports, constrained to reference only numerical facts provided in the JSON input.
              </p>
              <div className="border border-zinc-850 p-2.5 bg-black/40 text-[9px] text-zinc-500 font-mono leading-tight">
                [SYSTEM] Reference only values present in: risk_assessment.json. Do not extrapolate trends.
              </div>
            </div>

            {/* Layer 3 */}
            <div className="border border-zinc-800 bg-[#0B0F12] p-6 space-y-4">
              <div className="flex items-center space-x-3 text-emerald-500">
                <Database className="h-5 w-5" />
                <h3 className="text-xs font-bold uppercase tracking-wider">3. Append Audit Logs</h3>
              </div>
              <p className="text-zinc-400 text-xs font-sans leading-relaxed">
                Every inspection, assessment run, and telemetry trigger is appended to a Postgres JSONB table. Decisions are always reviewable.
              </p>
              <div className="border border-zinc-850 p-2.5 bg-black/40 text-[9px] text-zinc-500 font-mono leading-tight">
                INSERT INTO audit_logs (asset_id, sub_scores, final_score, llm_prose) VALUES (...)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. IoT Simulation Note Section */}
      <section id="iot" className="py-20 border-t border-zinc-900 bg-[#06080A] px-6">
        <div className="max-w-7xl mx-auto border border-zinc-800 bg-[#0B0F12] p-8 relative overflow-hidden">
          {/* Subtle background connection lines */}
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <Wifi className="w-64 h-64 text-accent" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center space-x-2 border border-amber-900/50 bg-amber-950/20 px-2.5 py-0.5 text-[10px] text-accent uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                <span>MQTT telemetry demo active</span>
              </div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Wokwi ESP32 IoT Integration</h2>
              <p className="text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
                We validated the "live telemetry" path by configuring a browser-based ESP32 simulator in **Wokwi** with virtual sensors (like a dial-based potentiometer for pressures). 
                The simulator publishes readings to a public MQTT broker, which our FastAPI service picks up using a `paho-mqtt` background subscriber. 
                Because live sensor metrics hit the exact same pipeline as historical records, updating the telemetry path requires zero system rewrites.
              </p>
            </div>
            
            <div className="lg:col-span-5 bg-zinc-950/60 p-4 border border-zinc-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 border-b border-zinc-900 pb-2">
                <span>SIMULATED MQTT TOPIC</span>
                <span>STATUS: OK</span>
              </div>
              <div className="text-[11px] text-zinc-300">
                <span className="text-amber-500">Topic:</span> <code className="text-zinc-100 font-mono text-xs bg-zinc-900 px-1">riskradar/PUMP-014/pressure</code>
              </div>
              <div className="text-[11px] text-zinc-300">
                <span className="text-accent">Broker:</span> <code className="text-zinc-100 font-mono text-xs bg-zinc-900 px-1">broker.hivemq.com</code>
              </div>
              <div className="text-[11px] text-zinc-300">
                <span className="text-emerald-500">Payload:</span> <code className="text-zinc-100 font-mono text-xs bg-zinc-900 px-1">{"{"}"value": 84.6, "unit": "psi"{"}"}</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Tech Stack Strip Section */}
      <section className="py-12 border-t border-zinc-900 px-6 bg-[#040608]">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-[10px] text-zinc-500 uppercase tracking-widest mb-6 font-bold">SYSTEM TECH COMPLIANCE DEPLOYMENT</p>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-xs text-zinc-400 font-bold">
            <span className="border border-zinc-850 px-3 py-1.5 bg-zinc-900/30 uppercase tracking-wider text-[10px]">Python &amp; FastAPI</span>
            <span className="border border-zinc-850 px-3 py-1.5 bg-zinc-900/30 uppercase tracking-wider text-[10px]">PostgreSQL (JSONB)</span>
            <span className="border border-zinc-850 px-3 py-1.5 bg-zinc-900/30 uppercase tracking-wider text-[10px]">Claude API</span>
            <span className="border border-zinc-850 px-3 py-1.5 bg-zinc-900/30 uppercase tracking-wider text-[10px]">Wokwi ESP32</span>
            <span className="border border-zinc-850 px-3 py-1.5 bg-zinc-900/30 uppercase tracking-wider text-[10px]">MQTT Broker</span>
            <span className="border border-zinc-850 px-3 py-1.5 bg-zinc-900/30 uppercase tracking-wider text-[10px]">React &amp; Tailwind</span>
          </div>
        </div>
      </section>

      {/* 8. Footer Section */}
      <footer className="border-t border-zinc-900 bg-[#030507] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider">INDUSLINK / RISKRADAR</h5>
            <p className="text-[10px] text-zinc-500 font-sans">Developed for Safety Hackathon. All calculations simulated.</p>
          </div>

          <div className="flex items-center space-x-6 text-[11px] text-zinc-400">
            <a href="#" className="hover:text-zinc-100 transition-colors uppercase">GitHub Repository</a>
            <span className="text-zinc-700">|</span>
            <a href="#" className="hover:text-zinc-100 transition-colors uppercase">Walkthrough Video</a>
          </div>

          <div className="text-[10px] text-zinc-500">
            CONSOLE v1.0.4 &copy; 2026. APPEND-ONLY RECORD.
          </div>
        </div>
      </footer>
    </div>
  );
}
