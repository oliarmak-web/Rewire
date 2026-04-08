export type ProfileKey =
  | "inattentive"
  | "hyperactive"
  | "combined"
  | "anxious"
  | "rsd"
  | "hyperfocus"
  | "masked";

export type CategoryKey = "school" | "food" | "social" | "executive";

export type AssessmentPayload = {
  subject: string;
  painPoints: string[];
  goals: string[];
  notes: string;
  answers: Record<string, number>;
};

export type AssessmentResult = {
  probability: number;
  summary: string;
  resemblance: Array<{
    key: ProfileKey;
    label: string;
    score: number;
    description: string;
  }>;
  routing: {
    category: CategoryKey;
    explanation: string;
  };
  followUp: {
    cadence: string;
    message: string;
    focusAreas: string[];
  };
  model: {
    name: string;
    status: string;
  };
};

export type AssistantPayload = {
  prompt: string;
  category: CategoryKey;
  painPoints: string[];
  goals: string[];
};

export type AssistantResult = {
  title: string;
  response: string;
  nextSteps: string[];
  routines: string[];
  escalation: string;
};

export type TribePayload = {
  reflection: string;
};

export type TribeResult = {
  available: boolean;
  mode: "remote" | "demo";
  status: string;
  signalSummary: string;
  cues: string[];
  disclaimer: string;
};

const questions = {
  q1: "emotion",
  q2: "time",
  q3: "energy",
  q4: "attention",
  q5: "activation",
  q6: "activation",
} as const;

export function scoreAssessment(payload: AssessmentPayload): AssessmentResult {
  const subject = payload.subject || "myself";
  const painPoints = Array.isArray(payload.painPoints) ? payload.painPoints : [];
  const goals = Array.isArray(payload.goals) ? payload.goals : [];
  const notes = String(payload.notes || "");
  const answers = payload.answers || {};
  const dimensionTotals = {
    attention: 0,
    activation: 0,
    emotion: 0,
    time: 0,
    energy: 0,
  };

  Object.entries(questions).forEach(([id, dimension]) => {
    dimensionTotals[dimension] += Number(answers[id] || 0);
  });

  const noteText = notes.toLowerCase();
  const resemblance = [
    {
      key: "inattentive" as const,
      label: "Inattentive",
      score: clampScore(
        38 + dimensionTotals.attention * 10 + containsAny(noteText, ["school", "late diagnosis", "inattentive"]) * 8,
      ),
      description: "Task drift, forgetfulness, and internal overwhelm are showing up strongly.",
    },
    {
      key: "hyperactive" as const,
      label: "Hyperactive-Impulsive",
      score: clampScore(20 + dimensionTotals.activation * 8),
      description: "Restlessness and impulsive action appear present, but not dominant in this intake.",
    },
    {
      key: "combined" as const,
      label: "Combined",
      score: clampScore(
        28 + dimensionTotals.attention * 7 + dimensionTotals.activation * 7 + dimensionTotals.time * 6,
      ),
      description: "There are signs of both distraction and action-regulation difficulty.",
    },
    {
      key: "anxious" as const,
      label: "Anxiety-Laced ADHD",
      score: clampScore(
        32 + dimensionTotals.emotion * 8 + containsAny(noteText, ["anxiety", "panic", "overwhelm"]) * 10,
      ),
      description: "Anxiety may be amplifying avoidance, indecision, and the cost of mistakes.",
    },
    {
      key: "rsd" as const,
      label: "Emotionally Sensitive / RSD",
      score: clampScore(
        22 + dimensionTotals.emotion * 11 + containsAny(noteText, ["rejection", "social", "masking"]) * 8,
      ),
      description: "Emotional pain and perceived criticism may be major drivers of shutdowns.",
    },
    {
      key: "hyperfocus" as const,
      label: "Hyperfocus Spiral",
      score: clampScore(25 + dimensionTotals.energy * 9 + dimensionTotals.time * 7),
      description: "The pattern suggests all-or-nothing focus, body neglect, and time slippage.",
    },
    {
      key: "masked" as const,
      label: "Masked / Underdiagnosed",
      score: clampScore(
        34 + dimensionTotals.attention * 6 + containsAny(noteText, ["female", "masking", "late diagnosis", "high functioning"]) * 12,
      ),
      description: "The intake resembles someone who looks composed externally while compensating heavily inside.",
    },
  ].sort((left, right) => right.score - left.score);

  const probability = clampScore(
    Math.round(
      22 +
        dimensionTotals.attention * 9 +
        dimensionTotals.activation * 6 +
        dimensionTotals.emotion * 5 +
        dimensionTotals.time * 7 +
        dimensionTotals.energy * 4,
    ),
  );

  const routingCategory = chooseRoutingCategory(painPoints, notes);

  return {
    probability,
    summary:
      subject === "myself"
        ? "Your intake shows a meaningful resemblance to ADHD-related patterns. This is a coaching signal meant to guide support, not a diagnosis."
        : "This intake shows a meaningful resemblance to ADHD-related patterns for the person you described. This is a coaching signal meant to guide support, not a diagnosis.",
    resemblance: resemblance.slice(0, 4),
    routing: {
      category: routingCategory,
      explanation: routeExplanation(routingCategory),
    },
    followUp: {
      cadence: chooseCadence(painPoints, noteText),
      message:
        "Start with a gentle morning check-in, a midday body prompt, and one evening reset that turns tomorrow into three small steps.",
      focusAreas: chooseFocusAreas(painPoints, goals, notes),
    },
    model: {
      name: process.env.TRIBE_V2_MODEL || "facebook/tribev2",
      status:
        "Research-informed scoring is active. If a hosted TRIBE v2 endpoint is configured later, this backend can enrich the coaching signal without exposing keys in the client.",
    },
  };
}

