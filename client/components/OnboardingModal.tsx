"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { AVATARS, AvatarGlyph } from "@/lib/avatars";
import { initRecord, type AvatarType } from "@/lib/xp";
import { tracks } from "@/lib/content";
import { Check, ArrowRight } from "lucide-react";

export default function OnboardingModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<"avatar" | "name" | "path">("avatar");
  const [selected, setSelected] = useState<AvatarType | null>(null);
  const [name, setName] = useState("");

  const chosen = AVATARS.find((a) => a.type === selected);

  function pickAvatar(type: AvatarType) {
    setSelected(type);
    setStep("name");
  }

  function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setStep("path");
  }

  function pickPath(slug: string) {
    initRecord(name.trim() || chosen?.label || "Explorer", selected ?? "explorer");
    onClose();
    router.push(`/tracks/${slug}`);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(28,25,21,0.45)", backdropFilter: "blur(8px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Start VersedAI"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", visualDuration: 0.35, bounce: 0.12 }}
        className="card-base p-8 w-full"
        style={{ maxWidth: 520, background: "var(--card)", maxHeight: "90vh", overflowY: "auto" }}
      >
        {step === "avatar" && (
          <div>
            <p className="kicker mb-1">Step 1 of 3</p>
            <h2 className="text-2xl font-semibold mb-1" style={{ color: "var(--foreground)" }}>
              What kind of learner are you?
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
              Pick the one that feels most like you.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="listbox" aria-label="Learner type">
              {AVATARS.map((a) => (
                <button
                  key={a.type}
                  type="button"
                  role="option"
                  aria-selected={selected === a.type}
                  onClick={() => pickAvatar(a.type)}
                  className="flex items-center gap-3 p-3 rounded-xl border text-left motion-safe:transition-transform motion-safe:duration-150 hover:-translate-y-px active:scale-[0.98]"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--background)",
                    minHeight: 44,
                  }}
                >
                  <AvatarGlyph type={a.type} size={18} />
                  <span>
                    <span className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      {a.label}
                    </span>
                    <span className="block text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {a.tagline}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "name" && chosen && (
          <div>
            <p className="kicker mb-1">Step 2 of 3</p>
            <div className="flex items-center gap-3 mb-4">
              <AvatarGlyph type={chosen.type} size={22} />
              <div>
                <h2 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
                  {chosen.label}
                </h2>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {chosen.tagline}
                </p>
              </div>
            </div>
            <label htmlFor="learner-name" className="text-sm mb-2 block" style={{ color: "var(--muted-foreground)" }}>
              What should we call you?
            </label>
            <form onSubmit={saveName} className="flex flex-col gap-3">
              <input
                id="learner-name"
                autoFocus
                type="text"
                autoComplete="nickname"
                placeholder="Your name or nickname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={1}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  minHeight: 44,
                }}
              />
              <button type="submit" className="btn-primary w-full gap-2">
                <Check size={15} aria-hidden="true" />
                Continue as {name.trim() || chosen.label}
              </button>
              <button
                type="button"
                className="text-xs text-center"
                style={{ color: "var(--muted-foreground)", minHeight: 44 }}
                onClick={() => setStep("avatar")}
              >
                Change learner type
              </button>
            </form>
          </div>
        )}

        {step === "path" && (
          <div>
            <p className="kicker mb-1">Step 3 of 3</p>
            <h2 className="text-2xl font-semibold mb-1" style={{ color: "var(--foreground)" }}>
              Pick your path
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
              Finish the path. Earn the badge. You can start another one later.
            </p>
            <div className="flex flex-col gap-2">
              {tracks.map((track) => (
                <button
                  key={track.slug}
                  type="button"
                  onClick={() => pickPath(track.slug)}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border text-left motion-safe:transition-transform motion-safe:duration-150 hover:-translate-y-px active:scale-[0.98]"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--background)",
                    minHeight: 56,
                  }}
                >
                  <img
                    src={track.badgeArt}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 rounded-full object-cover flex-shrink-0"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="kicker block mb-0.5">{track.kicker}</span>
                    <span className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      {track.path}
                    </span>
                    <span className="block text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      Badge: {track.badge}
                    </span>
                  </span>
                  <ArrowRight size={16} style={{ color: "var(--primary)" }} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
