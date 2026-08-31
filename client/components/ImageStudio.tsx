"use client";

import { useState, useRef } from "react";
import { Image, Loader2, RefreshCw, Sparkles, Zap, ChevronRight } from "lucide-react";
import { recordImageGenerated } from "@/lib/xp";

interface ImageStudioProps {
  trackSlug: string;
  lessonId: string;
  challengeMode?: boolean;
}

interface HistoryEntry {
  prompt: string;
  imageUrl: string;
  feedback?: FeedbackData;
}

interface FeedbackData {
  good: string;
  missing: string;
  next: string;
  score?: number;
}

const STYLE_CHIPS = [
  "cinematic",
  "photorealistic",
  "watercolour",
  "Studio Ghibli",
  "8-bit pixel art",
  "minimalist",
  "oil painting",
  "neon noir",
];

export default function ImageStudio({ trackSlug, lessonId, challengeMode = false }: ImageStudioProps) {
  const [prompt, setPrompt] = useState("");
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<HistoryEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const iterationCount = history.length;
  const maxXPIterations = 5;

  async function generate() {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    setFeedback(null);
    setSelectedHistory(null);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail || "Image generation failed");
      }

      const data = await res.json();
      const { imageUrl, feedback: rawFeedback } = data;

      // Parse feedback
      let parsedFeedback: FeedbackData | null = null;
      if (rawFeedback) {
        try {
          const cleaned = rawFeedback.trim().replace(/^```json|```$/g, "").trim();
          parsedFeedback = JSON.parse(cleaned);
        } catch {
          // Try plain text parsing
          parsedFeedback = {
            good: rawFeedback,
            missing: "",
            next: "Keep iterating!",
          };
        }
      }

      setCurrentImage(imageUrl);
      setFeedback(parsedFeedback);

      // Add to history
      const entry: HistoryEntry = {
        prompt: prompt.trim(),
        imageUrl,
        feedback: parsedFeedback || undefined,
      };
      setHistory((prev) => [...prev, entry]);

      // Award XP
      recordImageGenerated();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong. Is the backend running?";
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  }

  function appendStyleChip(chip: string) {
    setPrompt((prev) => (prev.trim() ? `${prev.trim()}, ${chip}` : chip));
    textareaRef.current?.focus();
  }

  function improveThis() {
    // Keep prompt, just let them edit
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }

  function startFresh() {
    setPrompt("");
    setCurrentImage(null);
    setFeedback(null);
    setSelectedHistory(null);
    setError(null);
    textareaRef.current?.focus();
  }

  const displayImage = selectedHistory ? selectedHistory.imageUrl : currentImage;
  const displayFeedback = selectedHistory ? selectedHistory.feedback : feedback;

  return (
    <div className="card-base overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)" }}
          >
            <Image size={16} style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              AI Image Studio
            </p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Powered by Imagen 3
            </p>
          </div>
        </div>

        {challengeMode && (
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{ background: "var(--destructive)", color: "white" }}
          >
            Challenge Mode
          </span>
        )}

        {/* XP counter */}
        <div className="flex items-center gap-1.5">
          <span className="xp-badge">
            <Zap size={10} />
            {Math.min(iterationCount, maxXPIterations)} / {maxXPIterations} ·{" "}
            +{Math.min(iterationCount, maxXPIterations) * 25} XP
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Helper text */}
        {!challengeMode && !currentImage && (
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            💡 Try: <strong>subject</strong> + <strong>environment</strong> + <strong>style</strong> + <strong>mood</strong>
          </p>
        )}

        {/* Prompt input */}
        <div className="flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to create…"
            className="w-full px-3 py-2 rounded-lg text-sm border resize-none outline-none transition-all"
            style={{
              border: "1px solid var(--border)",
              background: "var(--background)",
              color: "var(--foreground)",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) generate();
            }}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {prompt.length} chars · ⌘↵ to generate
            </span>
          </div>
        </div>

        {/* Style chips */}
        {!challengeMode && (
          <div className="flex flex-wrap gap-1.5">
            {STYLE_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => appendStyleChip(chip)}
                className="text-xs px-2.5 py-1 rounded-full border transition-all duration-150 hover:opacity-80 active:scale-95"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--muted-foreground)",
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Generate button */}
        <button
          className="btn-primary w-full flex items-center justify-center gap-2"
          onClick={generate}
          disabled={isGenerating || !prompt.trim()}
          style={{ opacity: isGenerating || !prompt.trim() ? 0.6 : 1 }}
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Imagen 3 is creating…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate Image
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div
            className="rounded-lg p-3 text-sm"
            style={{ background: "rgba(215,0,0,0.10)", color: "var(--destructive)" }}
          >
            {error}
          </div>
        )}

        {/* Loading placeholder */}
        {isGenerating && (
          <div
            className="w-full aspect-square rounded-xl flex items-center justify-center animate-pulse"
            style={{ background: "var(--muted)" }}
          >
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-3 animate-pulse-ring"
                style={{ background: "var(--primary)" }}
              />
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Imagen 3 is creating your image…
              </p>
            </div>
          </div>
        )}

        {/* Generated image */}
        {displayImage && !isGenerating && (
          <div className="flex flex-col gap-3">
            <div className="w-full rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt="AI generated"
                className="w-full h-auto"
              />
            </div>

            {/* Image actions */}
            <div className="flex gap-2">
              <button
                className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-sm"
                onClick={improveThis}
              >
                <RefreshCw size={13} /> Improve This
              </button>
              <button
                className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-sm"
                onClick={startFresh}
              >
                Start Fresh
              </button>
            </div>

            {/* Tutor feedback */}
            {!challengeMode && displayFeedback && (
              <div
                className="rounded-lg p-4"
                style={{
                  borderLeft: "3px solid var(--primary)",
                  background: "color-mix(in srgb, var(--primary) 6%, transparent)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={12} style={{ color: "var(--primary)" }} />
                  <span className="kicker text-xs">Tutor Feedback</span>
                  {displayFeedback.score && (
                    <span
                      className="ml-auto text-xs font-mono font-bold"
                      style={{ color: "var(--primary)" }}
                    >
                      {displayFeedback.score}/10
                    </span>
                  )}
                </div>
                {displayFeedback.good && (
                  <p className="text-xs mb-1" style={{ color: "var(--foreground)" }}>
                    <strong>✓ </strong>{displayFeedback.good}
                  </p>
                )}
                {displayFeedback.missing && (
                  <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                    <strong>Missing: </strong>{displayFeedback.missing}
                  </p>
                )}
                {displayFeedback.next && (
                  <p
                    className="text-xs flex items-start gap-1"
                    style={{ color: "var(--primary)" }}
                  >
                    <ChevronRight size={11} className="flex-shrink-0 mt-0.5" />
                    {displayFeedback.next}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Iteration history */}
        {history.length > 1 && (
          <div className="flex flex-col gap-2">
            <p className="kicker text-xs">Iteration history</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {history.map((entry, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedHistory(entry === selectedHistory ? null : entry)}
                  className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-150"
                  style={{
                    borderColor: selectedHistory === entry ? "var(--primary)" : "var(--border)",
                  }}
                  title={`V${i + 1}: ${entry.prompt}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.imageUrl}
                    alt={`Version ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Click a thumbnail to see that version's prompt and feedback
            </p>
            {selectedHistory && (
              <div
                className="rounded-lg p-3 text-xs"
                style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
              >
                <strong>Prompt:</strong> {selectedHistory.prompt}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