export function buildAssistantResponse(payload: AssistantPayload): AssistantResult {
  const category = payload.category;

  if (category === "school") {
    return {
      title: "School rescue plan",
      response:
        "You do not need to solve the whole semester right now. Pick the assignment with the nearest consequence, reduce it to a 10-minute starter, and let the assistant hold the sequence.",
      nextSteps: [
        "Open the assignment and write the title only.",
        "Set a 10 minute timer and make a bad first pass.",
        "Send one clarification email if you are blocked.",
      ],
      routines: ["Morning priority pick", "After-class reset", "Evening backpack closeout"],
      escalation: "If you miss two deadlines in a row, offer a human coach or school-support handoff.",
    };
  }

  if (category === "food") {
    return {
      title: "Food support plan",
      response:
        "The goal is not perfect nutrition. The goal is fewer crashes and less decision friction, especially around medication timing.",
      nextSteps: [
        "Choose one protein option you can repeat this week.",
        "Set a midday food check before hyperfocus takes over.",
        "Build a two-minute fallback meal list.",
      ],
      routines: ["Protein before meds", "Midday hydration", "Evening grocery check"],
      escalation: "If eating becomes consistently hard or distressing, offer a clinician or dietitian referral path.",
    };
  }

  if (category === "social") {
    return {
      title: "Social recovery plan",
      response:
        "When a text, tone, or silence hits hard, the assistant should slow interpretation before you spiral into certainty.",
      nextSteps: [
        "Name what happened without guessing intent.",
        "Wait 20 minutes before sending a reactive message.",
        "Use a repair script if you still want to respond.",
      ],
      routines: ["Pause before reply", "Evening social debrief", "Weekly connection check-in"],
      escalation: "Offer a human review when social pain keeps disrupting sleep, school, or self-worth.",
    };
  }

  return {
    title: "Executive function support plan",
    response:
      "The assistant should focus on narrowing choices, sequencing the next action, and protecting momentum instead of overwhelming you with options.",
    nextSteps: [
      "Pick one must-do and one nice-to-do.",
      "Shrink the must-do until it feels almost too easy.",
      "Check in again after 15 minutes instead of waiting for motivation.",
    ],
    routines: ["Morning startup", "Midday reset", "Tomorrow setup"],
    escalation: "Offer human coaching when planning keeps breaking down across multiple life areas.",
  };
}

