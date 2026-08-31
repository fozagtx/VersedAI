"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DotGrid from "@/components/DotGrid";
import TrackCard from "@/components/TrackCard";
import { tracks } from "@/lib/content";
import { AVATARS, AvatarGlyph } from "@/lib/avatars";
import { getRecord, initRecord, getLevelFromXP, type AvatarType } from "@/lib/xp";
import { ArrowRight, Check } from "lucide-react";

/* ─────────────────────────────────────────────────────────
 * PAGE CONTENT STORYBOARD
 *
 * Static shell (nav) never re-animates.
 *
 *    0ms   kicker
 *   80ms   headline
 *  180ms   body + CTAs
 *  360ms   tracks header
 *  420ms   track cards stagger
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  kicker: 0,
  title: 80,
  body: 180,
  tracks: 360,
};

const SPRING = { type: "spring" as const, stiffness: 350, damping: 28 };

function OnboardingModal({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"avatar" | "name">("avatar");
  const [selected, setSelected] = useState<AvatarType | null>(null);
  const [name, setName] = useState("");
  const reduce = useReducedMotion();

  const chosen = AVATARS.find((a) => a.type === selected);

  function pickAvatar(type: AvatarType) {
    setSelected(type);
    setStep("name");
  }

  function finish(e: React.FormEvent) {
    e.preventDefault();
    initRecord(name.trim() || chosen?.label || "Explorer", selected ?? "explorer");
    onDone();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(28,25,21,0.45)", backdropFilter: "blur(8px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Choose your avatar"
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", visualDuration: 0.35, bounce: 0.12 }}
        className="card-base p-8 w-full"
        style={{ maxWidth: 520, background: "var(--card)" }}
      >
        {step === "avatar" && (
          <div>
            <p className="kicker mb-1">Step 1 of 2</p>
            <h2 className="text-2xl font-semibold mb-1" style={{ color: "var(--foreground)" }}>
              What kind of learner are you?
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
              Pick the one that feels most like you.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="listbox" aria-label="Avatar options">
              {AVATARS.map((a) => (
                <button
                  key={a.type}
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
            <p className="kicker mb-1">Step 2 of 2</p>
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
            <form onSubmit={finish} className="flex flex-col gap-3">
              <input
                id="learner-name"
                autoFocus
                type="text"
                autoComplete="nickname"
                placeholder="Your name or nickname"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                Start as {name.trim() || chosen.label}
              </button>
              <button
                type="button"
                className="text-xs text-center"
                style={{ color: "var(--muted-foreground)", minHeight: 44 }}
                onClick={() => setStep("avatar")}
              >
                Change avatar
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function Home() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setOnboarding] = useState(false);
  const [xp, setXp] = useState(0);
  const [avatarType, setAvatarType] = useState<AvatarType | null>(null);
  const [username, setUsername] = useState("");
  const [stage, setStage] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const r = getRecord();
    if (r) {
      setXp(r.totalXp);
      setAvatarType(r.avatarType);
      setUsername(r.username);
    } else {
      setOnboarding(true);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (reduce) {
      setStage(5);
      return;
    }
    const timers = [
      setTimeout(() => setStage(1), TIMING.kicker),
      setTimeout(() => setStage(2), TIMING.title),
      setTimeout(() => setStage(3), TIMING.body),
      setTimeout(() => setStage(4), TIMING.tracks),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduce]);

  function handleDone() {
    const r = getRecord();
    if (r) {
      setXp(r.totalXp);
      setAvatarType(r.avatarType);
      setUsername(r.username);
    }
    setOnboarding(false);
  }

  const show = (n: number) => stage >= n;

  return (
    <div style={{ background: "var(--background)" }}>
      <DotGrid />
      <Navbar />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:rounded-lg focus:shadow"
        style={{ color: "var(--primary)" }}
      >
        Skip to content
      </a>

      {ready && showOnboarding && <OnboardingModal onDone={handleDone} />}

      <main id="main-content" className="page-container">
        <section className="py-24 md:py-32" aria-label="Hero">
          <div className="grid md:grid-cols-[1.4fr_0.8fr] gap-12 items-end">
            <div className="flex flex-col gap-5 max-w-2xl">
              <motion.p
                className="kicker"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: show(1) ? 1 : 0, y: show(1) ? 0 : -12 }}
                transition={SPRING}
              >
                High-school AI lab
              </motion.p>

              <motion.h1
                className="text-5xl md:text-6xl font-semibold leading-none"
                style={{ color: "var(--foreground)" }}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: show(2) ? 1 : 0, y: show(2) ? 0 : -12 }}
                transition={SPRING}
              >
                Learn to use AI.{" "}
                <span
                  className="font-display"
                  style={{ color: "var(--primary)", fontStyle: "italic", fontWeight: 400 }}
                >
                  Actually
                </span>{" "}
                use it.
              </motion.h1>

              <motion.p
                className="text-lg"
                style={{ color: "var(--muted-foreground)", maxWidth: "54ch" }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: show(3) ? 1 : 0, y: show(3) ? 0 : 16 }}
                transition={SPRING}
              >
                Four short tracks. Each lesson is three minutes of theory, then a real prompt,
                image, or agent task, with a tutor that hints instead of lecturing.
              </motion.p>

              <motion.div
                className="flex items-center gap-3 flex-wrap"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: show(3) ? 1 : 0, y: show(3) ? 0 : 16 }}
                transition={SPRING}
              >
                <Link href="/tracks">
                  <button className="btn-primary gap-2">
                    Start learning <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </Link>
                <Link href="/chat">
                  <button className="btn-secondary">Open playground</button>
                </Link>
              </motion.div>

              {avatarType && (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: show(3) ? 1 : 0 }}
                >
                  <AvatarGlyph type={avatarType} size={14} />
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Welcome back,{" "}
                    <strong style={{ color: "var(--foreground)" }}>{username || "learner"}</strong>
                    {xp > 0 && (
                      <>
                        {" "}
                        ·{" "}
                        <span className="tabular-nums" style={{ color: "var(--primary)" }}>
                          {xp} XP
                        </span>
                        {" "}
                        · {getLevelFromXP(xp).label}
                      </>
                    )}
                  </p>
                </motion.div>
              )}
            </div>

            <motion.aside
              className="hidden md:flex flex-col gap-6 border-l pl-8"
              style={{ borderColor: "var(--border)" }}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: show(3) ? 1 : 0, x: show(3) ? 0 : 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              aria-label="How it works"
            >
              {[
                { n: "01", title: "Learn", body: "The three things that matter. Three minutes." },
                { n: "02", title: "Try", body: "Generate an image, write a prompt, run an agent." },
                { n: "03", title: "Improve", body: "Smallest useful hint. You try again." },
              ].map((step) => (
                <div key={step.n} className="flex gap-4">
                  <span className="kicker w-8 flex-shrink-0 pt-1">{step.n}</span>
                  <div>
                    <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {step.title}
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </motion.aside>
          </div>
        </section>

        <section className="pb-20" aria-label="Learning tracks">
          <motion.div
            className="flex items-end justify-between mb-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: show(4) ? 1 : 0, y: show(4) ? 0 : 16 }}
            transition={SPRING}
          >
            <div>
              <p className="kicker mb-1">Tracks</p>
              <h2 className="text-3xl font-semibold" style={{ color: "var(--foreground)" }}>
                Pick a track, start today
              </h2>
            </div>
            <Link
              href="/tracks"
              className="hidden md:flex items-center gap-1 text-sm font-medium"
              style={{ color: "var(--primary)" }}
            >
              View all <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tracks.map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{
                  opacity: show(4) ? 1 : 0,
                  y: show(4) ? 0 : 24,
                }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 26,
                  delay: reduce ? 0 : i * 0.08,
                }}
              >
                <TrackCard track={track} />
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
