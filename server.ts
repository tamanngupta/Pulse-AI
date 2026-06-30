import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Use JSON body parser with generous limit for image uploads
app.use(express.json({ limit: "15mb" }));

// Lazy init of Google Gen AI to prevent startup crashes if key is missing
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Running in mock fallback mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Resilient wrapper to automatically retry with lighter fallback models when primary experiences high demand / 503 / 429
async function generateContentWithFallback(ai: GoogleGenAI, params: { model: string, contents: any, config?: any }) {
  try {
    return await ai.models.generateContent(params);
  } catch (error: any) {
    const errorMsg = error?.message || "";
    const isRateLimitOrUnavailable = 
      errorMsg.includes("503") ||
      errorMsg.includes("UNAVAILABLE") ||
      errorMsg.includes("demand") ||
      errorMsg.includes("limit") ||
      errorMsg.includes("429") ||
      errorMsg.includes("resource") ||
      errorMsg.includes("exhausted");

    if (isRateLimitOrUnavailable) {
      console.log(`[GEMINI] Model ${params.model} is experiencing high demand. Trying 'gemini-3.1-flash-lite' fallback...`);
      try {
        return await ai.models.generateContent({
          ...params,
          model: "gemini-3.1-flash-lite"
        });
      } catch (fallbackError: any) {
        console.log(`[GEMINI] 'gemini-3.1-flash-lite' failed, trying 'gemini-flash-latest'...`);
        try {
          return await ai.models.generateContent({
            ...params,
            model: "gemini-flash-latest"
          });
        } catch (innerError: any) {
          console.warn("[GEMINI] All Gemini models exhausted. Propagating to trigger local offline heuristics.");
          throw innerError;
        }
      }
    }
    throw error;
  }
}

// Custom system instructions for the Pulse Sarcastic/Playful AI Personality
const PULSE_SYSTEM_INSTRUCTION = `
You are the brain of "Pulse", an elite, highly premium, slightly sarcastic, and clever AI productivity companion.
Your tone is like a witty PG-13 best friend—playful, chaotic, slightly mocking but fundamentally supportive.
You never sound corporate, robotic, or dry-motivational.
Use short, punchy remarks.
Examples:
- "I adjusted today's schedule because pretending you'd wake up at 6 wasn't happening."
- "Nice. Future You is officially less stressed."
- "That quick check became a small vacation."
- "I don't trust you with this assignment today, let's start with something easier."
`;

// API Routes

