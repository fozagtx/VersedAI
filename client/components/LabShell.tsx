"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import DotGrid from "@/components/DotGrid";
import PathRail from "@/components/PathRail";
import { tracks } from "@/lib/content";

export default function LabShell({
  children,
  activeTrackSlug,
  activeLessonId,
  crumbs,
}: {
  children: React.ReactNode;
  activeTrackSlug?: string;
  activeLessonId?: string;
  crumbs: { href?: string; label: string }[];
}) {
  return (
    <div className="min-h-dvh" style={{ background: "var(--background)" }}>
      <DotGrid />
      <Navbar />
      <div className="relative z-[1] flex h-[calc(100dvh-57px)]">
        <PathRail activeTrackSlug={activeTrackSlug} activeLessonId={activeLessonId} />
        <div className="flex-1 min-w-0 flex flex-col">
          <header
            className="flex items-center gap-2 px-5 md:px-8 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
              {crumbs.map((c, i) => (
                <span key={`${c.label}-${i}`} className="flex items-center gap-2 min-w-0">
                  {i > 0 && (
                    <span aria-hidden="true" style={{ color: "var(--muted-foreground)" }}>
                      /
                    </span>
                  )}
                  {c.href ? (
                    <Link href={c.href} className="truncate" style={{ color: "var(--muted-foreground)" }}>
                      {c.label}
                    </Link>
                  ) : (
                    <span className="truncate" style={{ color: "var(--foreground)" }}>
                      {c.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          </header>
          <div
            className="md:hidden flex gap-2 overflow-x-auto px-5 py-2"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            {tracks.map((t) => (
              <Link
                key={t.slug}
                href={`/tracks/${t.slug}`}
                className="flex-shrink-0 text-xs px-2.5 py-1.5 rounded-full"
                style={{
                  minHeight: 32,
                  background:
                    t.slug === activeTrackSlug
                      ? "color-mix(in srgb, var(--primary) 10%, transparent)"
                      : "var(--muted)",
                  color: t.slug === activeTrackSlug ? "var(--primary)" : "var(--muted-foreground)",
                }}
              >
                {t.path}
              </Link>
            ))}
          </div>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
