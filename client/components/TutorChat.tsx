"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Brain } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import ModelTag from "@/components/ModelTag";
import QuizPrompt from "@/components/QuizPrompt";
import { readChatStream, type QuizPayload } from "@/lib/chat-stream";

interface Message {
  role: "user" | "assistant";
  content: string;
  label?: string;
  fallback?: boolean;
  quiz?: QuizPayload;
}

interface TutorChatProps {
  trackSlug: string;
  lessonId: string;
  lessonTitle: string;
}

export default function TutorChat({ trackSlug, lessonId, lessonTitle }: TutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi. I'm Versed, your tutor. You're on **"${lessonTitle}"**. Ask a question, ask me to explain it another way, or ask for a hint.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const proactiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Proactive nudge after 2 minutes
  useEffect(() => {
    proactiveTimerRef.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "How's it going? Would you like a hint on the challenge, or shall I give you a different example to make this click?",
        },
      ]);
    }, 120_000);
    return () => {
      if (proactiveTimerRef.current) clearTimeout(proactiveTimerRef.current);
    };
  }, []);

  async function sendMessage() {
    if (!input.trim() || isThinking) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          context: { trackSlug, lessonId, lessonTitle },
          mode: "auto",
        }),
      });

      if (!res.ok || !res.body) throw new Error("Failed to connect");
      setIsThinking(false);

      for await (const ev of readChatStream(res.body)) {
        if (ev.type === "meta") {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && !last.content && !last.quiz && !last.label) {
              const next = [...prev];
              next[next.length - 1] = { ...last, label: ev.label, fallback: ev.fallback };
              return next;
            }
            return [...prev, { role: "assistant", content: "", label: ev.label, fallback: ev.fallback }];
          });
        } else if (ev.type === "token") {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role !== "assistant") {
              next.push({ role: "assistant", content: ev.text });
              return next;
            }
            next[next.length - 1] = { ...last, content: last.content + ev.text };
            return next;
          });
        } else if (ev.type === "quiz") {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, quiz: ev, label: last.label || "Gemma 4" };
              return next;
            }
            return [...next, { role: "assistant", content: "", label: "Gemma 4", quiz: ev }];
          });
        }
      }
    } catch {
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Tutor did not answer. The Cloud Run agent may still be starting. Try once more.",
        },
      ]);
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div
        className="flex items-center gap-2 p-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <BrandMark size={32} />
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Versed
          </p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Gemma drills. Gemini coaches.
          </p>
        </div>
        <div
          className="ml-auto w-2 h-2 rounded-full"
          style={{ background: "var(--success)" }}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mr-2 mt-0.5"
                    style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)" }}
              >
                <Brain size={12} style={{ color: "var(--primary)" }} />
              </div>
            )}
            <div
              className="max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed"
              style={
                msg.role === "user"
                  ? {
                      background: "var(--muted)",
                      color: "var(--foreground)",
                    }
                  : {
                      background: "color-mix(in srgb, var(--primary) 8%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--primary) 15%, transparent)",
                    }
              }
            >
              {msg.role === "assistant" && msg.label && (
                <ModelTag label={msg.label} fallback={msg.fallback} />
              )}
              {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                part.startsWith("**") && part.endsWith("**") ? (
                  <strong key={j}>{part.slice(2, -2)}</strong>
                ) : (
                  part
                )
              )}
              {msg.quiz && msg.quiz.question && (
                <QuizPrompt
                  question={msg.quiz.question}
                  options={msg.quiz.options}
                  correct={msg.quiz.correct}
                />
              )}
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="flex justify-start">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center mr-2 mt-0.5"
                    style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)" }}
            >
              <Brain size={12} style={{ color: "var(--primary)" }} />
            </div>
            <div
              className="rounded-xl px-3 py-3 flex items-center gap-1"
              style={{
                background: "color-mix(in srgb, var(--primary) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--primary) 15%, transparent)",
              }}
            >
              {[0, 0.15, 0.3].map((delay) => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "var(--primary)",
                    animation: `bounce 1s ease-in-out ${delay}s infinite`,
                    display: "inline-block",
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="p-3 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask anything about this lesson…"
            className="flex-1 text-sm px-3 py-2 rounded-lg border outline-none"
            style={{
              border: "1px solid var(--border)",
              background: "var(--background)",
              color: "var(--foreground)",
            }}
          />
          <button
            className="btn-primary w-9 h-9 p-0 flex items-center justify-center"
            onClick={sendMessage}
            disabled={isThinking || !input.trim()}
          >
            {isThinking ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
        <p className="text-xs mt-1.5 text-center" style={{ color: "var(--muted-foreground)" }}>
          Gemma 4 drills. Gemini 2.5 Flash coaches.
        </p>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