// 1. Parse Natural Language Task
app.post("/api/gemini/parse-task", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  const ai = getAI();
  if (!ai) {
    // Fallback Mock Parser
    console.log("Mocking task parse for text:", text);
    const tasks: any[] = [];
    const parts = text.includes(",") ? text.split(",") : text.split(/\n+/);
    for (let part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const hasHigh = trimmed.toLowerCase().includes("urgent") || trimmed.toLowerCase().includes("important") || trimmed.toLowerCase().includes("finish");
      const priority = hasHigh ? "high" : trimmed.toLowerCase().includes("gym") ? "low" : "medium";
      const category = trimmed.toLowerCase().includes("gym") || trimmed.toLowerCase().includes("workout") ? "Health" :
                       trimmed.toLowerCase().includes("dsa") || trimmed.toLowerCase().includes("physics") || trimmed.toLowerCase().includes("exam") ? "Study" : "Work";
      tasks.push({
        title: trimmed.replace(/(tomorrow|friday|today|at \d+|gym|finish|dsa|physics)/gi, "").trim() || trimmed,
        deadline: trimmed.toLowerCase().includes("tomorrow") ? "Tomorrow" : trimmed.toLowerCase().includes("friday") ? "Friday" : "Today",
        priority,
        category,
        estimatedDuration: trimmed.toLowerCase().includes("gym") ? 60 : 45,
        reminders: ["Before starting", "30 mins before"]
      });
    }
    return res.json({ tasks });
  }

  try {
    const prompt = `
      Analyze this task input text: "${text}".
      Identify all the distinct tasks described in the input.
      The user might have entered a single task, a comma-separated list, bullet points, a numbered list, or a natural language sentence describing multiple activities (e.g., "finish assignment, then go to the gym and buy groceries").
      Extract each distinct activity as a separate task object.
      
      Return a JSON object with a "tasks" key containing an array of structured tasks:
      {
        "tasks": [
          {
            "title": "Short descriptive title of the task",
            "deadline": "Extracted deadline string, e.g., 'Friday', 'Tomorrow', '2026-06-30' or empty",
            "priority": "high" | "medium" | "low",
            "category": "Work" | "Study" | "Health" | "Personal" | "Finance",
            "estimatedDuration": number (estimated minutes to complete, e.g., 45),
            "reminders": ["string reminder triggers, e.g. '1 hour before'"]
          }
        ]
      }
      Strictly return ONLY JSON in your response. Do not enclose it in markdown blocks.
    `;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: PULSE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.warn("Notice: Using offline fallback for parse-task due to Gemini service unavailability:", error?.message || error);
    // FALLBACK
    const tasks: any[] = [];
    const parts = text.includes(",") ? text.split(",") : text.split(/\n+/);
    for (let part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const hasHigh = trimmed.toLowerCase().includes("urgent") || trimmed.toLowerCase().includes("important") || trimmed.toLowerCase().includes("finish");
      const priority = hasHigh ? "high" : trimmed.toLowerCase().includes("gym") ? "low" : "medium";
      const category = trimmed.toLowerCase().includes("gym") || trimmed.toLowerCase().includes("workout") ? "Health" :
                       trimmed.toLowerCase().includes("dsa") || trimmed.toLowerCase().includes("physics") || trimmed.toLowerCase().includes("exam") ? "Study" : "Work";
      tasks.push({
        title: trimmed.replace(/(tomorrow|friday|today|at \d+|gym|finish|dsa|physics)/gi, "").trim() || trimmed,
        deadline: trimmed.toLowerCase().includes("tomorrow") ? "Tomorrow" : trimmed.toLowerCase().includes("friday") ? "Friday" : "Today",
        priority,
        category,
        estimatedDuration: trimmed.toLowerCase().includes("gym") ? 60 : 45,
        reminders: ["Before starting", "30 mins before"]
      });
    }
    res.json({ tasks });
  }
});

// 2. Parse Notebook/Journal Handwriting or Screenshot Upload (Multimodal Vision)
app.post("/api/gemini/parse-image", async (req, res) => {
  const { imageBase64, mimeType } = req.body;
  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: "imageBase64 and mimeType are required" });
  }

  const ai = getAI();
  if (!ai) {
    // Fallback Mock Image Parsing
    return res.json({
      tasks: [
        {
          title: "Physics Assignment Review",
          deadline: "This Friday",
          priority: "high",
          category: "Study",
          estimatedDuration: 90,
          reminders: ["Review guidelines"]
        },
        {
          title: "Buy Groceries & Restock",
          deadline: "Tomorrow",
          priority: "medium",
          category: "Personal",
          estimatedDuration: 30,
          reminders: []
        }
      ]
    });
  }

  try {
    const prompt = `
      Analyze this image (which may be a handwritten page, journal notebook, syllabus, whiteboard, Gmail screenshot, Discord screenshot, or slides).
      Detect any deadlines, homework assignments, meetings, fitness workouts, chores, or general tasks.
      Return a JSON array of structured tasks.
      Use this JSON schema:
      {
        "tasks": [
          {
            "title": "Task title",
            "deadline": "Deadline description",
            "priority": "high" | "medium" | "low",
            "category": "Work" | "Study" | "Health" | "Personal",
            "estimatedDuration": number (in minutes, guess if not specified),
            "reminders": ["string"]
          }
        ]
      }
      Strictly return ONLY the JSON object. Do not enclose in markdown blocks.
    `;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBase64
          }
        },
        prompt
      ],
      config: {
        systemInstruction: PULSE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.warn("Notice: Using offline fallback for parse-image due to Gemini service unavailability:", error?.message || error);
    res.json({
      tasks: [
        {
          title: "Physics Assignment Review",
          deadline: "This Friday",
          priority: "high",
          category: "Study",
          estimatedDuration: 90,
          reminders: ["Review guidelines"]
        },
        {
          title: "Buy Groceries & Restock",
          deadline: "Tomorrow",
          priority: "medium",
          category: "Personal",
          estimatedDuration: 30,
          reminders: []
        }
      ]
    });
  }
});

