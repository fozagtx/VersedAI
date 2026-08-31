"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, Brain } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolUsed?: string;
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
      content: `Hi! I'm Versed, your AI tutor. You're on **"${lessonTitle}"** — let me know if you have any questions, want me to explain something differently, or give you a hint on the challenge.`,
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
          mode: "tutor",
        }),
      });

      if (!res.ok || !res.body) throw new Error("Failed to connect");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      // Add empty assistant message to fill in
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      setIsThinking(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE data lines
        chunk.split("\n").forEach((line) => {
          if (line.startsWith("data: ")) {
            assistantText += line.slice(6);
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: assistantText,
              };
              return updated;
            });
          }
        });
      }
    } catch {
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm having trouble reaching the tutor. The Cloud Run agent may still be starting — try again in a moment.",
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
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--primary)" }}
        >
          <Sparkles size={14} color="white" />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Versed
          </p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            AI Tutor · Always here
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
              {/* Render simple markdown bold */}
              {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                part.startsWith("**") && part.endsWith("**") ? (
                  <strong key={j}>{part.slice(2, -2)}</strong>
                ) : (
                  part
                )
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
          Powered by Gemini 2.5 Flash · Google ADK
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
