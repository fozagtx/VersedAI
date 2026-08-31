"use client";

import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import DotGrid from "@/components/DotGrid";
import { Send, Loader2, Bot, BookOpen, Brain, Code2, Search, Sparkles, Zap } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_TASKS = [
  { icon: Search, label: "Research a topic", prompt: "Research the history of the internet and summarise the 5 most important milestones." },
  { icon: Brain, label: "Explain 3 ways", prompt: "Explain photosynthesis in 3 different ways: for a 5-year-old, for a high schooler, and for a scientist." },
  { icon: BookOpen, label: "Build a study plan", prompt: "Create a 2-week study plan for learning Spanish from scratch, 30 minutes per day." },
  { icon: Zap, label: "Make a quiz", prompt: "Generate a 5-question multiple-choice quiz about the solar system. Include answers." },
  { icon: Code2, label: "Debug code", prompt: "Help me understand why this Python code might have a bug: def add(a, b): return a - b" },
  { icon: Bot, label: "Act as an expert", prompt: "Act as a professional chef. Give me a 3-course dinner menu for 4 people using only ingredients most people have at home." },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "I'm Versed. Give me a task — research, explanations, quizzes, code, writing — and I'll work through it with you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  async function send(messageText?: string) {
    const text = (messageText || input).trim();
    if (!text || isThinking) return;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, mode: "playground" }),
      });

      if (!res.ok || !res.body) throw new Error("unreachable");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      setIsThinking(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        chunk.split("\n").forEach((line) => {
          if (line.startsWith("data: ")) {
            assistantText += line.slice(6);
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: assistantText };
              return updated;
            });
          }
        });
      }
    } catch {
      setIsThinking(false);
      setError("Tutor is unreachable. The Cloud Run agent may still be starting.");
    }
  }

  return (
    <div className="flex flex-col min-h-[100dvh] overflow-hidden" style={{ background: "var(--background)" }}>
      <DotGrid />
      <Navbar />
      <main className="page-container flex-1 min-h-0 py-6 flex flex-col">
        <div className="flex flex-col gap-1 mb-4 flex-shrink-0">
          <span className="kicker">Playground</span>
          <h1 className="text-2xl font-semibold leading-none tracking-tight" style={{ color: "var(--foreground)" }}>
            Try anything
          </h1>
        </div>

        <div className="flex gap-5 flex-1 min-h-0">
          <aside className="hidden md:flex flex-col gap-2 w-52 flex-shrink-0 overflow-y-auto">
            <p className="kicker text-xs mb-1">Try these</p>
            {SUGGESTED_TASKS.map(({ icon: Icon, label, prompt }) => (
              <button
                key={label}
                onClick={() => send(prompt)}
                disabled={isThinking}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs border motion-safe:transition-opacity motion-safe:duration-150 hover:opacity-80"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--muted-foreground)",
                  minHeight: 44,
                }}
              >
                <Icon size={13} style={{ color: "var(--primary)", flexShrink: 0 }} aria-hidden="true" />
                {label}
              </button>
            ))}
          </aside>

          <div className="card-base flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mr-2 mt-0.5"
                      style={{ background: "var(--primary)" }}
                    >
                      <Sparkles size={13} color="white" aria-hidden="true" />
                    </div>
                  )}
                  <div
                    className="max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                    style={
                      msg.role === "user"
                        ? { background: "var(--muted)", color: "var(--foreground)" }
                        : {
                            background: "color-mix(in srgb, var(--primary) 8%, transparent)",
                            color: "var(--foreground)",
                            border: "1px solid color-mix(in srgb, var(--primary) 15%, transparent)",
                          }
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isThinking && (
                <p className="text-xs pl-9" style={{ color: "var(--muted-foreground)" }}>
                  Thinking…
                </p>
              )}
              {error && (
                <div
                  className="rounded-lg px-4 py-3 text-sm flex items-center justify-between gap-3"
                  style={{
                    background: "color-mix(in srgb, var(--destructive) 8%, transparent)",
                    color: "var(--destructive)",
                  }}
                  role="alert"
                >
                  <span>{error}</span>
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    style={{ minHeight: 36 }}
                    onClick={() => {
                      setError(null);
                      inputRef.current?.focus();
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form
              className="p-3 border-t"
              style={{ borderColor: "var(--border)" }}
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <label htmlFor="playground-input" className="sr-only">
                Message the tutor
              </label>
              <div className="flex gap-2">
                <input
                  id="playground-input"
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Give the agent a task…"
                  autoComplete="off"
                  className="flex-1 text-sm px-3 py-2 rounded-lg outline-none"
                  style={{
                    border: "1px solid var(--border)",
                    background: "var(--background)",
                    color: "var(--foreground)",
                    minHeight: 44,
                  }}
                />
                <button
                  type="submit"
                  className="btn-primary w-11 h-11 p-0 flex items-center justify-center"
                  disabled={isThinking || !input.trim()}
                  aria-label="Send"
                >
                  {isThinking ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
