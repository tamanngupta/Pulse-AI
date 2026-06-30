export type TimeState = "morning" | "day" | "night";

import { Task, Journal, UserProfile } from "./types";

export function getTimeOfDay(): TimeState {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return "morning";
  } else if (hour >= 12 && hour < 17) {
    return "day";
  } else {
    return "night";
  }
}

export function isAtOrAfterPlanningTime(profile: UserProfile | null): boolean {
  if (!profile) return false;
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  let targetHour = 8; // default morning
  let targetMin = 0;

  if (profile.preferredPlanningTime === "morning") {
    targetHour = 8;
    targetMin = 0;
  } else if (profile.preferredPlanningTime === "night") {
    targetHour = 21;
    targetMin = 30;
  } else if (profile.preferredPlanningTime === "custom" && profile.customPlanningTime) {
    const timeStr = profile.customPlanningTime.trim();
    const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)?$/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = match[3];
      if (ampm) {
        if (ampm.toUpperCase() === "PM" && h < 12) h += 12;
        if (ampm.toUpperCase() === "AM" && h === 12) h = 0;
      }
      targetHour = h;
      targetMin = m;
    } else {
      const parts = timeStr.split(":");
      if (parts.length >= 2) {
        targetHour = parseInt(parts[0], 10) || 8;
        targetMin = parseInt(parts[1], 10) || 0;
      }
    }
  }

  if (currentHour > targetHour) {
    return true;
  } else if (currentHour === targetHour) {
    return currentMin >= targetMin;
  }
  return false;
}

// Accent & general mood tints based on time of day (Layer 2 atmosphere tint)
export function getAtmosphereMood(timeOfDay: TimeState) {
  switch (timeOfDay) {
    case "morning":
      return {
        accentText: "text-amber-200",
        accentBg: "bg-amber-500/10 border-amber-500/20",
        subtleGlow: "shadow-[0_0_20px_rgba(251,191,36,0.05)]",
        quoteClass: "font-serif text-[#F2F0EA] italic leading-relaxed",
        quoteContainer: "border-l-2 border-amber-400/40 pl-4 py-1"
      };
    case "day":
      return {
        accentText: "text-sky-200",
        accentBg: "bg-sky-500/10 border-sky-500/20",
        subtleGlow: "shadow-[0_0_20px_rgba(56,189,248,0.05)]",
        quoteClass: "font-serif text-[#F2F0EA] italic leading-relaxed",
        quoteContainer: "border-l-2 border-sky-400/40 pl-4 py-1"
      };
    case "night":
    default:
      return {
        accentText: "text-indigo-200",
        accentBg: "bg-indigo-500/10 border-indigo-500/20",
        subtleGlow: "shadow-[0_0_20px_rgba(129,140,248,0.05)]",
        quoteClass: "font-serif text-[#F2F0EA] italic leading-relaxed",
        quoteContainer: "border-l-2 border-indigo-400/40 pl-4 py-1"
      };
  }
}

export interface ContextualObservations {
  planningObservation: string;
  creatingObservation: string;
  completingObservation: string;
  openingObservation: string;
  generalInsight: string;
}

