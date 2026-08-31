"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DotGrid from "@/components/DotGrid";
import TrackCard from "@/components/TrackCard";
import { tracks } from "@/lib/content";

export default function TracksPage() {
  return (
    <div className="overflow-x-hidden" style={{ background: "var(--background)" }}>
      <DotGrid />
      <Navbar />
      <main className="page-container pt-6 pb-16 md:pt-8 md:pb-20">
        <header className="mb-6 max-w-xl">
          <p className="kicker">Paths</p>
          <h1
            className="text-4xl font-semibold leading-none tracking-tight mt-2"
            style={{ color: "var(--foreground)" }}
          >
            Pick a path
          </h1>
          <p className="text-base mt-3" style={{ color: "var(--muted-foreground)" }}>
            Graphic design, writing, foundations, or agents. Four lessons each.
            Finish one, earn the badge.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 [grid-template-columns:minmax(0,1fr)] md:[grid-template-columns:minmax(0,1fr)_minmax(0,1fr)]">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
