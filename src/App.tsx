import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, 
  UploadCloud, 
  FileText, 
  Trash2, 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Copy, 
  Check, 
  RefreshCw, 
  ThumbsUp, 
  Sliders, 
  Briefcase,
  Skull,
  Activity,
  Award,
  Terminal,
  ShieldAlert,
  Fingerprint,
  History,
  Clock,
  X,
  ChevronRight
} from "lucide-react";

interface FileState {
  name: string;
  mimeType: string;
  base64: string;
  size: string;
}

interface HistoryItem {
  id: string;
  timestamp: number;
  fileName: string;
  activeTab: "upload" | "paste";
  pastedText: string;
  file: FileState | null;
  intensity: "mild" | "spicy" | "savage";
  roastResult: RoastResult;
}

interface Improvement {
  category: string;
  critique: string;
  actionable_steps: string[];
}

interface BulletMakeover {
  original: string;
  improved: string;
  why: string;
}

interface RoastResult {
  is_blank: boolean;
  roast: string;
  overall_feedback: string;
  key_strengths: string[];
  improvements: Improvement[];
  bullet_makeovers: BulletMakeover[];
  ats_score: number;
  interview_probability: string;
}

const FUNNY_LOADING_STEPS = [
  "Stoking the combustion chamber...",
  "Searching for evidence of actual work experience...",
  "Ignoring self-proclaimed 'synergistic paradigm shifters'...",
  "Counting the number of times you said 'passionate'...",
  "Translating buzzwords to human-readable terms...",
  "Comparing claims to reality database...",
  "Preparing brutal commentary...",
  "Calculating corporate survival rate...",
  "Consulting recruiter shadow cabinet...",
  "Assembling actionable improvements (yes, we actually have those)..."
];

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const [pastedText, setPastedText] = useState("");
  const [file, setFile] = useState<FileState | null>(null);
  const [intensity, setIntensity] = useState<"mild" | "spicy" | "savage">("spicy");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [roastResult, setRoastResult] = useState<RoastResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [latency, setLatency] = useState("45ms");
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem("resume_roaster_history");
      if (stored) {
        const parsed = JSON.parse(stored) as HistoryItem[];
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const valid = parsed.filter(item => item.timestamp >= oneDayAgo);
        localStorage.setItem("resume_roaster_history", JSON.stringify(valid));
        return valid;
      }
    } catch (err) {
      console.error("Failed to load history from LocalStorage", err);
    }
    return [];
  });
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to save history item
  const saveToHistory = (item: Omit<HistoryItem, "id" | "timestamp">) => {
    const newItem: HistoryItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 11) + "_" + Date.now(),
      timestamp: Date.now()
    };
    setHistory(prev => {
      const updated = [newItem, ...prev];
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const valid = updated.filter(i => i.timestamp >= oneDayAgo);
      localStorage.setItem("resume_roaster_history", JSON.stringify(valid));
      return valid;
    });
  };

  // Helper to delete from history
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem("resume_roaster_history", JSON.stringify(updated));
      return updated;
    });
  };

  // Clear all history
  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem("resume_roaster_history");
  };

  // Load a history item back into view
  const loadHistoryItem = (item: HistoryItem) => {
    setFile(item.file);
    setPastedText(item.pastedText);
    setActiveTab(item.activeTab);
    setIntensity(item.intensity);
    setRoastResult(item.roastResult);
    setShowHistoryDrawer(false);
  };

  // Cycle funny loading messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % FUNNY_LOADING_STEPS.length);
      }, 3000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Simulate latency variation for bento-grid feel
  useEffect(() => {
    const latencies = ["38ms", "42ms", "45ms", "51ms", "60ms"];
    const interval = setInterval(() => {
      const randomLat = latencies[Math.floor(Math.random() * latencies.length)];
      setLatency(randomLat);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (selectedFile: File) => {
    const validMimeTypes = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp"
    ];

    const fileNameLower = selectedFile.name.toLowerCase();
    const isDocx = fileNameLower.endsWith(".docx");
    const isDoc = fileNameLower.endsWith(".doc");
    const isTxt = fileNameLower.endsWith(".txt");
    const isMd = fileNameLower.endsWith(".md");
    const isPdf = fileNameLower.endsWith(".pdf");
    const isImage = fileNameLower.endsWith(".png") || fileNameLower.endsWith(".jpg") || fileNameLower.endsWith(".jpeg") || fileNameLower.endsWith(".webp");

    if (!validMimeTypes.includes(selectedFile.type) && !isDocx && !isDoc && !isTxt && !isMd && !isPdf && !isImage) {
      setError("Unsupported file format. Please upload a PDF (.pdf), Word Doc (.docx, .doc), Image (.png, .jpg, .webp), or Plain Text (.txt, .md) resume.");
      return;
    }

    setError(null);
    const sizeInKB = (selectedFile.size / 1024).toFixed(1);
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target?.result) {
        const base64String = (event.target.result as string).split(",")[1];
        
        let detectedMimeType = selectedFile.type;
        if (!detectedMimeType) {
          if (isDocx) detectedMimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          else if (isDoc) detectedMimeType = "application/msword";
          else if (isPdf) detectedMimeType = "application/pdf";
          else if (isTxt) detectedMimeType = "text/plain";
          else if (isMd) detectedMimeType = "text/markdown";
          else if (fileNameLower.endsWith(".png")) detectedMimeType = "image/png";
          else if (fileNameLower.endsWith(".jpg") || fileNameLower.endsWith(".jpeg")) detectedMimeType = "image/jpeg";
          else if (fileNameLower.endsWith(".webp")) detectedMimeType = "image/webp";
        }

        setFile({
          name: selectedFile.name,
          mimeType: detectedMimeType || "application/octet-stream",
          base64: base64String,
          size: `${sizeInKB} KB`,
        });
      }
    };

    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Run the roast call
  const triggerRoast = async (overrideIntensity?: "mild" | "spicy" | "savage") => {
    const targetIntensity = overrideIntensity || intensity;
    setLoading(true);
    setError(null);
    setRoastResult(null);

    const payload: any = {
      intensity: targetIntensity,
      text: activeTab === "paste" ? pastedText : "",
      file: activeTab === "upload" && file ? {
        mimeType: file.mimeType,
        base64: file.base64
      } : null
    };

    try {
      const response = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errMsg = "Failed to parse resume feedback.";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await response.json();
            errMsg = errData.error || errMsg;
          } else {
            const text = await response.text();
            // Clean HTML error descriptions slightly to make them more readable if we get them
            errMsg = text.slice(0, 200) || `HTTP error ${response.status}`;
          }
        } catch (innerErr) {
          errMsg = `HTTP error ${response.status}`;
        }
        throw new Error(errMsg);
      }

      let data: RoastResult;
      try {
        data = await response.json();
      } catch (parseErr) {
        throw new Error("The server returned an invalid response. Please try again.");
      }
      setRoastResult(data);
      setIntensity(targetIntensity);

      // Save to local history
      saveToHistory({
        fileName: activeTab === "upload" && file ? file.name : "Pasted Text",
        activeTab,
        pastedText: activeTab === "paste" ? pastedText : "",
        file: activeTab === "upload" ? file : null,
        intensity: targetIntensity,
        roastResult: data
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong on our end. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Copy helper
  const handleCopy = (textToCopy: string, sectionKey: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const resetAll = () => {
    setFile(null);
    setPastedText("");
    setRoastResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-slate-200 font-sans selection:bg-orange-500 selection:text-white pb-12 flex flex-col justify-between">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.03),transparent_50%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-full h-1/2 bg-[radial-gradient(ellipse_at_bottom_left,rgba(239,68,68,0.02),transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex-grow">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-white/10 pb-5 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 flex items-center gap-2">
              RESUME ROASTER 
              <span className="text-[10px] font-mono bg-red-600/20 text-red-400 px-2.5 py-1 rounded border border-red-500/30 uppercase tracking-wider">
                Incinerator Mode Active
              </span>
            </h1>
            <p className="text-slate-500 font-mono text-xs sm:text-sm mt-1">
              Converting average career paths into ash with Gemini AI diagnostics.
            </p>
          </div>
          <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-start bg-white/[0.02] sm:bg-transparent p-3 sm:p-0 rounded-xl border border-white/5 sm:border-transparent">
            {/* History Trigger Button */}
            <button
              onClick={() => setShowHistoryDrawer(true)}
              className="relative py-2 px-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer font-mono group"
            >
              <History className="w-3.5 h-3.5 text-orange-500 group-hover:rotate-[-15deg] transition-transform" />
              <span>HISTORY</span>
              {history.length > 0 && (
                <span className="bg-red-600 text-white font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-black animate-pulse">
                  {history.length}
                </span>
              )}
            </button>

            <div className="text-right">
              <p className="text-[9px] uppercase tracking-widest text-slate-500 font-mono">Session Status</p>
              <p className="text-green-500 font-mono text-xs font-bold tracking-tight">
                {loading ? "PROCESSING_TARGET" : roastResult ? "ANALYSIS_COMPLETE" : "WAITING_FOR_UPLOAD"}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/5 rounded-full border border-white/10 flex items-center justify-center">
              <div className={`w-2.5 h-2.5 rounded-full ${loading ? "bg-orange-500 animate-ping" : roastResult ? "bg-green-500" : "bg-amber-500 animate-pulse"}`} />
            </div>
          </div>
        </header>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 bg-red-950/20 border border-red-500/30 p-4 rounded-xl flex items-start gap-3 text-red-200 text-sm animate-pulse">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 font-mono text-xs">
              <span className="font-bold uppercase text-red-400">CRITICAL_ERROR:</span> {error}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* ======================================= */}
          {/* INPUT SCREEN (Wait state)               */}
          {/* ======================================= */}
          {!loading && !roastResult && (
            <motion.div
              key="input-grid"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-5"
            >
              
              {/* Bento Box 1: File Uploader (col-span-12 md:col-span-4) */}
              <div className="col-span-12 md:col-span-4 bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col justify-between min-h-[340px]">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Target Document</span>
                    <span className="text-[9px] font-mono text-slate-500">v1.2_uploader</span>
                  </div>

                  {/* Upload Dropzone Tab Content */}
                  <div className="space-y-4">
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
                      <button
                        onClick={() => { setActiveTab("upload"); setError(null); }}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all font-mono ${
                          activeTab === "upload"
                            ? "bg-orange-600 text-white shadow-md"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        UPLOAD FILE
                      </button>
                      <button
                        onClick={() => { setActiveTab("paste"); setError(null); }}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all font-mono ${
                          activeTab === "paste"
                            ? "bg-orange-600 text-white shadow-md"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        PASTE TEXT
                      </button>
                    </div>

                    {activeTab === "upload" ? (
                      <div>
                        {!file ? (
                          <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                              dragActive
                                ? "border-orange-500 bg-orange-950/15 scale-[1.01]"
                                : "border-white/10 hover:border-white/20 bg-black/30 hover:bg-black/50"
                            }`}
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.txt,.md"
                              className="hidden"
                            />
                            <div className="bg-white/5 p-3 rounded-full w-fit mx-auto border border-white/10 text-orange-400 mb-3">
                              <UploadCloud className="w-6 h-6 text-orange-500" />
                            </div>
                            <p className="text-xs font-semibold text-white mb-1">
                              Click or drop resume file here
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              PDF, WORD, IMAGES, TXT, or MD (MAX 10MB)
                            </p>
                          </div>
                        ) : (
                          <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="bg-white/5 p-2 rounded-lg text-orange-500 shrink-0 border border-white/5">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-white truncate max-w-[150px]">
                                  {file.name}
                                </h4>
                                <p className="text-[9px] text-slate-500 font-mono">
                                  {file.size} • {file.mimeType.split("/")[1]?.toUpperCase() || "PDF"}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setFile(null)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all cursor-pointer"
                              title="Clear resume"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          value={pastedText}
                          onChange={(e) => setPastedText(e.target.value)}
                          placeholder="Paste plaintext resume achievements..."
                          rows={4}
                          className="w-full bg-black/40 text-slate-200 text-xs p-3 rounded-xl border border-white/10 focus:border-orange-500 focus:outline-none font-mono resize-none"
                        />
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                          <span>{pastedText.length} characters</span>
                          {pastedText.length > 0 && (
                            <button onClick={() => setPastedText("")} className="hover:text-red-400">Clear</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <Fingerprint className="w-3.5 h-3.5 text-orange-500/70" />
                  <span>Resume content parsed locally</span>
                </div>
              </div>

              {/* Bento Box 2: Comedy Intensity & Burn Engine (col-span-12 md:col-span-5) */}
              <div className="col-span-12 md:col-span-5 bg-gradient-to-br from-red-950/20 to-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col justify-between min-h-[340px]">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Incinerator Settings</span>
                    <span className="text-[9px] font-mono text-red-500 uppercase tracking-widest font-bold">Severity selector</span>
                  </div>

                  <h3 className="text-xl font-black text-white font-display tracking-tight leading-tight">
                    CHOOSE YOUR INCINERATION TEMPERATURE
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 font-mono leading-relaxed">
                    Set the comedic output aggression. Severe burns may cause bruising to the professional ego.
                  </p>

                  {/* 3 Burn levels */}
                  <div className="grid grid-cols-3 gap-2.5 mt-5">
                    {[
                      { id: "mild", emoji: "🌶️", title: "Mild", desc: "Constructive" },
                      { id: "spicy", emoji: "🔥", title: "Spicy", desc: "Honest Sassy" },
                      { id: "savage", emoji: "💀", title: "Savage", desc: "No Filter" }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setIntensity(opt.id as any)}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                          intensity === opt.id
                            ? "bg-orange-500/15 border-orange-500 text-orange-400 shadow-md scale-[1.02]"
                            : "bg-black/30 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-300"
                        }`}
                      >
                        <span className="text-lg mb-1">{opt.emoji}</span>
                        <span className="text-xs font-bold block">{opt.title}</span>
                        <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => triggerRoast()}
                    disabled={activeTab === "upload" ? !file : !pastedText.trim()}
                    className={`w-full py-3.5 px-6 rounded-xl font-black tracking-wider text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer ${
                      (activeTab === "upload" ? file : pastedText.trim())
                        ? "bg-orange-600 hover:bg-orange-500 text-white shadow-orange-950/50 active:scale-[0.98]"
                        : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                    }`}
                  >
                    <Flame className="w-4 h-4 animate-bounce" />
                    INITIATE INCINERATION SEQUENCE
                  </button>
                </div>
              </div>

              {/* Bento Box 3: Live Stats & Intro (col-span-12 md:col-span-3) */}
              <div className="col-span-12 md:col-span-3 bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono block mb-4">Diagnostics Feed</span>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs text-slate-400 font-mono">HONESTY_FILTER: OFF</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-slate-400 font-mono">GEMINI_API: ATTACHED</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-xs text-slate-400 font-mono">XYZ_MODELER: ARMED</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-white/5">
                    <p className="text-xs font-bold text-white uppercase tracking-tight">The 6-Second Filter</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal font-mono">
                      Corporate algorithms and human gatekeepers delete 80% of resumes inside 10 seconds. We review for metrics, fluff, and layout structure instantly.
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center mt-6">
                  <p className="text-[9px] text-slate-400 font-mono">ESTIMATED ENGINE SPEED</p>
                  <p className="text-lg font-black text-white font-mono mt-0.5">3.5M TOKENS/S</p>
                </div>
              </div>

              {/* Bento Box 4: Under-row Banner (col-span-12) */}
              <div className="col-span-12 bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-orange-500" />
                  <span>NOTICE: No resumes are stored on our servers. Instant destruction after roasting.</span>
                </div>
                <div className="flex gap-4">
                  <span>LATENCY: {latency}</span>
                  <span>VERSION: 2.4.0</span>
                </div>
              </div>

            </motion.div>
          )}

          {/* ======================================= */}
          {/* LOADING SCREEN                          */}
          {/* ======================================= */}
          {loading && (
            <motion.div
              key="loading-bento"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 flex flex-col items-center justify-center max-w-md mx-auto space-y-6 text-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-orange-600/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative bg-[#101014] border border-orange-500/40 p-8 rounded-full shadow-2xl">
                  <Flame className="w-12 h-12 text-orange-500 animate-bounce" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  RUNNING RECRUITER EMULATOR...
                </h3>
                <p className="text-xs text-orange-400 font-mono h-6 transition-all">
                  &gt; {FUNNY_LOADING_STEPS[loadingStep]}
                </p>
              </div>

              <div className="w-full bg-white/5 border border-white/10 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 10, ease: "linear" }}
                  className="h-full bg-gradient-to-r from-orange-500 to-red-600"
                />
              </div>
              
              <p className="text-[10px] text-slate-500 font-mono uppercase">
                Calibrating brutally honest feedback algorithms. Hold tight.
              </p>
            </motion.div>
          )}

          {/* ======================================= */}
          {/* RESULTS SCREEN (Bento Grid Output)      */}
          {/* ======================================= */}
          {roastResult && (
            <motion.div
              key="results-grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              
              {/* Top row actions & reset */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-white/[0.02] border border-white/10 rounded-xl p-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                  <p className="text-xs font-mono text-slate-400">
                    DIAGNOSTICS: <span className="text-white font-bold">{intensity.toUpperCase()} INCINERATION</span> OVER {file ? "UPLOADED PDF" : "PASTED DATA"}
                  </p>
                </div>
                
                <div className="flex items-center gap-3 self-stretch sm:self-auto">
                  <button
                    onClick={() => handleCopy(JSON.stringify(roastResult, null, 2), "all")}
                    className="flex-1 sm:flex-none py-2 px-4 bg-black/40 border border-white/10 hover:border-white/20 text-xs text-slate-300 font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {copiedSection === "all" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        COPIED_DATA
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        COPY RAW DATA
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetAll}
                    className="flex-1 sm:flex-none py-2 px-5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-xs text-white font-black rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    BURN ANOTHER
                  </button>
                </div>
              </div>

              {/* Temperature Adjuster on Roasted Result */}
              <div className="bg-[#151212]/90 border border-orange-500/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Flame className="w-5 h-5 text-orange-500 animate-pulse shrink-0" />
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">WANT A DIFFERENT LEVEL OF EGOTISTICAL DAMAGE?</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Toggle severity levels to regenerate this exact resume and add it to your history stream.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                  {[
                    { id: "mild", label: "🌶️ MILD", desc: "Constructive advice" },
                    { id: "spicy", label: "🔥 SPICY", desc: "Sassy & raw" },
                    { id: "savage", label: "💀 SAVAGE", desc: "Ruthless comedian" }
                  ].map((opt) => {
                    const isSelected = intensity === opt.id;
                    return (
                      <button
                        key={opt.id}
                        disabled={loading}
                        onClick={() => {
                          if (!isSelected) {
                            triggerRoast(opt.id as any);
                          }
                        }}
                        className={`flex-1 md:flex-none py-2 px-3 rounded-lg border text-xs font-bold font-mono transition-all uppercase flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? "bg-orange-600 border-orange-500 text-white font-black shadow-lg shadow-orange-950/40"
                            : "bg-black/40 border-white/5 text-slate-400 hover:border-white/15 hover:text-slate-300 cursor-pointer"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* EDGE CASE: Completely blank resume */}
              {roastResult.is_blank ? (
                <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto">
                  <div className="bg-white/5 border border-red-500/20 p-4 rounded-full w-fit mx-auto text-red-500">
                    <Skull className="w-10 h-10 animate-bounce" />
                  </div>
                  <h3 className="text-2xl font-black text-white font-display tracking-tight uppercase">
                    No real content found
                  </h3>
                  <p className="text-slate-400 font-mono text-xs leading-relaxed">
                    ERROR_CODE_404: The document was empty, completely unreadable, or didn't contain any real resume details. Start over and feed the system actual resume achievements.
                  </p>
                  <button
                    onClick={resetAll}
                    className="mt-2 py-2.5 px-6 bg-white/5 border border-white/10 hover:border-white/20 text-xs text-orange-400 hover:text-orange-300 font-bold font-mono rounded-lg transition-all cursor-pointer"
                  >
                    RESET & TRY AGAIN
                  </button>
                </div>
              ) : (
                
                /* Bento Grid Output Structure */
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                  
                  {/* BENTO BOX 1: Document info & visual preview simulation (col-span-3) */}
                  <div className="col-span-12 md:col-span-3 bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between min-h-[380px]">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Target Document</span>
                        <span className="text-[9px] font-mono text-slate-600">v2.4_final</span>
                      </div>
                      
                      <div className="bg-black/30 rounded-lg border border-dashed border-white/5 p-4 overflow-hidden relative min-h-[220px]">
                        <div className="space-y-2.5 opacity-20 select-none">
                          <div className="h-4 w-3/4 bg-white/20 rounded" />
                          <div className="h-3 w-full bg-white/10 rounded" />
                          <div className="h-3 w-5/6 bg-white/10 rounded" />
                          <div className="h-8 w-full border border-white/10 rounded mt-4" />
                          <div className="h-3 w-full bg-white/10 rounded" />
                          <div className="h-3 w-4/5 bg-white/10 rounded" />
                          <div className="h-3 w-full bg-white/10 rounded" />
                        </div>

                        {/* File Details Overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                          <FileText className="w-8 h-8 text-orange-500/80 mb-2" />
                          <h4 className="text-xs font-bold text-white truncate max-w-full">
                            {file?.name || "Pasted Raw Data"}
                          </h4>
                          <p className="text-[9px] text-slate-500 font-mono mt-1">
                            {file?.size || `${pastedText.length} chars`} • PARSED
                          </p>
                          <button
                            onClick={resetAll}
                            className="mt-4 bg-orange-600 hover:bg-orange-500 text-white font-black py-1.5 px-4 rounded-full text-[10px] transition-all shadow-lg tracking-wider"
                          >
                            RE-UPLOAD RESUME
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5">
                      <p className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Processed using</p>
                      <p className="text-xs text-white font-semibold">Gemini 3.5 Flash Model</p>
                    </div>
                  </div>

                  {/* BENTO BOX 2: Roast Level gauge & comical sass roast description (col-span-5) */}
                  <div className="col-span-12 md:col-span-5 bg-gradient-to-br from-red-950/40 to-transparent border border-red-500/20 rounded-2xl p-6 flex flex-col justify-between min-h-[380px]">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 font-mono">INCINERATOR OUTPUT</span>
                      <span className="text-[9px] font-mono text-red-400 uppercase font-bold">{intensity} Mode</span>
                    </div>

                    <div className="flex items-center gap-6 my-6">
                      <div className="relative shrink-0">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                          <circle 
                            cx="48" 
                            cy="48" 
                            r="40" 
                            stroke="currentColor" 
                            strokeWidth="8" 
                            fill="transparent" 
                            strokeDasharray="251.2" 
                            strokeDashoffset={251.2 - (251.2 * roastResult.ats_score) / 100} 
                            className="text-red-500" 
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-red-500 font-mono">{roastResult.ats_score}%</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-red-500 font-black text-lg uppercase italic tracking-tighter">
                          ROAST STATUS: SEVERE
                        </h3>
                        <p className="text-slate-400 text-xs font-mono leading-tight mt-1">
                          Calculated score based on cliché usage and action impact lackings.
                        </p>
                      </div>
                    </div>

                    <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-red-500" />
                        The Direct Roast:
                      </p>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono italic">
                        "{roastResult.roast}"
                      </p>
                    </div>
                  </div>

                  {/* BENTO BOX 3: Quick Stats (col-span-4) */}
                  <div className="col-span-12 md:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between min-h-[380px]">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono block mb-4">Diagnostics Analytics</span>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col p-3 bg-black/20 rounded-xl border border-white/5">
                          <span className="text-[9px] font-bold text-slate-500 uppercase font-mono">ATS Readability</span>
                          <span className="text-lg font-black text-white mt-1">
                            {roastResult.ats_score < 40 ? "POOR" : roastResult.ats_score < 70 ? "MEDIUM" : "GOOD"}
                          </span>
                        </div>
                        <div className="flex flex-col p-3 bg-black/20 rounded-xl border border-white/5">
                          <span className="text-[9px] font-bold text-slate-500 uppercase font-mono">Cliché Score</span>
                          <span className="text-lg font-black text-red-500 mt-1 uppercase">
                            {roastResult.ats_score < 50 ? "CRITICAL" : "MODERATE"}
                          </span>
                        </div>
                        <div className="flex flex-col p-3 bg-black/20 rounded-xl border border-white/5 col-span-2">
                          <span className="text-[9px] font-bold text-slate-500 uppercase font-mono">Interview Odds</span>
                          <span className={`text-lg font-black mt-1 uppercase ${roastResult.ats_score < 50 ? "text-red-500" : "text-amber-500"}`}>
                            {roastResult.interview_probability}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Silver Lining:</span>
                      <p className="text-xs text-slate-300">
                        {roastResult.key_strengths?.[0] || "Found actual human text in the document."}
                      </p>
                    </div>
                  </div>

                  {/* BENTO BOX 4: The Honest Feedback (col-span-12 md:col-span-6) */}
                  <div className="col-span-12 md:col-span-6 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0" />
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-300 font-mono">THE BRUTAL TRUTH & CRITIQUES</h2>
                      </div>

                      <div className="space-y-4">
                        {roastResult.improvements?.map((item, index) => (
                          <div key={index} className="bg-black/20 p-4 rounded-xl border-l-4 border-orange-500">
                            <h4 className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-2">
                              <span>0{index + 1}</span> • {item.category}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1.5 font-mono leading-relaxed">
                              {item.critique}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-3 border-t border-white/5 text-[10px] text-slate-500 font-mono">
                      RECOMMENDATION_ENGINE: ACTIVE // 2.5
                    </div>
                  </div>

                  {/* BENTO BOX 5: Actionable Fixes & Rewrites (col-span-12 md:col-span-6) */}
                  <div className="col-span-12 md:col-span-6 bg-orange-600 rounded-2xl p-6 text-orange-950 flex flex-col justify-between">
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tighter mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        FIX IT OR FAIL (STAR Rewrite Board)
                      </h2>

                      <ul className="space-y-4">
                        {roastResult.improvements?.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="flex gap-3 items-start">
                            <span className="font-mono font-black text-sm text-orange-900 bg-orange-700/30 px-2 py-0.5 rounded shrink-0">
                              0{idx + 1}
                            </span>
                            <div className="text-xs leading-normal">
                              <strong className="uppercase font-extrabold text-orange-950 block">{item.category} Actionable Steps:</strong>
                              <p className="text-orange-900 font-medium mt-1 font-mono">
                                {item.actionable_steps?.join(" • ") || "Rewrite with metrics and action verbs."}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6">
                      <div className="p-3 bg-orange-700/30 rounded-xl mb-4 border border-orange-700/20">
                        <p className="text-[10px] font-mono font-bold uppercase text-orange-950">Example Bullet Makeover:</p>
                        <p className="text-[11px] font-mono leading-tight mt-1">
                          <span className="text-orange-900 line-through">Before: "{roastResult.bullet_makeovers?.[0]?.original || "Assisted with team goals"}"</span>
                          <br />
                          <span className="text-white font-bold block mt-1">After: "{roastResult.bullet_makeovers?.[0]?.improved || "Engineered 3 high-impact APIs using Go"}"</span>
                        </p>
                      </div>

                      <button
                        onClick={resetAll}
                        className="w-full py-3 bg-orange-950 hover:bg-black text-orange-400 font-black rounded-xl text-xs uppercase transition-colors tracking-widest cursor-pointer"
                      >
                        RUN ANOTHER RESUME
                      </button>
                    </div>
                  </div>

                  {/* BENTO BOX 6: System Diagnostics Logs (col-span-12) */}
                  <div className="col-span-12 bg-red-950/20 border border-red-500/10 rounded-2xl p-4 flex flex-col justify-center">
                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-1 font-mono">System Diagnostic Log</p>
                    <p className="text-[10px] font-mono leading-relaxed text-slate-400">
                      <span className="text-red-500">ROAST_SUMMARY_CODE:</span> {roastResult.overall_feedback}
                    </p>
                  </div>

                </div>
              )}

              {/* Status footer bar */}
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-600 border-t border-white/5 pt-4">
                <div className="flex gap-4">
                  <span>LATENCY: {latency}</span>
                  <span>SCAN_DEPTH: TOTAL</span>
                  <span>HONESTY_FILTER: DISABLED</span>
                </div>
                <span>© 2026 INCINERATOR LABS</span>
              </div>

            </motion.div>
          )}
          
        </AnimatePresence>

      </div>

      {/* 24-Hour History Slide-Over Drawer */}
      <AnimatePresence>
        {showHistoryDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryDrawer(false)}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />

            {/* Sidebar Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0e0e11] border-l border-white/10 shadow-2xl z-50 flex flex-col justify-between"
            >
              <div className="flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-orange-500" />
                    <div>
                      <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">ROAST STREAM (24H)</h2>
                      <p className="text-[10px] text-slate-500 font-mono">Self-destructing history channel</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHistoryDrawer(false)}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Subtitle / notice */}
                <div className="px-6 py-3.5 bg-orange-950/20 border-b border-white/5 text-[10px] text-orange-400/90 font-mono leading-relaxed flex items-start gap-2 shrink-0">
                  <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    To preserve confidentiality, all loaded documents and resume roasts are automatically deleted 24 hours after their generation.
                  </span>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {history.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 font-mono space-y-3">
                      <Skull className="w-8 h-8 text-slate-700 mx-auto" />
                      <p className="text-xs">No active combustions found.</p>
                      <p className="text-[10px] text-slate-600">Upload and incinerate your resume to start logging history.</p>
                    </div>
                  ) : (
                    history.map((item) => {
                      const isSelected = roastResult && file?.name === item.file?.name && pastedText === item.pastedText && intensity === item.intensity;
                      
                      // Severity badge formatting
                      const intensityBadge = 
                        item.intensity === "mild" ? { emoji: "🌶️", text: "Mild", bg: "bg-green-950/30 text-green-400 border-green-500/20" } :
                        item.intensity === "spicy" ? { emoji: "🔥", text: "Spicy", bg: "bg-orange-950/30 text-orange-400 border-orange-500/20" } :
                        { emoji: "💀", text: "Savage", bg: "bg-red-950/30 text-red-400 border-red-500/20" };

                      return (
                        <div
                          key={item.id}
                          onClick={() => loadHistoryItem(item)}
                          className={`p-4 rounded-xl border transition-all text-left group cursor-pointer relative flex flex-col justify-between gap-3 ${
                            isSelected
                              ? "bg-orange-950/20 border-orange-500 shadow-md"
                              : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                          }`}
                        >
                          {/* Item Head */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate max-w-[240px]">
                                {item.fileName}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                {formatRelativeTime(item.timestamp)}
                              </p>
                            </div>
                            
                            {/* Action elements */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={(e) => deleteHistoryItem(item.id, e)}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Item Body / details */}
                          <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2 text-[10px] font-mono">
                            <span className={`px-2 py-0.5 rounded border ${intensityBadge.bg}`}>
                              {intensityBadge.emoji} {intensityBadge.text}
                            </span>
                            
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">Score:</span>
                              <span className={`font-bold ${item.roastResult.ats_score < 40 ? "text-red-500" : item.roastResult.ats_score < 70 ? "text-amber-500" : "text-green-500"}`}>
                                {item.roastResult.ats_score}%
                              </span>
                            </div>
                          </div>
                          
                          {/* Chevron Indicator */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <ChevronRight className="w-4 h-4 text-orange-500" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Drawer Footer actions */}
                {history.length > 0 && (
                  <div className="p-6 border-t border-white/10 bg-black/40 shrink-0">
                    <button
                      onClick={clearAllHistory}
                      className="w-full py-2.5 px-4 bg-red-950/20 hover:bg-red-900/20 text-red-400 hover:text-red-300 font-black font-mono text-xs uppercase tracking-wider rounded-xl border border-red-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      PURGE ALL LOGS
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
