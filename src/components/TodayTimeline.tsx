import React from "react";
import { Task } from "../types";
import { 
  Check, 
  Dumbbell, 
  Code, 
  Book, 
  Video, 
  Phone, 
  Moon, 
  CloudUpload, 
  Circle, 
  Clock, 
  Award 
} from "lucide-react";

interface TodayTimelineProps {
  tasks: Task[];
  mode: "morning" | "night";
  onTriggerProofUpload: (task: Task) => void;
  onToggleComplete: (taskId: string, currentStatus: boolean) => void;
  onLaunchPlanning: () => void;
}

interface TimelineItem {
  id: string;
  title: string;
  time: string;
  category: string;
  completed: boolean;
  priority: string;
  taskRef?: Task;
}

export default function TodayTimeline({ tasks, mode, onTriggerProofUpload, onToggleComplete, onLaunchPlanning }: TodayTimelineProps) {
  // Filter for today's tasks
  const todayStr = new Date().toDateString();
  const todayTasks = tasks.filter(t => new Date(t.createdAt).toDateString() === todayStr);
  const completedCount = todayTasks.filter(t => t.completed).length;

  // Map tasks to a sorted timeline schedule
  const timelineItems: TimelineItem[] = [];

  if (todayTasks.length > 0) {
    todayTasks.forEach(task => {
      // Determine timeline hour/time from deadline or creation time
      let timeStr = "9:00 AM";
      if (task.deadline) {
        timeStr = task.deadline;
      } else {
        const dateObj = new Date(task.createdAt);
        timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      timelineItems.push({
        id: task.id,
        title: task.title,
        time: timeStr,
        category: task.category.toLowerCase(),
        completed: task.completed,
        priority: task.priority,
        taskRef: task
      });
    });
    // Sort timeline items chronologically (simplistic sort or preserve original)
  }

  if (timelineItems.length === 0) {
    return (
      <div 
        className={`relative w-full rounded-3xl p-6 border shadow-lg backdrop-blur-md flex flex-col justify-between min-h-[220px] transition-all duration-500 ${
        mode === "night" 
          ? "bg-[#0E0F21]/40 border-purple-950/30 text-[#F2F0EA]" 
          : "bg-white border-[#E2E1D9] text-slate-950"
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className={`text-[11px] font-mono tracking-widest uppercase font-bold ${mode === "night" ? "text-purple-400" : "text-amber-800"}`}>
              {mode === "night" ? "TODAY'S JOURNEY" : "TODAY'S PLAN"}
            </h4>
            <p className={`text-[9px] font-semibold ${mode === "night" ? "text-slate-300" : "text-slate-800"}`}>
              Calibration status check
            </p>
          </div>
        </div>

        {/* Empty/Blank Slate AI Message */}
        <div className="space-y-4 py-2">
          <div className="flex items-start space-x-3.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-display font-black text-sm shrink-0 ${
              mode === "night" ? "bg-purple-950/40 border border-purple-900/40 text-purple-300" : "bg-orange-100 border border-orange-200 text-orange-900"
            }`}>
              AI
            </div>
            <div className="space-y-1.5 flex-1">
              <h5 className={`text-[12px] font-bold leading-tight ${mode === "night" ? "text-white" : "text-slate-950"}`}>
                Blank Slate Warning
              </h5>
              <p className={`text-[11px] leading-relaxed italic font-serif ${mode === "night" ? "text-slate-200 font-medium" : "text-slate-900 font-semibold"}`}>
                "Having a blank slate is not okay. Empty schedules breed procrastination, distraction, and friction. To unlock your trajectory, we need a clear, intentional set of targets. Let's design a real plan right now."
              </p>
            </div>
          </div>
        </div>
      </div>

        {/* CTA to start planning */}
        <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
          <button
            onClick={onLaunchPlanning}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md active:scale-95 ${
              mode === "night"
                ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/50"
                 : "bg-amber-500 hover:bg-amber-400 text-white shadow-amber-950/30"
            }`}
          >
            Launch Planning Session
          </button>
        </div>
      </div>
    );
  }

  // Helper to retrieve category-specific icon styling and element
  const getTimelineMarker = (category: string, completed: boolean) => {
    let bgClass = "bg-slate-800 border-slate-700 text-slate-400";
    let icon = <Code className="w-3.5 h-3.5" />;

    if (completed) {
      bgClass = mode === "night" ? "bg-purple-500 text-white border-transparent" : "bg-emerald-500 text-white border-transparent";
      icon = <Check className="w-3.5 h-3.5 stroke-[3px]" />;
      return { bgClass, icon };
    }

    switch (category) {
      case "fitness":
      case "workout":
      case "health":
        bgClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-500";
        icon = <Dumbbell className="w-3.5 h-3.5" />;
        break;
      case "development":
      case "coding":
      case "work":
        bgClass = "bg-amber-500/10 border-amber-500/20 text-amber-500";
        icon = <Code className="w-3.5 h-3.5" />;
        break;
      case "learning":
      case "education":
      case "dsa":
      case "study":
        bgClass = "bg-rose-500/10 border-rose-500/20 text-rose-500";
        icon = <Book className="w-3.5 h-3.5" />;
        break;
      case "media":
      case "content":
      case "design":
        bgClass = "bg-sky-500/10 border-sky-500/20 text-sky-500";
        icon = <Video className="w-3.5 h-3.5" />;
        break;
      case "call":
      case "meetings":
      case "marketing":
        bgClass = "bg-violet-500/10 border-violet-500/20 text-violet-500";
        icon = <Phone className="w-3.5 h-3.5" />;
        break;
      case "reflection":
      case "journal":
      case "sleep":
        bgClass = "bg-yellow-500/10 border-yellow-500/20 text-yellow-500";
        icon = <Moon className="w-3.5 h-3.5" />;
        break;
      default:
        bgClass = "bg-slate-700/30 border-slate-600/30 text-slate-400";
        icon = <Clock className="w-3.5 h-3.5" />;
    }

    return { bgClass, icon };
  };

  return (
    <div 
      className={`relative w-full rounded-3xl p-5 border shadow-md backdrop-blur-md flex flex-col justify-between min-h-[220px] transition-all duration-500 ${
        mode === "night" 
          ? "bg-[#0E0F21]/40 border-purple-950/30" 
          : "bg-white border-[#E2E1D9]"
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className={`text-[11px] font-mono tracking-widest uppercase font-bold ${mode === "night" ? "text-purple-400" : "text-amber-800"}`}>
              {mode === "night" ? "TODAY'S JOURNEY" : "TODAY'S PLAN"}
            </h4>
            <p className={`text-[9px] font-semibold ${mode === "night" ? "text-slate-300" : "text-slate-800"}`}>
              {mode === "night" ? "Your progress lights up the night." : "Your journey for today"}
            </p>
          </div>
          <div className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
            mode === "night" 
              ? "bg-purple-950/40 border-purple-900/40 text-purple-200 font-bold" 
              : "bg-orange-100 text-orange-900 border-orange-200 font-bold"
          }`}>
            {todayTasks.length > 0 
              ? `${completedCount} / ${todayTasks.length} completed` 
              : "4 / 6 completed"
            }
          </div>
        </div>

        {/* Vertical Timeline list */}
        <div className="relative pl-6 space-y-4">
          {/* Vertical line connector */}
          <div className={`absolute top-2 bottom-2 left-[10px] w-0.5 border-l border-dashed ${
            mode === "night" ? "border-purple-950/40" : "border-orange-300"
          }`} />

          {timelineItems.map((item, index) => {
            const marker = getTimelineMarker(item.category, item.completed);
            
            // Replicates the "Finish Landing Page" specific upload button card from the Night Mode mockup
            const showUploadCard = mode === "night" && !item.completed && (item.priority === "high" || index === 3);

            return (
              <div key={item.id} className="relative group">
                {/* Connector dot */}
                <div className={`absolute -left-[22px] top-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${marker.bgClass}`}>
                  {marker.icon}
                </div>

                {/* Details Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 pl-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-mono font-bold ${mode === "night" ? "text-slate-400" : "text-slate-700"}`}>
                        {item.time}
                      </span>
                      {item.priority === "high" && (
                        <span className="text-[7px] uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/20 px-1 py-0.1 rounded font-mono font-bold">
                          Core Focus
                        </span>
                      )}
                    </div>
                    
                    {/* Title */}
                    <h5 className={`text-xs font-bold leading-snug truncate mt-0.5 ${
                      item.completed 
                        ? "line-through text-slate-500 font-normal" 
                        : mode === "night" ? "text-white" : "text-slate-950"
                    }`}>
                      {item.title}
                    </h5>
                  </div>

                  {/* Complete check trigger or simple bullet */}
                  {!item.completed && !showUploadCard && (
                    <button
                      onClick={() => item.taskRef && onToggleComplete(item.id, item.completed)}
                      className="text-slate-500 hover:text-emerald-500 transition-colors cursor-pointer mr-1 md:self-center self-start animate-pulse"
                      title="Quick check off"
                    >
                      <Circle className={`w-4 h-4 ${mode === "night" ? "text-slate-300 hover:text-emerald-400" : "text-slate-700 hover:text-emerald-600"}`} />
                    </button>
                  )}
                </div>

                {/* Night-mode specific proof upload box */}
                {showUploadCard && (
                  <div className="mt-2 ml-1 p-3 bg-purple-950/20 border border-purple-900/30 rounded-2xl flex items-center justify-between gap-3 shadow-inner">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-purple-200">Requires Proof Verification</p>
                      <p className="text-[8px] font-medium text-slate-300 truncate mt-0.5">Upload visual proof to verify and claim star</p>
                    </div>
                    <button
                      onClick={() => {
                        if (item.taskRef) {
                          onTriggerProofUpload(item.taskRef);
                        } else {
                          // Allow mock upload experience for fallbacks
                          alert("Aesthetic mode: This is a fallback mockup item. Add real tasks to test the full AI proof verification flow!");
                        }
                      }}
                      className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl text-[9px] font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
                    >
                      <CloudUpload className="w-3 h-3" />
                      <span>Upload proof</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