// 3. Audio / Voice Input transcription & task creation
app.post("/api/gemini/transcribe-audio", async (req, res) => {
  const { audioBase64, mimeType } = req.body;
  if (!audioBase64) {
    return res.status(400).json({ error: "audioBase64 is required" });
  }

  const ai = getAI();
  if (!ai) {
    // Mock Transcription Fallback
    return res.json({
      transcription: "Complete coding assignments for next week before Thursday",
      task: {
        title: "Complete coding assignments",
        deadline: "Thursday",
        priority: "high",
        category: "Study",
        estimatedDuration: 120,
        reminders: ["Start early"]
      }
    });
  }

  try {
    const prompt = `
      This is a voice note recorded by the user.
      1. Transcribe the spoken audio as accurately as possible.
      2. If the text describes a productivity task (e.g., "gym at 7", "need to finish writing physics paper tomorrow"), format it into a structured task.
      Return a JSON object:
      {
        "transcription": "The full exact text transcription of the spoken words",
        "task": {
          "title": "Task title",
          "deadline": "Deadline description",
          "priority": "high" | "medium" | "low",
          "category": "Work" | "Study" | "Health" | "Personal",
          "estimatedDuration": number,
          "reminders": ["string"]
        } (set to null if no task is spoken)
      }
      Strictly return ONLY the JSON object. Do not enclose in markdown blocks.
    `;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "audio/mp3",
            data: audioBase64
          }
        },
        prompt
      ],
      config: {
        systemInstruction: PULSE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.warn("Notice: Using offline fallback for transcribe-audio due to Gemini service unavailability:", error?.message || error);
    res.json({
      transcription: "Complete coding assignments for next week before Thursday",
      task: {
        title: "Complete coding assignments",
        deadline: "Thursday",
        priority: "high",
        category: "Study",
        estimatedDuration: 120,
        reminders: ["Start early"]
      }
    });
  }
});

