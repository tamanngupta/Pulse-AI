export interface Task {
  id: string;
  userId: string;
  title: string;
  deadline?: string;
  priority: "high" | "medium" | "low";
  category: string;
  estimatedDuration: number; // in minutes
  reminders?: string[];
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  focusTimeSpent: number; // in seconds
  inactivityLog?: InactivityRecord[];
}

export interface InactivityRecord {
  timestamp: string;
  duration: number; // in seconds
  comment?: string;
}

export interface Journal {
  id: string;
  userId: string;
  createdAt: string; // "YYYY-MM-DD"
  content: string;
  wins: string[];
  mistakes: string[];
  energyLevel: "high" | "medium" | "low";
  patterns: string[];
  procrastinationCauses: string[];
  aiScore: number; // 1-10
  skipPrediction: string;
}

export interface DailyBriefing {
  greeting: string;
  workloadSummary: string;
  suggestedFirstTask: string;
  skipPredictionWarning: string;
  yesterdayJournalInsight: string;
  estimatedWorkload: number; // minutes
}

export interface IntelligenceReport {
  skipPrediction: string;
  patterns: string[];
  workloadAdjustments: string[];
  dailyScore: number;
  weeklyReview: string;
  monthlyTrends: string;
}

export interface UserProfile {
  name: string;
  preferredPlanningTime: "morning" | "night" | "custom";
  customPlanningTime?: string; // "HH:MM" format
  planType: "current" | "next";
  productiveHours: string;
  bedtime: string;
  dailyTaskGoal: number;
  onboardingCompleted: boolean;
  streak?: number;
}

export interface BehaviorPattern {
  id?: string;
  userId: string;
  category: string;
  title: string;
  scheduledTime: string;
  duration: number; // in minutes
  densityContext: string; // e.g. "high total task duration", "packed day (5 tasks)"
  completed: boolean;
  statedReason: string; // from journal, empty if none
  createdAt: string; // ISO string
}
