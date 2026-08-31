"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DotGrid from "@/components/DotGrid";
import { getRecord, getLevelFromXP, isTrackComplete, type AvatarType } from "@/lib/xp";
import { AvatarGlyph } from "@/lib/avatars";
import { tracks } from "@/lib/content";
import { Trophy, Zap, Star, ArrowRight, Award } from "lucide-react";
import Link from "next/link";

export default function LeaderboardPage() {
  const [xp, setXp] = useState<number | null>(null);
  const [username, setUsername] = useState("");
  const [avatarType, setAvatarType] = useState<AvatarType>("explorer");
  const [level, setLevel] = useState("");
  const [skills, setSkills] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);

  useEffect(() => {
    const record = getRecord();
    if (!record) return;
    setXp(record.totalXp);
    setUsername(record.username);
    setAvatarType(record.avatarType ?? "explorer");
    setLevel(getLevelFromXP(record.totalXp).label);
    setSkills(Object.keys(record.skills || {}).length);
    setCompleted(record.completedLessons.length);
    setBadges(tracks.filter((t) => isTrackComplete(t.slug)).map((t) => t.badge));
  }, []);

  const notStarted = xp === null;

  return (
    <div style={{ background: "var(--background)" }}>
      <DotGrid />
      <Navbar />

      <main className="page-container py-12">
        <div className="flex flex-col gap-2 mb-10">
          <span className="kicker">Progress</span>
          <h1 className="text-4xl font-semibold leading-none tracking-tight" style={{ color: "var(--foreground)" }}>
            Your work
          </h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            XP is earned through demonstrated ability, not by clicking Complete.
          </p>
        </div>

        {notStarted ? (
          <div
            className="card-base p-10 flex flex-col items-center gap-4 text-center"
            style={{ maxWidth: 480, margin: "0 auto" }}
          >
            <AvatarGlyph type="explorer" size={28} />
            <h2 className="text-xl font-medium" style={{ color: "var(--foreground)" }}>
              No lessons yet
            </h2>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Start free, pick a path, finish it. Progress stays on this device. No login.
            </p>
            <Link href="/tracks">
              <button className="btn-primary flex items-center gap-2 mt-2">
                Start your first lesson <ArrowRight size={15} aria-hidden="true" />
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div
              className="rounded-2xl p-6 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-6"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              <AvatarGlyph type={avatarType} size={28} />
              <div className="flex-1">
                <p className="text-lg font-semibold leading-none">{username}</p>
                <p className="text-sm opacity-75 mt-0.5 capitalize">
                  {avatarType} · {level}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                {[
                  { label: "Total XP", value: xp, icon: Zap },
                  { label: "Lessons", value: completed, icon: Star },
                  { label: "Skills", value: skills, icon: Trophy },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label}>
                    <div className="flex items-center justify-center gap-1 opacity-70 mb-0.5">
                      <Icon size={14} aria-hidden="true" />
                      <span className="text-xs">{label}</span>
                    </div>
                    <p className="text-2xl font-bold leading-none tabular-nums">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-10">
              <h2 className="text-base font-medium mb-4" style={{ color: "var(--foreground)" }}>
                Path badges
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 mb-10">
                {tracks.map((track) => {
                  const earned = badges.includes(track.badge);
                  return (
                    <div
                      key={track.slug}
                      className="card-base flex items-center gap-3 px-4 py-3"
                      style={{ opacity: earned ? 1 : 0.55 }}
                    >
                      <Award
                        size={18}
                        style={{ color: earned ? "var(--primary)" : "var(--muted-foreground)" }}
                        aria-hidden="true"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {track.badge}
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {track.path}
                        </p>
                      </div>
                      <span className="text-xs" style={{ color: earned ? "var(--success)" : "var(--muted-foreground)" }}>
                        {earned ? "Earned" : "Open"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <h2 className="text-base font-medium mb-4" style={{ color: "var(--foreground)" }}>
                How XP is earned
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { action: "Complete a lesson", amt: "+50 – 150 XP" },
                  { action: "Pass a quiz", amt: "+100 XP" },
                  { action: "Generate an image", amt: "+25 XP (up to 5)" },
                  { action: "Earn a path badge", amt: "+500 XP bonus" },
                  { action: "Demonstrate a skill", amt: "+50 XP" },
                  { action: "Context Lab session", amt: "+75 XP" },
                ].map(({ action, amt }) => (
                  <div key={action} className="card-base flex items-center justify-between px-4 py-3">
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>
                      {action}
                    </span>
                    <span className="xp-badge">{amt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  {completed === 0
                    ? "Start your first lesson to earn XP"
                    : `You've completed ${completed} lesson${completed !== 1 ? "s" : ""}. Keep going.`}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                  Skills and XP are stored on this device.
                </p>
              </div>
              <Link href="/tracks">
                <button className="btn-primary flex items-center gap-2 text-sm flex-shrink-0">
                  Continue learning <ArrowRight size={14} aria-hidden="true" />
                </button>
              </Link>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