// 4. Generate Daily Morning Brief
app.post("/api/gemini/morning-brief", async (req, res) => {
  const { userName, tasks, yesterdayJournal, dayContext } = req.body;

  const ai = getAI();
  if (!ai) {
    return res.json({
      greeting: `Morning, ${userName || "friend"}. I adjusted today's schedule because pretending you'd wake up early wasn't happening.`,
      workloadSummary: "You have 3 tasks waiting for you, totaling roughly 2 hours of screen-glaring. Your typical pattern is skipping these after lunch.",
      suggestedFirstTask: "Physics Assignment Review",
      skipPredictionWarning: "You usually skip reading tasks after coding sessions. Let's do the hard thing first.",
      yesterdayJournalInsight: "Yesterday you wrote that you fell down a YouTube rabbit hole. Let's avoid that potato energy today.",
      estimatedWorkload: 120
    });
  }

  try {
    const prompt = dayContext ? `
      User Info: Name is ${userName || "User"}.
      Day Context: ${JSON.stringify(dayContext)}
      Today's Tasks to plan: ${JSON.stringify(tasks || [])}

      Generate a custom, immersive, highly stylized daily morning briefing based on the Day Context.
      Your briefing must pull from three sources in this exact order:
      1. Yesterday's schedule data (completed/skipped tasks, durations).
      2. Journal entries since the last brief (wins, mistakes, energy levels, procrastination reasons).
      3. Stored behavior patterns (matching schedule shapes, categories, and conditions).

      CRITICAL: You must construct a clear, explicit causal chain in 'skipPredictionWarning' and 'workloadSummary' that connects a specific past event to a specific reason from the journal, and then to a specific prediction/recommendation about today.
      For example: if yesterday's journal entry said the user scrolled instead of going to the gym, and yesterday had a packed task load, the briefing for today's similarly packed day must say something like: "Last time your day looked like this, you skipped gym and journaled that you ended up scrolling instead — today's just as packed, so let's plan the gym block somewhere it's actually going to happen".
      The causal chain (past schedule shape -> past behavior -> journaled reason -> relevance to today) must be explicit and legible in your generated copy. Avoid vague warnings.

      Ensure the greeting is hilarious, sarcastic, PG-13, and acts like a witty companion.
      Start the greeting by addressing the user by their name (e.g., "Hey [Name], it's planning time — let's look at yesterday first." or a witty PG-13 variation of that).

      Output exactly a JSON object matching this schema:
      {
        "greeting": "A punchy, slightly sarcastic greeting addressing them by name and prompting them to plan (max 25 words)",
        "workloadSummary": "A realistic, causal, and witty summary of yesterday's outcomes, journaled reasons, and how it impacts today's planning (max 65 words)",
        "suggestedFirstTask": "The exact title of the task they should tackle first based on past patterns to avoid procrastination",
        "skipPredictionWarning": "The explicit causal warning/prediction connecting past shape + behavior + journal reason to today (e.g. 'Since you skipped gym yesterday because you got distracted scrolling after a 3-hour focus session, today's 4-hour workload means you will probably skip gym again unless you do it first.') (max 60 words)",
        "yesterdayJournalInsight": "A witty insight/reference back to what they wrote in their journal yesterday",
        "estimatedWorkload": number (total estimated time in minutes for today's active tasks)
      }
      Strictly return ONLY JSON.
    ` : `
      User Info: Name is ${userName || "User"}.
      Current Task Workload: ${JSON.stringify(tasks || [])}
      Yesterday's Journal Log: ${JSON.stringify(yesterdayJournal || "No journal submitted")}

      Generate a custom, immersive, highly stylized daily morning briefing.
      Ensure the greeting is hilarious, sarcastic, PG-13, and acts like a witty friend. Do not use generic motivational quotes.
      Output exactly a JSON object matching this schema:
      {
        "greeting": "A punchy, slightly sarcastic time-aware greeting (max 25 words)",
        "workloadSummary": "A realistic and witty summary of today's workload (e.g. 'You've got 4 things to do...')",
        "suggestedFirstTask": "The exact title of the task they should tackle first to avoid procrastination",
        "skipPredictionWarning": "A humorous warning prediction of which task they are likely to skip based on patterns",
        "yesterdayJournalInsight": "A witty insight/reference back to what they wrote in their journal yesterday",
        "estimatedWorkload": number (total estimated time in minutes)
      }
      Strictly return ONLY JSON.
    `;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: PULSE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.warn("Notice: Using offline fallback for morning-brief due to Gemini service unavailability:", error?.message || error);
    res.json({
      greeting: `Morning, ${userName || "friend"}. I adjusted today's schedule because pretending you'd wake up early wasn't happening.`,
      workloadSummary: "You have 3 tasks waiting for you, totaling roughly 2 hours of screen-glaring. Your typical pattern is skipping these after lunch.",
      suggestedFirstTask: tasks?.[0]?.title || "Physics Assignment Review",
      skipPredictionWarning: "You usually skip reading tasks after coding sessions. Let's do the hard thing first.",
      yesterdayJournalInsight: yesterdayJournal ? "Yesterday you mentioned being a bit tired. Let's focus on finishing high-priority items." : "No entry from yesterday, so no excuse to hold back today.",
      estimatedWorkload: 120
    });
  }
});

// 5. Analyze End of Day Journal
app.post("/api/gemini/analyze-journal", async (req, res) => {
  const { content, historicalTasks, tasks } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Journal content is required" });
  }

  const ai = getAI();
  if (!ai) {
    return res.json({
      wins: ["Finished the primary coding task", "Drank water"],
      mistakes: ["Spent 45 minutes on social media during focus block"],
      energyLevel: "medium",
      patterns: ["You complete 87% of tasks before noon"],
      procrastinationCauses: ["Switching tabs frequently", "Decision fatigue"],
      aiScore: 7,
      skipPrediction: "You are likely to skip gym tasks tomorrow if you stay up coding tonight.",
      taskOutcomes: (tasks || []).map((t: any) => ({
        title: t.title,
        category: t.category,
        completed: t.completed,
        statedReason: !t.completed ? "got distracted or lost focus" : ""
      }))
    });
  }

  try {
    const prompt = `
      Journal Content: "${content}"
      Recent Completed Tasks: ${JSON.stringify(historicalTasks || [])}
      Today's Tasks to Analyze: ${JSON.stringify(tasks || [])}

      Analyze the user's freeform journal entry and productivity logs.
      Extract wins, mistakes, energy level (high, medium, or low), behavior patterns, causes of procrastination, and an AI productivity score (out of 10) for today.
      
      CRITICAL: For each task listed in "Today's Tasks to Analyze", inspect the journal content to extract if the user mentioned a specific reason/excuse for why they completed, skipped, or procrastinated on it.
      Describe this reason as a concise phrase (e.g. "ended up scrolling instead", "lost motivation due to late hour", "felt hyperfocused"). If not mentioned or completed smoothly, return an empty string "".

      Include a humorous, sarcastic 'skipPrediction' forecasting what they'll try to dodge tomorrow.
      Use this JSON schema:
      {
        "wins": ["string"],
        "mistakes": ["string"],
        "energyLevel": "high" | "medium" | "low",
        "patterns": ["witty observations about their routines"],
        "procrastinationCauses": ["string"],
        "aiScore": number (1-10),
        "skipPrediction": "sarcastic prediction (max 20 words)",
        "taskOutcomes": [
          {
            "title": "string",
            "category": "string",
            "completed": boolean,
            "statedReason": "string"
          }
        ]
      }
      Strictly return ONLY JSON.
    `;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: PULSE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.warn("Notice: Using offline fallback for analyze-journal due to Gemini service unavailability:", error?.message || error);
    res.json({
      wins: ["Logged journal reflection", "Kept track of tasks"],
      mistakes: ["Experienced transient API delays, but kept going"],
      energyLevel: "medium",
      patterns: ["You reflect regularly on your progress"],
      procrastinationCauses: ["Context switching", "Unstructured focus periods"],
      aiScore: 7,
      skipPrediction: "You might be tempted to skip planning tomorrow morning. Don't do it.",
      taskOutcomes: (tasks || []).map((t: any) => ({
        title: t.title,
        category: t.category,
        completed: t.completed,
        statedReason: !t.completed ? "ran out of time" : ""
      }))
    });
  }
});

