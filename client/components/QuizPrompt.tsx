"use client";

import { useState } from "react";
import { awardXP, XP_EVENTS } from "@/lib/xp";

type QuizPromptProps = {
  question: string;
  options: string[];
  correct: string;
};

export default function QuizPrompt({ question, options, correct }: QuizPromptProps) {
  const [picked, setPicked] = useState<string | null>(null);

  function choose(option: string) {
    if (picked) return;
    setPicked(option);
    const right = option === correct || option.startsWith(correct) || correct.startsWith(option);
    if (right && typeof window !== "undefined") {
      const key = `versedai_quiz:${question}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, "1");
        awardXP(XP_EVENTS.QUIZ_PASSED, "Gemma quiz");
      }
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
        {question}
      </p>
      {options.map((option) => {
        const chosen = picked === option;
        const right =
          picked != null &&
          (option === correct || option.startsWith(correct) || correct.startsWith(option));
        return (
          <button
            key={option}
            type="button"
            onClick={() => choose(option)}
            disabled={picked != null}
            className="text-left text-sm rounded-lg px-3 py-2 border"
            style={{
              borderColor: chosen
                ? right
                  ? "var(--success)"
                  : "var(--destructive)"
                : "var(--border)",
              background: chosen
                ? right
                  ? "color-mix(in srgb, var(--success) 10%, transparent)"
                  : "color-mix(in srgb, var(--destructive) 10%, transparent)"
                : "var(--card)",
              color: "var(--foreground)",
            }}
          >
            {option}
          </button>
        );
      })}
      {picked && (
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {picked === correct || picked.startsWith(correct) || correct.startsWith(picked)
            ? "Yes. +100 XP."
            : `Not that one. ${correct}`}
        </p>
      )}
    </div>
  );
}
