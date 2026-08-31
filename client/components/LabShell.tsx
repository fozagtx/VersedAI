"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import DotGrid from "@/components/DotGrid";
import AppSidebar from "@/components/Sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

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
      <SidebarProvider className="relative z-[1] !min-h-0 h-[calc(100dvh-57px)]">
        <AppSidebar activeTrackSlug={activeTrackSlug} activeLessonId={activeLessonId} />
        <SidebarInset className="min-w-0 overflow-hidden bg-transparent">
          <header
            className="flex items-center gap-2 px-4 md:px-6 py-2.5"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <SidebarTrigger
              aria-label="Open or close paths"
              className="size-10"
            />
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
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
