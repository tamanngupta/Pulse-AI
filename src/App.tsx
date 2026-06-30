import React, { useState, useEffect } from "react";
import { User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  Moon, 
  Sun, 
  CloudRain, 
  Volume2, 
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  Play,
  Calendar
} from "lucide-react";

import { auth, googleProvider, db, handleFirestoreError, OperationType } from "./firebase";
import { Task, Journal, UserProfile, BehaviorPattern, DailyBriefing } from "./types";
import { getTimeOfDay, isAtOrAfterPlanningTime } from "./utils";

// Sub-components
import MorningLayer from "./components/MorningLayer";
import ExecutionLayer from "./components/ExecutionLayer";
import Onboarding from "./components/Onboarding";
import VerificationModal from "./components/VerificationModal";
import InputLayer from "./components/InputLayer";
import JournalLayer from "./components/JournalLayer";
import IntelligenceLayer from "./components/IntelligenceLayer";

// Redesigned UI modules
import Sidebar from "./components/Sidebar";
import ConstellationMap from "./components/ConstellationMap";
import DumpZone from "./components/DumpZone";
import RecentProofs from "./components/RecentProofs";
import TodayTimeline from "./components/TodayTimeline";
import CalendarView from "./components/CalendarView";
import ProofsView from "./components/ProofsView";
import PulseLogo from "./components/PulseLogo";

