import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, ArrowLeft, Clock, Moon, Flame, Zap, CheckCircle2, Sun, Settings } from "lucide-react";
import { UserProfile } from "../types";

interface OnboardingProps {
  userId: string;
  onComplete: (profile: UserProfile) => void;
}

export default function Onboarding({ userId, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);

  // Form states
  const [name, setName] = useState("");
  const [preferredPlanningTime, setPreferredPlanningTime] = useState<"morning" | "night" | "custom">("morning");
  const [customPlanningTime, setCustomPlanningTime] = useState("08:00");
  const [planType, setPlanType] = useState<"current" | "next">("current");
  const [productiveHours, setProductiveHours] = useState("09:00 - 13:00");
  const [bedtime, setBedtime] = useState("23:00");
  const [dailyTaskGoal, setDailyTaskGoal] = useState<number>(4);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (step === 0 && !name.trim()) return;
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const profileObj: UserProfile = {
      name: name.trim() || "Champion",
      preferredPlanningTime,
      planType,
      productiveHours,
      bedtime,
      dailyTaskGoal: Number(dailyTaskGoal) || 4,
      onboardingCompleted: true,
      streak: 0,
    };

    if (preferredPlanningTime === "custom") {
      profileObj.customPlanningTime = customPlanningTime;
    }

    // Give it a tiny cinematic delay for "recalibrating core"
    setTimeout(() => {
      onComplete(profileObj);
      setIsSubmitting(false);
    }, 1500);
  };

  const stepsCount = 6;

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A12] flex flex-col justify-center items-center p-6 text-[#F5F4EE] overflow-y-auto">
      {/* Background ambient noise/glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1D1C3D]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#2B231B]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-[#0E101F]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-white/5">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Pulse Calibration — Step {step + 1} of {stepsCount}
          </span>
          <div className="flex space-x-1">
            {[...Array(stepsCount)].map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= step ? "w-4 bg-white" : "w-1.5 bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-display font-semibold text-xl md:text-2xl text-white">
                  First, what's your nickname?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  I need a name to address you when you skip tasks. It helps make my sarcastic comments highly personalized.
                </p>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maverick, Neo, Sleepy coder"
                  className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-white/30 text-white placeholder-slate-600 font-sans"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && name.trim() && handleNext()}
                />
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="font-display font-semibold text-xl md:text-2xl text-white">
                  When do we plan your schedule?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pulse will automatically spin up a dedicated Daily Planning Session at this hour. This planning session will act as the command center for your day.
                </p>
              </div>              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setPreferredPlanningTime("morning")}
                  className={`p-4 rounded-2xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                    preferredPlanningTime === "morning"
                      ? "bg-white/10 border-white/30 text-white"
                      : "bg-white/2 border-white/5 text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase font-mono tracking-wider text-white">Morning Routine</p>
                    <p className="text-[11px] text-slate-400 mt-1">Start fresh. Standard session scheduled at 08:00 AM.</p>
                  </div>
                  <Sun className="w-5 h-5 text-amber-400" />
                </button>
 
                <button
                  type="button"
                  onClick={() => setPreferredPlanningTime("night")}
                  className={`p-4 rounded-2xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                    preferredPlanningTime === "night"
                      ? "bg-white/10 border-white/30 text-white"
                      : "bg-white/2 border-white/5 text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase font-mono tracking-wider text-white">Night Owl Prep</p>
                    <p className="text-[11px] text-slate-400 mt-1">Get ready the night before. Session scheduled at 09:30 PM.</p>
                  </div>
                  <Moon className="w-5 h-5 text-indigo-400" />
                </button>
 
                <button
                  type="button"
                  onClick={() => setPreferredPlanningTime("custom")}
                  className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-start cursor-pointer ${
                    preferredPlanningTime === "custom"
                      ? "bg-white/10 border-white/30 text-white"
                      : "bg-white/2 border-white/5 text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <p className="text-xs font-semibold uppercase font-mono tracking-wider text-white">Custom Hour</p>
                    <Settings className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 mb-2">Configure a specific hour that fits your cognitive cycle.</p>
                  {preferredPlanningTime === "custom" && (
                    <input
                      type="time"
                      value={customPlanningTime}
                      onChange={(e) => setCustomPlanningTime(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-[#0A0C18] border border-white/10 rounded-lg text-white font-mono focus:outline-none focus:border-white/30 mt-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="font-display font-semibold text-xl md:text-2xl text-white">
                  When do you map out tasks?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Are we locking in items for today as it begins, or prepping tomorrow's items early?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPlanType("current")}
                  className={`p-5 rounded-2xl text-center border transition-all flex flex-col items-center justify-center space-y-2 cursor-pointer ${
                    planType === "current"
                      ? "bg-white/10 border-white/30 text-white"
                      : "bg-white/2 border-white/5 text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <Zap className="w-6 h-6 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wide">For Current Day</span>
                  <p className="text-[10px] text-slate-500 font-normal leading-relaxed">
                    Map today's tasks in the morning.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPlanType("next")}
                  className={`p-5 rounded-2xl text-center border transition-all flex flex-col items-center justify-center space-y-2 cursor-pointer ${
                    planType === "next"
                      ? "bg-white/10 border-white/30 text-white"
                      : "bg-white/2 border-white/5 text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  <span className="text-xs font-bold uppercase tracking-wide">For Next Day</span>
                  <p className="text-[10px] text-slate-500 font-normal leading-relaxed">
                    Plan tomorrow's battles tonight.
                  </p>
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
                </div>
                <h3 className="font-display font-semibold text-xl md:text-2xl text-white">
                  When is your brain most alive?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  I will map your highest priority focus blocks during this interval to ensure peak cognitive execution.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                    Productive Hours Range
                  </label>
                  <input
                    type="text"
                    value={productiveHours}
                    onChange={(e) => setProductiveHours(e.target.value)}
                    placeholder="e.g. 09:00 - 13:00 or 20:00 - 00:00"
                    className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-white/30 text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                    Target Bedtime
                  </label>
                  <input
                    type="time"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-white/30 text-white font-mono"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-display font-semibold text-xl md:text-2xl text-white">
                  Let's talk realistic output limit.
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  How many high-priority tasks do you realistically complete each day? Be extremely honest with yourself. Let's aim to curb planning bloated agendas.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                  <span className="text-xs text-slate-300">Daily Completion Goal:</span>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setDailyTaskGoal((g) => Math.max(1, g - 1))}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-lg text-white w-6 text-center">
                      {dailyTaskGoal}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDailyTaskGoal((g) => Math.min(10, g + 1))}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <p className="text-[10px] font-mono italic text-slate-500 text-center">
                  "Most humans plan 8 tasks, check off 3, and feel guilty. Let's aim for focus, not friction."
                </p>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center py-6 flex flex-col items-center"
            >
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                <div className="absolute inset-0 rounded-full border-4 border-t-white border-r-white animate-spin" />
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-semibold text-xl text-white">
                  Calibrating Core Memory Engine...
                </h3>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  Warping timelines, embedding sarcasm parameters, and structuring your recurring daily planning routine.
                </p>
              </div>

              <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-4 w-full text-left font-mono text-[10px] text-slate-400 space-y-1">
                <div>
                  Companion Name: <span className="text-white font-bold">Pulse</span>
                </div>
                <div>
                  User Nickname: <span className="text-white font-bold">{name}</span>
                </div>
                <div>
                  Planning Trigger:{" "}
                  <span className="text-white font-bold">
                    {preferredPlanningTime === "custom"
                      ? customPlanningTime
                      : preferredPlanningTime === "morning"
                      ? "08:00 AM"
                      : "09:30 PM"}
                  </span>
                </div>
                <div>
                  Realistic Goal: <span className="text-white font-bold">{dailyTaskGoal} tasks</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons footer */}
        {step < 5 && (
          <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-8 space-x-4">
            {step > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-slate-400 hover:text-white flex items-center space-x-1.5 text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              disabled={step === 0 && !name.trim()}
              onClick={step === 4 ? handleSubmit : handleNext}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-md cursor-pointer ${
                step === 0 && !name.trim()
                  ? "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed"
                  : "bg-[#F5F4EE] text-[#0A0C18] hover:bg-white hover:scale-[1.02]"
              }`}
            >
              <span>{step === 4 ? "Complete Calibration" : "Next"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
