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
          <span className="kicker">All tracks</span>
          <h1 className="text-4xl font-semibold leading-none tracking-tight" style={{ color: "var(--foreground)" }}>
            Learning tracks
          </h1>
          <p className="text-base mt-2" style={{ color: "var(--muted-foreground)" }}>
            Each track is 4 lessons. Each lesson is 3 min learn, then hands-on, then AI coaching.
            No login, no prerequisites.
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