// High-fidelity background images using premium Unsplash architecture placeholders for universal production stability
const lakesideNight = "https://images.unsplash.com/photo-1558868630-ecfdd6306e51?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
const lakesideMorning = "https://images.unsplash.com/photo-1768702133235-70b0815044f6?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [guestId, setGuestId] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Layout states
  const [currentView, setCurrentView] = useState<"morning-brief" | "workspace">("workspace");
  const [activeTab, setActiveTab] = useState<"tasks" | "journal" | "intelligence" | "calendar" | "proofs">("tasks");
  const [timeOverride, setTimeOverride] = useState<"morning" | "night">("night");

  // Core Data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [behaviorPatterns, setBehaviorPatterns] = useState<BehaviorPattern[]>([]);
  const [dayContext, setDayContext] = useState<any>(null);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);

  // Focus and proof states
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [verifyingTask, setVerifyingTask] = useState<Task | null>(null);
  const [pendingFocusComplete, setPendingFocusComplete] = useState<{
    focusTimeSpent: number;
    inactivityLog: any[];
  } | null>(null);

  // Digital clock live time
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Pulse Assistant Says Index
  const [roastIndex, setRoastIndex] = useState(0);

  const [showSlideshow, setShowSlideshow] = useState(false);

  const assistantRoasts = [
    "You left your journal blank yesterday, which is either peak efficiency or pure laziness. I'm betting on the latter.",
    "Oh, look who decided to show up. Still planning to finish that landing page, or should I reschedule it to 2027?",
    "12-day streak? Cool. Let's see if you can survive today without checking your social feeds 47 times.",
    "Your focus sessions are shorter than a goldfish's memory. Let's try aiming for actual deep work today, yeah?",
    "Ah, another brain dump. Is that a real plan or just a wish list of goals you will ignore tomorrow?",
    "You have high-priority coding tasks, yet spent 2 hours adjusting your font weights and color schemes. Classic."
  ];

  // Live clock hook
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update override based on natural local time on startup
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 6 && hours < 18) {
      setTimeOverride("morning");
    } else {
      setTimeOverride("night");
    }
  }, []);

  // Live planning session rollover triggers disabled to prevent unwanted automatic planning experience popups

  // Handle Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsGuest(false);
        fetchUserData(currentUser.uid);
      } else {
        setUser(null);
        const storedGuestId = localStorage.getItem("pulse_guest_id");
        if (storedGuestId) {
          setIsGuest(true);
          setGuestId(storedGuestId);
          fetchUserData(storedGuestId);
        } else {
          setAuthLoading(false);
        }
      }
    });
    return unsubscribe;
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      setAuthLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      setIsGuest(false);
      localStorage.removeItem("pulse_guest_id");
      fetchUserData(result.user.uid);
    } catch (error: any) {
      console.error("Google Login Error:", error);
      setAuthLoading(false);
      if (error?.code === "auth/popup-closed-by-user") {
        setAuthError("Google Sign-In popup was closed before completion. If you are experiencing iframe restrictions, please use 'Continue as Guest' below.");
      } else {
        setAuthError(error?.message || "An error occurred during Google sign-in. Please try again or use Guest Access.");
      }
    }
  };

  const handleGuestLogin = () => {
    setAuthError(null);
    setAuthLoading(true);
    const newGuestId = "guest_" + Math.random().toString(36).substring(2, 9);
    localStorage.setItem("pulse_guest_id", newGuestId);
    setIsGuest(true);
    setGuestId(newGuestId);
    fetchUserData(newGuestId);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("pulse_guest_id");
      setUser(null);
      setProfile(null);
      setIsGuest(false);
      setGuestId("");
      setTasks([]);
      setJournals([]);
      setBriefing(null);
      setCurrentView("workspace");
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Tasks, Journals, and Behaviors
  const fetchUserData = async (uid: string) => {
    try {
      let profileData: UserProfile | null = null;
      try {
        const profileDoc = await getDoc(doc(db, "profiles", uid));
        if (profileDoc.exists()) {
          profileData = profileDoc.data() as UserProfile;
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.warn("Could not load user profile, showing onboarding as fallback:", err);
      }

      // 1. Tasks
      let tasksSnapshot;
      try {
        const tasksQuery = query(
          collection(db, "tasks"),
          where("userId", "==", uid),
          orderBy("createdAt", "desc")
        );
        tasksSnapshot = await getDocs(tasksQuery);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.GET, "tasks");
        return;
      }
      const loadedTasks: Task[] = [];
      tasksSnapshot.forEach((doc) => {
        loadedTasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(loadedTasks);

      // 2. Journals
      let journalsSnapshot;
      try {
        const journalsQuery = query(
          collection(db, "journals"),
          where("userId", "==", uid),
          orderBy("createdAt", "desc")
        );
        journalsSnapshot = await getDocs(journalsQuery);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.GET, "journals");
        return;
      }
      const loadedJournals: Journal[] = [];
      journalsSnapshot.forEach((doc) => {
        loadedJournals.push({ id: doc.id, ...doc.data() } as Journal);
      });
      setJournals(loadedJournals);

      // 3. Behavior Patterns
      let loadedPatterns: BehaviorPattern[] = [];
      try {
        const patternsQuery = query(
          collection(db, "behaviorPatterns"),
          where("userId", "==", uid),
          orderBy("createdAt", "desc")
        );
        const patternsSnapshot = await getDocs(patternsQuery);
        patternsSnapshot.forEach((doc) => {
          loadedPatterns.push({ id: doc.id, ...doc.data() } as BehaviorPattern);
        });
      } catch (err) {
        console.warn("Could not load behavior patterns:", err);
      }
      setBehaviorPatterns(loadedPatterns);

      // 4. Briefing
      await generateMorningBrief(uid, loadedTasks, loadedJournals, loadedPatterns, profileData);
    } catch (err) {
      console.error("Error reading user records:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const generateMorningBrief = async (
    uid: string,
    currentTasks: Task[],
    currentJournals: Journal[],
    currentPatterns: BehaviorPattern[],
    userProfile?: UserProfile | null
  ) => {
    setIsBriefingLoading(true);
    try {
      const activeTasks = currentTasks.filter(t => !t.completed);
      const lastJournal = currentJournals[0] || null;
      const activeCategories = new Set(activeTasks.map(t => t.category));

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      const yesterdayTasks = currentTasks.filter(t => new Date(t.createdAt).toDateString() === yesterdayStr);
      const todayStr = new Date().toDateString();
      const nonTodayTasks = currentTasks.filter(t => new Date(t.createdAt).toDateString() !== todayStr);
      const finalYesterdayTasks = yesterdayTasks.length > 0 ? yesterdayTasks : nonTodayTasks.slice(0, 5);

      const relevantPatterns = currentPatterns.filter(p => {
        if (activeCategories.has(p.category)) return true;
        const totalDurationToday = activeTasks.reduce((sum, t) => sum + t.estimatedDuration, 0);
        if (totalDurationToday > 180 && p.densityContext.toLowerCase().includes("high")) return true;
        if (activeTasks.length > 4 && p.densityContext.toLowerCase().includes("packed")) return true;
        return false;
      }).slice(0, 5);

      const contextObj = {
        yesterdayTasks: finalYesterdayTasks.map(t => ({
          title: t.title,
          category: t.category,
          estimatedDuration: t.estimatedDuration,
          completed: t.completed,
          focusTimeSpent: t.focusTimeSpent,
          createdAt: t.createdAt
        })),
        recentJournals: currentJournals.slice(0, 2).map(j => ({
          content: j.content,
          wins: j.wins,
          mistakes: j.mistakes,
          energyLevel: j.energyLevel,
          patterns: j.patterns,
          procrastinationCauses: j.procrastinationCauses,
          aiScore: j.aiScore,
          skipPrediction: j.skipPrediction,
          createdAt: j.createdAt
        })),
        relevantPatterns: relevantPatterns.map(p => ({
          category: p.category,
          title: p.title,
          scheduledTime: p.scheduledTime,
          duration: p.duration,
          densityContext: p.densityContext,
          completed: p.completed,
          statedReason: p.statedReason,
          createdAt: p.createdAt
        }))
      };

      setDayContext(contextObj);

      const res = await fetch("/api/gemini/morning-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: userProfile?.name || profile?.name || user?.displayName || "Champion",
          tasks: activeTasks,
          yesterdayJournal: lastJournal ? lastJournal.content : "No reflection submitted yesterday",
          dayContext: contextObj
        })
      });
      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType || !contentType.includes("application/json")) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      if (data && !data.error) {
        setBriefing(data);
      }
    } catch (err) {
      console.error("Brief generation error:", err);
    } finally {
      setIsBriefingLoading(false);
    }
  };

  const handleOnboardingComplete = async (newProfile: UserProfile) => {
    const uid = user ? user.uid : guestId;
    if (!uid) return;

    try {
      await setDoc(doc(db, "profiles", uid), newProfile);
      setProfile(newProfile);

      const timeStr = newProfile.preferredPlanningTime === "morning" 
        ? "08:00 AM" 
        : newProfile.preferredPlanningTime === "night" 
        ? "09:30 PM" 
        : newProfile.customPlanningTime || "08:00 AM";

      const planningTask = {
        userId: uid,
        title: "Daily Pulse Planning Session",
        deadline: `Daily at ${timeStr}`,
        priority: "high" as const,
        category: "Personal",
        estimatedDuration: 15,
        reminders: ["Immediately"],
        completed: false,
        createdAt: new Date().toISOString(),
        focusTimeSpent: 0,
        inactivityLog: []
      };

      let addedTask;
      try {
        const docRef = await addDoc(collection(db, "tasks"), planningTask);
        addedTask = { id: docRef.id, ...planningTask };
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "tasks");
      }
      if (addedTask) {
        setTasks((prev) => [addedTask, ...prev]);
      }
      setCurrentView("workspace");
    } catch (err) {
      console.error("Error saving onboarding profile:", err);
    }
  };

  const handleAddTasks = async (newTasks: Omit<Task, "id" | "userId" | "createdAt" | "completed" | "focusTimeSpent">[]) => {
    const uid = user ? user.uid : guestId;
    if (!uid) return;

    try {
      const addedTasksList: Task[] = [];
      for (const t of newTasks) {
        const taskObj = {
          userId: uid,
          title: t.title,
          deadline: t.deadline || "Today",
          priority: t.priority || "medium",
          category: t.category || "Work",
          estimatedDuration: t.estimatedDuration || 30,
          reminders: t.reminders || [],
          completed: false,
          createdAt: new Date().toISOString(),
          focusTimeSpent: 0,
          inactivityLog: []
        };

        try {
          const docRef = await addDoc(collection(db, "tasks"), taskObj);
          addedTasksList.push({ id: docRef.id, ...taskObj });
        } catch (err: any) {
          handleFirestoreError(err, OperationType.CREATE, "tasks");
        }
      }
      setTasks((prev) => [...addedTasksList, ...prev]);
    } catch (err) {
      console.error("Error adding tasks:", err);
    }
  };

  const toggleTaskCompleted = async (taskId: string, currentStatus: boolean) => {
    try {
      if (!currentStatus) {
        const targetTask = tasks.find((t) => t.id === taskId);
        if (targetTask) {
          setVerifyingTask(targetTask);
          setPendingFocusComplete(null);
          return;
        }
      }

      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { completed: false, completedAt: null });
      setTasks((prev) =>
        prev.map((t) => t.id === taskId ? { ...t, completed: false, completedAt: undefined } : t)
      );
    } catch (err) {
      console.error("Toggle task error:", err);
    }
  };

  const handleVerificationSuccess = async () => {
    if (!verifyingTask) return;

    try {
      const taskRef = doc(db, "tasks", verifyingTask.id);

      if (pendingFocusComplete) {
        const { focusTimeSpent, inactivityLog } = pendingFocusComplete;
        await updateDoc(taskRef, {
          completed: true,
          completedAt: new Date().toISOString(),
          focusTimeSpent: verifyingTask.focusTimeSpent + focusTimeSpent,
          inactivityLog: [...(verifyingTask.inactivityLog || []), ...inactivityLog]
        });

        setTasks((prev) =>
          prev.map((t) =>
            t.id === verifyingTask.id
              ? {
                  ...t,
                  completed: true,
                  completedAt: new Date().toISOString(),
                  focusTimeSpent: t.focusTimeSpent + focusTimeSpent,
                  inactivityLog: [...(t.inactivityLog || []), ...inactivityLog]
                }
              : t
          )
        );
      } else {
        await updateDoc(taskRef, { completed: true, completedAt: new Date().toISOString() });
        setTasks((prev) =>
          prev.map((t) =>
            t.id === verifyingTask.id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
          )
        );
      }
    } catch (err) {
      console.error("Error handling verification success:", err);
    } finally {
      setVerifyingTask(null);
      setPendingFocusComplete(null);
      setActiveFocusTask(null);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("Delete task error:", err);
    }
  };

  const handleClearAllTasks = async () => {
    const uid = user ? user.uid : guestId;
    if (!uid) return;

    try {
      const q = query(collection(db, "tasks"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(docSnapshot => deleteDoc(doc(db, "tasks", docSnapshot.id)));
      await Promise.all(deletePromises);
      setTasks([]);
    } catch (err) {
      console.error("Error clearing all tasks:", err);
    }
  };

  const handleFocusCompleted = async (focusTimeSpent: number, inactivityRecords: any[]) => {
    if (!activeFocusTask) return;

    setPendingFocusComplete({
      focusTimeSpent,
      inactivityLog: inactivityRecords
    });
    setVerifyingTask(activeFocusTask);
    setActiveFocusTask(null);
  };



  // Auth/Onboarding Load Checks
  if (authLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#090A15] p-6 z-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-bounce">
            <PulseLogo className="w-12 h-12 rounded-full" isNight={true} />
          </div>
          <span className="text-[10px] font-mono text-purple-400/80 uppercase tracking-widest animate-pulse">
            Syncing workspace...
          </span>
        </div>
      </div>
    );
  }

  if (activeFocusTask) {
    return (
      <ExecutionLayer
        task={activeFocusTask}
        onComplete={handleFocusCompleted}
        onCancel={() => setActiveFocusTask(null)}
        tasks={tasks}
      />
    );
  }

  if (!user && !isGuest && !authLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-center items-center p-6 bg-[#090A15] text-[#F5F4EE]">
        {/* Background Atmosphere */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-950/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-md bg-[#0E101F]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center space-y-8 relative">
          <div className="space-y-3">
            <PulseLogo className="w-16 h-16 rounded-2xl mx-auto shadow-lg" isNight={true} />
            <h1 className="font-display font-black text-3xl text-white tracking-tight">Pulse</h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto font-sans">
              Welcome to your system engine. Align your cognitive cycles, track proof of work, and build your baseline.
            </p>
          </div>

          <div className="space-y-3.5">
            <button
              onClick={handleGoogleLogin}
              className="w-full inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 bg-[#FAF9F5] hover:bg-white text-[#0A0C18] rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Sign In with Google</span>
            </button>

            <button
              onClick={handleGuestLogin}
              className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Continue as Guest</span>
            </button>
          </div>

          {authError && (
            <p className="text-[10px] text-rose-400 font-medium leading-relaxed max-w-xs mx-auto">
              {authError}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (profile === null && !authLoading && (user || isGuest)) {
    return <Onboarding userId={user?.uid || guestId} onComplete={handleOnboardingComplete} />;
  }

  const defaultUserDisplayName = profile?.name || user?.displayName || "Tommy";
  const unfinishedCount = tasks.filter(t => !t.completed).length;

  return (
    <div className={`min-h-screen flex font-sans relative select-none transition-colors duration-500 ${
      timeOverride === "night" ? "bg-[#090A15] text-[#F2F0EA]" : "bg-[#FAF9F5] text-[#1C1D26]"
    }`}>


      {/* 2. Full-Screen Morning Session Layer */}
      <AnimatePresence>
        {currentView === "morning-brief" && (
          <div className="fixed inset-0 z-50 bg-[#090A15] overflow-y-auto flex flex-col items-center justify-start p-4 md:p-6">
            <MorningLayer
              userName={defaultUserDisplayName}
              briefing={briefing}
              onClose={() => setCurrentView("workspace")}
              timeOfDay={timeOverride}
              tasks={tasks}
              journals={journals}
              behaviorPatterns={behaviorPatterns}
              onTasksAdded={handleAddTasks}
            />
          </div>
        )}
      </AnimatePresence>

      {/* 3. Fully Redesigned Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setCurrentView("workspace");
        }}
        onLaunchPlanning={() => setCurrentView("morning-brief")}
        profile={profile}
        userName={defaultUserDisplayName}
        email={user?.email || "guest@pulse.ai"}
        onLogout={handleLogout}
        mode={timeOverride}
      />

      {/* 4. Primary Workspace Main Canvas */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto pb-32">
        {/* Dynamic Theme Control Header Band */}
        <header className={`px-6 md:px-8 py-4 border-b flex items-center justify-between backdrop-blur-md sticky top-0 z-20 transition-colors duration-500 ${
          timeOverride === "night"
            ? "border-white/5 bg-black/10"
            : "border-black/5 bg-[#FAF9F5]/80"
        }`}>
          <div className="flex items-center space-x-2">
            <span className={`text-[10px] font-mono uppercase tracking-widest ${
              timeOverride === "night" ? "text-slate-300 font-semibold" : "text-slate-800 font-bold"
            }`}>
              Workspace Environment
            </span>
          </div>

          {/* Mode Selector Switcher */}
          <div className={`flex p-1 rounded-full border transition-all duration-500 ${
            timeOverride === "night"
              ? "bg-black/30 border-white/5"
              : "bg-[#EAE8DE] border-[#D3D1C5]"
          }`}>
            <button
              onClick={() => setTimeOverride("night")}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                timeOverride === "night"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-950/40"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Moon className="w-3 h-3" />
              <span>NIGHT MODE</span>
            </button>
            <button
              onClick={() => setTimeOverride("morning")}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                timeOverride === "morning"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-950/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sun className="w-3 h-3" />
              <span>MORNING MODE</span>
            </button>
          </div>
        </header>

        {/* Dynamic Tab Panel Views */}
        <AnimatePresence mode="wait">
          {activeTab === "tasks" && (
            <motion.div
              key="tasks-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="px-6 md:px-8 py-6 md:py-8 space-y-8 max-w-5xl w-full mx-auto"
            >
              {/* LANDSCAPE HERO BACKDROP CARD */}
              <div className="relative overflow-hidden rounded-[32px] border border-white/5 min-h-[220px] md:min-h-[280px] p-6 md:p-8 flex flex-col justify-between shadow-2xl group">
                {/* Background image illustration */}
                <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden rounded-[32px]">
                  <img
                    src={
                      timeOverride === "night"
                        ? "https://images.unsplash.com/photo-1558868630-ecfdd6306e51?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        : "https://images.unsplash.com/photo-1445561696415-deadc6a2adaa?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    }
                    alt="Lakeside Glass House"
                    className="absolute inset-0 w-full h-full object-cover rounded-3xl opacity-60 transform scale-100 group-hover:scale-[1.01] transition-transform duration-1000 select-none"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle darkening overlay for premium typography read */}
                  <div className={`absolute inset-0 transition-opacity duration-1000 ${
                    timeOverride === "night" 
                      ? "bg-gradient-to-t from-[#090A15] via-black/40 to-transparent opacity-95" 
                      : "bg-gradient-to-t from-[#0E101F]/80 via-black/30 to-transparent opacity-85"
                  }`} />
                </div>

                {/* Left Aligned Content */}
                <div className="relative z-10 space-y-1.5 max-w-xl self-end md:self-auto mb-4 md:mb-0">
                  <h2 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight leading-tight">
                    {timeOverride === "night" ? "Evening, " : "Rise and shine, "}
                    <span className="capitalize">{defaultUserDisplayName}</span>
                  </h2>
                  <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed max-w-md">
                    {timeOverride === "night" 
                      ? "Your behavioral profile is compiled and ready. Let's analyze yesterday and plan smarter."
                      : `Yesterday left ${unfinishedCount || 2} promises unfinished. Let's fix that today.`
                    }
                  </p>
                  <div className="pt-2">
                    {timeOverride === "night" ? (
                      <button
                        onClick={() => setActiveTab("intelligence")}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-2xl text-[11px] font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-purple-950/50"
                      >
                        <span>View Insights</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentView("morning-brief")}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-white rounded-2xl text-[11px] font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-amber-950/40"
                      >
                        <span>Start My Day</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Aligned Widgets Layer */}
                <div className="relative z-10 flex flex-row md:flex-col gap-3 md:self-end self-start items-end justify-end md:absolute md:top-8 md:right-8">
                  {/* DIGITAL CLOCK */}
                  <div className="bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/5 shadow-lg text-right min-w-[120px]">
                    <span className="text-[8px] font-mono tracking-widest text-slate-400 uppercase font-bold block">
                      Local Time
                    </span>
                    <span className="text-xl font-bold font-display text-white mt-0.5 block leading-tight">
                      {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                    <span className="text-[9px] text-slate-300 font-mono">
                      {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>


                </div>
              </div>

              {/* HIGH-FIDELITY BENTO GRID GRID */}
              {timeOverride === "night" ? (
                // --- NIGHT MODE BENTO GRID LAYOUT ---
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Column 1: Star constellation (takes 2 columns span on large screens) */}
                  <div className="md:col-span-2 space-y-6">
                    <ConstellationMap 
                      tasks={tasks} 
                      onTaskClick={(task) => {
                        setActiveFocusTask(task);
                      }}
                    />
                    
                    {/* Today's Journey Checklist / timeline */}
                    <TodayTimeline
                      tasks={tasks}
                      mode="night"
                      onTriggerProofUpload={(task) => setVerifyingTask(task)}
                      onToggleComplete={(taskId, curr) => toggleTaskCompleted(taskId, curr)}
                      onLaunchPlanning={() => setCurrentView("morning-brief")}
                    />
                  </div>

                  {/* Column 2: Side panels */}
                  <div className="space-y-6">
                    {/* Dump zone */}
                    <DumpZone mode="night" />

                    {/* Recent Proofs gallery preview */}
                    <RecentProofs 
                      tasks={tasks} 
                      onViewAll={() => setActiveTab("proofs")}
                    />
                  </div>
                </div>
              ) : (
                // --- MORNING MODE BENTO GRID LAYOUT ---
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Column 1: Today's schedule vertical timeline */}
                  <div className="md:col-span-2 space-y-6">
                    <TodayTimeline
                      tasks={tasks}
                      mode="morning"
                      onTriggerProofUpload={(task) => setVerifyingTask(task)}
                      onToggleComplete={(taskId, curr) => toggleTaskCompleted(taskId, curr)}
                      onLaunchPlanning={() => setCurrentView("morning-brief")}
                    />
                    
                    {/* Quick mind dump box */}
                    <DumpZone mode="morning" />
                  </div>

                  {/* Column 2: Side panels */}
                  <div className="space-y-6">
                    {/* Pulse Assistant morning advice */}
                    <div className="relative rounded-3xl p-5 border border-[#E2E1D9] bg-white shadow-sm min-h-[130px] flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-mono tracking-widest text-amber-800 uppercase font-bold block">
                          Pulse Assistant
                        </span>
                        <p className="text-[11px] leading-relaxed italic text-slate-800 font-serif font-semibold mt-2.5">
                          "Let's not romanticize procrastination today, yeah? Hit that workout and then lock into deep coding."
                        </p>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => console.log("Pulse Assistant is watching you. Stay locked in.")}
                          className="px-3 py-1 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-900 border border-amber-200 rounded-xl text-[9px] font-bold uppercase cursor-pointer"
                        >
                          I hear you
                        </button>
                      </div>
                    </div>

                    {/* Calendar Agenda Sync */}
                    <div className="relative rounded-3xl p-5 border border-[#E2E1D9] bg-white shadow-sm min-h-[130px] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono tracking-widest text-slate-700 uppercase font-bold">
                            Calendar Sync
                          </span>
                          <span className="text-[8px] font-mono text-slate-600 font-bold">Next up</span>
                        </div>
                        
                        <div className="flex items-start space-x-3 mt-3">
                          <Calendar className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                          <div>
                            <h5 className="text-[11px] font-bold text-slate-900">Deep Work: Project</h5>
                            <p className="text-[9px] text-slate-700 font-mono font-bold mt-0.5">9:00 AM - 11:00 AM</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-right">
                        <button 
                          onClick={() => setActiveTab("calendar")}
                          className="text-[9px] font-mono text-slate-700 hover:text-black font-bold cursor-pointer"
                        >
                          View day schedule →
                        </button>
                      </div>
                    </div>

                    {/* Proof Reminder rule card */}
                    <div className="relative rounded-3xl p-5 border border-rose-200 bg-rose-50 shadow-sm min-h-[110px] flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-mono tracking-widest text-rose-700 uppercase font-bold block">
                          Proof Reminder
                        </span>
                        <p className="text-[10px] leading-relaxed text-rose-900 mt-2 font-bold">
                          You can't complete a task without proof. I don't play around. Keep those screenshots ready.
                        </p>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button 
                          onClick={() => console.log("Proof protocol accepted!")}
                          className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[9px] font-bold uppercase border border-rose-300 cursor-pointer"
                        >
                          Got it
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "calendar" && (
            <motion.div
              key="calendar-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <CalendarView mode={timeOverride} tasks={tasks} onClearAllTasks={handleClearAllTasks} isGuest={isGuest} />
            </motion.div>
          )}

          {activeTab === "journal" && (
            <motion.div
              key="journal-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="px-6 md:px-8 py-6 max-w-4xl mx-auto w-full"
            >
              <JournalLayer
                userId={user ? user.uid : guestId}
                onJournalSaved={(newJournal) => setJournals((prev) => [newJournal, ...prev])}
                tasks={tasks}
                mode={timeOverride}
              />
            </motion.div>
          )}

          {activeTab === "proofs" && (
            <motion.div
              key="proofs-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <ProofsView tasks={tasks} mode={timeOverride} />
            </motion.div>
          )}

          {activeTab === "intelligence" && (
            <motion.div
              key="intelligence-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="px-6 md:px-8 py-6 max-w-4xl mx-auto w-full"
            >
              <IntelligenceLayer tasks={tasks} journals={journals} mode={timeOverride} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom Input Bar for quick scheduler */}
      {currentView === "workspace" && activeTab === "tasks" && (
        <div className="fixed bottom-6 left-6 right-6 md:left-[250px] md:right-0 md:mx-auto md:max-w-xl z-20">
          <InputLayer onTasksAdded={handleAddTasks} />
        </div>
      )}

      {/* Dynamic AI Verification Proof Modal */}
      <AnimatePresence>
        {verifyingTask && (
          <VerificationModal
            task={verifyingTask}
            onVerified={handleVerificationSuccess}
            onCancel={() => {
              setVerifyingTask(null);
              setPendingFocusComplete(null);
            }}
          />
        )}
      </AnimatePresence>


    </div>
  );
}
