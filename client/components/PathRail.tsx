"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { tracks } from "@/lib/content";
import { isLessonComplete, isTrackComplete } from "@/lib/xp";
import { Award } from "lucide-react";

export default function PathRail({
  activeTrackSlug,
  activeLessonId,
}: {
  activeTrackSlug?: string;
  activeLessonId?: string;
}) {
  const pathname = usePathname();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [trackDone, setTrackDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const lessons: Record<string, boolean> = {};
    const complete: Record<string, boolean> = {};
    tracks.forEach((t) => {
      complete[t.slug] = isTrackComplete(t.slug);
      t.lessons.forEach((l) => {
        lessons[`${t.slug}/${l.id}`] = isLessonComplete(t.slug, l.id);
      });
    });
    setDone(lessons);
    setTrackDone(complete);
  }, [pathname]);

  return (
    <aside
      className="hidden md:flex w-60 shrink-0 flex-col gap-6 py-6 px-4 overflow-y-auto"
      style={{
        borderRight: "1px solid var(--border)",
        background: "transparent",
      }}
      aria-label="Paths"
    >
      <div>
        <p className="kicker mb-3 px-1">Paths</p>
        <nav className="flex flex-col gap-1">
          {tracks.map((track) => {
            const active = track.slug === activeTrackSlug;
            const finished = track.lessons.filter((l) => done[`${track.slug}/${l.id}`]).length;

            return (
              <div key={track.id}>
                <Link
                  href={`/tracks/${track.slug}`}
                  aria-current={active && !activeLessonId ? "page" : undefined}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm"
                  style={{
                    minHeight: 40,
                    color: active ? "var(--primary)" : "var(--foreground)",
                    background: active
                      ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                      : "transparent",
                  }}
                >
                  {trackDone[track.slug] ? (
                    <Award size={14} className="flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <span
                      className="flex-shrink-0 w-7 text-center font-mono text-[10px] tabular-nums"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {finished}/{track.lessons.length}
                    </span>
                  )}
                  <span className="truncate">{track.path}</span>
                </Link>

                {active && (
                  <div className="mt-1 mb-2 ml-3 flex flex-col border-l pl-2" style={{ borderColor: "var(--border)" }}>
                    {track.lessons.map((lesson, i) => {
                      const lessonDone = done[`${track.slug}/${lesson.id}`];
                      const lessonActive = lesson.id === activeLessonId;
                      return (
                        <Link
                          key={lesson.id}
                          href={`/tracks/${track.slug}/${lesson.id}`}
                          aria-current={lessonActive ? "page" : undefined}
                          className="rounded-md px-2 py-1.5 text-xs"
                          style={{
                            minHeight: 32,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            color: lessonActive ? "var(--primary)" : "var(--muted-foreground)",
                            background: lessonActive
                              ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                              : "transparent",
                            textDecoration: lessonDone && !lessonActive ? "line-through" : "none",
                          }}
                        >
                          <span className="font-mono tabular-nums w-4">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="truncate">{lesson.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
