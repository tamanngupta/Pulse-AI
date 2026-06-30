import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, BarChart2, Zap, RefreshCw } from "lucide-react";
import { Task, Journal, IntelligenceReport } from "../types";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface IntelligenceLayerProps {
  tasks: Task[];
  journals: Journal[];
  mode?: "morning" | "night";
}

export default function IntelligenceLayer({ tasks, journals, mode = "night" }: IntelligenceLayerProps) {
  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const isNight = mode === "night";

  const fetchIntelligence = async () => {
    if (journals.length === 0) return;
    setIsLoading(true);
    setErrorText("");
    try {
      const res = await fetch("/api/gemini/intelligence-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, journals })
      });
      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType || !contentType.includes("application/json")) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      if (data && !data.error) {
        setReport(data);
      } else {
        setErrorText(data.error || "Failed to generate report.");
      }
    } catch (err) {
      console.error(err);
      setErrorText("Failed to sync intelligence engine.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, [tasks.length, journals.length]);

  // Format chart data from journal logs
  const chartData = [...journals]
    .reverse()
    .map((j) => ({
      date: new Date(j.createdAt + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Score: j.aiScore,
      Energy: j.energyLevel === "high" ? 3 : j.energyLevel === "medium" ? 2 : 1
    }));

  // Render blank slate if no journals are present
  if (journals.length === 0) {
    return (
      <div className={`w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6 transition-colors duration-500 ${
        isNight ? "text-[#F5F4EE]" : "text-[#1C1D26]"
      }`}>
        {/* Title */}
        <div className={`flex items-center justify-between border-b pb-4 ${
          isNight ? "border-white/10" : "border-black/5"
        }`}>
          <div>
            <span className={`text-xs font-mono uppercase tracking-widest ${
              isNight ? "text-slate-400" : "text-slate-500"
            }`}>Cognitive Intelligence</span>
            <h2 className={`font-display font-bold text-2xl mt-1 ${
              isNight ? "text-white" : "text-[#1C1D26]"
            }`}>Behavior Analytics & Predictions</h2>
          </div>
        </div>

        <div className={`rounded-3xl p-8 border text-center flex flex-col items-center justify-center space-y-4 py-16 transition-all duration-500 ${
          isNight
            ? "bg-[#0E0F21]/40 border-purple-950/30 text-[#F5F4EE]"
            : "bg-white border border-[#E2E1D9] text-[#1C1D26] shadow-sm"
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isNight ? "bg-purple-950/40 text-purple-400 border border-purple-900/40" : "bg-amber-50 text-amber-600 border border-amber-200"
          }`}>
            <BarChart2 className="w-8 h-8 animate-pulse text-slate-400" />
          </div>
          <div className="max-w-md space-y-2">
            <h4 className="text-base font-bold font-display">Cognitive Graph Locked</h4>
            <p className={`text-xs leading-relaxed ${
              isNight ? "text-slate-400" : "text-slate-500"
            }`}>
              Our behavioral model requires historic milestones. Go to the <span className="font-semibold">Journal</span> tab, write a brief overview of your day, and log it to initialize the neural behavior analysis graph!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6 transition-colors duration-500 ${
      isNight ? "text-[#F5F4EE]" : "text-[#1C1D26]"
    }`}>
      {/* Title */}
      <div className={`flex items-center justify-between border-b pb-4 ${
        isNight ? "border-white/10" : "border-black/5"
      }`}>
        <div>
          <span className={`text-xs font-mono uppercase tracking-widest ${
            isNight ? "text-slate-400" : "text-slate-500"
          }`}>Cognitive Intelligence</span>
          <h2 className={`font-display font-bold text-2xl mt-1 ${
            isNight ? "text-white" : "text-[#1C1D26]"
          }`}>Behavior Analytics & Predictions</h2>
        </div>
        <button
          onClick={fetchIntelligence}
          disabled={isLoading}
          className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1 border ${
            isNight
              ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
              : "bg-[#FAF9F5] border-[#E2E1D9] text-slate-700 hover:bg-slate-100"
          }`}
          title="Recalculate models"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-500" : ""}`} />
          <span className="text-xs font-medium font-sans">Recalculate</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`p-12 rounded-3xl border text-center flex flex-col items-center justify-center space-y-4 min-h-[350px] transition-colors duration-500 ${
              isNight 
                ? "bg-white/5 border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)] backdrop-blur-md" 
                : "bg-white border border-[#E2E1D9] text-[#1C1D26] shadow-sm"
            }`}
          >
            <div className="relative w-16 h-16">
              <div className={`absolute inset-0 rounded-full border-4 ${isNight ? "border-white/10" : "border-slate-100"}`} />
              <div className={`absolute inset-0 rounded-full border-4 animate-spin ${
                isNight ? "border-t-white border-r-white" : "border-t-[#1C1D26] border-r-[#1C1D26]"
              }`} />
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm">Synchronizing Intelligence Models</h4>
              <p className={`text-xs max-w-sm mt-1 leading-relaxed ${
                isNight ? "text-slate-400" : "text-slate-500"
              }`}>
                Gemini is parsing completion speeds, distraction logs, and end-of-day reflections to construct your cognitive behavior graph...
              </p>
            </div>
          </motion.div>
        ) : errorText ? (
          <motion.div
            key="error"
            className="p-8 bg-red-500/10 border border-red-500/20 text-center text-red-500 text-sm rounded-2xl"
          >
            {errorText}
          </motion.div>
        ) : report ? (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Top Grid: Main stats and Recharts visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily AI Score Card (Minimalist) */}
              <div className={`rounded-3xl p-6 border flex flex-col justify-between relative overflow-hidden transition-colors duration-500 ${
                isNight
                  ? "bg-white/5 text-white border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)] backdrop-blur-md"
                  : "bg-white text-[#1C1D26] border border-[#E2E1D9] shadow-sm"
              }`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${
                    isNight ? "text-slate-400" : "text-slate-500"
                  }`}>Current AI Focus Score</span>
                  <Zap className="w-4 h-4 text-amber-500 fill-current" />
                </div>
                <div className="my-6">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-6xl font-display font-bold">{report.dailyScore}</span>
                    <span className="text-slate-500 font-mono text-lg">/ 10</span>
                  </div>
                  <p className={`text-xs mt-2 leading-relaxed ${
                    isNight ? "text-slate-400" : "text-slate-500"
                  }`}>
                    Based on focus durations and tab transition frequency.
                  </p>
                </div>
                <div className={`border-t pt-3 text-[11px] font-mono ${
                  isNight ? "border-white/10 text-slate-400" : "border-black/5 text-slate-500"
                }`}>
                  Status: <span className="text-emerald-500 font-bold">Highly Attuned</span>
                </div>
              </div>

              {/* Minimal Chart Card */}
              <div className={`lg:col-span-2 rounded-3xl p-6 border flex flex-col justify-between transition-colors duration-500 ${
                isNight
                  ? "bg-white/5 border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)] backdrop-blur-md"
                  : "bg-white border border-[#E2E1D9] shadow-sm"
              }`}>
                <div>
                  <h4 className="font-display font-semibold text-sm flex items-center">
                    <BarChart2 className={`w-4 h-4 mr-2 ${isNight ? "text-slate-400" : "text-slate-500"}`} /> Focus Trend Over Time
                  </h4>
                  <p className={`text-[11px] ${isNight ? "text-slate-400" : "text-slate-500"} mb-4`}>
                    Calculated focus health across previous journals
                  </p>
                </div>
                <div className="w-full h-44">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isNight ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"} vertical={false} />
                        <XAxis dataKey="date" stroke={isNight ? "#94a3b8" : "#64748b"} fontSize={9} fontClassName="font-mono" axisLine={false} tickLine={false} />
                        <YAxis stroke={isNight ? "#94a3b8" : "#64748b"} fontSize={9} fontClassName="font-mono" axisLine={false} tickLine={false} domain={[1, 10]} />
                        <Tooltip contentStyle={{ background: isNight ? "rgba(10, 12, 24, 0.95)" : "rgba(255, 255, 255, 0.95)", color: isNight ? "#F5F4EE" : "#1C1D26", borderRadius: "12px", border: isNight ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.1)", backdropFilter: "blur(8px)", fontSize: "11px" }} />
                        <Line type="monotone" dataKey="Score" stroke={isNight ? "#FFFFFF" : "#1C1D26"} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500 italic">
                      Need at least 1 journal reflection to trace trends.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Grid: Qualitative analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Skip Prediction Warning Card */}
              <div className={`border rounded-3xl p-6 relative backdrop-blur-md transition-all duration-500 ${
                isNight 
                  ? "bg-orange-500/5 border-orange-500/10 text-orange-100" 
                  : "bg-orange-50 border border-orange-200 text-orange-950"
              }`}>
                <div className="absolute top-4 right-4">
                  <AlertTriangle className="w-5 h-5 text-orange-500 animate-bounce" />
                </div>
                <h4 className={`font-display font-semibold text-sm uppercase font-mono tracking-wider flex items-center ${
                  isNight ? "text-orange-400" : "text-orange-800"
                }`}>
                  Cognitive Dodge Warning
                </h4>
                <p className="text-sm italic font-medium mt-3 leading-relaxed">
                  "{report.skipPrediction}"
                </p>
              </div>

              {/* Suggested Workload Adjustments */}
              <div className={`border rounded-3xl p-6 backdrop-blur-md transition-all duration-500 ${
                isNight 
                  ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-100" 
                  : "bg-emerald-50 border border-emerald-200 text-emerald-950"
              }`}>
                <h4 className={`font-display font-semibold text-sm uppercase font-mono tracking-wider flex items-center ${
                  isNight ? "text-emerald-400" : "text-emerald-800"
                }`}>
                  <Lightbulb className="w-4 h-4 mr-2" /> Adaptive Scheduling
                </h4>
                <ul className="mt-3 space-y-2">
                  {report.workloadAdjustments.map((adj, i) => (
                    <li key={i} className="text-xs flex items-start leading-relaxed font-medium">
                      <span className={`mr-2 font-bold ${isNight ? "text-emerald-400" : "text-emerald-600"}`}>•</span>
                      <span>{adj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* General Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weekly review */}
              <div className={`border rounded-3xl p-6 transition-colors duration-500 ${
                isNight
                  ? "bg-white/5 border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)] text-slate-300"
                  : "bg-white border border-[#E2E1D9] text-slate-700 shadow-sm"
              }`}>
                <h4 className={`font-display font-semibold text-sm flex items-center mb-3 ${
                  isNight ? "text-white" : "text-[#1C1D26]"
                }`}>
                  <TrendingUp className={`w-4 h-4 mr-2 ${isNight ? "text-slate-400" : "text-slate-500"}`} /> Weekly Cognitive Profile
                </h4>
                <p className="text-xs leading-relaxed font-sans font-medium">
                  {report.weeklyReview}
                </p>
              </div>

              {/* Long term trends */}
              <div className={`border rounded-3xl p-6 transition-colors duration-500 ${
                isNight
                  ? "bg-white/5 border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)] text-slate-300"
                  : "bg-white border border-[#E2E1D9] text-slate-700 shadow-sm"
              }`}>
                <h4 className={`font-display font-semibold text-sm flex items-center mb-3 ${
                  isNight ? "text-white" : "text-[#1C1D26]"
                }`}>
                  <Sparkles className={`w-4 h-4 mr-2 ${isNight ? "text-slate-400" : "text-slate-500"}`} /> Monthly Trajectory
                </h4>
                <p className="text-xs leading-relaxed font-sans font-medium">
                  {report.monthlyTrends}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-sm font-mono">
            Could not fetch report data. Check back later.
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
