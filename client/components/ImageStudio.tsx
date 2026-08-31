"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Download, ImageIcon, Loader2, RefreshCw, Zap, ChevronRight } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { recordImageGenerated } from "@/lib/xp";
import {
  dataUrlToBlob,
  downloadBlob,
  listStudioItems,
  saveStudioItem,
  slugFilename,
} from "@/lib/studio-store";

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
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const objectUrls = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await listStudioItems("image");
        if (cancelled || items.length === 0) return;
        const scoped = items.filter(
          (item) => !trackSlug || item.trackSlug === trackSlug
        );
        const entries: HistoryEntry[] = scoped.slice(0, 12).reverse().map((item) => {
          const url = URL.createObjectURL(item.blob);
          objectUrls.current.push(url);
          return { prompt: item.prompt, imageUrl: url };
        });
        if (entries.length) {
          setHistory(entries);
          const last = entries[entries.length - 1];
          setCurrentImage(last.imageUrl);
          setPrompt(last.prompt);
          setSaved(true);
        }
      } catch {
        /* private mode, first visit */
      }
    })();
    return () => {
      cancelled = true;
      objectUrls.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrls.current = [];
    };
  }, [trackSlug]);

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
        const err = await res.json().catch(() => ({}));
        let raw = err.error ?? err.detail ?? err.message ?? "";
        if (typeof raw === "string") {
          try {
            const nested = JSON.parse(raw);
            raw = nested.detail ?? nested.error ?? raw;
          } catch {
            /* keep raw */
          }
        }
        const text = String(raw);
        if (/404|NOT_FOUND|retired|was not found/i.test(text)) {
          throw new Error(
            "Image model is not available on this Vertex project. Chat still works. Ask the tutor to write the prompt while we switch models."
          );
        }
        throw new Error(text || `Image request failed (${res.status}).`);
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
      setSaved(false);

      const entry: HistoryEntry = {
        prompt: prompt.trim(),
        imageUrl,
        feedback: parsedFeedback || undefined,
      };
      setHistory((prev) => [...prev, entry]);
      recordImageGenerated();

      try {
        const blob = await dataUrlToBlob(imageUrl);
        await saveStudioItem({
          kind: "image",
          prompt: prompt.trim(),
          mimeType: blob.type || "image/png",
          blob,
          trackSlug,
          lessonId,
        });
        setSaved(true);
      } catch (saveErr) {
        console.warn("[studio] image save failed", saveErr);
      }
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
    setSaved(false);
    textareaRef.current?.focus();
  }

  const displayImage = selectedHistory ? selectedHistory.imageUrl : currentImage;
  const displayFeedback = selectedHistory ? selectedHistory.feedback : feedback;

  async function downloadCurrent() {
    if (!displayImage) return;
    const blob = await dataUrlToBlob(displayImage);
    const name = selectedHistory?.prompt || prompt || "image";
    downloadBlob(blob, slugFilename(name, "png"));
  }

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
            <ImageIcon size={16} style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Image studio
            </p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Gemini image on Vertex · saved on this device
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
            Try: <strong>subject</strong> + <strong>environment</strong> + <strong>style</strong> + <strong>mood</strong>
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
          aria-label={isGenerating ? "Making the image" : "Generate Image"}
          style={{ opacity: isGenerating || !prompt.trim() ? 0.6 : 1 }}
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Making the image…
            </>
          ) : (
            <>
              <BrandMark size={16} />
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
                Making the image…
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

            <p className="text-xs" style={{ color: saved ? "var(--success)" : "var(--muted-foreground)" }}>
              {saved
                ? "Saved on this device. Open Studio anytime to get it back."
                : "Saving to this device…"}
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-sm"
                onClick={downloadCurrent}
              >
                <Download size={13} /> Download
              </button>
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
            <Link
              href="/studio"
              className="text-xs"
              style={{ color: "var(--primary)" }}
            >
              Open saved studio →
            </Link>

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
                  <BrandMark size={14} />
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
              Click a thumbnail to see that version prompt and feedback
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
