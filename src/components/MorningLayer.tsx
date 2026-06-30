import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Flame, AlertTriangle, ArrowRight, BookOpen, Volume2, VolumeX, Clock, CheckCircle2, Sparkles, User, Lightbulb } from "lucide-react";
import { DailyBriefing, Task, Journal, BehaviorPattern } from "../types";
import Atmosphere from "./Atmosphere";
import InputLayer from "./InputLayer";

const MountainBanner = ({ isNight }: { isNight: boolean }) => {
  return (
    <div className={`relative w-full h-40 overflow-hidden ${
      isNight ? "bg-gradient-to-b from-[#110F24] to-[#18162D]" : "bg-gradient-to-b from-[#1D160D] to-[#2B2014]"
    }`}>
      {isNight ? (
        <>
          {/* Stars */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-4 left-8 w-1 h-1 bg-white rounded-full animate-pulse" />
            <div className="absolute top-8 left-24 w-1 h-1 bg-white rounded-full" />
            <div className="absolute top-3 right-1/4 w-0.5 h-0.5 bg-white rounded-full" />
            <div className="absolute top-12 left-1/3 w-1 h-1 bg-white rounded-full" />
            <div className="absolute top-6 right-10 w-1 h-1 bg-white rounded-full animate-pulse" />
          </div>
          {/* Silver Moon */}
          <div className="absolute top-6 right-12 w-10 h-10 rounded-full bg-[#EAE8F0] shadow-[0_0_12px_rgba(234,232,240,0.6)]" />
          {/* Mountains */}
          <svg className="absolute bottom-0 w-full h-24 text-[#0B0A12]" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points="0,100 25,30 50,100" fill="currentColor" opacity="0.4" />
            <polygon points="30,100 65,40 100,100" fill="currentColor" opacity="0.6" />
            <polygon points="10,100 45,50 80,100" fill="currentColor" />
          </svg>
        </>
      ) : (
        <>
          {/* Golden Sun */}
          <div className="absolute top-6 right-12 w-12 h-12 rounded-full bg-[#E0A343] shadow-[0_0_15px_rgba(224,163,67,0.6)]" />
          {/* Mountains */}
          <svg className="absolute bottom-0 w-full h-24 text-[#0F0E0D]" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points="0,100 25,35 50,100" fill="currentColor" opacity="0.4" />
            <polygon points="30,100 65,45 100,100" fill="currentColor" opacity="0.6" />
            <polygon points="10,100 45,55 80,100" fill="currentColor" />
          </svg>
        </>
      )}
      {/* Centered Focus Blocks */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1 pointer-events-none z-10">
        <div className="w-7 h-11 bg-[#E0A343] border border-white/5 shadow-md rounded-sm" />
        <div className="w-7 h-11 bg-[#8C6F41] border border-white/5 shadow-md rounded-sm opacity-80" />
      </div>
    </div>
  );
};

interface MorningLayerProps {
  userName: string;
  briefing: DailyBriefing | null;
  onClose: () => void;
  timeOfDay: "morning" | "day" | "night";
  tasks?: Task[];
  journals: Journal[];
  behaviorPatterns: BehaviorPattern[];
  onTasksAdded: (newTasks: Omit<Task, "id" | "userId" | "createdAt" | "completed" | "focusTimeSpent">[]) => void;
}

export default function MorningLayer({
  userName,
  briefing,
  onClose,
  timeOfDay,
  tasks = [],
  journals,
  behaviorPatterns,
  onTasksAdded
}: MorningLayerProps) {
  const [step, setStep] = useState<"greeting" | "insights" | "dump">("insights");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const isNight = timeOfDay === "night";

  // Update current time live
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeakBriefing = () => {
    if (!window.speechSynthesis) {
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if (!briefing) return;

    const textToSpeak = `
      Briefing for today.
      ${briefing.greeting}
      Your workload status: ${briefing.workloadSummary}
      Your high priority focus: ${briefing.suggestedFirstTask}.
      Yesterday, your journal showed: ${briefing.yesterdayJournalInsight}.
      And here is our behavioral observation: ${briefing.skipPredictionWarning}.
    `;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    utterance.onend = () => {
      setIsPlayingAudio(false);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  if (!briefing) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center p-8 space-y-4 text-center min-h-[60vh]">
        <Atmosphere timeOfDay={timeOfDay} tasks={tasks} />
        <div className="relative z-10 flex flex-col items-center space-y-4">
          <div className={`w-12 h-12 rounded-full border-2 border-t-[#F5F4EE] animate-spin ${
            isNight ? "border-white/10" : "border-slate-200"
          }`} />
          <p className={`font-mono text-xs ${isNight ? "text-slate-400" : "text-slate-500"}`}>
            Assembling your comprehensive overview...
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer border border-white/5 transition-colors"
          >
            Skip & Open Workspace
          </button>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const todayDateStr = new Date().toDateString();
  const todayTasks = tasks.filter(t => new Date(t.createdAt).toDateString() === todayDateStr);

  // Time-of-day specific greeting title
  const getGreetingTitle = () => {
    if (timeOfDay === "morning") return `Morning, ${userName}`;
    if (timeOfDay === "day") return `Good Afternoon, ${userName}`;
    return `Evening, ${userName}`;
  };

  return (
    <div className={`relative w-full min-h-screen flex flex-col items-center justify-center py-10 px-4 md:px-8 overflow-x-hidden transition-colors duration-500 ${
      isNight ? "bg-[#0A0910] text-[#F2F0FA]" : "bg-[#0C0B0A] text-[#FAF9F6]"
    }`}>
      {/* Dynamic atmospheric layer */}
      <Atmosphere timeOfDay={timeOfDay} tasks={tasks} />

      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center space-y-6">
        <AnimatePresence mode="wait">
          
          {/* STEP 2: INSIGHTS SCREEN */}
          {step === "insights" && (
            <motion.div
              key="insights-step"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`w-full max-w-2xl p-6 md:p-10 rounded-[32px] shadow-2xl space-y-6 transition-all duration-500 border ${
                isNight
                  ? "bg-[#111019] border-[#24223A] text-[#F2F0FA]"
                  : "bg-[#121110] border-[#24211D] text-[#FAF9F6]"
              }`}
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                  <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                    isNight ? "text-[#9F8AF6]" : "text-[#E0A343]"
                  }`}>Calculated Vectors</span>
                  <h2 className="font-display font-black text-xl mt-0.5 text-white">Your Daily Insights</h2>
                </div>

                <button
                  onClick={handleSpeakBriefing}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                    isPlayingAudio
                      ? isNight
                        ? "bg-[#9F8AF6]/20 border-[#9F8AF6]/40 text-[#9F8AF6] animate-pulse"
                        : "bg-[#E0A343]/20 border-[#E0A343]/40 text-[#E0A343] animate-pulse"
                      : isNight
                        ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                        : "bg-[#E0A343]/10 border-[#E0A343]/20 text-[#E0A343] hover:bg-[#E0A343]/25"
                  }`}
                >
                  {isPlayingAudio ? (
                    <>
                      <VolumeX className="w-3 h-3" />
                      <span>Silence Overview</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3" />
                      <span>Read Aloud</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sarcastic / analytical insights content */}
              <div className="space-y-5">
                
                {/* Greeting centerpiece */}
                <div className={`p-4 border rounded-2xl ${
                  isNight ? "bg-[#151422] border-[#24223E]" : "bg-[#161412] border-[#262320]"
                }`}>
                  <p className="font-serif text-base md:text-lg font-light italic leading-relaxed text-center text-[#FAF9F6]">
                    "{briefing.greeting}"
                  </p>
                </div>

                {/* Workload */}
                <div className="space-y-1 text-left">
                  <span className={`text-[9px] font-mono uppercase tracking-widest block font-bold ${
                    isNight ? "text-[#9F8AF6]" : "text-[#E0A343]"
                  }`}>Yesterday's Analysis</span>
                  <p className={`text-xs leading-relaxed rounded-xl p-3 border ${
                    isNight ? "bg-[#151422] border-[#24223E] text-slate-300" : "bg-[#161412] border-[#262320] text-slate-300"
                  }`}>
                    {briefing.workloadSummary}
                  </p>
                </div>

                {/* Prime recommendation */}
                <div className={`p-4 border-l-2 rounded-r-2xl space-y-1 border text-left ${
                  isNight 
                    ? "bg-[#19152C]/60 border-[#2D2258]/60 border-l-[#9F8AF6]" 
                    : "bg-[#1E1711]/60 border-[#3D2C1D]/60 border-l-[#E0A343]"
                }`}>
                  <div className="flex items-center space-x-1.5">
                    <Flame className={`w-3.5 h-3.5 ${isNight ? "text-[#9F8AF6]" : "text-[#E0A343]"}`} />
                    <span className={`text-[9px] font-mono uppercase tracking-widest font-bold ${
                      isNight ? "text-[#9F8AF6]" : "text-[#E0A343]"
                    }`}>Prime Recommendation</span>
                  </div>
                  <h3 className="font-display font-black text-sm mt-1 text-white">
                    {briefing.suggestedFirstTask}
                  </h3>
                  <p className="text-[10px] leading-relaxed text-slate-400">
                    Tackling this specific focus block first will maximize momentum and help prevent later-day procrastination.
                  </p>
                </div>

                {/* Predictive risk warnings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className={`p-3.5 rounded-xl space-y-1.5 border ${
                    isNight ? "bg-[#151422] border-[#24223E]" : "bg-[#161412] border-[#262320]"
                  }`}>
                    <div className={`flex items-center space-x-1.5 text-[9px] font-mono uppercase tracking-widest font-bold ${
                      isNight ? "text-[#9F8AF6]" : "text-[#E0A343]"
                    }`}>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Procrastination Check</span>
                    </div>
                    <p className="text-xs italic font-serif leading-relaxed text-slate-300">
                      "{briefing.skipPredictionWarning}"
                    </p>
                  </div>

                  <div className={`p-3.5 rounded-xl space-y-1.5 border ${
                    isNight ? "bg-[#151422] border-[#24223E]" : "bg-[#161412] border-[#262320]"
                  }`}>
                    <div className={`flex items-center space-x-1.5 text-[9px] font-mono uppercase tracking-widest font-bold ${
                      isNight ? "text-[#9F8AF6]" : "text-[#E0A343]"
                    }`}>
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                      <span>Yesterday's Echo</span>
                    </div>
                    <p className="text-xs italic font-serif leading-relaxed text-slate-300">
                      "{briefing.yesterdayJournalInsight}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress buttons */}
              <div className="pt-4 flex items-center justify-end border-t border-white/5">
                <button
                  onClick={() => setStep("dump")}
                  id="btn-insights-proceed"
                  className="flex items-center space-x-2 px-6 py-3 bg-[#E0A343] hover:bg-[#F3BE65] active:scale-95 text-[#0A0A0A] rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-[#E0A343]/10"
                >
                  <span>Begin Planning Session</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: MIND DUMP & PLANNER SCREEN */}
          {step === "dump" && (
            <motion.div
              key="dump-step"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`w-full max-w-3xl p-6 md:p-8 rounded-[32px] shadow-2xl space-y-6 transition-all duration-500 border text-left ${
                isNight
                  ? "bg-[#111019] border-[#24223A]"
                  : "bg-[#121110] border-[#24211D]"
              }`}
            >
              <div>
                <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                  isNight ? "text-[#9F8AF6]" : "text-[#E0A343]"
                }`}>Active Setup</span>
                <h3 className="font-display font-black text-xl mt-0.5 text-white">Plan Your Day</h3>
                <p className="text-xs mt-1 leading-relaxed text-slate-400">
                  Outline your agenda in natural language. Pulse automatically indexes your previous journals and flags past skipped focus blocks immediately in the background.
                </p>
              </div>

              {/* Interactive Chat/Mind-Dump Box */}
              <div className={`border p-1 rounded-2xl ${
                isNight ? "border-[#24223A] bg-[#151422]" : "border-[#24211D] bg-[#161412]"
              }`}>
                <InputLayer
                  onTasksAdded={onTasksAdded}
                  journals={journals}
                  behaviorPatterns={behaviorPatterns}
                />
              </div>

              {/* Scheduled Blocks Today Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                    isNight ? "text-[#9F8AF6]" : "text-[#E0A343]"
                  }`}>Scheduled Blocks Today</span>
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full ${
                    isNight ? "bg-[#24223A] text-[#9F8AF6]" : "bg-[#262320] text-[#E0A343]"
                  }`}>
                    {todayTasks.length} Loaded
                  </span>
                </div>

                <div className={`border rounded-2xl p-4 min-h-[160px] max-h-[260px] overflow-y-auto space-y-2 ${
                  isNight ? "bg-[#151422] border-[#24223E]" : "bg-[#161412] border-[#262320]"
                }`}>
                  <AnimatePresence initial={false}>
                    {todayTasks.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center text-center py-6"
                      >
                        <p className="text-xs font-mono text-slate-500">No blocks registered yet. Use the dump box above to outline your schedule.</p>
                      </motion.div>
                    ) : (
                      todayTasks.map((t) => {
                        const priorityColor =
                          t.priority === "high"
                            ? "border-red-500/30 text-red-400 bg-red-500/10"
                            : t.priority === "medium"
                            ? "border-amber-500/30 text-amber-500 bg-amber-500/10"
                            : "border-blue-500/30 text-blue-400 bg-blue-500/10";

                        return (
                          <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            layout
                            className={`p-3 border rounded-xl flex items-center justify-between space-x-3 transition-colors ${
                              isNight 
                                ? "bg-[#1E1C2F]/70 border-white/5 text-white" 
                                : "bg-[#1F1C18]/70 border-white/5 text-white"
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <CheckCircle2 className="w-4 h-4 shrink-0 text-slate-500" />
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold truncate text-white">{t.title}</h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${
                                    isNight ? "bg-white/10 text-slate-300" : "bg-white/10 text-slate-300"
                                  }`}>
                                    {t.category}
                                  </span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase border ${priorityColor}`}>
                                    {t.priority}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1.5 font-mono text-[10px] shrink-0 text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>{t.estimatedDuration}m</span>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Action Close/Proceed button */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  onClick={() => setStep("insights")}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Back to Insights
                </button>

                <button
                  onClick={onClose}
                  id="btn-lock-schedule-proceed"
                  className="flex items-center space-x-2 px-6 py-3 bg-[#E0A343] hover:bg-[#F3BE65] active:scale-95 text-[#0A0A0A] rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#E0A343]/10 group"
                >
                  <span>Commit Plan & Open Workspace</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
