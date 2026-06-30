import React from "react";
import { Calendar as CalendarIcon, Clock, RefreshCw } from "lucide-react";
import { Task } from "../types";

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  description?: string;
}

interface CalendarViewProps {
  mode: "morning" | "night";
  tasks?: Task[];
  onClearAllTasks?: () => void;
  isGuest?: boolean;
}

export default function CalendarView({ mode, tasks = [], onClearAllTasks, isGuest }: CalendarViewProps) {
  const isNight = mode === "night";
  const [showGuestWarning, setShowGuestWarning] = React.useState<boolean>(false);

  // Map real active tasks to agenda events
  const events: CalendarEvent[] = tasks.map((task) => {
    return {
      id: task.id,
      title: task.title,
      time: task.deadline || "Today",
      description: `Category: ${task.category} | Estimated duration: ${task.estimatedDuration} minutes`
    };
  });

  return (
    <div className={`w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6 transition-colors duration-500 ${
      isNight ? "text-[#F5F4EE]" : "text-[#1C1D26]"
    }`}>
      {/* Header card with glass style */}
      <div 
        className={`rounded-3xl p-6 border md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-500 ${
          isNight 
            ? "bg-[#0E0F21]/80 border-purple-950/30 text-white shadow-2xl backdrop-blur-md" 
            : "bg-white border-[#E2E1D9] text-[#1C1D26] shadow-xl"
        }`}
      >
        <div className="space-y-1">
          <span className={`text-[10px] font-mono uppercase tracking-widest ${
            isNight ? "text-slate-400" : "text-slate-500"
          }`}>Time Synchronization</span>
          <h3 className="font-display font-bold text-2xl">Calendar Sync</h3>
          <p className={`text-xs max-w-lg mt-1 ${
            isNight ? "text-slate-400" : "text-slate-600"
          }`}>
            Keep your schedule completely aligned with external Google Calendars. Your focus blocks lock when events start.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
          {onClearAllTasks && events.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to clear all tasks in your current schedule? This cannot be undone.")) {
                  onClearAllTasks();
                }
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-md active:scale-95 border ${
                isNight 
                  ? "bg-red-950/20 hover:bg-red-900/30 text-red-400 border-red-900/30" 
                  : "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
              }`}
            >
              <span>Clear All Tasks</span>
            </button>
          )}
          <button 
            onClick={() => {
              if (isGuest) {
                setShowGuestWarning(true);
              } else {
                alert("Successfully synchronizing external calendar...");
              }
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-md active:scale-95 ${
              isNight 
                ? "bg-purple-600 hover:bg-purple-500 text-white" 
                : "bg-[#1C1D26] hover:bg-black text-[#FAF9F5]"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync External Calendar</span>
          </button>
        </div>
      </div>

      {showGuestWarning && (
        <div 
          className={`p-4 rounded-2xl border flex items-start justify-between space-x-3 transition-all duration-300 ${
            isNight 
              ? "bg-amber-950/20 border-amber-500/30 text-amber-200" 
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <div className="flex space-x-3">
            <span className="text-base">🤖</span>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold block">Pulse Assistant says:</span>
              <p className="text-xs leading-relaxed mt-1 font-semibold">
                You must be logged in with a Google account to sync a calendar. Please register or sign in with Google to enable external integrations.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowGuestWarning(false)}
            className="text-xs font-bold hover:opacity-80 px-2 py-1 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid containing calendar and agenda */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Agenda Events list */}
        <div className={`md:col-span-2 rounded-3xl p-5 border shadow-md flex flex-col justify-between transition-colors duration-500 ${
          isNight 
            ? "bg-[#0E0F21]/40 border-purple-950/30" 
            : "bg-white border-[#E2E1D9]"
        }`}>
          <div>
            <div className="flex items-center space-x-2.5 mb-4">
              <CalendarIcon className={`w-4 h-4 ${isNight ? "text-purple-400" : "text-amber-600"}`} />
              <h4 className={`text-xs font-mono uppercase tracking-widest ${
                isNight ? "text-slate-400" : "text-slate-500"
              }`}>Upcoming Agenda</h4>
            </div>

            <div className="space-y-3">
              {events.length > 0 ? (
                events.map(ev => (
                  <div 
                    key={ev.id} 
                    className={`p-4 rounded-2xl border transition-all ${
                      isNight 
                        ? "bg-purple-950/10 border-purple-900/15 hover:border-purple-800/30 text-[#F5F4EE]" 
                        : "bg-[#FAF9F5] border-[#E2E1D9] hover:border-slate-300 text-[#1C1D26]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="text-sm font-semibold leading-tight">{ev.title}</h5>
                        <p className={`text-xs mt-1 ${isNight ? "text-slate-400" : "text-slate-500"}`}>{ev.description}</p>
                      </div>
                      <div className={`flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full border flex-shrink-0 ${
                        isNight 
                          ? "text-slate-400 bg-black/10 border-white/5" 
                          : "text-slate-600 bg-slate-100 border-slate-200"
                      }`}>
                        <Clock className={`w-3 h-3 ${isNight ? "text-purple-400" : "text-amber-600"}`} />
                        <span>{ev.time}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`flex flex-col items-center justify-center text-center py-10 px-4 border border-dashed rounded-2xl min-h-[160px] ${
                  isNight 
                    ? "border-white/10 bg-white/2" 
                    : "border-[#D3D1C5] bg-[#FAF9F5]"
                }`}>
                  <p className={`text-[11px] font-mono uppercase tracking-widest ${
                    isNight ? "text-purple-400" : "text-amber-700"
                  }`}>Calendar Blank</p>
                  <p className={`text-xs max-w-sm mt-1.5 leading-normal italic ${
                    isNight ? "text-slate-400" : "text-slate-500"
                  }`}>
                    "Your schedule is an open canvas. No daily tasks have been plotted on the calendar. Initialize a planning session to build your itinerary."
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calendar Mini-Widget */}
        <div className={`rounded-3xl p-5 border shadow-md flex flex-col justify-between transition-colors duration-500 ${
          isNight 
            ? "bg-[#0E0F21]/40 border-purple-950/30" 
            : "bg-white border-[#E2E1D9]"
        }`}>
          <div>
            <div className="mb-4">
              <h4 className={`text-xs font-mono uppercase tracking-widest ${
                isNight ? "text-slate-400" : "text-slate-500"
              }`}>Monthly View</h4>
              <p className={`text-[10px] mt-0.5 ${
                isNight ? "text-slate-400" : "text-slate-600"
              }`}>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            </div>

            {/* Simple Grid calendar layout */}
            <div className="grid grid-cols-7 gap-y-2.5 gap-x-1 text-center text-xs font-mono font-semibold">
              {/* Day headers */}
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                <span key={d} className="text-[9px] text-slate-500 uppercase">{d}</span>
              ))}

              {/* Blank spacers for calendar grid */}
              {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, i) => (
                <span key={`blank-${i}`} />
              ))}

              {/* Days of current month */}
              {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }).map((_, i) => {
                const day = i + 1;
                const isToday = day === new Date().getDate();
                
                return (
                  <button 
                    key={`day-${day}`}
                    className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isToday 
                        ? isNight
                          ? "bg-purple-600 text-white font-bold shadow-[0_0_8px_#A855F7]" 
                          : "bg-amber-600 text-white font-bold shadow-sm shadow-amber-600/30"
                        : isNight 
                          ? "text-slate-300 hover:bg-purple-950/30" 
                          : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick sync stats */}
          <div className={`mt-4 pt-4 border-t flex items-center justify-between text-[10px] font-mono ${
            isNight ? "border-white/5 text-slate-400" : "border-black/5 text-slate-500"
          }`}>
            <span>Last Synced:</span>
            <span>Just now</span>
          </div>
        </div>
      </div>
    </div>
  );
}
