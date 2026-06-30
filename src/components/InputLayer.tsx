import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Mic, Paperclip, Loader, Check, AlertCircle, Trash2, Calendar, Clock, Tag } from "lucide-react";
import { Task, Journal, BehaviorPattern } from "../types";

interface InputLayerProps {
  onTasksAdded: (tasks: Omit<Task, "id" | "userId" | "createdAt" | "completed" | "focusTimeSpent">[]) => void;
  journals?: Journal[];
  behaviorPatterns?: BehaviorPattern[];
}

const EMPTY_ARRAY: any[] = [];

export default function InputLayer({ onTasksAdded, journals = EMPTY_ARRAY, behaviorPatterns = EMPTY_ARRAY }: InputLayerProps) {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Extracted tasks confirmation state
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [taskWarnings, setTaskWarnings] = useState<Record<number, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Background memory analyzer for newly extracted tasks
  useEffect(() => {
    if (!pendingTasks || pendingTasks.length === 0) {
      setTaskWarnings((prev) => {
        if (Object.keys(prev).length === 0) return prev;
        return {};
      });
      return;
    }

    const warnings: Record<number, string> = {};
    const stopWords = new Set(["the", "a", "an", "to", "at", "for", "on", "in", "with", "and", "or", "of", "my", "your", "by", "is", "it"]);

    pendingTasks.forEach((task, idx) => {
      const titleLower = (task.title || "").toLowerCase();
      const categoryLower = (task.category || "Work").toLowerCase();

      // Tokenize the proposed task title
      const words = titleLower
        .replace(/[^a-z0-9\s]/gi, "")
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));

      let matchingPattern: BehaviorPattern | null = null;

      // 1. Search behaviorPatterns for an incomplete matching past task
      if (behaviorPatterns && behaviorPatterns.length > 0) {
        // Try to find a pattern with keyword overlap in the title first
        matchingPattern = behaviorPatterns.find(p => {
          const pTitleLower = p.title.toLowerCase();
          const hasOverlap = words.some(w => pTitleLower.includes(w));
          return hasOverlap && !p.completed;
        }) || null;

        // If no keyword match, check if there's a pattern in the same category that was skipped
        if (!matchingPattern) {
          matchingPattern = behaviorPatterns.find(p => {
            return p.category.toLowerCase() === categoryLower && !p.completed;
          }) || null;
        }
      }

      // 2. Search journals for matching keyword mentions if no specific behavior pattern is found
      let journalReason = "";
      if (!matchingPattern && journals && journals.length > 0) {
        const lastJournal = journals[0];
        const journalContentLower = lastJournal.content.toLowerCase();
        const hasKeywordMatch = words.some(w => journalContentLower.includes(w));
        
        if (hasKeywordMatch && lastJournal.procrastinationCauses && lastJournal.procrastinationCauses.length > 0) {
          journalReason = `Your recent journal log mentioned procrastinating on similar topics due to: ${lastJournal.procrastinationCauses.join(", ")}.`;
        }
      }

      // 3. Populate warning copy
      if (matchingPattern) {
        const reasonStr = matchingPattern.statedReason
          ? `Your recent reflection noted: "${matchingPattern.statedReason}"`
          : "You skipped it without log explanation";
        warnings[idx] = `Pattern Alert: You recently skipped "${matchingPattern.title}". ${reasonStr}. Plan to run this session when you are fully rested.`;
      } else if (journalReason) {
        warnings[idx] = `Note: ${journalReason} Let's schedule this block deliberately to avoid distractions.`;
      }
    });

    setTaskWarnings((prev) => {
      const keysPrev = Object.keys(prev);
      const keysNew = Object.keys(warnings);
      if (keysPrev.length === keysNew.length && keysNew.every(k => prev[Number(k)] === warnings[Number(k)])) {
        return prev;
      }
      return warnings;
    });
  }, [pendingTasks, behaviorPatterns, journals]);

  // Clean up media recorder on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/mp3" });
        await handleAudioUpload(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      setAudioChunks([]);
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setStatusMessage("Listening to your voice...");
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied. Enable mic in settings or use text typing.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleAudioUpload = async (blob: Blob) => {
    setIsProcessing(true);
    setStatusMessage("Transcribing audio and structuring task...");
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(",")[1];
        const res = await fetch("/api/gemini/transcribe-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioBase64: base64data, mimeType: "audio/mp3" })
        });
        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType || !contentType.includes("application/json")) {
          throw new Error(`Server returned status ${res.status}`);
        }
        const data = await res.json();
        setIsProcessing(false);

        if (data.task) {
          setPendingTasks([data.task]);
          setShowConfirmation(true);
          setInputText(data.transcription || "");
        } else if (data.transcription) {
          setInputText(data.transcription);
          setStatusMessage("Transcribed. Press send or type to adjust.");
          setTimeout(() => setStatusMessage(""), 3000);
        } else {
          setStatusMessage("Couldn't extract anything from audio.");
          setTimeout(() => setStatusMessage(""), 3000);
        }
      };
    } catch (err) {
      console.error("Voice parse error:", err);
      setIsProcessing(false);
      setStatusMessage("Error parsing voice.");
    }
  };

  // Natural Language text sending
  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setStatusMessage("Pulse is thinking...");
    try {
      const res = await fetch("/api/gemini/parse-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText })
      });
      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType || !contentType.includes("application/json")) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      setIsProcessing(false);

      if (data) {
        if (data.tasks && Array.isArray(data.tasks)) {
          setPendingTasks(data.tasks);
        } else if (Array.isArray(data)) {
          setPendingTasks(data);
        } else {
          setPendingTasks([data]);
        }
        setShowConfirmation(true);
      }
    } catch (err) {
      console.error("Text parse error:", err);
      setIsProcessing(false);
      setStatusMessage("Failed to parse task.");
    }
  };

  // Image Upload (multimodal handwriting or screenshot)
  const handleImageFile = async (file: File) => {
    setIsProcessing(true);
    setStatusMessage("Scanning notebook/screenshot using Gemini Vision...");
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(",")[1];
        const res = await fetch("/api/gemini/parse-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64data, mimeType: file.type })
        });
        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType || !contentType.includes("application/json")) {
          throw new Error(`Server returned status ${res.status}`);
        }
        const data = await res.json();
        setIsProcessing(false);

        if (data && data.tasks && data.tasks.length > 0) {
          setPendingTasks(data.tasks);
          setShowConfirmation(true);
        } else {
          setStatusMessage("No tasks detected in the image. Try a cleaner image.");
          setTimeout(() => setStatusMessage(""), 4000);
        }
      };
    } catch (err) {
      console.error("Image upload parsing error:", err);
      setIsProcessing(false);
      setStatusMessage("Error scanning image.");
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        handleImageFile(file);
      } else {
        setStatusMessage("Please upload image files (png/jpg/jpeg) of notebooks or screenshots.");
        setTimeout(() => setStatusMessage(""), 3000);
      }
    }
  };

  // Task confirmation execution
  const confirmSavingTasks = () => {
    onTasksAdded(pendingTasks);
    setPendingTasks([]);
    setShowConfirmation(false);
    setInputText("");
    setStatusMessage("Tasks successfully added!");
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const cancelSavingTasks = () => {
    setPendingTasks([]);
    setShowConfirmation(false);
    setStatusMessage("Cancelled.");
    setTimeout(() => setStatusMessage(""), 2000);
  };

  const updatePendingTaskField = (index: number, field: string, value: any) => {
    const updated = [...pendingTasks];
    updated[index] = { ...updated[index], [field]: value };
    setPendingTasks(updated);
  };

  const removePendingTask = (index: number) => {
    const updated = [...pendingTasks];
    updated.splice(index, 1);
    setPendingTasks(updated);
    if (updated.length === 0) {
      setShowConfirmation(false);
    }
  };

  return (
    <div className="w-full">
      {/* Pending Confirmation Modal Drawer */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#030408]/80 backdrop-blur-md z-50 flex flex-col items-center justify-start md:justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#0A0C18]/90 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-white/15 backdrop-blur-xl flex flex-col max-h-[90vh] md:max-h-[85vh] my-auto text-[#F5F4EE]"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                <div>
                  <h3 className="font-display font-semibold text-lg text-white flex items-center">
                    <Check className="w-5 h-5 text-emerald-400 mr-2" /> Verify Extracted Tasks
                  </h3>
                  <p className="text-xs text-slate-400">Confirm or adjust before adding to schedule</p>
                </div>
                <button
                  onClick={cancelSavingTasks}
                  className="text-slate-400 hover:text-white text-xs font-mono bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md border border-white/5"
                >
                  Discard
                </button>
              </div>

              {/* Task Items List */}
              <div className="overflow-y-auto space-y-4 flex-1 pr-1 py-1">
                {pendingTasks.map((task, idx) => (
                  <div key={idx} className="p-4 bg-white/5 rounded-2xl relative border border-white/10">
                    <button
                      onClick={() => removePendingTask(idx)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-400 transition-colors"
                      title="Remove task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                          Task Title
                        </label>
                        <input
                          type="text"
                          value={task.title || ""}
                          onChange={(e) => updatePendingTaskField(idx, "title", e.target.value)}
                          className="w-full text-sm font-medium bg-[#0A0C18]/50 text-white px-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/20"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" /> Deadline
                          </label>
                          <input
                            type="text"
                            value={task.deadline || ""}
                            onChange={(e) => updatePendingTaskField(idx, "deadline", e.target.value)}
                            placeholder="e.g. Tomorrow, Friday"
                            className="w-full text-xs bg-[#0A0C18]/50 text-white px-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/20"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1 flex items-center">
                            <Clock className="w-3 h-3 mr-1" /> Duration (mins)
                          </label>
                          <input
                            type="number"
                            value={task.estimatedDuration || 30}
                            onChange={(e) => updatePendingTaskField(idx, "estimatedDuration", parseInt(e.target.value) || 30)}
                            className="w-full text-xs bg-[#0A0C18]/50 text-white px-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1 flex items-center">
                            <Tag className="w-3 h-3 mr-1" /> Category
                          </label>
                          <select
                            value={task.category || "Work"}
                            onChange={(e) => updatePendingTaskField(idx, "category", e.target.value)}
                            className="w-full text-xs bg-[#0A0C18]/50 text-white px-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/20"
                          >
                            <option value="Work" className="bg-[#0A0C18] text-white">Work</option>
                            <option value="Study" className="bg-[#0A0C18] text-white">Study</option>
                            <option value="Health" className="bg-[#0A0C18] text-white">Health</option>
                            <option value="Personal" className="bg-[#0A0C18] text-white">Personal</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                            Priority
                          </label>
                          <select
                            value={task.priority || "medium"}
                            onChange={(e) => updatePendingTaskField(idx, "priority", e.target.value)}
                            className="w-full text-xs bg-[#0A0C18]/50 text-white px-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/20 font-medium"
                          >
                            <option value="high" className="bg-[#0A0C18] text-red-400 font-sans">High</option>
                            <option value="medium" className="bg-[#0A0C18] text-amber-400 font-sans">Medium</option>
                            <option value="low" className="bg-[#0A0C18] text-blue-400 font-sans">Low</option>
                          </select>
                        </div>
                      </div>

                      {taskWarnings[idx] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="p-3 bg-red-950/20 border border-red-500/25 rounded-xl text-xs text-red-200 font-sans leading-relaxed flex items-start space-x-2 mt-2"
                        >
                          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                          <span>{taskWarnings[idx]}</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-white/10 mt-4 flex space-x-3">
                <button
                  onClick={cancelSavingTasks}
                  className="flex-1 py-3 text-sm font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSavingTasks}
                  className="flex-1 py-3 text-sm font-bold text-[#0A0C18] bg-[#F5F4EE] hover:bg-white rounded-2xl shadow-lg transition-all cursor-pointer"
                >
                  Save to Schedule ({pendingTasks.length})
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Interactive Floating Bar */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative z-40 transition-all duration-300 w-full rounded-2xl bg-white/5 backdrop-blur-md border ${
          dragActive ? "border-white/30 ring-2 ring-white/15 bg-white/10" : "border-white/10 shadow-xl"
        }`}
      >
        {/* Status indicator bar */}
        {statusMessage && (
          <div className="absolute top-0 left-0 right-0 transform -translate-y-full bg-slate-900 text-slate-100 text-[10px] md:text-xs font-mono px-4 py-1.5 rounded-t-2xl flex items-center justify-between border-b border-slate-800 transition-all">
            <span className="flex items-center">
              <Loader className="w-3 h-3 animate-spin mr-1.5 text-orange-400" />
              {statusMessage}
            </span>
          </div>
        )}

        {/* Input Bar Form */}
        <form onSubmit={handleSendText} className="flex items-center p-2 pl-4">
          {/* File attachment upload trigger */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
            title="Upload journal, note, homework screenshot, or workspace slides"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleImageFile(e.target.files[0]);
              }
            }}
          />

          {/* Text input area */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
            placeholder={
              isRecording
                ? "Recording your voice... Speak now."
                : "Type naturally: 'Gym at 7' or drag-and-drop a note photo..."
            }
            className="flex-1 py-3 px-3 text-sm font-sans text-white placeholder-slate-500 bg-transparent border-0 focus:outline-none focus:ring-0"
          />

          {/* Voice Input Recorder trigger */}
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="p-3 text-white bg-red-500 rounded-full hover:bg-red-600 transition-all cursor-pointer mr-1 animate-pulse"
              title="Stop Recording"
            >
              <Mic className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isProcessing}
              onClick={startRecording}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
              title="Record Voice Command"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          {/* Send Button */}
          <button
            type="submit"
            disabled={isProcessing || !inputText.trim()}
            className={`p-3 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
              inputText.trim() && !isProcessing
                ? "bg-[#F5F4EE] text-[#0A0C18] hover:bg-white hover:scale-105 active:scale-95"
                : "bg-white/5 text-slate-600 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {dragActive && (
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] rounded-2xl flex items-center justify-center pointer-events-none">
            <p className="text-xs font-mono font-medium text-white uppercase tracking-widest bg-slate-900 px-4 py-2 rounded-full border border-white/10">
              Drop Notebook or Screenshot Here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
