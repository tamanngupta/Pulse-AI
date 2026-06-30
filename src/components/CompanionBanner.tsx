import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Brain, AlertTriangle, ArrowRight, X, ChevronRight, Zap, Settings } from "lucide-react";
import { Task, Journal, UserProfile, DailyBriefing } from "../types";
import { generateContextualObservations } from "../utils";

interface CompanionBannerProps {
  tasks: Task[];
  journals: Journal[];
  profile: UserProfile | null;
  briefing: DailyBriefing | null;
}

export default function CompanionBanner({ tasks, journals, profile, briefing }: CompanionBannerProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  const observations = generateContextualObservations(tasks, journals, profile);
  const nickname = profile?.name || "friend";

  // Use briefing conclusions as direct context for day planning if available
  if (briefing) {
    observations.planningObservation = briefing.skipPredictionWarning || observations.planningObservation;
    observations.generalInsight = briefing.workloadSummary || observations.generalInsight;
    observations.openingObservation = `Target first: "${briefing.suggestedFirstTask}". ${briefing.yesterdayJournalInsight}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0E101F]/80 backdrop-blur-xl p-5 md:p-6 mb-6 shadow-xl"
    >
      {/* Glow backgrounds */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#2D2B55]/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#E5A93C]/5 rounded-full blur-2xl pointer-events-none" />

      {/* Close button */}
      <button
        onClick={() => setIsOpen(false)}
        className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
        title="Minimize companion advice"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-center space-x-2.5 mb-3">
        <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative">
          <Brain className="w-4 h-4 text-[#F5F4EE] animate-pulse" />
          <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
          Pulse Companion Mind • Proactive Observation
        </span>
      </div>

      {/* Typographic Centerpiece */}
      <div className="space-y-3.5 pr-4">
        <h4 className="font-serif text-sm md:text-base text-[#F5F4EE] italic leading-relaxed">
          "{observations.planningObservation}"
        </h4>

        {/* Dynamic sub-insights list based on history */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex items-start space-x-2.5 text-xs text-slate-300">
            <Zap className="text-amber-400 w-3.5 h-3.5 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-white block">Continuous Memory:</span>
              <p className="text-slate-400 leading-normal text-[11px] mt-0.5">
                {observations.generalInsight}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2.5 text-xs text-slate-300">
            <Settings className="text-sky-400 w-3.5 h-3.5 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-white block">Cognitive Context:</span>
              <p className="text-slate-400 leading-normal text-[11px] mt-0.5">
                {observations.openingObservation}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
