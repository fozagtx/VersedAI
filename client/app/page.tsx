"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DotGrid from "@/components/DotGrid";
import TrackCard from "@/components/TrackCard";
import OnboardingModal from "@/components/OnboardingModal";
import MacBookHero from "@/components/MacBookHero";
import { tracks } from "@/lib/content";
import { AvatarGlyph } from "@/lib/avatars";
import { getRecord, getLevelFromXP, type AvatarType } from "@/lib/xp";
import { ArrowRight } from "lucide-react";

const TIMING = {
  title: 0,
  body: 120,
  tracks: 320,
};

const SPRING = { type: "spring" as const, stiffness: 350, damping: 28 };

export default function Home() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setOnboarding] = useState(false);
  const [xp, setXp] = useState(0);
  const [avatarType, setAvatarType] = useState<AvatarType | null>(null);
  const [username, setUsername] = useState("");
  const [stage, setStage] = useState(0);
  const reduce = useReducedMotion();
  const started = Boolean(username);

  useEffect(() => {
    const r = getRecord();
    if (r) {
      setXp(r.totalXp);
      setAvatarType(r.avatarType);
      setUsername(r.username);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (reduce) {
      setStage(5);
      return;
    }
    const timers = [
      setTimeout(() => setStage(1), TIMING.title),
      setTimeout(() => setStage(2), TIMING.body),
      setTimeout(() => setStage(3), TIMING.tracks),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduce]);

  function openStart() {
    if (started) return;
    setOnboarding(true);
  }

  const show = (n: number) => stage >= n;

  return (
    <div style={{ background: "var(--background)" }}>
      <DotGrid />
      <Navbar onStartFree={openStart} />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:rounded-lg focus:shadow"
        style={{ color: "var(--primary)" }}
      >
        Skip to content
      </a>

      {ready && showOnboarding && <OnboardingModal onClose={() => setOnboarding(false)} />}

      <main id="main-content" className="page-container">
        <section className="py-16 md:py-24" aria-label="Hero">
          <div className="grid md:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
            <div className="flex flex-col gap-5 max-w-2xl">
              <motion.h1
                className="text-5xl md:text-6xl font-semibold leading-none"
                style={{ color: "var(--foreground)" }}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: show(1) ? 1 : 0, y: show(1) ? 0 : -12 }}
                transition={SPRING}
              >
                The first{" "}
                <span
                  className="font-display"
                  style={{ color: "var(--primary)", fontStyle: "italic", fontWeight: 400 }}
                >
                  generative
                </span>{" "}
                AI lab for online learners.
              </motion.h1>

              <motion.p
                className="text-lg"
                style={{ color: "var(--muted-foreground)", maxWidth: "54ch" }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: show(2) ? 1 : 0, y: show(2) ? 0 : 16 }}
                transition={SPRING}
              >
                Gemma runs drills and quizzes. Gemini coaches. Type a concept, Veo 3
                turns it into a clip. Pick a path, do the work, keep what you make.
              </motion.p>

              <motion.div
                className="flex items-center gap-3 flex-wrap"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: show(2) ? 1 : 0, y: show(2) ? 0 : 16 }}
                transition={SPRING}
              >
                {started ? (
                  <Link href="/tracks">
                    <button className="btn-primary gap-2">
                      Continue <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  </Link>
                ) : (
                  <button type="button" className="btn-primary gap-2" onClick={openStart}>
                    Start free <ArrowRight size={16} aria-hidden="true" />
                  </button>
                )}
                <Link href="/chat">
                  <button className="btn-secondary">Ask the tutor</button>
                </Link>
              </motion.div>

              {avatarType && (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: show(2) ? 1 : 0 }}
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
              className="flex flex-col"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: show(2) ? 1 : 0, x: show(2) ? 0 : 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              aria-label="How it works"
            >
              <MacBookHero />
            </motion.aside>
          </div>
        </section>

        <section className="pb-20" aria-label="Learning paths">
          <motion.div
            className="flex items-end justify-between mb-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: show(3) ? 1 : 0, y: show(3) ? 0 : 16 }}
            transition={SPRING}
          >
            <div>
              <p className="kicker mb-1">Paths</p>
              <h2 className="text-3xl font-semibold" style={{ color: "var(--foreground)" }}>
                Four paths. One badge each.
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 [grid-template-columns:minmax(0,1fr)] md:[grid-template-columns:minmax(0,1fr)_minmax(0,1fr)]">
            {tracks.map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{
                  opacity: show(3) ? 1 : 0,
                  y: show(3) ? 0 : 24,
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
