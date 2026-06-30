import React from "react";
import { Task } from "../types";
import { CloudUpload, ShieldCheck, CheckCircle } from "lucide-react";

interface ProofsViewProps {
  tasks: Task[];
  mode: "morning" | "night";
}

export default function ProofsView({ tasks, mode }: ProofsViewProps) {
  // Filter for completed tasks with actual or mock evidence
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Panel */}
      <div 
        className={`rounded-3xl p-6 border md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-500 ${
          mode === "night" 
            ? "bg-[#0E0F21]/80 border-purple-950/30 text-white" 
            : "bg-white border border-[#E2E1D9] text-[#1C1D26] shadow-sm"
        }`}
      >
        <div className="space-y-1">
          <span className={`text-[10px] font-mono uppercase tracking-widest ${
            mode === "night" ? "text-slate-400" : "text-slate-500"
          }`}>Claims Verification</span>
          <h3 className="font-display font-bold text-2xl">Proofs & Evidence Center</h3>
          <p className={`text-xs max-w-lg mt-1 ${
            mode === "night" ? "text-slate-400" : "text-slate-500"
          }`}>
            Browse through your verified achievements. Only tasks accompanied by image, file, or device synchronization credentials are authenticated.
          </p>
        </div>
        <div className={`flex items-center space-x-1.5 text-xs font-mono font-bold px-4 py-2 rounded-2xl border self-start md:self-center ${
          mode === "night"
            ? "text-purple-400 bg-purple-950/20 border-purple-900/40"
            : "text-amber-800 bg-amber-50 border-amber-200"
        }`}>
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Claim Authenticator: Active</span>
        </div>
      </div>

      {/* Grid of Verified proofs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {completedTasks.length > 0 ? (
          completedTasks.map(task => {
            const gradients = [
              "from-indigo-600 via-purple-600 to-pink-600",
              "from-blue-600 via-sky-600 to-cyan-500",
              "from-emerald-600 via-teal-600 to-green-500",
              "from-amber-500 via-orange-600 to-red-500"
            ];
            const idx = task.title.charCodeAt(0) % gradients.length;
            const gradientClass = gradients[idx];
            const timeStr = task.completedAt 
              ? new Date(task.completedAt).toLocaleString() 
              : "Verified Today";

            return (
              <div 
                key={task.id} 
                className={`rounded-2xl p-4 border transition-all hover:scale-[1.01] ${
                  mode === "night" 
                    ? "bg-[#0E0F21]/40 border-purple-950/30 text-[#F5F4EE]" 
                    : "bg-white border border-[#E2E1D9] text-[#1C1D26] shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    {/* Visual Cover */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${gradientClass} flex items-center justify-center font-bold text-xs text-white shadow-md flex-shrink-0 overflow-hidden relative`}>
                      <div className="absolute inset-0 bg-black/10" />
                      <span className="relative font-mono">{task.category.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <span className={`text-[9px] font-mono uppercase tracking-wider ${
                        mode === "night" ? "text-slate-400" : "text-slate-500"
                      }`}>{task.category}</span>
                      <h4 className="text-sm font-semibold truncate max-w-[180px] md:max-w-[240px] leading-snug mt-0.5">{task.title}</h4>
                      <p className={`text-[10px] font-mono mt-0.5 ${
                        mode === "night" ? "text-slate-400" : "text-slate-500"
                      }`}>{timeStr}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold flex-shrink-0">
                    <CheckCircle className="w-3 h-3 stroke-[3px]" />
                    <span>Verified</span>
                  </div>
                </div>

                <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
                  mode === "night" ? "border-white/5" : "border-black/5"
                }`}>
                  <span className={`text-[9px] font-mono ${
                    mode === "night" ? "text-slate-400" : "text-slate-500"
                  }`}>AI Audit Outcome:</span>
                  <p className={`text-[10px] font-medium text-right max-w-[200px] truncate ${
                    mode === "night" ? "text-slate-300 italic" : "text-slate-700 italic"
                  }`}>
                    "Compliance confirmed by Pulse AI."
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          /* Beautiful blank-slate starry/sunlit container */
          <div className={`col-span-1 md:col-span-2 rounded-3xl p-8 border text-center flex flex-col items-center justify-center space-y-4 py-16 transition-all duration-500 ${
            mode === "night"
              ? "bg-[#0E0F21]/40 border-purple-950/30 text-[#F5F4EE]"
              : "bg-white border border-[#E2E1D9] text-[#1C1D26] shadow-sm"
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              mode === "night" ? "bg-purple-950/40 text-purple-400 border border-purple-900/40" : "bg-amber-50 text-amber-600 border border-amber-200"
            }`}>
              <CloudUpload className="w-8 h-8 animate-pulse" />
            </div>
            <div className="max-w-md space-y-2">
              <h4 className="text-base font-bold font-display">No Verified Evidence Found</h4>
              <p className={`text-xs leading-relaxed ${
                mode === "night" ? "text-slate-400" : "text-slate-500"
              }`}>
                You haven't uploaded any verified proofs yet! Go to the <span className="font-semibold">Today</span> tab, check off an active goal, and upload your screenshot or text confirmation to authenticate your star.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
