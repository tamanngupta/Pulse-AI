import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Send, Mic, Paperclip, Loader, Compass, Award, Sparkles } from "lucide-react";
import { Journal, Task } from "../types";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc, getDocs, query, orderBy, where } from "firebase/firestore";

interface JournalLayerProps {
  userId: string;
  onJournalSaved: (journal: Journal) => void;
  tasks: Task[];
  mode?: "morning" | "night";
}

export default function JournalLayer({ userId, onJournalSaved, tasks, mode = "night" }: JournalLayerProps) {
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [journalsHistory, setJournalsHistory] = useState<Journal[]>([]);
  const [statusText, setStatusText] = useState("");
  const [latestAnalysis, setLatestAnalysis] = useState<Omit<Journal, "id" | "userId" | "createdAt" | "content"> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNight = mode === "night";

  // Fetch journals history
  const fetchJournals = async () => {
    if (!userId) return;
    try {
      let snapshot;
      try {
        const q = query(
          collection(db, "journals"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );
        snapshot = await getDocs(q);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.GET, "journals");
        return;
      }
      const list: Journal[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Journal);
      });
      setJournalsHistory(list);
    } catch (err) {
      console.error("Error fetching journals:", err);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, [userId]);

  // Handle free-form submission and Gemini analysis
  const handleSubmitJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsAnalyzing(true);
    setStatusText("Pulse AI is reading and reflecting on your day...");
    try {
      // Send current tasks for outcome analysis
      const res = await fetch("/api/gemini/analyze-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content,
          tasks: tasks.filter(t => !t.completed || new Date(t.createdAt).toDateString() === new Date().toDateString())
        })
      });
      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType || !contentType.includes("application/json")) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      setIsAnalyzing(false);

      if (data) {
        setLatestAnalysis(data);

        // Write outcomes and extracted patterns back to the behavior-pattern memory store
        if (data.taskOutcomes && Array.isArray(data.taskOutcomes)) {
          for (const outcome of data.taskOutcomes) {
            const patternObj = {
              userId,
              category: outcome.category || "Work",
              title: outcome.title,
              scheduledTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              duration: 30, // Default typical block duration
              densityContext: tasks.length > 4 ? "packed" : tasks.length > 2 ? "medium" : "low",
              completed: !!outcome.completed,
              statedReason: outcome.statedReason || "",
              createdAt: new Date().toISOString()
            };

            try {
              await addDoc(collection(db, "behaviorPatterns"), patternObj);
            } catch (err) {
              console.warn("Could not write back pattern to memory store:", err);
            }
          }
        }

        // Save entire journal object to Firestore
        const todayStr = new Date().toISOString().split("T")[0];
        const newJournalData = {
          userId,
          createdAt: todayStr,
          content,
          wins: data.wins || [],
          mistakes: data.mistakes || [],
          energyLevel: data.energyLevel || "medium",
          patterns: data.patterns || [],
          procrastinationCauses: data.procrastinationCauses || [],
          aiScore: data.aiScore || 5,
          skipPrediction: data.skipPrediction || ""
        };

        let docRef;
        try {
          docRef = await addDoc(collection(db, "journals"), newJournalData);
        } catch (err: any) {
          handleFirestoreError(err, OperationType.CREATE, "journals");
          return;
        }
        const savedJournal: Journal = { id: docRef.id, ...newJournalData };

        onJournalSaved(savedJournal);
        setJournalsHistory((prev) => [savedJournal, ...prev]);
        setContent("");
        setStatusText("Journal successfully logged and written back to behavior memory store!");
        setTimeout(() => {
          setStatusText("");
          setLatestAnalysis(null);
        }, 10000);
      }
    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
      setStatusText("Failed to analyze journal.");
    }
  };

  // Voice recording handlers for journal
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
        setIsAnalyzing(true);
        setStatusText("Transcribing your spoken reflection...");
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
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
            setIsAnalyzing(false);
            if (data.transcription) {
              setContent((prev) => (prev ? prev + " " + data.transcription : data.transcription));
              setStatusText("Reflection transcribed! Edit or press reflect.");
            } else {
              setStatusText("Couldn't transcribe voice.");
            }
            setTimeout(() => setStatusText(""), 3000);
          };
        } catch (err) {
          console.error(err);
          setIsAnalyzing(false);
          setStatusText("Error transcribing voice.");
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setStatusText("Recording your day... speak freely.");
    } catch (err) {
      console.error(err);
      alert("Microphone denied. Type your reflections.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Handwriting / image upload analysis
  const handleImageUpload = async (file: File) => {
    setIsAnalyzing(true);
    setStatusText("Reading handwritten journal page using Vision...");
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
        setIsAnalyzing(false);
        if (data && data.tasks) {
          const titles = data.tasks.map((t: any) => t.title).join(", ");
          setContent((prev) => (prev ? prev + "\n" + titles : "Handwritten tasks: " + titles));
          setStatusText("Handwriting scanned! Continue typing or submit.");
        } else {
          setStatusText("Image couldn't be scanned as journal.");
        }
        setTimeout(() => setStatusText(""), 3000);
      };
    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
      setStatusText("Failed to read journal image.");
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto p-4 md:p-6 transition-colors duration-500 ${
      isNight ? "text-[#F5F4EE]" : "text-[#1C1D26]"
    }`}>
      {/* Journal Entry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* Input box */}
        <div className={`rounded-3xl p-6 border backdrop-blur-md flex flex-col transition-all duration-500 ${
          isNight 
            ? "bg-white/5 border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)] text-white" 
            : "bg-white border-[#E2E1D9] text-[#1C1D26] shadow-sm"
        }`}>
          <div className={`flex items-center justify-between mb-4 pb-2 border-b ${
            isNight ? "border-white/10" : "border-black/5"
          }`}>
            <div>
              <h3 className="font-display font-semibold flex items-center">
                <BookOpen className={`w-5 h-5 mr-2 ${isNight ? "text-slate-400" : "text-slate-500"}`} />
                End-of-Day Reflection
              </h3>
              <p className={`text-xs ${isNight ? "text-slate-400" : "text-slate-500"}`}>
                Unload your mind. Pulse will compute patterns, wins, & energy leaks.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isNight ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-[#1C1D26] hover:bg-slate-100"
                }`}
                title="Upload notebook picture"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              />
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="p-2 text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all cursor-pointer animate-pulse"
                >
                  <Mic className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isNight ? "text-slate-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-[#1C1D26] hover:bg-slate-100"
                  }`}
                  title="Speak your reflection"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmitJournal} className="space-y-4 flex-1 flex flex-col">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isAnalyzing}
              placeholder="How was today? What did you build? What delayed you? Tell Pulse like a PG-13 friend..."
              rows={6}
              className={`w-full text-sm placeholder-slate-500 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none flex-1 py-1 ${
                isNight ? "text-[#F5F4EE] placeholder-slate-500" : "text-[#1C1D26] placeholder-slate-400"
              }`}
            />

            {statusText && (
              <div className={`text-xs font-mono flex items-center border p-2.5 rounded-xl ${
                isNight 
                  ? "text-amber-400 bg-amber-500/5 border-amber-500/10" 
                  : "text-amber-800 bg-amber-50 border-amber-200"
              }`}>
                <Loader className="w-3.5 h-3.5 mr-2 animate-spin" />
                {statusText}
              </div>
            )}

            <div className={`flex justify-end pt-2 border-t ${
              isNight ? "border-white/10" : "border-black/5"
            }`}>
              <button
                type="submit"
                disabled={isAnalyzing || !content.trim()}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center space-x-2 cursor-pointer ${
                  content.trim() && !isAnalyzing
                    ? isNight 
                      ? "bg-[#F5F4EE] text-[#0A0C18] hover:bg-white hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-[#1C1D26] text-[#FAF9F5] hover:bg-black hover:scale-[1.02] active:scale-[0.98]"
                    : isNight 
                      ? "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed"
                      : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                }`}
              >
                <span>Reflect & Log Journal</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Sidebar: Dynamic AI Score Display */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {latestAnalysis ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`rounded-3xl p-6 border shadow-sm transition-all duration-500 ${
                  isNight
                    ? "bg-white/5 border-white/10 text-[#F5F4EE]"
                    : "bg-white border-[#E2E1D9] text-[#1C1D26]"
                }`}
              >
                <div className="flex items-center space-x-2 font-mono text-[10px] uppercase tracking-widest mb-2 text-emerald-500">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Realtime Reflection</span>
                </div>
                <div className="flex items-baseline space-x-1.5 mb-4">
                  <span className={`text-4xl font-display font-bold ${isNight ? "text-white" : "text-[#1C1D26]"}`}>
                    {latestAnalysis.aiScore}
                  </span>
                  <span className="text-slate-500 font-mono text-sm">/ 10</span>
                  <span className="text-xs font-mono text-emerald-500 ml-auto">Energy: {latestAnalysis.energyLevel}</span>
                </div>

                <div className={`space-y-3 text-xs leading-relaxed border-t pt-3 ${
                  isNight ? "border-white/10" : "border-black/5"
                }`}>
                  <div>
                    <h5 className={`font-semibold mb-1 ${isNight ? "text-white" : "text-[#1C1D26]"}`}>Wins:</h5>
                    <ul className={`list-disc pl-4 space-y-1 ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                      {latestAnalysis.wins.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h5 className={`font-semibold mb-1 ${isNight ? "text-white" : "text-[#1C1D26]"}`}>Procrastination triggers:</h5>
                    <ul className={`list-disc pl-4 space-y-1 ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                      {latestAnalysis.procrastinationCauses.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className={`border rounded-3xl p-6 text-center flex flex-col items-center justify-center h-full min-h-[220px] shadow-sm transition-all duration-500 ${
                isNight
                  ? "bg-white/5 border-white/10 text-white"
                  : "bg-white border-[#E2E1D9] text-[#1C1D26]"
              }`}>
                <Compass className={`w-8 h-8 mb-2 animate-spin ${isNight ? "text-slate-400" : "text-slate-500"}`} style={{ animationDuration: "10s" }} />
                <h4 className="font-display font-medium text-sm">Reflective Guidance</h4>
                <p className={`text-xs mt-1 max-w-xs leading-relaxed ${isNight ? "text-slate-400" : "text-slate-500"}`}>
                  Log your journal entry on the left to see your calculated AI focus score and behavior analysis.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Journals History */}
      <div>
        <h3 className="font-display font-semibold text-lg mb-4 flex items-center">
          <Award className={`w-5 h-5 mr-2 ${isNight ? "text-slate-400" : "text-slate-500"}`} />
          Reflection Archives
        </h3>

        {journalsHistory.length === 0 ? (
          <div className={`rounded-2xl p-8 border text-center flex flex-col items-center justify-center space-y-3 transition-all duration-500 ${
            isNight
              ? "bg-[#0E0F21]/40 border-purple-950/30 text-slate-400"
              : "bg-white border border-[#E2E1D9] text-slate-500 shadow-sm"
          }`}>
            <Compass className="w-8 h-8 animate-pulse text-slate-400" />
            <p className="text-xs font-medium max-w-sm">
              Your reflection vault is clean. Write and save your first journal entry above to start charting your milestones.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {journalsHistory.map((j) => (
              <div key={j.id} className={`border rounded-2xl p-5 shadow-sm space-y-3 relative transition-all hover:scale-[1.01] ${
                isNight 
                  ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-[#F5F4EE]" 
                  : "bg-white border border-[#E2E1D9] hover:bg-slate-50 hover:border-slate-300 text-[#1C1D26] shadow-sm"
              }`}>
                <span className={`absolute top-4 right-4 font-mono text-[10px] px-2.5 py-1 rounded-full font-semibold border ${
                  isNight
                    ? "bg-white/10 text-white border-white/10"
                    : "bg-[#FAF9F5] text-amber-700 border-[#E2E1D9]"
                }`}>
                  Score: {j.aiScore}/10
                </span>
                <div>
                  <span className={`text-xs font-mono uppercase ${isNight ? "text-slate-400" : "text-slate-500"}`}>
                    {new Date(j.createdAt + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <p className={`text-sm font-sans mt-2 line-clamp-3 italic ${isNight ? "text-slate-300" : "text-slate-600"}`}>
                    "{j.content}"
                  </p>
                </div>

                <div className={`pt-2.5 border-t grid grid-cols-2 gap-2 text-[11px] ${
                  isNight ? "border-white/10 text-slate-400" : "border-black/5 text-slate-500"
                }`}>
                  <div>
                    <span className="font-mono text-[9px] text-slate-500 block uppercase">Wins ({j.wins.length})</span>
                    <p className={`font-medium truncate ${isNight ? "text-slate-200" : "text-[#1C1D26]"}`}>
                      {j.wins[0] || "None logged"}
                    </p>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-slate-500 block uppercase">Energy Level</span>
                    <p className={`font-medium capitalize ${isNight ? "text-slate-200" : "text-[#1C1D26]"}`}>
                      {j.energyLevel}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
