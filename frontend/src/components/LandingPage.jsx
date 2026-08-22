import React, { useState, useEffect, useRef, useMemo } from "react";
import AccordionGallery from "./AccordionGallery";
import FoldText from "./FoldText";
import GlareHover from "./GlareHover";
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
  ExternalLink,
  ChevronDown,
  Info
} from "lucide-react";

export default function LandingPage({ onEnterApp }) {
  const [logs, setLogs] = useState([
    { type: "SYSTEM", text: "Initializing telemetry ingestion socket...", color: "text-zinc-400", time: "20:24:01" },
    { type: "SYSTEM", text: "Connecting to MQTT Broker: broker.hivemq.com", color: "text-zinc-400", time: "20:24:03" },
    { type: "SYSTEM", text: "Ingestion active. Monitoring 5 dimensions...", color: "text-emerald-500", time: "20:24:05" }
  ]);
  const [isPaused, setIsPaused] = useState(false);
  const [logIndex, setLogIndex] = useState(0);
  const terminalContainerRef = useRef(null);

  const logTemplates = useMemo(() => [
    { type: "VIBRATION", text: "PUMP-014: 2.1 mm/s - Vibration within tolerance", color: "text-[#8CA094]" },
    { type: "PRESSURE", text: "BOILER-01: 72.4 psi - Nominal pressure", color: "text-[#8CA094]" },
    { type: "TEMPERATURE", text: "TURBINE-08: 142.6°F - Steady state", color: "text-[#8CA094]" },
    { type: "MAINTENANCE", text: "VALVE-09: Scheduled lubrication complete", color: "text-emerald-400/80" },
    { type: "SYSTEM", text: "Audit log sync: 0 anomalies detected in past 24h", color: "text-zinc-400" },
    { type: "VIBRATION", text: "PUMP-014: 4.2 mm/s - Drift detected (Threshold: 4.0)", color: "text-amber-400 font-medium" },
    { type: "INDUSLINK", text: ">>> [FLAGGED] PUMP-014: Score elevated to 54 (WARN) - Drift detected", color: "text-amber-400 font-semibold" },
    { type: "PRESSURE", text: "COMPRESSOR-02: 84.1 psi - Nominal pressure", color: "text-[#8CA094]" },
    { type: "MAINTENANCE", text: "COMPRESSOR-02: Next PM schedule overdue by 124 days", color: "text-amber-405" },
    { type: "INDUSLINK", text: ">>> [FLAGGED] COMPRESSOR-02: Score elevated to 72 (HIGH) - Overdue maintenance", color: "text-red-400 font-semibold" },
    { type: "INDUSLINK", text: ">>> [RECOMMENDATION] Dispatch mechanical check for COMPRESSOR-02", color: "text-emerald-400 font-semibold" },
    { type: "INSPECTION", text: "VALVE-09: Seal integrity marked as 'degraded' in report", color: "text-amber-400" },
    { type: "SYSTEM", text: "Cleared queue: 14 telemetry packets processed", color: "text-zinc-400" }
  ], []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setLogs((prev) => {
        const nextLog = logTemplates[logIndex % logTemplates.length];
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        return [...prev, { ...nextLog, time: timeStr }].slice(-20);
      });
      setLogIndex((prev) => prev + 1);
    }, 2800);

    return () => clearInterval(interval);
  }, [isPaused, logIndex, logTemplates]);

  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleInjectFailure = () => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const injected = [
      { type: "INJECT", text: "[USER_INJECT] Triggered cooling loop blockage sequence...", color: "text-purple-400 font-bold", time: timeStr },
      { type: "TEMPERATURE", text: "BOILER-01: 298.4°F - EXTREME HEAT EXCURSION", color: "text-red-500 font-bold", time: timeStr },
      { type: "PRESSURE", text: "BOILER-01: 119.5 psi - Limit exceeded", color: "text-red-500 font-bold", time: timeStr },
      { type: "INDUSLINK", text: ">>> [CRITICAL ALERT] BOILER-01: Score 92 (EMERGENCY) - Thermal runaway threat", color: "text-red-400 font-black tracking-wide", time: timeStr },
      { type: "INDUSLINK", text: ">>> [RECOMMENDATION] EMERGENCY DISPATCH: Actuate manual steam vent release valve.", color: "text-emerald-400 font-black", time: timeStr }
    ];
    setLogs((prev) => [...prev, ...injected].slice(-20));
  };

  // Helper for smooth scrolling
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1D2A22] font-sans antialiased relative overflow-hidden selection:bg-[#1D3225] selection:text-white">
      
      {/* Muted green ambient lights for inviting look */}
      <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[900px] h-[350px] bg-emerald-500/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-[35%] right-[5%] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E3DFD5] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-[#1D3225]/5 border border-[#1D3225]/20 p-2 rounded-sm shadow-sm">
            <ShieldAlert className="h-5 w-5 text-[#1D3225]" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-widest text-[#1D3225] font-mono">INDUSLINK</h1>
            <p className="text-[10px] text-zinc-500 tracking-widest font-mono -mt-1">PREDICTIVE SAFETY CONSOLE</p>
          </div>
        </div>

        <nav className="hidden lg:flex items-center space-x-8 text-xs font-mono uppercase tracking-wider text-[#3B4C41]">
          <button onClick={() => scrollToSection("problem")} className="hover:text-[#1D3225] transition-colors">The Gap</button>
          <button onClick={() => scrollToSection("shift")} className="hover:text-[#1D3225] transition-colors">The Shift</button>
          <button onClick={() => scrollToSection("core-loop")} className="hover:text-[#1D3225] transition-colors">The Loop</button>
          <button onClick={() => scrollToSection("differentiators")} className="hover:text-[#1D3225] transition-colors">Differences</button>
          <button onClick={() => scrollToSection("demo")} className="hover:text-[#1D3225] transition-colors">Live Preview</button>
          <button onClick={() => scrollToSection("architecture")} className="hover:text-[#1D3225] transition-colors">Architecture</button>
        </nav>

        <div className="flex items-center space-x-4">
          <button
            onClick={onEnterApp}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#1D3225] hover:bg-[#15291D] text-white text-xs font-bold font-mono uppercase tracking-wider transition-all hover:shadow-[0_4px_14px_rgba(29,50,37,0.15)] rounded-lg"
          >
            <span>LAUNCH CONSOLE</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 1. Hero Section with Large Rounded Curves and Forest Green Simulator Card */}
      <section className="relative pt-20 pb-28 px-6 bg-[#F6F4EE] rounded-b-[3.5rem] border-b border-[#E3DFD5] shadow-sm bg-grid-warm">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Texts */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 border border-[#E3DFD5] bg-[#EFECE6]/40 px-3 py-1 rounded-full text-[11px] text-[#3B4C41] font-mono tracking-wider">
              <span className="text-emerald-600 font-bold">&bull;</span>
              <span className="uppercase text-[9px]">AI-Powered Industrial Safety</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1D3225] leading-[1.05] uppercase">
              <FoldText
                text="Most industrial accidents don't happen without warning."
                splitBy="word"
                fontSize="inherit"
                fontWeight="inherit"
                color="#1D3225"
                trigger="mount"
                duration={1.2}
                stagger={0.08}
              />
              <br />
              <span className="text-[#C0392B]">They happen without anyone listening.</span>
            </h1>

            <p className="text-[#3B4C41] text-sm sm:text-lg leading-relaxed max-w-2xl font-sans">
              Overdue maintenance. A pressure reading drifting off-range. A failure that got patched but never root-caused. The warning signs are almost always sitting in the records — scattered across logs no one has time to cross-reference until after something goes wrong. <strong className="text-[#1D3225] font-semibold">IndusLink reads them first.</strong>
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => scrollToSection("demo")}
                className="px-6 py-3.5 bg-[#1D3225] hover:bg-[#15291D] text-white text-xs font-bold font-mono uppercase tracking-widest transition-all flex items-center space-x-2 hover:shadow-[0_4px_14px_rgba(29,50,37,0.2)] rounded-lg"
              >
                <span>SEE HOW IT WORKS</span>
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollToSection("architecture")}
                className="px-6 py-3.5 border border-[#E3DFD5] hover:border-[#1D3225] bg-transparent text-[#3B4C41] hover:text-[#1D3225] text-xs font-bold font-mono uppercase tracking-widest transition-all rounded-lg"
              >
                VIEW THE ARCHITECTURE
              </button>
            </div>
          </div>

          {/* Right Hero: Live Telemetry Logger Terminal wrapped in GlareHover */}
          <div className="lg:col-span-5 shadow-2xl">
            <GlareHover
              glareColor="#ffffff"
              glareOpacity={0.15}
              glareAngle={-30}
              glareSize={220}
              borderRadius="16px"
              background="#13261C"
              borderColor="#274433"
              height="400px"
              className="p-5 text-zinc-150 relative overflow-hidden flex flex-col h-[400px]"
            >
              {/* Card Header */}
              <div className="border-b border-[#274433] pb-3 mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Live Ingest Monitor</h3>
                  <p className="text-[9px] text-zinc-400 font-sans mt-0.5">Correlating multi-dimensional safety data streams</p>
                </div>
                <div className="flex items-center space-x-1.5 bg-[#0D1912] border border-[#274433] px-2.5 py-1 rounded-full">
                  <span className={`h-1.5 w-1.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                  <span className="text-[9px] font-mono text-zinc-300 font-bold uppercase tracking-wider">
                    {isPaused ? 'PAUSED' : 'STREAMING'}
                  </span>
                </div>
              </div>

              {/* Terminal Logs Area */}
              <div ref={terminalContainerRef} className="flex-grow bg-[#0D1912] border border-[#274433] rounded-lg p-3 overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar-none">
                {logs.map((log, index) => (
                  <div key={index} className="leading-relaxed break-words">
                    <span className="text-zinc-550 mr-1.5">[{log.time}]</span>
                    <span className="px-1 py-0.5 bg-[#13261C] border border-[#274433] text-zinc-300 rounded text-[8px] mr-1.5 font-bold uppercase select-none tracking-wide">
                      {log.type}
                    </span>
                    <span className={log.color}>{log.text}</span>
                  </div>
                ))}
              </div>

              {/* Terminal Controls */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[9px] font-mono font-bold uppercase">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="py-2.5 border border-[#274433] hover:border-zinc-500 hover:text-white bg-[#1A3226] text-zinc-300 rounded-lg transition-colors"
                >
                  {isPaused ? 'RESUME FEED' : 'PAUSE FEED'}
                </button>
                <button
                  onClick={() => setLogs([])}
                  className="py-2.5 border border-[#274433] hover:border-zinc-500 hover:text-white bg-[#1A3226] text-zinc-300 rounded-lg transition-colors"
                >
                  CLEAR
                </button>
                <button
                  onClick={handleInjectFailure}
                  className="py-2.5 border border-purple-800 hover:border-purple-500 bg-[#25132A] text-purple-200 hover:text-white rounded-lg transition-colors"
                >
                  INJECT ERROR
                </button>
              </div>
            </GlareHover>
          </div>

        </div>
      </section>

      {/* 2. The Problem (Narrative section) */}
      <section id="problem" className="py-24 bg-[#FAF8F5] px-6 max-w-7xl mx-auto border-x border-[#E3DFD5]/70 bg-grid-warm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Narrative Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="text-xs font-mono text-[#3B4C41] tracking-widest uppercase">// THE GAP</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1D3225] tracking-tight leading-snug">
              <FoldText
                text="Safety today is a postmortem, not a forecast."
                splitBy="word"
                fontSize="inherit"
                fontWeight="inherit"
                color="#1D3225"
                trigger="scroll"
                duration={1.2}
                stagger={0.08}
              />
            </h2>
            <div className="text-[#3B4C41] text-sm sm:text-base leading-relaxed space-y-4 font-sans">
              <p>
                Walk into most industrial safety operations and you'll find the same pattern: inspections happen on a calendar, not on risk. Maintenance records, sensor logs, and audit reports pile up in separate systems that rarely talk to each other.
              </p>
              <p>
                And when something does fail, the investigation that follows almost always turns up the same thing — <strong>the signs were there</strong>. A maintenance interval that kept slipping. A sensor that had been trending toward its limit for weeks. A failure that repeated because the fix addressed the symptom, not the cause.
              </p>
              <p>
                This isn't a data problem. The data usually exists. It's a <strong>synthesis problem</strong> — nobody has the time to read every log against every other log for every asset, every day. So the review only happens after the accident, when it's too late to matter.
              </p>
            </div>
          </div>

          {/* Right Column: Visual Safety Pyramid Accent */}
          <div className="lg:col-span-5 bg-[#F6F4EE] border border-[#E3DFD5] p-6 rounded-2xl shadow-sm relative">
            <h3 className="text-xs font-mono text-[#3B4C41] uppercase tracking-wider">// The Safety-Pyramid Principle</h3>
            
            {/* SVG Visual Representation of Safety Pyramid */}
            <div className="relative flex justify-center py-6">
              <svg width="220" height="160" viewBox="0 0 220 160" className="overflow-visible">
                {/* 1 Major Accident */}
                <polygon points="110,10 135,50 85,50" className="fill-red-500/10 stroke-red-500" strokeWidth="1.5" />
                {/* 30 Minor Incidents */}
                <polygon points="135,50 165,100 55,100 85,50" className="fill-amber-500/10 stroke-amber-500/50" strokeWidth="1.5" />
                {/* 300 Near Misses / Weak Signals */}
                <polygon points="165,100 195,150 25,150 55,100" className="fill-[#FAF8F5] stroke-[#E3DFD5]" strokeWidth="1.5" />
                
                {/* Labels */}
                <text x="110" y="38" className="fill-red-600 text-[10px] font-mono text-center font-bold" textAnchor="middle">1 ACCIDENT</text>
                <text x="110" y="82" className="fill-amber-600 text-[9px] font-mono text-center" textAnchor="middle">30 MINOR EVENTS</text>
                <text x="110" y="132" className="fill-[#3B4C41] text-[9px] font-mono text-center" textAnchor="middle">300 UNTRACKED SIGNALS</text>
              </svg>
            </div>

            <div className="p-4 border-l-2 border-red-500 bg-[#C0392B]/5 text-xs text-[#3B4C41] font-sans leading-relaxed italic rounded-r-lg">
              "Industrial safety has long recognized that serious accidents are preceded by far more near-misses and minor incidents than anyone tracks in real time. The evidence is almost always there before the event. The problem has never been the absence of warning signs. It's the absence of someone connecting them in time."
            </div>
          </div>

        </div>
      </section>

      {/* 3. The Shift (turn / solution intro) */}
      <section id="shift" className="py-24 bg-[#F6F4EE] border-t border-[#E3DFD5] px-6 bg-grid-warm">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Visual Status Board */}
          <div className="lg:col-span-5 border border-[#E3DFD5] bg-[#FAF8F5] p-6 space-y-4 shadow-sm rounded-2xl">
            <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 border-b border-[#E3DFD5]/80 pb-2">
              <span>DAEMON_CHECK: ACTIVE</span>
              <span>SYNCHRONIZER_STATUS</span>
            </div>
            
            <div className="space-y-2">
              <div className="bg-[#FAF8F5] p-3 border border-[#E3DFD5] flex justify-between items-center text-xs font-mono rounded-lg">
                <span className="text-[#3B4C41]">MAINTENANCE_INTERVALS</span>
                <span className="text-emerald-600 font-bold">SYNCHRONIZED</span>
              </div>
              <div className="bg-[#FAF8F5] p-3 border border-[#E3DFD5] flex justify-between items-center text-xs font-mono rounded-lg">
                <span className="text-[#3B4C41]">SENSOR_DRIFT_METRICS</span>
                <span className="text-emerald-600 font-bold">SYNCHRONIZED</span>
              </div>
              <div className="bg-[#FAF8F5] p-3 border border-[#E3DFD5] flex justify-between items-center text-xs font-mono rounded-lg">
                <span className="text-[#3B4C41]">INSPECTOR_REPORTS</span>
                <span className="text-emerald-600 font-bold">SYNCHRONIZED</span>
              </div>
            </div>

            <div className="text-[10px] text-zinc-400 font-mono text-center">
              &bull; CONTINUOUS SCANNING SYSTEM OPERATIONAL &bull;
            </div>
          </div>

          {/* Right Text Description */}
          <div className="lg:col-span-7 space-y-6">
            <div className="text-xs font-mono text-[#3B4C41] tracking-widest uppercase">// THE SHIFT</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1D3225] tracking-tight leading-snug">
              What if the cross-referencing just... happened. Continuously.
            </h2>
            <div className="text-[#3B4C41] text-sm sm:text-base leading-relaxed space-y-4 font-sans">
              <p>
                IndusLink sits underneath your existing maintenance logs, inspection reports, incident history, and sensor feeds — historical or live — and does the correlation work no one has time to do by hand.
              </p>
              <p>
                It doesn't wait for a scheduled audit. It watches continuously, flags what's drifting toward dangerous before it gets there, and tells you exactly why, in plain language an inspector can act on immediately.
              </p>
            </div>
            <div className="p-4 border border-[#E3DFD5] bg-[#FAF8F5] font-mono text-xs space-y-1 text-[#3B4C41] rounded-xl shadow-inner">
              <span className="text-[#E8871E] font-black">Not a red dot on a dashboard.</span>
              <p className="font-sans text-zinc-500 text-xs mt-1">A reason. A recommendation. A rank telling you which one to walk to first.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Accordion Gallery Showcase (off-white card frame with dark green inside) */}
      <section className="py-20 bg-[#FAF8F5] border-t border-[#E3DFD5] px-6 max-w-7xl mx-auto border-x border-[#E3DFD5]/70 bg-grid-warm">
        <div className="space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs text-accent uppercase tracking-widest font-mono font-bold">// CONVERGED DIMENSIONS</span>
            <h2 className="text-3xl font-extrabold text-[#1D3225] tracking-tight">The Telemetry Dimensions We Monitor</h2>
            <p className="text-[#3B4C41] text-sm max-w-lg mx-auto font-sans">
              Hover over each dimension to expand its visual focus and discover how IndusLink aggregates disparate datasets.
            </p>
          </div>
          <div className="border border-[#E3DFD5] bg-[#F6F4EE]/50 p-6 rounded-3xl shadow-sm">
            <AccordionGallery
              defaultIndex={2}
              expandRatio={0.55}
              trigger="hover"
              accentColor="#1D3225"
              overlayColor="#13261C"
              textColor="#ffffff"
              grayscale={true}
              showLabels={true}
              duration={0.6}
              ease="power3.out"
              parallax={0.4}
              tilt={6}
              stagger={0.05}
              height={380}
              gap={12}
              radius={20}
              orientation="horizontal"
            />
          </div>
        </div>
      </section>

      {/* 4. How It Works (The Core Loop) */}
      <section id="core-loop" className="py-24 border-t border-[#E3DFD5] bg-[#F6F4EE] px-6 bg-grid-warm">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs text-accent uppercase tracking-widest font-mono font-bold">// THE LOOP</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1D3225] tracking-tight">The Correlation Engine</h2>
            <p className="text-[#3B4C41] text-sm font-sans">
              From raw records to a ranked action list — automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <GlareHover
              glareColor="#1D3225"
              glareOpacity={0.08}
              glareAngle={-45}
              glareSize={150}
              borderRadius="16px"
              background="#FAF8F5"
              borderColor="#E3DFD5"
              className="p-6 space-y-4 hover:border-[#1D3225] transition-all relative shadow-sm"
            >
              <span className="text-[10px] font-mono text-zinc-400">STEP 01 // DATA INGEST</span>
              <div className="bg-[#F6F4EE] w-10 h-10 flex items-center justify-center border border-[#E3DFD5] text-[#1D3225] rounded-xl">
                <Wifi className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1D3225] uppercase tracking-wide">1. Data In</h3>
              <p className="text-[#3B4C41] text-xs leading-relaxed font-sans">
                Gathers historical maintenance logs, inspection reports, incident records, and sensor readings — messy, incomplete, and inconsistent. Live sensor streams feed into the exact same pipeline, so nothing is rebuilt when real IoT hardware is ready.
              </p>
            </GlareHover>

            {/* Step 2 */}
            <GlareHover
              glareColor="#1D3225"
              glareOpacity={0.08}
              glareAngle={-45}
              glareSize={150}
              borderRadius="16px"
              background="#FAF8F5"
              borderColor="#E3DFD5"
              className="p-6 space-y-4 hover:border-[#1D3225] transition-all relative shadow-sm"
            >
              <span className="text-[10px] font-mono text-zinc-400">STEP 02 // RULES ENGINE</span>
              <div className="bg-[#F6F4EE] w-10 h-10 flex items-center justify-center border border-[#E3DFD5] text-[#1D3225] rounded-xl">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1D3225] uppercase tracking-wide">2. Risk Scoring</h3>
              <p className="text-[#3B4C41] text-xs leading-relaxed font-sans">
                Every asset is scored against a transparent, rule-and-scenario engine (not a black box). It checks individual factors and known dangerous combinations of them, mimicking the domain patterns an experienced safety engineer recognizes.
              </p>
            </GlareHover>

            {/* Step 3 */}
            <GlareHover
              glareColor="#1D3225"
              glareOpacity={0.08}
              glareAngle={-45}
              glareSize={150}
              borderRadius="16px"
              background="#FAF8F5"
              borderColor="#E3DFD5"
              className="p-6 space-y-4 hover:border-[#1D3225] transition-all relative shadow-sm"
            >
              <span className="text-[10px] font-mono text-zinc-400">STEP 03 // GENERATED LOGIC</span>
              <div className="bg-[#F6F4EE] w-10 h-10 flex items-center justify-center border border-[#E3DFD5] text-[#1D3225] rounded-xl">
                <Terminal className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1D3225] uppercase tracking-wide">3. Flag + Explain</h3>
              <p className="text-[#3B4C41] text-xs leading-relaxed font-sans">
                Nothing gets flagged without a reason. "High risk" always comes with *why*: which factors fired, by how much, and whether the situation matches a known risk pattern like repeated failures or silent sensor drift.
              </p>
            </GlareHover>

            {/* Step 4 */}
            <GlareHover
              glareColor="#1D3225"
              glareOpacity={0.08}
              glareAngle={-45}
              glareSize={150}
              borderRadius="16px"
              background="#FAF8F5"
              borderColor="#E3DFD5"
              className="p-6 space-y-4 hover:border-[#1D3225] transition-all relative shadow-sm"
            >
              <span className="text-[10px] font-mono text-zinc-400">STEP 04 // PROTOCOLS</span>
              <div className="bg-[#F6F4EE] w-10 h-10 flex items-center justify-center border border-[#E3DFD5] text-[#1D3225] rounded-xl">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1D3225] uppercase tracking-wide">4. Recommend</h3>
              <p className="text-[#3B4C41] text-xs leading-relaxed font-sans">
                Every flag comes with a next step — inspect, maintain, calibrate, or monitor more closely — so the output is something someone can act on today, not just a number to stare at.
              </p>
            </GlareHover>

            {/* Step 5 */}
            <GlareHover
              glareColor="#1D3225"
              glareOpacity={0.08}
              glareAngle={-45}
              glareSize={150}
              borderRadius="16px"
              background="#FAF8F5"
              borderColor="#E3DFD5"
              className="p-6 space-y-4 hover:border-[#1D3225] transition-all relative shadow-sm"
            >
              <span className="text-[10px] font-mono text-zinc-400">STEP 05 // STRATEGY</span>
              <div className="bg-[#F6F4EE] w-10 h-10 flex items-center justify-center border border-[#E3DFD5] text-[#1D3225] rounded-xl">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1D3225] uppercase tracking-wide">5. Rank</h3>
              <p className="text-[#3B4C41] text-xs leading-relaxed font-sans">
                With limited inspectors and many assets, order matters. IndusLink ranks every flagged risk so the most dangerous situations reach a human first — not the one that happened to get logged most recently.
              </p>
            </GlareHover>

            {/* Step 6 */}
            <GlareHover
              glareColor="#1D3225"
              glareOpacity={0.08}
              glareAngle={-45}
              glareSize={150}
              borderRadius="16px"
              background="#FAF8F5"
              borderColor="#E3DFD5"
              className="p-6 space-y-4 hover:border-[#1D3225] transition-all relative shadow-sm"
            >
              <span className="text-[10px] font-mono text-zinc-400">STEP 06 // SNAPSHOTS</span>
              <div className="bg-[#F6F4EE] w-10 h-10 flex items-center justify-center border border-[#E3DFD5] text-[#1D3225] rounded-xl">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1D3225] uppercase tracking-wide">6. Watch + Log</h3>
              <p className="text-[#3B4C41] text-xs leading-relaxed font-sans">
                Every score, every explanation, every recommendation is written to an audit trail. If a risk level climbs between checks, an early warning fires immediately.
              </p>
            </GlareHover>

          </div>
        </div>
      </section>

      {/* 5. Why This Isn't Just a Dashboard (styled like the FAQ accordion list) */}
      <section id="differentiators" className="py-24 border-t border-[#E3DFD5] bg-[#FAF8F5] px-6 max-w-7xl mx-auto border-x border-[#E3DFD5]/70 bg-grid-warm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column Label */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            <span className="text-xs text-accent uppercase tracking-widest font-mono font-bold">// THE DIFFERENCES</span>
            <h2 className="text-3xl font-extrabold text-[#1D3225] tracking-tight">A flag without a reason is just noise.</h2>
            <p className="text-[#3B4C41] text-sm font-sans leading-relaxed">
              Plenty of systems can put a red badge next to an asset. IndusLink is built around five things a red badge alone can never give you.
            </p>
          </div>

          {/* Right Column Rows list (Separated by borders) */}
          <div className="lg:col-span-8 border border-[#E3DFD5] bg-[#F6F4EE]/50 p-6 rounded-2xl shadow-sm space-y-6">
            
            {/* Diff Row 1 */}
            <div className="border-b border-[#E3DFD5] pb-6 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-[#3B4C41]">
                <span className="font-bold text-[#1D3225]">01 / EXPLAINABLE SCORING</span>
                <span className="text-red-600 font-bold uppercase text-[9px]">// NO BLACK-BOX</span>
              </div>
              <p className="text-[#3B4C41] text-xs sm:text-sm leading-relaxed font-sans">
                Every risk score traces back to specific, named factors — overdue maintenance, failure history, sensor readings out of range — so an inspector can verify the reasoning, not just trust it.
              </p>
            </div>

            {/* Diff Row 2 */}
            <div className="border-b border-[#E3DFD5] pb-6 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-[#3B4C41]">
                <span className="font-bold text-[#1D3225]">02 / RECOMMENDS ACTION</span>
                <span className="text-[#E8871E] font-bold uppercase text-[9px]">// TARGETED DIRECTIVES</span>
              </div>
              <p className="text-[#3B4C41] text-xs sm:text-sm leading-relaxed font-sans">
                A risk flag always comes with a next step: inspect, maintain, calibrate, or monitor. Detection without direction just moves the bottleneck.
              </p>
            </div>

            {/* Diff Row 3 */}
            <div className="border-b border-[#E3DFD5] pb-6 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-[#3B4C41]">
                <span className="font-bold text-[#1D3225]">03 / DYNAMIC RANKING</span>
                <span className="text-[#1D3225] font-bold uppercase text-[9px]">// LIMITED RESOURCES</span>
              </div>
              <p className="text-[#3B4C41] text-xs sm:text-sm leading-relaxed font-sans">
                You don't have enough inspectors to check everything today. IndusLink tells you which one to check *first* using custom tie-breaking rules.
              </p>
            </div>

            {/* Diff Row 4 */}
            <div className="border-b border-[#E3DFD5] pb-6 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-[#3B4C41]">
                <span className="font-bold text-[#1D3225]">04 / FULLY AUDITABLE</span>
                <span className="text-emerald-700 font-bold uppercase text-[9px]">// TRACEABLE LOGS</span>
              </div>
              <p className="text-[#3B4C41] text-xs sm:text-sm leading-relaxed font-sans">
                The full reasoning behind every recommendation — not just the final verdict — is logged, because a system feeding into safety decisions has to show its work.
              </p>
            </div>

            {/* Diff Row 5 */}
            <div className="pb-2 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-[#3B4C41]">
                <span className="font-bold text-[#1D3225]">05 / NOISY-DATA TOLERANCE</span>
                <span className="text-purple-700 font-bold uppercase text-[9px]">// FIELD RESILIENT</span>
              </div>
              <p className="text-[#3B4C41] text-xs sm:text-sm leading-relaxed font-sans">
                Incomplete inspection records, inconsistent formatting, and sensors that go silent. IndusLink is designed to work with data as it actually exists in the field.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 6. See It In Action (Demo section - Cream background with forest green cards) */}
      <section id="demo" className="py-24 border-t border-[#E3DFD5] bg-[#F6F4EE] px-6 bg-grid-warm">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs text-accent uppercase tracking-widest font-mono font-bold">// WALK THROUGH ONE ASSET</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1D3225] tracking-tight">From a spreadsheet row to a decision</h2>
            <p className="text-[#3B4C41] text-sm font-sans">
              See what an actual analyzed safety flag looks like to an inspector in the field.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* The Main Console Card Panel in Forest Green (rounded-2xl) */}
            <div className="lg:col-span-7 border border-[#274433] bg-[#13261C] p-6 space-y-6 flex flex-col justify-between shadow-2xl rounded-2xl relative text-zinc-150">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-xl pointer-events-none" />

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-[#274433] pb-3">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-mono tracking-wider">IDENTIFICATION SPEC</span>
                    <h4 className="text-base font-bold text-white font-mono">ASSET A-114</h4>
                  </div>
                  <div className="px-3 py-1 bg-red-950/40 border border-red-800 text-red-400 text-xs font-bold font-mono tracking-wider rounded">
                    HIGH RISK // 78 SCORE
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-[#1A3226] p-3 border border-[#274433] rounded-lg">
                    <span className="text-zinc-400 text-[10px]">ASSET TYPE</span>
                    <p className="text-zinc-200 mt-0.5 font-bold">Compressor, Bay 3</p>
                  </div>
                  <div className="bg-[#1A3226] p-3 border border-[#274433] rounded-lg">
                    <span className="text-zinc-400 text-[10px]">MATCHED SCENARIO</span>
                    <p className="text-amber-400 mt-0.5 font-bold">Silent Degradation</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider font-bold">Calculated Narrative</span>
                  <div className="bg-[#1A3226]/50 border border-[#274433] p-4 text-xs text-zinc-300 leading-relaxed font-mono rounded-lg">
                    <p className="text-amber-400">// ANALYZED MATCH LOG:</p>
                    <p className="mt-1 leading-relaxed">
                      Pressure readings trending toward the safe limit on 4 of the last 6 checks, combined with maintenance overdue by 214 days (interval: 90 days) and no inspection logged in over 5 months.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider font-bold">Recommended Action</span>
                  <div className="border border-[#274433] bg-[#1A3226] p-4 text-xs text-emerald-400 font-bold flex items-center space-x-2 rounded-lg">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>SCHEDULE INSPECTION AND PRESSURE RECALIBRATION THIS WEEK</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#274433] pt-4 flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                <span>AUDIT_LOG_ID: AUD-A114-082</span>
                <span>SYSTEM_TIMESTAMP: 2026-08-22</span>
              </div>
            </div>

            {/* Video player card / mock frame */}
            <div className="lg:col-span-5 border border-[#274433] bg-[#13261C] p-1 flex flex-col justify-between shadow-2xl rounded-2xl text-zinc-150">
              <div className="bg-[#0A1711] border border-[#274433]/40 flex-grow flex flex-col items-center justify-center p-8 text-center relative overflow-hidden min-h-[300px] rounded-t-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06)_0%,transparent_75%)] pointer-events-none" />
                
                <div className="relative z-10 space-y-4">
                  <div className="inline-flex p-4 bg-[#13261C] border border-[#274433] text-zinc-400 shadow-xl rounded-xl">
                    <Play className="h-6 w-6 text-zinc-300 fill-zinc-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest font-mono">Console Demo Walkthrough</h4>
                    <p className="text-zinc-450 text-[11px] font-sans mt-2 max-w-xs mx-auto leading-relaxed">
                      Reserved space for a GIF or video demonstrating live telemetry updates, risk priorities, and log streams inside the console dashboard.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#13261C] p-4 text-center border-t border-[#274433]/45 rounded-b-xl">
                <button
                  onClick={onEnterApp}
                  className="inline-flex items-center space-x-2 text-xs font-bold text-amber-400 hover:underline uppercase tracking-widest font-mono"
                >
                  <span>LAUNCH OPERATIONAL CONSOLE NOW</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Sub-thumbnail Cards (styled like in third mockup, cream/off-white palette) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-4 border-t border-[#E3DFD5]">
            <GlareHover
              glareColor="#1D3225"
              glareOpacity={0.08}
              glareAngle={-45}
              glareSize={150}
              borderRadius="12px"
              background="#FAF8F5"
              borderColor="#E3DFD5"
              className="p-4 space-y-2 cursor-pointer hover:border-[#1D3225] transition-all shadow-sm"
            >
              <span className="text-[9px] font-mono text-[#3B4C41]">ASSET PUMP-014</span>
              <p className="text-xs font-bold text-[#1D3225]">Coolant Pump</p>
              <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 text-[9px] font-mono font-bold rounded">HIGH RISK</span>
            </GlareHover>
            <GlareHover
              glareColor="#1D3225"
              glareOpacity={0.08}
              glareAngle={-45}
              glareSize={150}
              borderRadius="12px"
              background="#FAF8F5"
              borderColor="#E3DFD5"
              className="p-4 space-y-2 cursor-pointer hover:border-[#1D3225] transition-all shadow-sm"
            >
              <span className="text-[9px] font-mono text-[#3B4C41]">ASSET BOILER-01</span>
              <p className="text-xs font-bold text-[#1D3225]">Steam Boiler A</p>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 text-[9px] font-mono font-bold rounded">WARN RISK</span>
            </GlareHover>
            <GlareHover
              glareColor="#1D3225"
              glareOpacity={0.08}
              glareAngle={-45}
              glareSize={150}
              borderRadius="12px"
              background="#FAF8F5"
              borderColor="#E3DFD5"
              className="p-4 space-y-2 cursor-pointer hover:border-[#1D3225] transition-all shadow-sm"
            >
              <span className="text-[9px] font-mono text-[#3B4C41]">ASSET TURBINE-08</span>
              <p className="text-xs font-bold text-[#1D3225]">Power Turbine B</p>
              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 border border-zinc-200 text-[9px] font-mono font-bold rounded">SYSTEM OK</span>
            </GlareHover>
            <GlareHover
              glareColor="#1D3225"
              glareOpacity={0.08}
              glareAngle={-45}
              glareSize={150}
              borderRadius="12px"
              background="#FAF8F5"
              borderColor="#E3DFD5"
              className="p-4 space-y-2 cursor-pointer hover:border-[#1D3225] transition-all shadow-sm"
            >
              <span className="text-[9px] font-mono text-[#3B4C41]">ASSET VALVE-09</span>
              <p className="text-xs font-bold text-[#1D3225]">Shutoff Valve V1</p>
              <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 text-[9px] font-mono font-bold rounded">HIGH RISK</span>
            </GlareHover>
          </div>

        </div>
      </section>

      {/* 7. Under the Hood (Architecture section) */}
      <section id="architecture" className="py-24 border-t border-[#E3DFD5] bg-[#FAF8F5] px-6 max-w-6xl mx-auto bg-grid-warm">
        <div className="space-y-12">
          <div className="space-y-3">
            <span className="text-xs text-accent uppercase tracking-widest font-mono font-bold">// ARCHITECTURE</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1D3225] tracking-tight">Judgment stays deterministic. Language gets generated.</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 text-[#3B4C41] text-sm sm:text-base leading-relaxed space-y-4 font-sans">
              <p>
                Every risk score, every rank, every recommended action comes from a transparent rule-and-scenario engine — the same inputs will always produce the same output, which matters when a recommendation could influence a real safety decision.
              </p>
              <p>
                A language model sits on top of that, but only to translate the engine's structured findings into plain, readable explanations — it never decides what's risky.
              </p>
              <p>
                The two are kept separate on purpose: one layer for judgment, one layer for language, and a full audit log underneath both, capturing not just what was recommended, but exactly why.
              </p>
            </div>

            {/* Architecture Stack Drawing Mock with Rounded Corners */}
            <div className="lg:col-span-5 border border-[#E3DFD5] bg-[#F6F4EE] p-5 space-y-3 text-xs font-mono shadow-sm rounded-2xl">
              <div className="border border-[#E3DFD5] p-3.5 bg-[#FAF8F5] rounded-xl relative shadow-sm">
                <span className="absolute top-2.5 right-3 text-[9px] text-[#3B4C41]/60">LAYER 03</span>
                <span className="text-[#1D3225] font-bold font-sans">LLM TRANSLATION LAYER</span>
                <p className="text-[10px] text-zinc-500 mt-1 font-sans">Claude API text output (facts constrained)</p>
              </div>
              <div className="border border-[#E3DFD5] p-3.5 bg-[#FAF8F5] rounded-xl relative shadow-sm">
                <span className="absolute top-2.5 right-3 text-[9px] text-[#3B4C41]/60">LAYER 02</span>
                <span className="text-[#C0392B] font-bold font-sans">DETERMINISTIC EVAL ENGINE</span>
                <p className="text-[10px] text-zinc-500 mt-1 font-sans">Subscores, thresholds &amp; expert scenarios</p>
              </div>
              <div className="border border-[#E3DFD5] p-3.5 bg-[#FAF8F5] rounded-xl relative shadow-sm">
                <span className="absolute top-2.5 right-3 text-[9px] text-[#3B4C41]/60">LAYER 01</span>
                <span className="text-emerald-700 font-bold font-sans">DATA CONVERGENCE BASE</span>
                <p className="text-[10px] text-zinc-500 mt-1 font-sans">PostgreSQL relational tables, JSONB audit logs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Built for the Real World (IoT Section) */}
      <section id="iot" className="py-24 border-t border-[#E3DFD5] bg-[#F6F4EE] px-6 bg-grid-warm">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 bg-[#13261C] border border-[#274433] p-5 space-y-3 font-mono text-xs shadow-2xl rounded-2xl text-zinc-200">
            <div className="flex justify-between items-center text-[10px] text-zinc-400 border-b border-[#274433] pb-2">
              <span>WOKWI SIMULATOR STACK</span>
              <span className="text-amber-400">MQTT LIVE</span>
            </div>
            <div className="space-y-1.5">
              <div>
                <span className="text-zinc-400">MICROCONTROLLER:</span> <span className="text-zinc-200">ESP32 Sim</span>
              </div>
              <div>
                <span className="text-zinc-400">PROTOCOL:</span> <span className="text-zinc-200">MQTT over WebSockets</span>
              </div>
              <div>
                <span className="text-zinc-400">BROKER:</span> <span className="text-zinc-200">broker.hivemq.com</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-mono text-[#3B4C41] tracking-widest uppercase">// BEYOND THE MOCK DATA</span>
            <h2 className="text-3xl font-extrabold text-[#1D3225] tracking-tight uppercase">The live-sensor path isn't a diagram. It's wired.</h2>
            <p className="text-[#3B4C41] text-sm sm:text-base leading-relaxed font-sans">
              To prove the system works with live data, not just historical CSVs, sensor input is simulated through Wokwi — virtual industrial sensors publishing real-time readings over MQTT — feeding into the exact same scoring pipeline used for historical records. When real IoT hardware is ready to plug in, nothing about the pipeline has to change. Just the source.
            </p>
          </div>

        </div>
      </section>

      {/* 9. Closing / CTA Section with large curved edge */}
      <section className="py-32 border-t border-[#E3DFD5] bg-[#FAF8F5] px-6 relative rounded-t-[3.5rem] shadow-sm max-w-7xl mx-auto border-x border-[#E3DFD5]/70 bg-grid-warm">
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <span className="text-xs text-accent uppercase tracking-widest font-mono font-bold">// THE POINT</span>
          <h2 className="text-3xl sm:text-5xl font-black text-[#1D3225] leading-tight uppercase max-w-3xl mx-auto">
            <FoldText
              text="The warning was never missing. Someone just needed to be reading everything, all the time."
              splitBy="word"
              fontSize="inherit"
              fontWeight="inherit"
              color="#1D3225"
              trigger="scroll"
              duration={1.2}
              stagger={0.06}
            />
          </h2>
          <p className="text-[#3B4C41] text-base sm:text-lg max-w-2xl mx-auto font-sans leading-relaxed">
            IndusLink doesn't replace inspectors. It gives them what they've never had enough time for — every record, cross-referenced, continuously, with the reasoning laid out and the most dangerous risks surfaced first.
          </p>

          <div className="pt-4">
            <button
              onClick={onEnterApp}
              className="px-8 py-4 bg-[#1D3225] hover:bg-[#15291D] text-white text-xs font-bold font-mono uppercase tracking-widest transition-all inline-flex items-center space-x-3 hover:shadow-[0_4px_14px_rgba(29,50,37,0.2)] rounded-lg border border-[#15291D]"
            >
              <span>LAUNCH OPERATIONAL CONSOLE</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer Section in deep forest green */}
      <footer className="bg-[#13261C] py-16 px-6 text-zinc-150">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-1.5">
            <h5 className="text-sm font-bold text-white uppercase tracking-wider font-mono">INDUSLINK</h5>
            <p className="text-xs text-zinc-400 font-sans">Developed for safety validation. All indicators simulated.</p>
          </div>

          <div className="flex items-center space-x-8 text-xs text-zinc-300 font-mono uppercase tracking-wider">
            <a href="#" className="hover:text-white transition-colors">GitHub Repository</a>
            <span className="text-emerald-700">|</span>
            <a href="#" className="hover:text-white transition-colors">Walkthrough Video</a>
          </div>

          <div className="text-xs text-zinc-400 font-mono uppercase tracking-wider">
            CONSOLE v1.0.4 &bull; IMMUTABLE STATE
          </div>
        </div>
      </footer>
    </div>
  );
}
