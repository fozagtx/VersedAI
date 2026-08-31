"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Download, Loader2, RefreshCw, Video, Zap } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { recordVideoGenerated } from "@/lib/xp";
import { videoGenerateUrl } from "@/lib/backend";
import { readVideoStream } from "@/lib/video-stream";
import {
  dataUrlToBlob,
  downloadBlob,
  saveStudioItem,
  slugFilename,
} from "@/lib/studio-store";

interface VideoStudioProps {
  trackSlug?: string;
  lessonId?: string;
}

const CONCEPT_CHIPS = [
  "how tokens work",
  "what is an AI agent",
  "photosynthesis in 8 seconds",
  "why iteration beats one-shot prompts",
  "a neural net guessing the next word",
];

export default function VideoStudio({ trackSlug, lessonId }: VideoStudioProps) {
  const [concept, setConcept] = useState("");
  const [veoPrompt, setVeoPrompt] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function persist(url: string, prompt: string, shot: string | null) {
    try {
      const blob = await dataUrlToBlob(url);
      await saveStudioItem({
        kind: "video",
        prompt,
        concept: prompt,
        veoPrompt: shot || undefined,
        mimeType: blob.type || "video/mp4",
        blob,
        trackSlug,
        lessonId,
      });
      setSaved(true);
    } catch (e) {
      console.warn("[studio] video save failed", e);
    }
  }

  async function generate() {
    if (!concept.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    setSaved(false);
    setVeoPrompt(null);
    setStatus("Sending the concept…");
    setVideoUrl(null);

    try {
      const res = await fetch(videoGenerateUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: concept.trim(), duration: 8 }),
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
        throw new Error(String(raw) || `Video request failed (${res.status}).`);
      }

      if (!res.body) throw new Error("No response from the tutor.");

      let lastPrompt: string | null = null;
      let gotVideo = false;
      for await (const event of readVideoStream(res.body)) {
        if (event.type === "status") setStatus(event.message);
        if (event.type === "prompt") {
          lastPrompt = event.veoPrompt;
          setVeoPrompt(event.veoPrompt);
        }
        if (event.type === "error") throw new Error(event.error);
        if (event.type === "video") {
          gotVideo = true;
          lastPrompt = event.veoPrompt || lastPrompt;
          if (event.veoPrompt) setVeoPrompt(event.veoPrompt);
          setVideoUrl(event.videoUrl);
          setStatus(null);
          recordVideoGenerated();
          await persist(event.videoUrl, concept.trim(), lastPrompt);
        }
      }
      if (!gotVideo) {
        throw new Error("Veo finished without a clip. Try a simpler concept.");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Video request failed.";
      if (/404|NOT_FOUND|permission|not found|ACCESS_DENIED/i.test(msg)) {
        setError(
          "Veo 3 is not enabled on this Vertex project yet. Chat and images still work. Ask the tutor to storyboard the shot while access is added."
        );
      } else {
        setError(msg);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  async function download() {
    if (!videoUrl) return;
    const blob = await dataUrlToBlob(videoUrl);
    downloadBlob(blob, slugFilename(concept || "concept", "mp4"));
  }

  function startFresh() {
    setConcept("");
    setVeoPrompt(null);
    setVideoUrl(null);
    setSaved(false);
    setError(null);
    setStatus(null);
    textareaRef.current?.focus();
  }

  return (
    <div className="card-base overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)" }}
          >
            <Video size={16} style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Concept to clip
            </p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Gemini writes the shot. Veo 3 renders it.
            </p>
          </div>
        </div>
        <span className="xp-badge">
          <Zap size={10} />
          +25 XP first 5 clips
        </span>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {!videoUrl && (
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Type a raw idea. We turn it into an 8-second clip you can watch and keep.
          </p>
        )}

        <textarea
          ref={textareaRef}
          rows={3}
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="A concept you want to see, not a finished prompt…"
          className="w-full px-3 py-2 rounded-lg text-sm border resize-none outline-none"
          style={{
            border: "1px solid var(--border)",
            background: "var(--background)",
            color: "var(--foreground)",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) generate();
          }}
        />

        <div className="flex flex-wrap gap-1.5">
          {CONCEPT_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setConcept(chip);
                textareaRef.current?.focus();
              }}
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

        <button
          className="btn-primary w-full flex items-center justify-center gap-2"
          onClick={generate}
          disabled={isGenerating || !concept.trim()}
          aria-label={isGenerating ? status || "Making the clip" : "Make the clip"}
          style={{ opacity: isGenerating || !concept.trim() ? 0.6 : 1 }}
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {status || "Making the clip…"}
            </>
          ) : (
            <>
              <BrandMark size={16} />
              Make the clip
            </>
          )}
        </button>

        {error && (
          <div
            className="rounded-lg p-3 text-sm"
            style={{ background: "rgba(215,0,0,0.10)", color: "var(--destructive)" }}
          >
            {error}
          </div>
        )}

        {isGenerating && (
          <div
            className="w-full aspect-video rounded-xl flex items-center justify-center"
            style={{ background: "var(--muted)" }}
          >
            <div className="text-center px-6">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-3 animate-pulse-ring"
                style={{ background: "var(--primary)" }}
              />
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                {status || "Veo 3 is rendering…"}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                About a minute. Keep this tab open.
              </p>
            </div>
          </div>
        )}

        {veoPrompt && (
          <div
            className="rounded-lg p-4"
            style={{
              borderLeft: "3px solid var(--primary)",
              background: "color-mix(in srgb, var(--primary) 6%, transparent)",
            }}
          >
            <p className="kicker text-xs mb-2">Shot Veo received</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
              {veoPrompt}
            </p>
          </div>
        )}

        {videoUrl && !isGenerating && (
          <div className="flex flex-col gap-3">
            <video
              src={videoUrl}
              controls
              playsInline
              className="w-full rounded-xl"
              style={{ background: "#1C1915" }}
            />
            <p className="text-xs" style={{ color: saved ? "var(--success)" : "var(--muted-foreground)" }}>
              {saved
                ? "Saved on this device. It stays in Studio after you leave."
                : "Clip is ready. Saving to this device…"}
            </p>
            <div className="flex gap-2">
              <button
                className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-sm"
                onClick={download}
              >
                <Download size={13} /> Download
              </button>
              <button
                className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-sm"
                onClick={startFresh}
              >
                <RefreshCw size={13} /> New concept
              </button>
            </div>
            <Link href="/studio" className="text-xs" style={{ color: "var(--primary)" }}>
              Open saved studio →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
