"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Track } from "@/lib/content";
import { isTrackComplete } from "@/lib/xp";
import { BookOpen, Zap, ArrowRight, Award } from "lucide-react";

interface TrackCardProps {
  track: Track;
}

export default function TrackCard({ track }: TrackCardProps) {
  const [earned, setEarned] = useState(false);

  useEffect(() => {
    setEarned(isTrackComplete(track.slug));
  }, [track.slug]);

  return (
    <Link href={`/tracks/${track.slug}`} className="block h-full min-w-0">
      <article className="card-base h-full flex flex-col p-5 min-w-0 overflow-hidden motion-safe:transition-transform motion-safe:duration-150 hover:-translate-y-0.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={track.badgeArt}
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-lg object-cover flex-shrink-0"
          />
          <span className="kicker hidden sm:block truncate min-w-0">{track.path}</span>
          {earned ? (
            <span
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: "color-mix(in srgb, var(--success) 12%, transparent)",
                color: "var(--success)",
              }}
            >
              <Award size={11} aria-hidden="true" />
              {track.badge}
            </span>
          ) : (
            <span
              className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                color: "var(--primary)",
              }}
            >
              {track.badge}
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold leading-snug mt-4" style={{ color: "var(--foreground)" }}>
          {track.title}
        </h3>
        <p
          className="text-sm leading-relaxed mt-1.5 min-h-[2.75rem]"
          style={{ color: "var(--muted-foreground)" }}
        >
          {track.description}
        </p>

        <div
          className="mt-5 pt-3 flex items-center gap-4 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
            <BookOpen size={13} aria-hidden="true" />
            {track.lessonCount} lessons
          </span>
          <span className="flex items-center gap-1.5 text-sm tabular-nums" style={{ color: "var(--muted-foreground)" }}>
            <Zap size={13} aria-hidden="true" />
            {track.totalXp} XP
          </span>
          <ArrowRight
            size={16}
            className="ml-auto flex-shrink-0"
            style={{ color: "var(--primary)" }}
            aria-hidden="true"
          />
        </div>
      </article>
    </Link>
  );
}