export function generateContextualObservations(
  tasks: Task[],
  journals: Journal[],
  profile: UserProfile | null
): ContextualObservations {
  const name = profile?.name || "Champion";
  const dailyGoal = profile?.dailyTaskGoal || 4;

  // 1. Unfinished yesterday or postponed tasks
  const now = new Date();
  const unfinishedYesterday = tasks.filter(t => {
    if (t.completed) return false;
    const createdDate = new Date(t.createdAt);
    // created yesterday or older
    return (now.getTime() - createdDate.getTime()) > 24 * 60 * 60 * 1000;
  });

  const dsaTask = unfinishedYesterday.find(t => t.title.toLowerCase().includes("dsa") || t.title.toLowerCase().includes("code") || t.title.toLowerCase().includes("study"));
  const yesterdayUnfinishedText = dsaTask 
    ? `You left "${dsaTask.title}" unfinished yesterday. Want to start with that?`
    : unfinishedYesterday.length > 0
    ? `You left ${unfinishedYesterday.length} unfinished tasks yesterday, starting with "${unfinishedYesterday[0].title}". Want to clean that up first?`
    : "Your plate was clean yesterday! Incredible. Let's keep the streak hot.";

  // 2. Gym / Workout post-pone check
  const workoutTasks = tasks.filter(t => {
    const title = t.title.toLowerCase();
    return title.includes("gym") || title.includes("workout") || title.includes("run") || title.includes("exercise");
  });
  const uncompletedWorkouts = workoutTasks.filter(t => !t.completed);
  const completedWorkoutsThisWeek = workoutTasks.filter(t => {
    if (!t.completed || !t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    return (now.getTime() - completedDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
  });

  let planningObservation = yesterdayUnfinishedText;
  let generalInsight = "You're building premium habits. Don't let up.";

  // 3. Connect Journal to Planning (Journal becomes memory)
  const lastJournal = journals[0];
  const lastJournalText = lastJournal?.content.toLowerCase() || "";
  const lastJournalExhausted = lastJournalText.includes("exhausted") || lastJournalText.includes("tired") || lastJournalText.includes("fatigue");

  // Check if planning workout late
  const planningLateWorkout = uncompletedWorkouts.some(w => {
    const deadline = w.deadline?.toLowerCase() || "";
    return deadline.includes("pm") || deadline.includes("9") || deadline.includes("night") || deadline.includes("evening");
  });

  if (lastJournalExhausted && planningLateWorkout) {
    planningObservation = `You mentioned being exhausted after your workout in yesterday's journal. Since you're planning a late fitness session again, you may want to move it earlier.`;
    generalInsight = `Memory recall: Yesterday's journal noted peak fatigue. Deferring late physical blocks is highly advised today.`;
  } else if (uncompletedWorkouts.length >= 3) {
    planningObservation = `You've postponed your last three workouts. Pretending you're going to the gym at midnight is a bold strategy. Let's make it real today.`;
  } else if (tasks.filter(t => !t.completed).length > dailyGoal) {
    planningObservation = `You're planning ${tasks.filter(t => !t.completed).length} focus tasks. Realistically, you usually complete around ${dailyGoal}. Let's prioritize the top 3.`;
  }

  // 4. Contextual Observations for Creating / Scheduling
  let creatingObservation = "Add a crisp title. Pulse automatically indexes dependencies.";
  if (uncompletedWorkouts.length > 1) {
    creatingObservation = "You've postponed workouts twice this week already. Let's schedule it for early morning instead.";
  } else {
    creatingObservation = "Pro tip: You usually finish coding and heavy focus tasks before noon. Put them early!";
  }

  // 5. Contextual Observations for Completing
  let completingObservation = "Focus block complete. Future You is officially less stressed.";
  if (completedWorkoutsThisWeek.length > 0) {
    completingObservation = `Nice! That's your ${completedWorkoutsThisWeek.length + 1}th workout logged this week. Consistent.`;
  } else if (tasks.filter(t => t.completed).length >= dailyGoal) {
    completingObservation = `Realistic target achieved! That's ${tasks.filter(t => t.completed).length} tasks completed today. Go touch grass.`;
  }

  // 6. Contextual Observations for opening today's tasks
  let openingObservation = "Welcome back. Let's map out a premium, balanced agenda.";
  const completedYesterday = tasks.filter(t => {
    if (!t.completed || !t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    return (now.getTime() - completedDate.getTime()) < 36 * 60 * 60 * 1000;
  });

  if (completedYesterday.length > 5) {
    openingObservation = `Yesterday was packed (${completedYesterday.length} tasks completed!). Let's make today a little lighter to avoid burnout.`;
  } else if (unfinishedYesterday.length > 3) {
    openingObservation = "A lot of backlog carried over. Let's declutter and delete what doesn't matter.";
  }

  return {
    planningObservation,
    creatingObservation,
    completingObservation,
    openingObservation,
    generalInsight
  };
}

