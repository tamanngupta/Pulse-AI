import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Task } from "../types";
import { Sparkles, Star } from "lucide-react";

interface ConstellationMapProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  mode?: "morning" | "night";
}

interface ConstellationNode {
  x: number;
  y: number;
  label: string;
  time?: string;
  isCustomTask: boolean;
  taskRef?: Task;
}

export default function ConstellationMap({ tasks, onTaskClick, mode = "night" }: ConstellationMapProps) {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // Filter for today's tasks
  const todayStr = new Date().toDateString();
  const todayTasks = tasks.filter(t => new Date(t.createdAt).toDateString() === todayStr);
  const completedToday = todayTasks.filter(t => t.completed);

  // Fallback preset nodes if there are no tasks today, to make the constellation look beautiful
  const defaultNodes = [
    { x: 15, y: 70, label: "Morning Run", time: "6:30 AM", isCompleted: true },
    { x: 38, y: 30, label: "DSA Practice", time: "3:00 AM", isCompleted: true },
    { x: 55, y: 80, label: "Python Course", time: "6:00 PM", isCompleted: true },
    { x: 75, y: 45, label: "Read 20 Pages", time: "8:30 PM", isCompleted: true },
    { x: 90, y: 75, label: "Evening Reflection", time: "11:00 PM", isCompleted: false },
  ];

  const nodes: ConstellationNode[] = [];
  
  // Custom coordinate mappings for up to 6 tasks to keep it visually balanced
  const coordinatePresets = [
    { x: 15, y: 70 },
    { x: 38, y: 30 },
    { x: 75, y: 45 },
    { x: 55, y: 80 },
    { x: 90, y: 75 },
    { x: 48, y: 45 },
  ];

  if (todayTasks.length > 0) {
    todayTasks.slice(0, 6).forEach((task, index) => {
      const preset = coordinatePresets[index] || { x: 10 + (index * 15), y: 40 + (index % 2 * 30) };
      const timeStr = task.completedAt 
        ? new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : task.deadline || "Today";
        
      nodes.push({
        x: preset.x,
        y: preset.y,
        label: task.title,
        time: timeStr,
        isCustomTask: true,
        taskRef: task
      });
    });
  }

  // Draw connector lines. We connect nodes sequentially.
  const drawLines = () => {
    const lines: React.ReactNode[] = [];
    if (nodes.length < 2) return lines;
    for (let i = 0; i < nodes.length - 1; i++) {
      const start = nodes[i];
      const end = nodes[i + 1];
      
      // Determine if this connection line is "illuminated" (both end nodes completed)
      let isIlluminated = false;
      if (start.isCustomTask && end.isCustomTask) {
        isIlluminated = !!(start.taskRef?.completed && end.taskRef?.completed);
      }

      const activeColor = mode === "night" ? "#A855F7" : "#D97706";
      const inactiveColor = mode === "night" ? "rgba(168, 85, 247, 0.15)" : "rgba(217, 119, 6, 0.15)";

      lines.push(
        <line
          key={`line-${i}`}
          x1={`${start.x}%`}
          y1={`${start.y}%`}
          x2={`${end.x}%`}
          y2={`${end.y}%`}
          stroke={isIlluminated ? activeColor : inactiveColor}
          strokeWidth={isIlluminated ? "2" : "1"}
          strokeDasharray={isIlluminated ? "0" : "4 4"}
          className="transition-all duration-700"
        />
      );

      // Add elegant secondary glowing line behind active lines
      if (isIlluminated) {
        lines.push(
          <line
            key={`line-glow-${i}`}
            x1={`${start.x}%`}
            y1={`${start.y}%`}
            x2={`${end.x}%`}
            y2={`${end.y}%`}
            stroke={activeColor}
            strokeWidth="6"
            strokeOpacity="0.25"
            className="blur-sm transition-all duration-700"
          />
        );
      }
    }
    return lines;
  };

  return (
    <div id="constellation-card" className={`relative w-full h-[220px] rounded-3xl p-5 overflow-hidden transition-all duration-500 ${
      mode === "night"
        ? "bg-[#0E0F21]/40 border border-purple-950/30 shadow-inner backdrop-blur-md"
        : "bg-white border border-[#E2E1D9] shadow-sm"
    }`}>
      {/* Tiny Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className={`text-[11px] font-mono tracking-widest uppercase ${
            mode === "night" ? "text-purple-400" : "text-amber-700"
          }`}>
            {mode === "night" ? "Tonight's Constellation" : "Today's Constellation"}
          </h4>
          <p className={`text-[9px] ${mode === "night" ? "text-slate-400" : "text-slate-500"}`}>
            {mode === "night" ? "Your progress lights up the night." : "Your progress lights up the day."}
          </p>
        </div>
        <div className={`flex items-center space-x-1 text-[9px] font-mono px-2 py-0.5 rounded-full border ${
          mode === "night" 
            ? "text-purple-300 bg-purple-950/30 border-purple-900/40" 
            : "text-amber-800 bg-amber-50 border-amber-200"
        }`}>
          <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
          <span>{completedToday.length} / {todayTasks.length || 0} Stars</span>
        </div>
      </div>

      {todayTasks.length > 0 ? (
        /* Interactive SVG Canvas */
        <div className="relative w-full h-[150px] mt-1 select-none">
          {/* Draw Starfield background dots */}
          <div className="absolute inset-0 pointer-events-none opacity-25">
            <div className={`absolute top-[10%] left-[25%] w-1 h-1 rounded-full animate-pulse ${mode === "night" ? "bg-white" : "bg-amber-400"}`} />
            <div className={`absolute top-[40%] left-[85%] w-0.5 h-0.5 rounded-full ${mode === "night" ? "bg-white" : "bg-amber-400"}`} />
            <div className={`absolute top-[75%] left-[45%] w-1 h-1 rounded-full animate-pulse ${mode === "night" ? "bg-white" : "bg-amber-400"}`} />
            <div className={`absolute top-[80%] left-[10%] w-0.5 h-0.5 rounded-full ${mode === "night" ? "bg-white" : "bg-amber-400"}`} />
            <div className={`absolute top-[20%] left-[70%] w-1.5 h-1.5 rounded-full opacity-50 ${mode === "night" ? "bg-white" : "bg-amber-400"}`} />
          </div>

          {/* SVG lines */}
          <svg className="absolute inset-0 w-full h-full z-0 overflow-visible">
            {drawLines()}
          </svg>

          {/* Render interactive nodes as HTML buttons overlaid on top */}
          {nodes.map((node, index) => {
            let isCompleted = false;
            if (node.isCustomTask) {
              isCompleted = !!node.taskRef?.completed;
            }

            return (
              <div
                key={`node-${index}`}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                onMouseEnter={() => setHoveredNode(index)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => {
                  if (node.isCustomTask && node.taskRef && onTaskClick) {
                    onTaskClick(node.taskRef);
                  }
                }}
              >
                {/* Star Pulse Core */}
                <div className="relative flex items-center justify-center">
                  {isCompleted ? (
                    <>
                      {/* Ring Pulse */}
                      <span className={`absolute w-5 h-5 rounded-full animate-ping pointer-events-none ${
                        mode === "night" ? "bg-purple-500/20" : "bg-amber-500/20"
                      }`} />
                      <span className={`absolute w-8 h-8 rounded-full blur-sm pointer-events-none ${
                        mode === "night" ? "bg-purple-500/10" : "bg-amber-500/10"
                      }`} />
                      {/* Glowing golden/purple star */}
                      <div className={`w-3.5 h-3.5 border border-white rounded-full flex items-center justify-center hover:scale-125 transition-transform duration-200 ${
                        mode === "night" 
                          ? "bg-purple-400 shadow-[0_0_12px_#A855F7]" 
                          : "bg-amber-500 shadow-[0_0_12px_#F59E0B]"
                      }`}>
                        <Star className="w-2 h-2 text-white fill-current" />
                      </div>
                    </>
                  ) : (
                    // Dormant star
                    <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center hover:scale-125 transition-transform duration-200 ${
                      mode === "night"
                        ? "bg-slate-800 border border-slate-700 hover:border-slate-500"
                        : "bg-slate-200 border border-slate-300 hover:border-slate-400"
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${mode === "night" ? "bg-slate-600" : "bg-slate-400"}`} />
                    </div>
                  )}
                </div>

                {/* Mini tag labels always visible below the star */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-75 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
                  <span className={`text-[8px] font-mono px-1 py-0.5 rounded border ${
                    mode === "night"
                      ? "text-slate-400 bg-[#0E0F21]/80 border-white/5"
                      : "text-slate-600 bg-white/90 border-black/10 shadow-sm"
                  }`}>
                    {node.label.length > 15 ? node.label.substring(0, 13) + ".." : node.label}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Precise, elegant hovering tooltip popover */}
          <AnimatePresence>
            {hoveredNode !== null && nodes[hoveredNode] && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className={`absolute bottom-1 right-2 z-30 pointer-events-none px-3 py-2 rounded-2xl shadow-xl max-w-[180px] border ${
                  mode === "night"
                    ? "bg-[#13142A] border-purple-500/30"
                    : "bg-white border-[#E2E1D9] text-[#1C1D26]"
                }`}
              >
                <div className="flex items-center space-x-1 mb-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    nodes[hoveredNode].taskRef?.completed 
                      ? mode === "night"
                        ? "bg-purple-400 shadow-[0_0_4px_#A855F7]"
                        : "bg-amber-500 shadow-[0_0_4px_#F59E0B]" 
                      : "bg-slate-400"
                  }`} />
                  <span className={`text-[9px] font-mono uppercase tracking-widest ${
                    mode === "night" ? "text-slate-400" : "text-slate-500"
                  }`}>
                    {nodes[hoveredNode].taskRef?.completed 
                      ? "Star Shines" 
                      : "Dormant Node"
                    }
                  </span>
                </div>
                <h5 className={`text-[11px] font-semibold leading-tight truncate ${
                  mode === "night" ? "text-white" : "text-[#1C1D26]"
                }`}>
                  {nodes[hoveredNode].label}
                </h5>
                {nodes[hoveredNode].time && (
                  <p className={`text-[9px] font-mono mt-0.5 ${
                    mode === "night" ? "text-purple-300" : "text-amber-700"
                  }`}>
                    {nodes[hoveredNode].taskRef?.completed
                      ? `Completed at ${nodes[hoveredNode].time}`
                      : `Goal: ${nodes[hoveredNode].time}`
                    }
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* Beautiful blank-slate starry container */
        <div className="relative w-full h-[150px] mt-1 select-none flex flex-col items-center justify-center text-center px-4">
          {/* Decorative starfield background dots */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className={`absolute top-[15%] left-[15%] w-1 h-1 rounded-full animate-pulse ${mode === "night" ? "bg-white" : "bg-amber-400"}`} />
            <div className={`absolute top-[35%] left-[80%] w-0.5 h-0.5 rounded-full ${mode === "night" ? "bg-white" : "bg-amber-400"}`} />
            <div className={`absolute top-[70%] left-[50%] w-1 h-1 rounded-full animate-pulse ${mode === "night" ? "bg-white" : "bg-amber-400"}`} />
            <div className={`absolute top-[80%] left-[20%] w-0.5 h-0.5 rounded-full ${mode === "night" ? "bg-white" : "bg-amber-400"}`} />
            <div className={`absolute top-[25%] left-[75%] w-1 h-1 rounded-full animate-pulse ${mode === "night" ? "bg-white" : "bg-amber-400"}`} />
          </div>
          
          <div className="relative z-10 max-w-sm space-y-1">
            <p className={`text-[10px] font-mono tracking-wider uppercase ${
              mode === "night" ? "text-purple-400" : "text-amber-700"
            }`}>Dormant Canopy</p>
            <p className={`text-[11px] font-serif leading-normal italic ${
              mode === "night" ? "text-slate-300" : "text-slate-600"
            }`}>
              "The sky remains unmapped. To light up your cosmic trajectory, design an active set of targets today."
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
