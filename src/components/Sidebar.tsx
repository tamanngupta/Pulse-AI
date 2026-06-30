import React, { useState } from "react";
import { 
  Sparkles, 
  Layers, 
  Calendar, 
  BookOpen, 
  Award, 
  Brain, 
  LogOut, 
  ChevronDown, 
  User,
  Zap,
  Flame,
  Star
} from "lucide-react";
import { UserProfile } from "../types";
import PulseLogo from "./PulseLogo";

interface SidebarProps {
  activeTab: "tasks" | "journal" | "intelligence" | "calendar" | "proofs";
  onTabChange: (tab: "tasks" | "journal" | "intelligence" | "calendar" | "proofs") => void;
  onLaunchPlanning: () => void;
  profile: UserProfile | null;
  userName: string;
  email: string;
  onLogout: () => void;
  mode: "morning" | "night";
}

export default function Sidebar({ 
  activeTab, 
  onTabChange, 
  onLaunchPlanning,
  profile, 
  userName, 
  email, 
  onLogout,
  mode
}: SidebarProps) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const menuItems = [
    { 
      id: "tasks", 
      label: "Today", 
      icon: <Star className="w-4 h-4" />, 
      tab: "tasks" as const 
    },
    { 
      id: "plan", 
      label: "Plan", 
      icon: <Sparkles className="w-4 h-4 text-amber-400" />, 
      action: onLaunchPlanning 
    },
    { 
      id: "calendar", 
      label: "Calendar", 
      icon: <Calendar className="w-4 h-4" />, 
      tab: "calendar" as const 
    },
    { 
      id: "journal", 
      label: "Journal", 
      icon: <BookOpen className="w-4 h-4" />, 
      tab: "journal" as const 
    },
    { 
      id: "proofs", 
      label: "Proofs", 
      icon: <Award className="w-4 h-4" />, 
      tab: "proofs" as const 
    },
    { 
      id: "intelligence", 
      label: "Insights", 
      icon: <Brain className="w-4 h-4" />, 
      tab: "intelligence" as const 
    },
  ];

  return (
    <aside 
      className={`w-[250px] flex-shrink-0 h-screen sticky top-0 py-6 px-4 flex flex-col justify-between border-r select-none transition-all duration-500 z-30 ${
        mode === "night" 
          ? "bg-[#090A15] border-purple-950/20 text-[#F2F0EA]" 
          : "bg-[#F4F3EE] border-[#E2E1D9] text-[#1C1D26]"
      }`}
    >
      {/* Branding Logo */}
      <div>
        <div className="flex items-center space-x-2.5 px-3 mb-8">
          <PulseLogo className="w-6 h-6 rounded-md" isNight={mode === "night"} />
          <span className={`font-display font-extrabold text-2xl tracking-tight flex items-center gap-1.5 ${
            mode === "night" ? "text-white" : "text-[#1C1D26]"
          }`}>
            pulse
            <span className={`text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded ml-1 border ${
              mode === "night"
                ? "bg-purple-950/40 border-purple-900/30 text-purple-400"
                : "bg-amber-100 border-amber-200 text-amber-700"
            }`}>
              ai
            </span>
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {menuItems.map(item => {
            const isActive = item.tab && activeTab === item.tab;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else if (item.tab) {
                    onTabChange(item.tab);
                  }
                }}
                className={`w-full flex items-center space-x-3.5 px-3 py-2.5 rounded-2xl text-[12px] font-semibold transition-all cursor-pointer relative ${
                  isActive 
                    ? mode === "night"
                      ? "bg-purple-950/40 text-white border border-purple-900/40 shadow-sm shadow-purple-950/20"
                      : "bg-[#EAE8DE] text-[#1C1D26] border border-[#D3D1C5] shadow-sm shadow-black/5"
                    : mode === "night"
                      ? "text-slate-400 hover:text-white hover:bg-white/5"
                      : "text-slate-600 hover:text-[#1C1D26] hover:bg-black/5"
                }`}
              >
                {/* Active side indicator */}
                {isActive && (
                  <div className={`absolute left-0 w-1 h-5 rounded-r-full -translate-x-3 ${mode === "night" ? "bg-purple-400" : "bg-amber-600"}`} />
                )}
                
                <span className={`${isActive ? (mode === "night" ? "text-purple-400" : "text-amber-600") : "text-slate-500"}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Section: Streak Card + Profile Trigger */}
      <div className="space-y-5">
        {/* STREAK Card */}
        <div className={`rounded-2xl p-4 border transition-all duration-500 ${
          mode === "night" 
            ? "bg-[#0E0F21]/60 border-purple-950/30" 
            : "bg-white border-[#E2E1D9] shadow-sm shadow-black/5"
        }`}>
          <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase font-bold block">Streak</span>
          <div className="flex items-center space-x-1 mt-1.5">
            <span className={`text-xl font-bold font-display ${mode === "night" ? "text-white" : "text-[#1C1D26]"}`}>{profile?.streak ?? 0} { (profile?.streak ?? 0) === 1 ? "day" : "days" }</span>
            <Zap className={`w-4 h-4 shrink-0 ${mode === "night" ? "text-purple-400" : "text-amber-500"}`} />
          </div>
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
            {(profile?.streak ?? 0) > 0 ? "chaos, but consistent." : "Start your focus streak!"}
          </p>
        </div>

        {/* Profile Trigger */}
        <div className="relative">
          <button 
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className={`w-full flex items-center justify-between p-2 rounded-2xl transition-all cursor-pointer text-left border border-transparent ${
              mode === "night"
                ? "hover:bg-white/5 hover:border-white/5"
                : "hover:bg-black/5 hover:border-black/5"
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0">
              {/* Avatar representation with initial */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-inner uppercase font-display flex-shrink-0 text-white ${
                mode === "night" ? "bg-purple-600" : "bg-amber-600"
              }`}>
                {userName.substring(0, 1) || "T"}
              </div>
              <div className="min-w-0">
                <p className={`text-[11px] font-bold truncate leading-tight ${mode === "night" ? "text-white" : "text-[#1C1D26]"}`}>
                  {userName || "Tommy"}
                </p>
                <p className={`text-[9px] font-mono font-medium ${mode === "night" ? "text-purple-400" : "text-amber-600"}`}>
                  Companion Mode
                </p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileDropdown && (
            <div className={`absolute bottom-full left-0 right-0 mb-2 rounded-2xl p-1.5 border shadow-2xl z-40 ${
              mode === "night" 
                ? "bg-[#101124] border-purple-950/40" 
                : "bg-white border-[#E2E1D9]"
            }`}>
              <div className={`px-3 py-1.5 border-b mb-1 text-[9px] font-mono truncate ${
                mode === "night" ? "border-white/5 text-slate-500" : "border-black/5 text-slate-500"
              }`}>
                {email || "tommy@pulse.ai"}
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 text-[11px] font-semibold cursor-pointer transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout Session</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
