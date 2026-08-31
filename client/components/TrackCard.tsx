"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Track } from "@/lib/content";
import { isTrackComplete } from "@/lib/xp";
import { BookOpen, Zap, ArrowRight, Award } from "lucide-react";

interface TrackCardProps {
  track: Track;
}

const LEVEL_BADGE: Record<string, { bg: string; text: string }> = {
  Beginner: { bg: "color-mix(in srgb, var(--success) 12%, transparent)", text: "var(--success)" },
  Creator: { bg: "color-mix(in srgb, #B45309 12%, transparent)", text: "#B45309" },
  Researcher: { bg: "color-mix(in srgb, var(--primary) 12%, transparent)", text: "var(--primary)" },
  Builder: { bg: "color-mix(in srgb, var(--foreground) 8%, transparent)", text: "var(--foreground)" },
  Operator: { bg: "color-mix(in srgb, var(--destructive) 12%, transparent)", text: "var(--destructive)" },
};

export default function TrackCard({ track }: TrackCardProps) {
  const badge = LEVEL_BADGE[track.level] ?? LEVEL_BADGE.Beginner;
  const [earned, setEarned] = useState(false);

  useEffect(() => {
    setEarned(isTrackComplete(track.slug));
  }, [track.slug]);

  return (
    <Link href={`/tracks/${track.slug}`} className="block h-full">
      <div className="card-base h-full flex flex-col gap-4 p-6 group motion-safe:transition-transform motion-safe:duration-150 hover:-translate-y-0.5">
        <img
          src={track.badgeArt}
          alt={`${track.badge} badge`}
          width={88}
          height={88}
          className="size-[88px] rounded-full object-cover self-start"
        />
        <div className="flex items-center justify-between">
          <span className="kicker">{track.path}</span>
          {earned ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                background: "color-mix(in srgb, var(--success) 12%, transparent)",
                color: "var(--success)",
              }}
            >
              <Award size={12} aria-hidden="true" />
              {track.badge}
            </span>
          ) : (
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: badge.bg, color: badge.text }}
            >
              Badge: {track.badge}
            </span>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
            {track.title}
          </h3>
          <p className="text-sm leading-relaxed mt-2" style={{ color: "var(--muted-foreground)" }}>
            {track.description}
          </p>
        </div>

        <div className="flex-1" />

        <div
          className="flex items-center gap-4 pt-4 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
            <BookOpen size={13} aria-hidden="true" />
            {track.lessonCount} lessons
          </span>
          <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--muted-foreground)" }}>
            <Zap size={13} aria-hidden="true" />
            {track.totalXp} XP
          </span>
          <ArrowRight
            size={16}
            className="ml-auto opacity-0 group-hover:opacity-100 motion-safe:transition-opacity motion-safe:duration-150"
            style={{ color: "var(--primary)" }}
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  );
}
