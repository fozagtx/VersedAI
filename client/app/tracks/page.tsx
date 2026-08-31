"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DotGrid from "@/components/DotGrid";
import TrackCard from "@/components/TrackCard";
import { tracks } from "@/lib/content";

export default function TracksPage() {
  return (
    <div style={{ background: "var(--background)" }}>
      <DotGrid />
      <Navbar />
      <main className="page-container py-12">
        <div className="flex flex-col gap-2 mb-10">
          <span className="kicker">Paths</span>
          <h1 className="text-4xl font-semibold leading-none tracking-tight" style={{ color: "var(--foreground)" }}>
            Pick a path
          </h1>
          <p className="text-base mt-2" style={{ color: "var(--muted-foreground)" }}>
            Graphic design, writing, foundations, or agents. Four lessons each. Finish one, earn the badge.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