export async function runTribeDemo(payload: TribePayload): Promise<TribeResult> {
  const endpoint = process.env.TRIBE_V2_ENDPOINT_URL;

  if (endpoint) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("TRIBE endpoint request failed.");
    }

    const data = (await response.json()) as Partial<TribeResult>;

    return {
      available: true,
      mode: "remote",
      status: data.status || "Remote TRIBE v2 endpoint responded.",
      signalSummary:
        data.signalSummary ||
        "Remote service returned a multimodal brain-response-style enrichment summary.",
      cues: data.cues || [],
      disclaimer:
        data.disclaimer ||
        "This enrichment is experimental, non-diagnostic, and should not be treated as medical advice.",
    };
  }

  const reflection = payload.reflection.toLowerCase();
  const cues = [
    reflection.includes("assignment") || reflection.includes("school")
      ? "High academic urgency cue"
      : "General cognitive load cue",
    reflection.includes("eat") || reflection.includes("meal")
      ? "Body-maintenance disruption cue"
      : "No strong food cue in reflection",
    reflection.includes("panic") || reflection.includes("anxious") || reflection.includes("overwhelm")
      ? "Elevated emotional strain cue"
      : "Moderate emotional strain cue",
  ];

  return {
    available: false,
    mode: "demo",
    status:
      "Demo mode only. No hosted TRIBE v2 endpoint is configured, so this is a research-inspired placeholder signal.",
    signalSummary:
      "The reflection suggests high task pressure, possible shutdown risk, and a need for lower-friction sequencing rather than more information.",
    cues,
    disclaimer:
      "Official TRIBE v2 is not running here. The public model is large, non-commercially licensed, and not currently available through a standard hosted inference provider.",
  };
}

export function classifyPrompt(prompt: string): { category: CategoryKey; explanation: string } {
  const normalized = prompt.toLowerCase();

  if (
    normalized.includes("eat") ||
    normalized.includes("food") ||
    normalized.includes("meal") ||
    normalized.includes("protein")
  ) {
    return {
      category: "food",
      explanation: "Detected body and meal language, so the prompt would route into food support.",
    };
  }

  if (
    normalized.includes("class") ||
    normalized.includes("school") ||
    normalized.includes("assignment") ||
    normalized.includes("study")
  ) {
    return {
      category: "school",
      explanation: "Detected school pressure, so the app would shift into academic coaching.",
    };
  }

  if (
    normalized.includes("friend") ||
    normalized.includes("text") ||
    normalized.includes("party") ||
    normalized.includes("social")
  ) {
    return {
      category: "social",
      explanation: "Detected social friction, so the app would offer regulation plus scripting help.",
    };
  }

  return {
    category: "executive",
    explanation: "The prompt reads like prioritization or executive function support.",
  };
}

function chooseRoutingCategory(painPoints: string[], notes: string): CategoryKey {
  const joined = `${painPoints.join(" ")} ${String(notes || "")}`.toLowerCase();

  if (containsAny(joined, ["meal", "food", "protein", "eat"])) {
    return "food";
  }

  if (containsAny(joined, ["school", "class", "assignment", "education", "study"])) {
    return "school";
  }

  if (containsAny(joined, ["social", "friend", "rejection", "text"])) {
    return "social";
  }

  return "executive";
}

function routeExplanation(category: CategoryKey) {
  if (category === "food") {
    return "The user would benefit from meal support, medication-timing awareness, and low-friction nutrition coaching.";
  }

  if (category === "school") {
    return "The user would benefit from task translation, deadline triage, and momentum support around education.";
  }

  if (category === "social") {
    return "The user would benefit from co-regulation, repair scripts, and help with emotionally loaded social moments.";
  }

  return "The user would benefit from prioritization, task breakdown, and executive function support.";
}

function chooseCadence(painPoints: string[], notes: string) {
  const joined = `${painPoints.join(" ")} ${notes}`.toLowerCase();

  if (containsAny(joined, ["school", "deadline", "class"])) {
    return "Three check-ins on school days";
  }

  if (containsAny(joined, ["food", "protein", "eat"])) {
    return "Morning and midday body-based check-ins";
  }

  return "Morning, midday, and evening micro-coaching";
}

function chooseFocusAreas(painPoints: string[], goals: string[], notes: string) {
  const items = [
    ...painPoints.slice(0, 2),
    ...goals.slice(0, 1),
    containsAny(String(notes).toLowerCase(), ["anxiety", "autism"]) ? "Co-occurring patterns" : undefined,
  ].filter((value): value is string => Boolean(value));

  return [...new Set(items)];
}

function containsAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle)) ? 1 : 0;
}

function clampScore(value: number) {
  return Math.max(5, Math.min(96, Math.round(value)));
}
