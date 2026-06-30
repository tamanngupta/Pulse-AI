import React, { useState, useEffect } from "react";
import { Check, Plus, AlertCircle, Circle, Trash2, Mic, Lightbulb, Bell, FileText, Compass } from "lucide-react";

interface DumpItem {
  id: string;
  text: string;
  category: "task" | "reminder" | "idea" | "random";
  completed: boolean;
  createdAt: string;
}

interface DumpZoneProps {
  mode: "morning" | "night";
}

export default function DumpZone({ mode }: DumpZoneProps) {
  const [items, setItems] = useState<DumpItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedTag, setSelectedTag] = useState<"task" | "reminder" | "idea" | "random">("task");

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("pulse_brain_dumps");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse brain dumps", e);
      }
    } else {
      setItems([]);
    }
  }, []);

  // Save to LocalStorage
  const saveItems = (newItems: DumpItem[]) => {
    setItems(newItems);
    localStorage.setItem("pulse_brain_dumps", JSON.stringify(newItems));
  };

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newItem: DumpItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: inputText.trim(),
      category: selectedTag,
      completed: false,
      createdAt: new Date().toISOString()
    };

    const updated = [...items, newItem];
    saveItems(updated);
    setInputText("");
  };

  const toggleComplete = (id: string) => {
    const updated = items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveItems(updated);
  };

  const deleteItem = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    saveItems(updated);
  };

  const getCategoryIcon = (cat: "task" | "reminder" | "idea" | "random") => {
    switch (cat) {
      case "task":
        return <Check className="w-3 h-3 text-emerald-400" />;
      case "reminder":
        return <Bell className="w-3 h-3 text-amber-400" />;
      case "idea":
        return <Lightbulb className="w-3 h-3 text-sky-400" />;
      case "random":
      default:
        return <Compass className="w-3 h-3 text-purple-400" />;
    }
  };

  return (
    <div 
      className={`relative w-full rounded-3xl p-5 border shadow-md backdrop-blur-md flex flex-col justify-between min-h-[220px] transition-all duration-500 ${
        mode === "night" 
          ? "bg-[#0E0F21]/40 border-purple-950/30" 
          : "bg-white/40 border-orange-100/30"
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className={`text-[11px] font-mono tracking-widest uppercase font-bold ${mode === "night" ? "text-purple-400" : "text-amber-700"}`}>
              {mode === "night" ? "DUMP ZONE" : "QUICK DUMP"}
            </h4>
            <p className={`text-[9px] font-medium ${mode === "night" ? "text-slate-300" : "text-slate-700"}`}>
              {mode === "night" ? "Brain dump. I'll organize the chaos." : "Add anything on your mind"}
            </p>
          </div>
        </div>

        {/* Notes list */}
        <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
          {items.length === 0 ? (
            <p className={`text-xs italic text-center py-4 font-medium ${mode === "night" ? "text-slate-400" : "text-slate-600"}`}>
              Your mind is clear. Dump a thought!
            </p>
          ) : (
            items.map(item => (
              <div 
                key={item.id} 
                className="flex items-center justify-between group py-1 border-b border-black/5 last:border-0"
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <button 
                    onClick={() => toggleComplete(item.id)}
                    className="cursor-pointer text-slate-400 hover:text-white transition-colors flex-shrink-0"
                  >
                    {item.completed ? (
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${mode === "night" ? "bg-purple-950/50" : "bg-orange-100"}`}>
                        <Check className="w-3 h-3 text-emerald-500 stroke-[3px]" />
                      </div>
                    ) : (
                      <div className={`w-4 h-4 rounded-full border border-slate-500 hover:border-slate-400 flex items-center justify-center`} />
                    )}
                  </button>
                  <span className={`text-[11px] leading-tight truncate flex-1 ${
                    item.completed 
                      ? "line-through text-slate-500 font-normal" 
                      : mode === "night" ? "text-[#F5F4EE] font-semibold" : "text-slate-900 font-semibold"
                  }`}>
                    {item.text}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-semibold flex items-center space-x-1 ${
                    mode === "night" ? "bg-purple-950/20 text-purple-300" : "bg-orange-100 text-orange-800"
                  }`}>
                    {getCategoryIcon(item.category)}
                    <span className="capitalize">{item.category}</span>
                  </span>
                </div>
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="p-1 opacity-0 group-hover:opacity-100 text-red-400/70 hover:text-red-400 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input section */}
      <div className="mt-3">
        {/* Morning Tag Pills */}
        {mode === "morning" && (
          <div className="flex space-x-1 mb-2">
            {(["task", "reminder", "idea", "random"] as const).map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize border transition-all cursor-pointer ${
                  selectedTag === tag 
                    ? "bg-amber-500 text-white border-transparent" 
                    : "bg-white/50 text-slate-500 border-slate-200 hover:bg-white"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleAddItem} className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={mode === "morning" ? "Type or speak..." : "+ Add something"}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className={`w-full text-xs font-semibold px-3 py-1.5 pr-8 rounded-xl focus:outline-none border transition-all ${
                mode === "night" 
                  ? "bg-[#0A0B1A]/60 border-purple-900/40 text-white placeholder-slate-400 focus:border-purple-500" 
                  : "bg-white/60 border-slate-200 text-slate-900 placeholder-slate-600 focus:border-amber-500"
              }`}
            />
            {mode === "morning" && (
              <button 
                type="button" 
                title="Voice input (mock)" 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button 
            type="submit"
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              mode === "night" 
                ? "bg-purple-900/30 hover:bg-purple-800 text-purple-300" 
                : "bg-amber-100 hover:bg-amber-200 text-amber-700"
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
