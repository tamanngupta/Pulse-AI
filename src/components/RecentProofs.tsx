import React from "react";
import { Task } from "../types";
import { CheckCircle2, Award, Calendar, ExternalLink } from "lucide-react";

interface RecentProofsProps {
  tasks: Task[];
  onViewAll?: () => void;
}

export default function RecentProofs({ tasks, onViewAll }: RecentProofsProps) {
  // Filter tasks completed today that require proof, or just generally completed tasks
  const completedTasks = tasks
    .filter(t => t.completed)
    .slice(0, 3); // Get the 3 most recent

  return (
    <div id="recent-proofs" className="relative w-full rounded-3xl p-5 border border-purple-950/30 bg-[#0E0F21]/40 backdrop-blur-md flex flex-col justify-between min-h-[220px]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-[11px] font-mono tracking-widest text-purple-400 uppercase font-bold">Recent Proofs</h4>
            <p className="text-[9px] text-slate-300 font-medium">Your evidence-backed victories</p>
          </div>
          {onViewAll && (
            <button 
              onClick={onViewAll}
              className="text-[9px] font-mono text-purple-300 hover:text-white flex items-center space-x-0.5 cursor-pointer font-semibold"
            >
              <span>View all</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Gallery List */}
        <div className="space-y-2.5">
          {completedTasks.length > 0 ? (
            completedTasks.map(task => {
              const timeStr = task.completedAt 
                ? new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : "Today";

              // Generate a deterministic gradient class for the mock thumbnail based on task id
              const gradients = [
                "from-violet-600 via-fuchsia-600 to-pink-500",
                "from-cyan-500 via-blue-600 to-indigo-600",
                "from-emerald-500 via-teal-600 to-blue-600",
                "from-amber-500 via-orange-600 to-red-500"
              ];
              const idx = task.title.charCodeAt(0) % gradients.length;
              const gradientClass = gradients[idx];

              return (
                <div 
                  key={task.id} 
                  className="flex items-center space-x-3 bg-purple-950/10 border border-purple-900/10 hover:border-purple-800/20 p-2 rounded-2xl transition-all"
                >
                  {/* Thumbnail Cover or Image */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${gradientClass} flex items-center justify-center text-[10px] font-bold text-white shadow-inner flex-shrink-0 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10" />
                    <span className="relative font-mono">{task.category.substring(0, 2).toUpperCase()}</span>
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <h5 className="text-[11px] font-bold text-[#F5F4EE] truncate leading-snug">
                      {task.title}
                    </h5>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="text-[9px] text-slate-300 font-mono font-medium">{timeStr}</span>
                      <span className="text-[9px] text-purple-200 font-mono bg-purple-950/30 px-1.5 py-0.2 rounded border border-purple-900/40 font-semibold">
                        Verified ✓
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-4 px-3 border border-purple-950/10 bg-[#0E0F21]/10 rounded-2xl min-h-[120px]">
              <div className="w-8 h-8 rounded-xl bg-purple-950/40 border border-purple-900/30 flex items-center justify-center text-purple-400 mb-2">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
              <p className="text-[10px] font-mono text-purple-300 uppercase tracking-wider font-bold">No proofs logged</p>
              <p className="text-[9.5px] text-slate-300 max-w-[210px] mt-1.5 leading-normal font-medium">
                Finish a high-value task, and submit your interactive proof to start building your cosmic gallery.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
