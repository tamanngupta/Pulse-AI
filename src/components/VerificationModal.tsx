import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Sparkles, UploadCloud, Camera, Check, 
  AlertTriangle, Loader, FileText, Link as LinkIcon, RefreshCw, Trophy
} from "lucide-react";
import { Task } from "../types";

interface VerificationModalProps {
  task: Task;
  onVerified: () => void;
  onCancel: () => void;
}

export default function VerificationModal({ task, onVerified, onCancel }: VerificationModalProps) {
  const [step, setStep] = useState<"loading" | "prompt" | "verifying" | "success" | "failed">("loading");
  const [proofPrompt, setProofPrompt] = useState("");
  const [expectedProofType, setExpectedProofType] = useState("Any");
  
  const [proofText, setProofText] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch dynamic proof request from server on mount
  useEffect(() => {
    let active = true;
    async function fetchProofRequest() {
      try {
        const res = await fetch("/api/gemini/request-proof", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskTitle: task.title,
            taskCategory: task.category
          })
        });
        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType || !contentType.includes("application/json")) {
          throw new Error(`Server returned status ${res.status}`);
        }
        const data = await res.json();
        if (active) {
          setProofPrompt(data.proofPrompt || `Upload proof that you completed "${task.title}".`);
          setExpectedProofType(data.expectedProofType || "Any");
          setStep("prompt");
        }
      } catch (err) {
        console.error("Error fetching proof request:", err);
        if (active) {
          setProofPrompt(`Please upload a screenshot or write an explanation to verify you completed "${task.title}".`);
          setExpectedProofType("Any");
          setStep("prompt");
        }
      }
    }
    fetchProofRequest();
    return () => {
      active = false;
    };
  }, [task.title, task.category]);

  // Handle image files to Base64
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (JPEG/PNG/etc.) as completion proof.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProofImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Submit proof for AI verification
  const handleSubmitProof = async () => {
    if (!proofText.trim() && !proofImage) {
      alert("Please write an explanation or attach a photo/screenshot proof first.");
      return;
    }

    setStep("verifying");
    try {
      const res = await fetch("/api/gemini/verify-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: task.title,
          taskCategory: task.category,
          proofText: proofText,
          imageBase64: proofImage
        })
      });
      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType || !contentType.includes("application/json")) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      setFeedback(data.feedback || "Proof accepted by Pulse AI.");
      if (data.verified) {
        setStep("success");
      } else {
        setStep("failed");
      }
    } catch (err) {
      console.error("Error verifying proof:", err);
      // Fallback behavior on network error to prevent blocking user completely
      setFeedback("The network delayed my verdict. I'll trust you this once, but don't make it a habit.");
      setStep("success");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl z-10 flex flex-col text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <h3 className="font-display font-bold text-lg text-white">
              Pulse Verification Core
            </h3>
          </div>
          <button 
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Content Panel */}
        <div className="p-6 flex-1 overflow-y-auto max-h-[75vh]">
          <AnimatePresence mode="wait">
            {/* Step 1: Loading request */}
            {step === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 flex flex-col items-center text-center space-y-4"
              >
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500/10 border-t-amber-500 animate-spin" />
                  <Loader className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-display font-semibold text-white">Analyzing Task Context...</p>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    Determining dynamic proof requirements for "<span className="text-slate-200 font-medium">{task.title}</span>"
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Proof Prompt & Input Fields */}
            {step === "prompt" && (
              <motion.div
                key="prompt"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Task Details Info Card */}
                <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                      {task.category} • {task.priority} Priority
                    </span>
                    <h4 className="font-display font-semibold text-white text-base mt-0.5">
                      {task.title}
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
                    Type: {expectedProofType}
                  </span>
                </div>

                {/* Sarcastic Prompt Bubble */}
                <div className="relative bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 text-amber-200 text-sm leading-relaxed italic">
                  <div className="absolute top-2.5 right-2.5 bg-amber-500/10 text-amber-400 font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                    Pulse AI Mandate
                  </div>
                  "{proofPrompt}"
                </div>

                {/* Proof inputs */}
                <div className="space-y-4">
                  {/* Image Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2.5 ${
                      isDragging 
                        ? "border-amber-400 bg-amber-500/5" 
                        : proofImage 
                        ? "border-slate-700 bg-slate-950/40" 
                        : "border-slate-800 hover:border-slate-700 hover:bg-slate-950/30"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />

                    {proofImage ? (
                      <div className="relative w-full max-h-48 overflow-hidden rounded-xl flex items-center justify-center">
                        <img 
                          src={proofImage} 
                          alt="Proof preview" 
                          className="object-contain max-h-40 rounded-lg shadow-md border border-slate-800"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProofImage(null);
                          }}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-lg transition-colors shadow"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 rounded-full bg-slate-800 text-slate-300">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            Drop screenshot or click to browse
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Whoop ring, gym photo, IDE code, book page, or receipt
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Text Description Box */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                      Written explanation, takeaways, or confirmation links
                    </label>
                    <textarea
                      value={proofText}
                      onChange={(e) => setProofText(e.target.value)}
                      placeholder="e.g. Completed 12 sets of high pull & core, or pasted PR link: github.com/user/repo/pull/1"
                      className="w-full h-24 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-700 text-sm resize-none transition-colors"
                    />
                  </div>
                </div>

                {/* Submissions actions */}
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={onCancel}
                    className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-2xl font-semibold text-sm transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitProof}
                    disabled={!proofText.trim() && !proofImage}
                    className={`flex-1 py-3.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center space-x-2 ${
                      (!proofText.trim() && !proofImage)
                        ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                        : "bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer shadow-lg shadow-amber-500/15"
                    }`}
                  >
                    <span>Validate with Pulse</span>
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Verifying */}
            {step === "verifying" && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 flex flex-col items-center text-center space-y-4"
              >
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500/10 border-t-amber-500 animate-spin" />
                  <Camera className="w-6 h-6 text-amber-400 animate-bounce" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-display font-semibold text-white">Verifying Authenticity...</p>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    Pulse AI is inspecting your visual context & text details to detect any slacking or fake data.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 4: Verification Success */}
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5 animate-bounce">
                  <Check className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                    Proof Verified
                  </span>
                  <h3 className="font-display font-bold text-xl text-white pt-2">
                    Verdict: Legitimate.
                  </h3>
                </div>

                {/* AI feedback block */}
                <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800 text-sm italic leading-relaxed text-slate-300">
                  "{feedback}"
                </div>

                <button
                  onClick={onVerified}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-2xl text-sm flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-emerald-500/10 transition-all"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Check Off & Celebrate</span>
                </button>
              </motion.div>
            )}

            {/* Step 5: Verification Failed */}
            {step === "failed" && (
              <motion.div
                key="failed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-500/5 animate-pulse">
                  <AlertTriangle className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                    Rejected By AI
                  </span>
                  <h3 className="font-display font-bold text-xl text-white pt-2">
                    Nice Try. Redo Required.
                  </h3>
                </div>

                {/* AI feedback roast block */}
                <div className="bg-red-950/20 border border-red-950/50 rounded-2xl p-5 text-sm italic leading-relaxed text-red-200">
                  "{feedback}"
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={onCancel}
                    className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 rounded-2xl font-semibold text-sm transition-all cursor-pointer"
                  >
                    Give Up
                  </button>
                  <button
                    onClick={() => setStep("prompt")}
                    className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl text-sm flex items-center justify-center space-x-2 cursor-pointer shadow-lg transition-all animate-pulse"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Revise Proof</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
