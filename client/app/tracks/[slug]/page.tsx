"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import LabShell from "@/components/LabShell";
import Navbar from "@/components/Navbar";
import DotGrid from "@/components/DotGrid";
import LessonRow from "@/components/LessonRow";
import { getTrack } from "@/lib/content";
import { isLessonComplete, isTrackComplete } from "@/lib/xp";
import { Clock, Zap, BookOpen, Trophy } from "lucide-react";

export default function TrackPage() {
  const params = useParams();
  const slug   = params?.slug as string;
  const track  = getTrack(slug);

  const [completedCount, setCompleted] = useState(0);
  const [trackDone, setTrackDone]      = useState(false);

  useEffect(() => {
    if (!track) return;
    setCompleted(track.lessons.filter((l) => isLessonComplete(slug, l.id)).length);
    setTrackDone(isTrackComplete(slug));
  }, [slug, track]);

  if (!track) {
    return (
      <>
        <DotGrid />
        <Navbar />
        <div className="page-container py-24 text-center">
          <p style={{ color: "var(--muted-foreground)" }}>Track not found.</p>
          <Link href="/tracks"><button className="btn-primary mt-4">Back to paths</button></Link>
        </div>
      </>
    );
  }

  const progress = (completedCount / track.lessons.length) * 100;

  return (
    <LabShell
      activeTrackSlug={slug}
      crumbs={[
        { href: "/tracks", label: "Paths" },
        { label: track.path },
      ]}
    >
      <main id="main-content" className="flex-1 overflow-y-auto px-5 md:px-10 py-10">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-4 mb-8"
          >
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full self-start"
              style={{
                background: "color-mix(in srgb, var(--primary) 9%, transparent)",
                color: "var(--primary)",
              }}
            >
              {track.level}
            </span>

            <p className="kicker">{track.path}</p>
            <h1 className="text-4xl font-semibold" style={{ color: "var(--foreground)" }}>
              {track.title}
            </h1>

            <p className="text-base" style={{ color: "var(--muted-foreground)" }}>
              {track.description}
            </p>

            <div className="flex flex-wrap gap-5">
              {[
                { icon: Clock,    label: track.duration },
                { icon: Zap,      label: `${track.totalXp} XP` },
                { icon: BookOpen, label: `${track.lessonCount} lessons` },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
                  <Icon size={13} aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>

            <div
              role="progressbar"
              aria-valuenow={completedCount}
              aria-valuemin={0}
              aria-valuemax={track.lessons.length}
              aria-label={`${completedCount} of ${track.lessons.length} lessons done`}
            >
              <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                <span>{completedCount} of {track.lessons.length} complete</span>
                <span className="tabular-nums">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "var(--primary)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>

          {trackDone && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl p-4 mb-8 flex items-center gap-3"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              <Trophy size={20} aria-hidden="true" />
              <div>
                <p className="font-semibold text-sm">{track.badge} badge earned</p>
                <p className="text-xs opacity-80">You finished {track.path}.</p>
              </div>
            </div>
          )}

          <div className="border-t mb-6" style={{ borderColor: "var(--border)" }} />

          <section aria-label="Lessons">
            <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--foreground)" }}>Lessons</h2>
            <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
              3 min learn, then hands-on, then AI coaching.
            </p>
            <ol>
              {track.lessons.map((lesson, i) => (
                <motion.li
                  key={lesson.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.25 }}
                >
                  <LessonRow
                    lesson={lesson}
                    trackSlug={slug}
                    index={i}
                    isComplete={isLessonComplete(slug, lesson.id)}
                  />
                </motion.li>
              ))}
            </ol>
          </section>
        </div>
      </main>
    </LabShell>
  );
}
