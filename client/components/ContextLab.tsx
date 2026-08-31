"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";

const ATTEMPTS = [
  {
    label: "Attempt 1 — Vague",
    prompt: "Write me an essay about climate change.",
    locked: true,
    description: "No context, no constraints. What does AI do with this?",
  },
  {
    label: "Attempt 2 — Better instructions",
    prompt: "Write a 500-word essay about climate change for a high school science class.",
    locked: true,
    description: "We added length and audience. Already much better.",
  },
  {
    label: "Attempt 3 — Your turn",
    prompt: "",
    locked: false,
    description: "Add topic, audience, length, tone, format, and constraints. Make it specific.",
    placeholder:
      "Write a [length] essay about [specific topic] for [audience]. Use [tone]. Include [specific elements]. Do NOT [constraint].",
  },
];

interface AttemptResult {
  response: string;
}

export default function ContextLab() {
  const [responses, setResponses] = useState<(AttemptResult | null)[]>([null, null, null]);
  const [loading, setLoading] = useState<boolean[]>([false, false, false]);
  const [userPrompt, setUserPrompt] = useState("");

  async function runAttempt(index: number) {
    const prompt = index === 2 ? userPrompt : ATTEMPTS[index].prompt;
    if (!prompt.trim()) return;

    setLoading((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          context: { trackSlug: "prompting", lessonId: "three-attempts" },
          mode: "tutor",
        }),
      });

      if (!res.ok || !res.body) throw new Error("Failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      setResponses((prev) => {
        const next = [...prev];
        next[index] = { response: "" };
        return next;
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        chunk.split("\n").forEach((line) => {
          if (line.startsWith("data: ")) {
            text += line.slice(6);
          }
        });
        setResponses((prev) => {
          const next = [...prev];
          next[index] = { response: text };
          return next;
        });
      }
    } catch {
      setResponses((prev) => {
        const next = [...prev];
        next[index] = { response: "Could not connect to AI. Make sure the backend is running." };
        return next;
      });
    } finally {
      setLoading((prev) => {
        const next = [...prev];
        next[index] = false;
        return next;
      });
    }
  }

  const qualityColors = ["var(--destructive)", "#D97706", "var(--success)"];
  const qualityLabels = ["Poor", "Better", "Best"];

  return (
    <div className="flex flex-col gap-6">
      <div
        className="rounded-xl p-4 border"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}
      >
        <p className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
          The Three-Attempt Method
        </p>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Run each attempt and see how much context changes the output. Then write your own Attempt 3.
        </p>
      </div>

      {ATTEMPTS.map((attempt, i) => (
        <div key={i} className="card-base overflow-hidden">
          {/* Attempt header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "var(--border)", background: "var(--muted)" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: qualityColors[i], color: "white" }}
              >
                {i + 1}
              </span>
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                {attempt.label}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: qualityColors[i] + "20", color: qualityColors[i] }}
              >
                {qualityLabels[i]}
              </span>
            </div>
            {responses[i] && <CheckCircle size={14} style={{ color: "var(--success)" }} />}
          </div>

          <div className="p-4 flex flex-col gap-3">
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {attempt.description}
            </p>

            {/* Prompt */}
            {attempt.locked ? (
              <div
                className="rounded-lg px-3 py-2.5 text-sm font-mono"
                style={{ background: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border)" }}
              >
                {attempt.prompt}
              </div>
            ) : (
              <textarea
                rows={4}
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder={attempt.placeholder}
                className="w-full px-3 py-2 rounded-lg text-sm border resize-none outline-none"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                }}
              />
            )}

            <button
              className="btn-primary flex items-center gap-2 self-start"
              onClick={() => runAttempt(i)}
              disabled={loading[i] || (i === 2 && !userPrompt.trim())}
              style={{ opacity: loading[i] ? 0.7 : 1 }}
            >
              {loading[i] ? (
                <><Loader2 size={13} className="animate-spin" /> Running...</>
              ) : (
                <>Send to AI <ArrowRight size={13} /></>
              )}
            </button>

            {/* Response */}
            {responses[i] && (
              <div
                className="rounded-lg p-3 text-sm leading-relaxed"
                style={{ background: "color-mix(in srgb, var(--primary) 5%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--foreground)" }}
              >
                {responses[i]!.response || "Receiving…"}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Comparison summary */}
      {responses[2] && (
        <div
          className="rounded-xl p-5 border"
          style={{ borderLeft: "3px solid var(--primary)", background: "color-mix(in srgb, var(--primary) 5%, transparent)", borderColor: "var(--border)" }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: "var(--primary)" }}>
            What changed?
          </p>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Your Attempt 3 should be noticeably longer, more specific, and more useful than Attempt 1.
            The difference isn't a better prompt — it's more context. That's context engineering.
          </p>
        </div>
      )}
    </div>
  );
}
