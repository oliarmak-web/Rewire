"use client";

import { useMemo, useState } from "react";
import {
  classifyPrompt,
  type AssessmentResult,
  type AssistantResult,
  type TribeResult,
} from "@/lib/assessment";

type AssessmentQuestion = {
  id: string;
  prompt: string;
  dimension: "attention" | "activation" | "emotion" | "time" | "energy";
};

const questionSet: AssessmentQuestion[] = [
  {
    id: "q1",
    prompt: "How often do small setbacks or tone shifts hit much harder than they seem to for other people?",
    dimension: "emotion",
  },
  {
    id: "q2",
    prompt: "How often does time slip away until something becomes urgent?",
    dimension: "time",
  },
  {
    id: "q3",
    prompt: "How often do meals, hydration, or body needs fall apart when the day gets intense?",
    dimension: "energy",
  },
  {
    id: "q4",
    prompt: "How often do you seem capable on the outside while privately overcompensating?",
    dimension: "attention",
  },
  {
    id: "q5",
    prompt: "How often do you swing between paralysis and hyperfocus?",
    dimension: "activation",
  },
  {
    id: "q6",
    prompt: "How often do you know exactly what matters but still cannot begin?",
    dimension: "activation",
  },
];

const painPointOptions = [
  "School deadlines",
  "Social overwhelm",
  "Meal consistency",
  "Email paralysis",
  "Task prioritization",
  "Time blindness",
];

const goalOptions = [
  "Get through school without constant burnout",
  "Make food easier and more regular",
  "Understand my brain better",
  "Improve social confidence",
  "Build a daily support system",
];

const routines = [
  { label: "Morning startup", streak: "4 days", status: "On track" },
  { label: "Protein before meds", streak: "2 days", status: "Needs help" },
  { label: "Evening reset", streak: "6 days", status: "Strong" },
];

