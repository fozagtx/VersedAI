"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import Navbar from "@/components/Navbar";
import DotGrid from "@/components/DotGrid";
import AppSidebar from "@/components/Sidebar";
import TutorChat from "@/components/TutorChat";
import ImageStudio from "@/components/ImageStudio";
import ContextLab from "@/components/ContextLab";
import { getTrack, getLesson, getLessonIndex } from "@/lib/content";
import { markLessonComplete, markTrackComplete, isLessonComplete } from "@/lib/xp";
import {
  ArrowLeft, ArrowRight, Clock, Zap, CheckCircle,
  BookOpen, Image, MessageSquare, FlaskConical, Lightbulb,
} from "lucide-react";

const TYPE_META: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  read:           { label: "Reading",       Icon: BookOpen,      color: "#6B7280" },
  "image-studio": { label: "Image Studio",  Icon: Image,         color: "#D97706" },
  "agent-chat":   { label: "Agent Chat",    Icon: MessageSquare, color: "#2563EB" },
  "context-lab":  { label: "Context Lab",   Icon: FlaskConical,  color: "#7C3AED" },
  quiz:           { label: "Quiz",          Icon: Lightbulb,     color: "#16A34A" },
};

export default function LessonPage() {
  const params   = useParams();
  const slug     = params?.slug   as string;
  const lessonId = params?.lesson as string;

  const track  = getTrack(slug);
  const lesson = getLesson(slug, lessonId);
  const index  = getLessonIndex(slug, lessonId);

  const [complete, setComplete]         = useState(false);
  const [justDone, setJustDone]         = useState(false);

  useEffect(() => {
    setComplete(isLessonComplete(slug, lessonId));
  }, [slug, lessonId]);

  if (!track || !lesson) {
    return (
      <>
        <DotGrid /><Navbar />
        <div className="page-container py-24 text-center">
          <p style={{ color: "var(--muted-foreground)" }}>Lesson not found.</p>
          <Link href={`/tracks/${slug}`}><button className="btn-primary mt-4">Back</button></Link>
        </div>
      </>
    );
  }

  const prev = index > 0 ? track.lessons[index - 1] : null;
  const next = index < track.lessons.length - 1 ? track.lessons[index + 1] : null;
  const meta = TYPE_META[lesson.type] ?? TYPE_META.read;

  function handleComplete() {
    const r = markLessonComplete(slug, lessonId, lesson!.xp);
    if (r?.isNew) {
      setComplete(true);
      setJustDone(true);
      if (track!.lessons.every((l) => isLessonComplete(slug, l.id))) {
        markTrackComplete(slug, 500);
      }
      setTimeout(() => setJustDone(false), 3500);
    }
  }

  return (
    <div style={{ background: "var(--background)" }}>
      <DotGrid />
      <Navbar />

      {/* XP toast */}
      <AnimatePresence>
        {justDone && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,   scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            role="status"
            aria-live="polite"
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-xl px-5 py-3 flex items-center gap-2 shadow-lg"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            <Zap size={16} aria-hidden="true" />
            <span className="text-sm font-semibold tabular-nums">+{lesson.xp} XP earned!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <SidebarProvider>
        <AppSidebar activeTrackSlug={slug} activeLessonId={lessonId} />

        <SidebarInset>
          {/* Breadcrumb header */}
          <header
            className="flex items-center gap-2 px-6 py-3 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <SidebarTrigger aria-label="Toggle sidebar" />
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
              <Link href="/tracks" className="hover:underline">Tracks</Link>
              <span aria-hidden="true">/</span>
              <Link href={`/tracks/${slug}`} className="hover:underline">{track.title}</Link>
              <span aria-hidden="true">/</span>
              <span style={{ color: "var(--foreground)" }}>{lesson.title}</span>
            </nav>
          </header>

          {/* Split two-panel layout */}
          <div className="flex h-[calc(100vh-57px-49px)]">

            {/* ── LEFT: Lesson content (scrollable) ─────────── */}
            <article
              className="flex-1 overflow-y-auto px-6 md:px-10 py-8"
              aria-label={lesson.title}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className="max-w-2xl"
              >
                {/* Lesson type chip */}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md font-medium"
                    style={{ background: `${meta.color}18`, color: meta.color }}
                  >
                    <meta.Icon size={11} aria-hidden="true" />
                    {meta.label}
                  </span>
                  <span className="text-xs tabular-nums" style={{ color: "var(--muted-foreground)" }}>
                    {index + 1} / {track.lessons.length}
                  </span>
                </div>

                <h1 className="text-3xl font-semibold mb-3" style={{ color: "var(--foreground)" }}>
                  {lesson.title}
                </h1>

                <div className="flex items-center gap-4 mb-8">
                  <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
                    <Clock size={13} aria-hidden="true" /> {lesson.duration}
                  </span>
                  <span className="xp-badge" aria-label={`${lesson.xp} XP`}>
                    <Zap size={10} aria-hidden="true" /> {lesson.xp} XP
                  </span>
                  {complete && (
                    <span className="flex items-center gap-1 text-sm font-medium" style={{ color: "var(--success)" }}>
                      <CheckCircle size={13} aria-hidden="true" /> Done
                    </span>
                  )}
                </div>

                <div className="border-t mb-8" style={{ borderColor: "var(--border)" }} />

                {/* Principles */}
                <section aria-label="Key concepts" className="flex flex-col gap-7 mb-10">
                  {lesson.content.principles.map((p, i) => (
                    <div key={i} className="flex gap-4">
                      <span
                        aria-hidden="true"
                        className="text-sm font-mono tabular-nums flex-shrink-0 mt-0.5"
                        style={{ color: "var(--muted-foreground)", opacity: 0.4 }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h2 className="text-base font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>
                          {p.heading}
                        </h2>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                          {p.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </section>

                {/* Example */}
                {lesson.content.example && (
                  <aside
                    aria-label="Example"
                    className="rounded-lg p-4 mb-8"
                    style={{
                      borderLeft: "3px solid var(--primary)",
                      background: "color-mix(in srgb, var(--primary) 5%, transparent)",
                    }}
                  >
                    <p className="kicker mb-2">{lesson.content.example.label}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                      {lesson.content.example.prompt}
                    </p>
                  </aside>
                )}

                {/* Interactive zones */}
                {lesson.type === "image-studio" && (
                  <section aria-label="AI Image Studio" className="mb-8">
                    <ImageStudio trackSlug={slug} lessonId={lessonId} challengeMode={lesson.id === "image-challenge"} />
                  </section>
                )}
                {lesson.type === "context-lab" && (
                  <section aria-label="Context Lab" className="mb-8">
                    <ContextLab />
                  </section>
                )}
                {lesson.type === "agent-chat" && (
                  <div className="rounded-xl p-5 mb-8 border flex items-center gap-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "color-mix(in srgb, var(--primary) 9%, transparent)" }}>
                      <MessageSquare size={20} aria-hidden="true" style={{ color: "var(--primary)" }} />
                    </div>
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                      <strong style={{ color: "var(--foreground)" }}>Use the AI Tutor panel</strong> on the right.
                      Give the agent a real task and watch it work.
                    </p>
                  </div>
                )}

                {/* Challenge */}
                {lesson.content.challenge && (
                  <section aria-label="Your challenge" className="rounded-xl p-5 mb-8 border" style={{ borderColor: "color-mix(in srgb, var(--primary) 22%, transparent)", background: "color-mix(in srgb, var(--primary) 4%, transparent)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap size={15} aria-hidden="true" style={{ color: "var(--primary)" }} />
                      <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>Your Challenge</span>
                    </div>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--foreground)" }}>
                      {lesson.content.challenge}
                    </p>
                    {!complete ? (
                      <button className="btn-primary" onClick={handleComplete} aria-label={`Complete and earn ${lesson.xp} XP`}>
                        Mark Complete &middot; +{lesson.xp} XP
                      </button>
                    ) : (
                      <p className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--success)" }}>
                        <CheckCircle size={14} aria-hidden="true" /> Completed &middot; +{lesson.xp} XP earned
                      </p>
                    )}
                  </section>
                )}

                {/* Prev / Next */}
                <nav aria-label="Lesson navigation" className="flex justify-between pt-6 border-t" style={{ borderColor: "var(--border)" }}>
                  {prev ? (
                    <Link href={`/tracks/${slug}/${prev.id}`}>
                      <button className="btn-secondary gap-2" aria-label={`Previous: ${prev.title}`}>
                        <ArrowLeft size={14} aria-hidden="true" />
                        <span className="hidden sm:inline">{prev.title}</span>
                        <span className="sm:hidden">Prev</span>
                      </button>
                    </Link>
                  ) : <div />}

                  {next ? (
                    <Link href={`/tracks/${slug}/${next.id}`}>
                      <button className="btn-primary gap-2" aria-label={`Next: ${next.title}`}>
                        <span className="hidden sm:inline">{next.title}</span>
                        <span className="sm:hidden">Next</span>
                        <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </Link>
                  ) : (
                    <Link href={`/tracks/${slug}`}>
                      <button className="btn-primary gap-2">
                        Back to Track <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </Link>
                  )}
                </nav>
              </motion.div>
            </article>

            {/* ── RIGHT: AI Tutor (fixed height, scrolls inside) ─ */}
            <div
              className="hidden lg:flex flex-col flex-shrink-0 border-l"
              style={{
                width: "360px",
                borderColor: "var(--border)",
              }}
            >
              <TutorChat trackSlug={slug} lessonId={lessonId} lessonTitle={lesson.title} />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