// 6. Sarcastic Inactivity Comment
app.post("/api/gemini/inactivity-comment", async (req, res) => {
  const { taskTitle, inactiveDuration } = req.body; // duration in seconds
  const mins = Math.round((inactiveDuration || 0) / 60);

  const ai = getAI();
  if (!ai) {
    return res.json({
      comment: `That quick check on your phone somehow lasted ${mins || 5} minutes. Focus on "${taskTitle || "your work"}" already!`
    });
  }

  try {
    const prompt = `
      Generate a quick, sarcastic, humorous PG-13 remark because the user switched tabs or walked away from their screen during a Focus Mode block.
      Task Title: "${taskTitle || "untitled task"}"
      Time they were distracted: ${mins} minutes.
      Keep it short (max 15 words) and highly playful.
      Strictly return ONLY JSON:
      {
        "comment": "your sarcastic text"
      }
    `;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: PULSE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.warn("Notice: Using offline fallback for inactivity-comment due to Gemini service unavailability:", error?.message || error);
    res.json({
      comment: `That quick check on your phone somehow lasted ${mins || 5} minutes. Focus on "${taskTitle || "your work"}" already!`
    });
  }
});

// 7. Intelligence Report based on historical tasks & journals
app.post("/api/gemini/intelligence-report", async (req, res) => {
  const { tasks, journals } = req.body;

  const ai = getAI();
  if (!ai) {
    // Fallback Mock Intelligence Report
    return res.json({
      skipPrediction: "You are highly likely to skip reading/theory tasks after 4:00 PM coding marathons.",
      patterns: [
        "You complete 87% of tasks when starting them before noon.",
        "Your focus span drops by 45% when switching tabs more than 5 times in a session.",
        "Three consecutive high-priority tasks in one day usually causes you to miss the fourth."
      ],
      workloadAdjustments: [
        "Keep evening blocks to under 30 minutes to reduce late-day fatigue.",
        "Schedule your critical algorithmic blocks between 9:00 AM and 11:30 AM."
      ],
      dailyScore: 8.5,
      weeklyReview: "This week you logged 12 productive focus hours. Your primary blocker was context switching (mostly tab surfing during coding focus blocks). You logged 3 journals reflecting high afternoon fatigue.",
      monthlyTrends: "Steady progress. Your consistency score is up 12% compared to last month, mainly driven by committing to shorter, focused intervals instead of open-ended tasks."
    });
  }

  try {
    const prompt = `
      You are Pulse's elite analytical brain.
      Analyze the user's historical task list and end-of-day journal reflections to extract deep cognitive productivity insights.
      Tasks: ${JSON.stringify(tasks || [])}
      Journals: ${JSON.stringify(journals || [])}

      Generate an analytical profile. Do not use simple rules—use deep semantic pattern matching.
      Return strictly a JSON object:
      {
        "skipPrediction": "A highly precise, sarcastic but helpful PG-13 warning prediction on what task they'll skip tomorrow and why",
        "patterns": ["3 deep observations about their exact productivity habits, e.g. 'You complete 87% of tasks before noon'"],
        "workloadAdjustments": ["2-3 hyper-specific suggestions for restructuring their day based on energy levels"],
        "dailyScore": number (current score out of 10),
        "weeklyReview": "A 2-3 sentence overview of their consistency, wins, and failures this week",
        "monthlyTrends": "A 2-3 sentence overview of their long-term trajectory and habits"
      }
      Strictly return ONLY JSON.
    `;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: PULSE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.warn("Notice: Using offline fallback for intelligence-report due to Gemini service unavailability:", error?.message || error);
    res.json({
      skipPrediction: "You are highly likely to skip reading/theory tasks after 4:00 PM coding marathons.",
      patterns: [
        "You complete 87% of tasks when starting them before noon.",
        "Your focus span drops by 45% when switching tabs more than 5 times in a session.",
        "Three consecutive high-priority tasks in one day usually causes you to miss the fourth."
      ],
      workloadAdjustments: [
        "Keep evening blocks to under 30 minutes to reduce late-day fatigue.",
        "Schedule your critical algorithmic blocks between 9:00 AM and 11:30 AM."
      ],
      dailyScore: 8.5,
      weeklyReview: "This week you logged 12 productive focus hours. Your primary blocker was context switching (mostly tab surfing during coding focus blocks). You logged 3 journals reflecting high afternoon fatigue.",
      monthlyTrends: "Steady progress. Your consistency score is up 12% compared to last month, mainly driven by committing to shorter, focused intervals instead of open-ended tasks."
    });
  }
});

