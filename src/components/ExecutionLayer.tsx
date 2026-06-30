import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, X, AlertOctagon, Sparkles, Coffee, ArrowRight, EyeOff } from "lucide-react";
import { Task, InactivityRecord } from "../types";
import Atmosphere from "./Atmosphere";

interface ExecutionLayerProps {
  task: Task;
  onComplete: (focusTimeSpent: number, inactivityLog: InactivityRecord[]) => void;
  onCancel: () => void;
  tasks?: Task[];
}

export default function ExecutionLayer({ task, onComplete, onCancel, tasks = [] }: ExecutionLayerProps) {
  const [duration, setDuration] = useState(task.estimatedDuration); // in minutes
  const [timeLeft, setTimeLeft] = useState(task.estimatedDuration * 60); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [inBreak, setInBreak] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(10 * 60); // 10 minutes in seconds

  // Tab distraction tracking
  const [isDistracted, setIsDistracted] = useState(false);
  const [distractionComment, setDistractionComment] = useState("");
  const [inactivityRecords, setInactivityRecords] = useState<InactivityRecord[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tabAwayTimeRef = useRef<number | null>(null);

  // Synchronize timeLeft with duration choice before starting
  useEffect(() => {
    if (!isRunning && !isCompleted) {
      setTimeLeft(duration * 60);
    }
  }, [duration]);

  // Main timer tick
  useEffect(() => {
    if (isRunning && !isCompleted) {
      if (inBreak) {
        timerRef.current = setInterval(() => {
          setBreakTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current!);
              // Automatically switch back to next task focus
              setInBreak(false);
              setIsRunning(true);
              return 10 * 60;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current!);
              handleTaskFinished();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, inBreak, isCompleted]);

  // Distraction tab checking (Visibility API)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!isRunning || isCompleted) return;

      if (document.hidden) {
        // User left the tab
        tabAwayTimeRef.current = Date.now();
      } else {
        // User came back
        if (tabAwayTimeRef.current) {
          const secondsAway = Math.round((Date.now() - tabAwayTimeRef.current) / 1000);
          tabAwayTimeRef.current = null;

          if (secondsAway >= 3) {
            // Significant distraction
            setIsRunning(false);
            setIsDistracted(true);
            setDistractionComment("Fetching my sarcastic opinion of your tab-switching habit...");

            try {
              const res = await fetch("/api/gemini/inactivity-comment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  taskTitle: task.title,
                  inactiveDuration: secondsAway
                })
              });
              const contentType = res.headers.get("content-type");
              if (!res.ok || !contentType || !contentType.includes("application/json")) {
                throw new Error(`Server returned status ${res.status}`);
              }
              const data = await res.json();
              if (data.comment) {
                setDistractionComment(data.comment);
                // Record to logs
                const newRecord: InactivityRecord = {
                  timestamp: new Date().toISOString(),
                  duration: secondsAway,
                  comment: data.comment
                };
                setInactivityRecords((prev) => [...prev, newRecord]);
              }
            } catch (err) {
              console.error(err);
              setDistractionComment(`That quick check somehow lasted ${Math.round(secondsAway / 60)} minutes.`);
            }
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRunning, isCompleted, task.title]);

  const handleTaskFinished = () => {
    setIsCompleted(true);
    setIsRunning(false);
  };

  const handleStartNextTask = () => {
    const totalTimeSpent = duration * 60 - timeLeft;
    onComplete(totalTimeSpent, inactivityRecords);
  };

  const handleTakeBreak = () => {
    setInBreak(true);
    setBreakTimeLeft(10 * 60); // Start 10 min break
  };

  // SVG circular calculations
  const totalSeconds = inBreak ? 10 * 60 : duration * 60;
  const currentSecondsLeft = inBreak ? breakTimeLeft : timeLeft;
  const progressRatio = currentSecondsLeft / totalSeconds;
  const strokeDashoffset = 2 * Math.PI * 90 * (1 - progressRatio);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col items-center justify-start md:justify-center bg-[#0A0C18] text-[#F5F4EE] p-6 md:p-8 select-none">
      {/* Background Layer: Data-driven live night skyline */}
      <Atmosphere timeOfDay="night" tasks={tasks} />

      {/* Top Controls */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <div className="w-2 h-2 rounded-full bg-[#F5F4EE] animate-pulse" />
          <span className="text-[10px] font-mono text-slate-300 uppercase tracking-widest">
            {inBreak ? "Break Active" : "Deep Focus Mode"}
          </span>
        </div>
        {!isCompleted && (
          <button
            onClick={onCancel}
            className="p-2 text-slate-300 hover:text-white bg-white/5 border border-white/10 rounded-full transition-all cursor-pointer backdrop-blur-md"
            title="Exit Focus Mode"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Active Focus Display */}
      <AnimatePresence mode="wait">
        {!isCompleted ? (
          <motion.div
            key="timer"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center text-center max-w-xl w-full my-auto py-12"
          >
            {/* Task Meta */}
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono uppercase tracking-widest text-slate-300 mb-2 backdrop-blur-md">
              {task.category || "Study"}
            </span>
            <h2 className="font-display font-bold text-2xl md:text-4xl text-white mb-8 max-w-lg leading-tight">
              {task.title}
            </h2>

            {/* Circular Timer Display */}
            <div className="relative w-64 h-64 md:w-72 md:h-72 mb-8 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="90"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="90"
                  fill="none"
                  stroke="#F5F4EE"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 90}
                  strokeDashoffset={strokeDashoffset}
                  transition={{ ease: "linear" }}
                />
              </svg>

              <div className="flex flex-col items-center">
                <span className="font-mono text-4xl md:text-5xl font-bold tracking-tight text-white select-all">
                  {formatTime(currentSecondsLeft)}
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-1">
                  {isRunning ? (inBreak ? "relax" : "focusing") : "paused"}
                </span>
              </div>
            </div>

            {/* Duration Selector (Only shown if NOT running yet) */}
            {!isRunning && timeLeft === duration * 60 && !inBreak && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 w-full max-w-xs"
              >
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                  Commit Focus Duration
                </label>
                <div className="flex justify-around bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                  {[15, 25, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setDuration(mins)}
                      className={`px-4 py-2 text-xs font-mono rounded-xl transition-all cursor-pointer ${
                        duration === mins
                          ? "bg-white/10 text-white font-semibold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Inactivity Alert Overlay */}
            <AnimatePresence>
              {isDistracted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-32 left-6 right-6 md:left-auto md:right-12 md:max-w-md bg-[#0C0E1C]/90 border border-white/10 backdrop-blur-md p-5 rounded-3xl shadow-2xl flex flex-col items-start text-left z-30"
                >
                  <div className="flex items-center space-x-2 text-slate-300 font-mono text-[10px] uppercase tracking-widest mb-2">
                    <AlertOctagon className="w-4 h-4 text-slate-400 animate-bounce" />
                    <span>Distraction Flagged</span>
                  </div>
                  <p className="text-xs text-slate-300 italic mb-4 leading-relaxed font-serif">
                    "{distractionComment}"
                  </p>
                  <button
                    onClick={() => {
                      setIsDistracted(false);
                      setIsRunning(true);
                    }}
                    className="px-4 py-2 bg-[#F5F4EE] text-[#0A0C18] hover:bg-white rounded-xl text-xs font-semibold cursor-pointer self-end transition-all"
                  >
                    I'm focused, resume timer
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Play / Pause Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-8 py-4 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer flex items-center space-x-2 ${
                  isRunning
                    ? "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                    : "bg-[#F5F4EE] text-[#0A0C18] hover:bg-white"
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Timer</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Focus Session</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          /* Celebration View when completed - ONLY two options to prevent decision fatigue */
          <motion.div
            key="celebration"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center max-w-md my-auto py-12"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>

            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Task Completed!</span>
            <h2 className="font-display font-bold text-2xl text-white mt-2 mb-3">
              Spectacular work.
            </h2>
            <p className="text-slate-300 text-sm mb-10 leading-relaxed italic font-serif">
              "Nice. Future You is officially less stressed. Your focus streak has been updated in database."
            </p>

            {/* Two decision-fatigue-free choices */}
            <div className="w-full space-y-4">
              <button
                onClick={handleStartNextTask}
                className="w-full py-4 bg-[#F5F4EE] hover:bg-white text-[#0A0C18] rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center space-x-2 cursor-pointer group"
              >
                <span>Start Next Task</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleTakeBreak}
                disabled={inBreak}
                className={`w-full py-4 rounded-full font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  inBreak
                    ? "bg-white/10 border border-white/20 text-white"
                    : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                }`}
              >
                <Coffee className="w-4 h-4" />
                <span>
                  {inBreak
                    ? `Break Active (${formatTime(breakTimeLeft)})`
                    : "Take 10 Minute Break"}
                </span>
              </button>
            </div>

            {inBreak && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-[10px] font-mono text-slate-500"
              >
                Break will automatically complete and cycle back. Feel free to stretch.
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