const initialAnswers = Object.fromEntries(questionSet.map((question) => [question.id, 2]));

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}`);
  }

  return (await response.json()) as T;
}

function toggleValue(value: string, current: string[], setter: (next: string[]) => void) {
  setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
}

function OptionPill({
  label,
  selected,
  onClick,
  activeClassName,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  activeClassName: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
        selected ? activeClassName : "border border-slate-300 bg-white text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

function SliderQuestion({
  question,
  value,
  onChange,
}: {
  question: AssessmentQuestion;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm leading-6 text-slate-800">{question.prompt}</p>
      <div className="mt-4 rounded-full bg-white px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
        {question.dimension}
      </div>
      <input
        className="mt-4 w-full accent-slate-950"
        type="range"
        min="0"
        max="4"
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>Rarely</span>
        <span>Sometimes</span>
        <span>Often</span>
      </div>
    </div>
  );
}

function SimpleCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
      <p className="text-base font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

export default function RewireApp() {
  const subject = "myself";
  const [painPoints, setPainPoints] = useState<string[]>([
    "School deadlines",
    "Task prioritization",
  ]);
  const [goals, setGoals] = useState<string[]>([
    "Get through school without constant burnout",
    "Build a daily support system",
  ]);
  const [notes, setNotes] = useState(
    "Late diagnosis, masking, anxiety spikes, and meals falling apart when the day gets intense.",
  );
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [assistant, setAssistant] = useState<AssistantResult | null>(null);
  const [tribeResult, setTribeResult] = useState<TribeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [tribeLoading, setTribeLoading] = useState(false);
  const [error, setError] = useState("");
  const [assistantPrompt, setAssistantPrompt] = useState(
    "I have an assignment due tomorrow and I still have not started.",
  );
  const [tribeReflection, setTribeReflection] = useState(
    "I am overwhelmed by school, forgetting meals, and getting stuck before I begin.",
  );

  const promptRouting = useMemo(() => classifyPrompt(assistantPrompt), [assistantPrompt]);

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      const assessment = await postJson<AssessmentResult>("/api/assessment", {
        subject,
        painPoints,
        goals,
        notes,
        answers,
      });
      setResult(assessment);
    } catch (submissionError) {
      setError("The assessment request failed. Please try again.");
      console.error(submissionError);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssistant() {
    setAssistantLoading(true);
    setError("");

    try {
      const next = await postJson<AssistantResult>("/api/assistant", {
        prompt: assistantPrompt,
        category: promptRouting.category,
        painPoints,
        goals,
      });
      setAssistant(next);
    } catch (assistantError) {
      setError("The assistant request failed. Please try again.");
      console.error(assistantError);
    } finally {
      setAssistantLoading(false);
    }
  }

  async function handleTribe() {
    setTribeLoading(true);
    setError("");

    try {
      const next = await postJson<TribeResult>("/api/tribe", {
        reflection: tribeReflection,
      });
      setTribeResult(next);
    } catch (tribeError) {
      setError("The TRIBE lab request failed. Please try again.");
      console.error(tribeError);
    } finally {
      setTribeLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#eef5f3_0%,_#f6f8f4_46%,_#edf4ef_100%)] text-slate-900">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 md:px-8">
        <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-teal-950">
              Rewire
            </span>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs text-slate-600">
              Built for ADHD-friendly clarity
            </span>
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Start here. We&apos;ll help you figure out what is hardest and what to do next.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
            First, answer a few simple questions. Then Rewire turns that into a dashboard,
            routines, and a life assistant that helps with the most stressful parts of your day.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="#onboarding"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Start onboarding
            </a>
            <a
              href="#assistant"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Jump to assistant
            </a>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SimpleCard
            title={result ? `${result.probability}% pattern match` : "One clear result"}
            body="You get a simple summary, not a wall of information."
          />
          <SimpleCard
            title="Tiny next steps"
            body="The app translates overwhelm into a few actions you can actually start."
          />
          <SimpleCard
            title="Human backup"
            body="If things keep breaking down, the assistant can point you toward human support."
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
          <section
            id="onboarding"
            className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] md:p-6"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Step 1
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Tell Rewire what feels hardest</h2>

            <div className="mt-6 grid gap-7">
              <div>
                <p className="text-sm font-semibold text-slate-900">What is hardest right now?</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {painPointOptions.map((option) => (
                    <OptionPill
                      key={option}
                      label={option}
                      selected={painPoints.includes(option)}
                      onClick={() => toggleValue(option, painPoints, setPainPoints)}
                      activeClassName="bg-cyan-100 text-cyan-950 border border-cyan-200"
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">What would feel most helpful first?</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {goalOptions.map((option) => (
                    <OptionPill
                      key={option}
                      label={option}
                      selected={goals.includes(option)}
                      onClick={() => toggleValue(option, goals, setGoals)}
                      activeClassName="bg-emerald-100 text-emerald-950 border border-emerald-200"
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Anything important to know?
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  You can mention anxiety, masking, autism traits, food issues, school stress, or anything else.
                </p>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-3 min-h-32 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">Optional deeper pattern check</p>
                <div className="mt-4 space-y-4">
                  {questionSet.map((question) => (
                    <SliderQuestion
                      key={question.id}
                      question={question}
                      value={answers[question.id]}
                      onChange={(next) =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: next,
                        }))
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-teal-950 p-4 text-white">
                <p className="text-sm font-semibold">Main action</p>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-teal-950 transition hover:bg-slate-100 disabled:cursor-wait disabled:bg-slate-300"
                  >
                    {loading ? "Building dashboard..." : "Generate my dashboard"}
                  </button>
                  <p className="text-sm text-teal-100">
                    Pattern-based support only. Not diagnosis.
                  </p>
                </div>
              </div>
              {error ? <p className="text-sm text-rose-700">{error}</p> : null}
            </div>
          </section>

          <div className="grid gap-6">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] md:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Step 2</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">See your dashboard</h2>

              {result ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-[1.5rem] bg-cyan-50 p-5">
                    <p className="text-sm font-semibold text-cyan-950">Your pattern summary</p>
                    <p className="mt-2 text-5xl font-semibold text-cyan-950">{result.probability}%</p>
                    <p className="mt-3 text-sm leading-6 text-cyan-950/80">{result.summary}</p>
                  </div>

                  <div className="grid gap-3">
                    <SimpleCard
                      title={`Current focus: ${result.routing.category}`}
                      body={result.routing.explanation}
                    />
                    <SimpleCard
                      title={result.followUp.cadence}
                      body={result.followUp.message}
                    />
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">Strongest patterns</p>
                    <div className="mt-3 space-y-3">
                      {result.resemblance.map((profile) => (
                        <div key={profile.key} className="rounded-[1.25rem] bg-white p-4">
                          <div className="flex items-center justify-between gap-4">
                            <p className="font-semibold text-slate-900">{profile.label}</p>
                            <span className="text-sm text-slate-500">{profile.score}%</span>
                          </div>
                          <div className="mt-3 h-2 rounded-full bg-slate-200">
                            <div className="h-2 rounded-full bg-slate-950" style={{ width: `${profile.score}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                  Your dashboard will show one clear summary, your most relevant support route,
                  and what to focus on next.
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] md:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Step 3</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Keep routines visible</h2>
              <div className="mt-5 space-y-3">
                {routines.map((routine) => (
                  <div key={routine.label} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-slate-900">{routine.label}</p>
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">
                        {routine.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{routine.streak}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <section
            id="assistant"
            className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] md:p-6"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Assistant</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Tell Rewire what is happening right now
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The assistant will turn the situation into a short plan and tell you when human support might help.
            </p>

            <textarea
              value={assistantPrompt}
              onChange={(event) => setAssistantPrompt(event.target.value)}
              className="mt-4 min-h-28 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 outline-none transition focus:border-slate-400"
            />

            <div className="mt-4 rounded-[1.5rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Detected focus</p>
              <p className="mt-2 text-xl font-semibold capitalize text-slate-950">{promptRouting.category}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{promptRouting.explanation}</p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleAssistant}
                disabled={assistantLoading}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
              >
                {assistantLoading ? "Planning..." : "Help me with this"}
              </button>
            </div>

            {assistant ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-[1.5rem] bg-emerald-50 p-4">
                  <p className="text-lg font-semibold text-emerald-950">{assistant.title}</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-950/80">{assistant.response}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SimpleCard
                    title="Next steps"
                    body={assistant.nextSteps.join(" ")}
                  />
                  <SimpleCard
                    title="Suggested routines"
                    body={assistant.routines.join(" ")}
                  />
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">Human backup</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{assistant.escalation}</p>
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] md:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">TRIBE Lab</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Experimental research layer
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This stays clearly separate from the main experience. If a hosted TRIBE endpoint exists,
              it can enrich the demo. Otherwise, it remains an honest placeholder.
            </p>

            <textarea
              value={tribeReflection}
              onChange={(event) => setTribeReflection(event.target.value)}
              className="mt-4 min-h-28 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 outline-none transition focus:border-slate-400"
            />

            <div className="mt-4">
              <button
                type="button"
                onClick={handleTribe}
                disabled={tribeLoading}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
              >
                {tribeLoading ? "Running..." : "Run TRIBE lab"}
              </button>
            </div>

            {tribeResult ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                  <p className="text-sm font-semibold">
                    {tribeResult.mode === "remote" ? "Remote TRIBE response" : "Demo-mode signal"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{tribeResult.status}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{tribeResult.signalSummary}</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">Notes</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{tribeResult.disclaimer}</p>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}