// Request specific completion proof from Pulse AI based on the task description
app.post("/api/gemini/request-proof", async (req, res) => {
  const { taskTitle, taskCategory } = req.body;
  const ai = getAI();

  if (!ai) {
    // Mock / Offline Fallback Mode
    return res.json(getOfflineProofRequest(taskTitle, taskCategory));
  }

  try {
    const prompt = `
      Task: "${taskTitle}"
      Category: "${taskCategory || "General"}"

      As "Pulse", you are the cynical, extremely skeptical, and clever AI productivity companion.
      The user says they are about to complete this task. We DO NOT trust them blindly.
      Generate a customized, slightly sarcastic demand/prompt specifying what EXACT proof of completion they must provide.
      
      Examples of proof types to demand:
      - If it's a "gym", "workout", or "run" session: Demand a fitness tracker (Whoop/Apple Watch/Strava) screenshot, a gym equipment photo, or a sweaty muscle selfie.
      - If it's a "coding", "programming", or "bug fix" task: Demand a compilation terminal screenshot, IDE code screen, or git commit / PR merge confirmation link.
      - If it's "clean room", "wash dishes", or "chores": Demand a clear before/after photo of the space or floor.
      - If it's "reading", "studying", or "exam prep": Demand a photo of notes, key quotes, Kindle screenshot, or a 1-sentence profound takeaway from the chapter.
      - If it's "grocery", "buying", or "shopping": Demand a photo of the receipt or item.

      Return strictly a JSON object matching this structure:
      {
        "proofPrompt": "A 1-2 sentence witty, slightly sarcastic demand specifying what proof is needed",
        "expectedProofType": "One of: 'Image' | 'Screenshot' | 'Text' | 'Link' | 'Any'"
      }
      Do not enclose in markdown blocks.
    `;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: PULSE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      proofPrompt: parsed.proofPrompt || `I need substantial proof for "${taskTitle}". Send a photo or detailed description first.`,
      expectedProofType: parsed.expectedProofType || "Any"
    });
  } catch (error: any) {
    console.warn("Notice: Using offline fallback for request-proof:", error?.message || error);
    res.json(getOfflineProofRequest(taskTitle, taskCategory));
  }
});

