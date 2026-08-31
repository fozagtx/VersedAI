"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import DotGrid from "@/components/DotGrid";
import { ArrowDown, Send, Loader2 } from "lucide-react";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/components/ui/prompt-input";
import { PromptSuggestion } from "@/components/ui/prompt-suggestion";
import {
  ChatContainerRoot,
  ChatContainerContent,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container";
import { ScrollButton } from "@/components/ui/scroll-button";
import { Message, MessageContent } from "@/components/ui/message";
import BrandMark from "@/components/BrandMark";
import ModelTag from "@/components/ModelTag";
import QuizPrompt from "@/components/QuizPrompt";
import { readChatStream, type QuizPayload } from "@/lib/chat-stream";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  label?: string;
  fallback?: boolean;
  quiz?: QuizPayload;
}

const STARTERS = [
  { label: "What AI is", prompt: "In two sentences, what is AI actually doing when it answers me? No lecture." },
  { label: "Fix my prompt", prompt: "Critique this prompt and rewrite it with a goal, context, and one constraint: write a short bio for a student designer." },
  { label: "Image prompt", prompt: "Help me write a poster prompt: quiet library at night, one lamp, no people. Make it specific." },
  { label: "Agent vs chatbot", prompt: "What is an AI agent, and how is it different from a chatbot? Two sentences." },
  { label: "Quiz me", prompt: "Quiz me on when not to trust AI." },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "I'm Versed. Gemma 4 handles drills and quizzes. Gemini 3.5 Flash coaches on prompts and hints. Ask.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        body: JSON.stringify({ message: text, mode: "auto" }),
      });

      if (!res.ok || !res.body) throw new Error("unreachable");
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
      setError("Tutor did not answer. First call after idle can fail. Try once more.");
    }
  }

  return (
    <div className="flex flex-col min-h-[100dvh] overflow-hidden" style={{ background: "var(--background)" }}>
      <DotGrid />
      <Navbar />
      <main className="page-container flex-1 min-h-0 py-5 flex flex-col gap-3">
        <div className="flex-shrink-0">
          <p className="kicker">Tutor</p>
          <h1 className="text-2xl font-semibold leading-none tracking-tight" style={{ color: "var(--foreground)" }}>
            Ask Versed
          </h1>
          <p className="text-xs mt-1.5" style={{ color: "var(--muted-foreground)" }}>
            Gemma drills. Gemini coaches. Each reply is tagged.
          </p>
        </div>

        <div className="card-base flex-1 flex flex-col overflow-hidden min-h-0 relative">
          <ChatContainerRoot className="flex-1 min-h-0 px-4 pt-4">
            <ChatContainerContent className="gap-4 pb-16">
              {messages.map((msg, i) => (
                <Message
                  key={i}
                  className={msg.role === "user" ? "flex-row-reverse" : undefined}
                >
                  {msg.role === "assistant" ? (
                    <BrandMark size={28} />
                  ) : (
                    <span
                      className="size-7 rounded-lg flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                      style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                    >
                      You
                    </span>
                  )}
                  <div className="min-w-0">
                    {msg.role === "assistant" && msg.label && (
                      <ModelTag label={msg.label} fallback={msg.fallback} />
                    )}
                    <MessageContent
                      markdown={msg.role === "assistant"}
                      className={
                        msg.role === "user"
                          ? "bg-[var(--muted)] text-[var(--foreground)]"
                          : "bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]"
                      }
                    >
                      {msg.content || (isThinking && i === messages.length - 1 ? "…" : "")}
                    </MessageContent>
                    {msg.quiz && msg.quiz.question && (
                      <QuizPrompt
                        question={msg.quiz.question}
                        options={msg.quiz.options}
                        correct={msg.quiz.correct}
                      />
                    )}
                  </div>
                </Message>
              ))}
              {isThinking && (
                <p className="text-xs pl-11" style={{ color: "var(--muted-foreground)" }}>
                  Thinking…
                </p>
              )}
              {error && (
                <div
                  className="rounded-lg px-4 py-3 text-sm"
                  style={{
                    background: "color-mix(in srgb, var(--destructive) 8%, transparent)",
                    color: "var(--destructive)",
                  }}
                  role="alert"
                >
                  {error}
                </div>
              )}
              <ChatContainerScrollAnchor />
            </ChatContainerContent>
            <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
              <ScrollButton
                className="pointer-events-auto border-[var(--border)] bg-[var(--card)]"
                aria-label="More below. Jump to latest"
              >
                <ArrowDown className="h-5 w-5" />
              </ScrollButton>
            </div>
          </ChatContainerRoot>

          <div className="p-3 border-t flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-1.5">
                {STARTERS.map((s) => (
                  <PromptSuggestion
                    key={s.label}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => send(s.prompt)}
                    disabled={isThinking}
                  >
                    {s.label}
                  </PromptSuggestion>
                ))}
              </div>
            )}
            <PromptInput
              value={input}
              onValueChange={setInput}
              isLoading={isThinking}
              onSubmit={() => send()}
              className="border border-[var(--border)] bg-[var(--background)]"
            >
              <PromptInputTextarea
                placeholder="Ask about a path, a prompt, or a task…"
                aria-label="Message the tutor"
              />
              <PromptInputActions className="justify-end p-2">
                <PromptInputAction tooltip="Send">
                  <button
                    type="button"
                    className="btn-primary w-10 h-10 p-0 flex items-center justify-center"
                    disabled={isThinking || !input.trim()}
                    onClick={() => send()}
                    aria-label="Send"
                  >
                    {isThinking ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </PromptInputAction>
              </PromptInputActions>
            </PromptInput>
          </div>
        </div>
      </main>
    </div>
  );
}