// Verify the completion proof (text explanation, link, and/or image upload)
app.post("/api/gemini/verify-proof", async (req, res) => {
  const { taskTitle, taskCategory, proofText, imageBase64 } = req.body;
  const ai = getAI();

  if (!ai) {
    return res.json(getOfflineProofVerification(taskTitle, proofText));
  }

  try {
    const prompt = `
      Task: "${taskTitle}"
      Category: "${taskCategory || "General"}"
      User Written Proof/Explanation: "${proofText || "No explanation provided"}"
      Has Attached Proof Image/Screenshot: ${imageBase64 ? "YES (Attached)" : "NO"}

      As "Pulse's" cynical, elite verification brain, analyze this proof of completion for the task.
      Determine if the proof is realistic, fits the task requirements, and looks legitimate (as opposed to lazy empty submissions or random words/gibberish).
      If there is an image attached, inspect it to see if it matches the task (e.g., if the task was 'gym', does it contain a gym, activity tracker screen, weights, or physical exertion? If 'coding', does it contain an IDE, terminal, git, or code? If 'writing/reading', does it look like paper, a book, or notes?).
      Be cynical but ultimately flexible and fun. Don't let empty text or pure random junk pass.

      Return strictly a JSON object:
      {
        "verified": true or false,
        "feedback": "Sarcastic, witty verification feedback (1-2 sentences). If approved, make a humorous backhanded compliment. If rejected, roast their proof or tell them what they actually need to show."
      }
      Do not enclose in markdown blocks.
    `;

    let response;
    if (imageBase64) {
      // Stripping data URL prefix if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      response = await generateContentWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          },
          prompt
        ],
        config: {
          systemInstruction: PULSE_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json"
        }
      });
    } else {
      response = await generateContentWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: PULSE_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json"
        }
      });
    }

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      verified: parsed.verified !== undefined ? parsed.verified : true,
      feedback: parsed.feedback || "Fine, looks believable. Task completed."
    });
  } catch (error: any) {
    console.warn("Notice: Using offline fallback for verify-proof:", error?.message || error);
    res.json(getOfflineProofVerification(taskTitle, proofText));
  }
});

// Helper offline fallback generator for Proof Requests
function getOfflineProofRequest(title: string, category: string) {
  const tLower = title.toLowerCase();
  if (tLower.includes("gym") || tLower.includes("workout") || tLower.includes("run") || tLower.includes("exercise")) {
    return {
      proofPrompt: "Ah, the gym. I'm highly skeptical. Show me your Apple Watch activity ring screenshot, a photo of your sweaty shirt, or a snap of those dumbbells.",
      expectedProofType: "Image"
    };
  }
  if (tLower.includes("code") || tLower.includes("program") || tLower.includes("debug") || tLower.includes("git") || tLower.includes("develop")) {
    return {
      proofPrompt: "Sure, 'writing code'. Or were you surfing Reddit? Upload a screenshot of your VS Code editor, compiling terminal, or a git commit hash link.",
      expectedProofType: "Screenshot"
    };
  }
  if (tLower.includes("read") || tLower.includes("study") || tLower.includes("book") || tLower.includes("chapter") || tLower.includes("learn")) {
    return {
      proofPrompt: "To make sure you didn't just stare at the cover, paste one mind-blowing sentence or direct quote you learned from this reading.",
      expectedProofType: "Text"
    };
  }
  if (tLower.includes("clean") || tLower.includes("wash") || tLower.includes("dishes") || tLower.includes("room")) {
    return {
      proofPrompt: "I need to see a clean floor or shiny plates. Snap a picture of your completed chore so I know you aren't living in chaos.",
      expectedProofType: "Image"
    };
  }
  // Default
  return {
    proofPrompt: `Complete proof required for "${title}". Please upload a screenshot/photo or describe precisely what you accomplished so I can sign off.`,
    expectedProofType: "Any"
  };
}

// Helper offline fallback generator for Proof Verification
function getOfflineProofVerification(title: string, proofText: string) {
  const pLower = (proofText || "").trim().toLowerCase();
  
  if (!pLower || pLower.length < 5) {
    return {
      verified: false,
      feedback: "Are you kidding? That tiny response doesn't prove anything. Try writing an actual sentence describing your triumph or attach a real screenshot."
    };
  }

  if (pLower.includes("done") || pLower.includes("completed") || pLower.includes("yes") || pLower.includes("no") || pLower === "completed task") {
    return {
      verified: false,
      feedback: "Just typing 'done' is peak procrastination laziness. Give me some real details or proof about what you actually did."
    };
  }

  return {
    verified: true,
    feedback: "Fine, I guess I'll believe you this once. It's not like I have access to your webcam to double-check... or do I?"
  };
}

// Server-side health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// Vite & Static Asset Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from:", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pulse app running at http://localhost:${PORT}`);
  });
}

startServer();
