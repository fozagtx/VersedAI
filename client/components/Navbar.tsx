"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getRecord, getLevelFromXP } from "@/lib/xp";
import { LayoutGrid, Menu, Trophy } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import OnboardingModal from "@/components/OnboardingModal";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/tracks", label: "Paths", icon: "paths" as const },
  { href: "/chat", label: "Tutor", icon: "logo" as const },
  { href: "/leaderboard", label: "Progress", icon: "progress" as const },
];

export default function Navbar({ onStartFree }: { onStartFree?: () => void }) {
  const pathname = usePathname();
  const inLab = Boolean(pathname?.startsWith("/tracks/"));
  const [xp, setXp] = useState<number | null>(null);
  const [lvl, setLvl] = useState("");
  const [open, setOpen] = useState(false);
  const [onboard, setOnboard] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const r = getRecord();
    if (r) {
      setXp(r.totalXp);
      setLvl(getLevelFromXP(r.totalXp).label);
      setStarted(true);
    } else {
      setStarted(false);
    }
  }, [pathname]);

  function handleStart() {
    setOpen(false);
    if (started) return;
    if (onStartFree) onStartFree();
    else setOnboard(true);
  }

  return (
    <header
      role="banner"
      className="sticky top-0 z-50"
      style={{
        background: "var(--background)",
        borderBottom: "1px solid var(--border)",
        height: "57px",
      }}
    >
      <div
        className="page-container h-full flex items-center justify-between gap-4"
        aria-label="Main navigation"
      >
        <Link href="/" aria-label="VersedAI home" className="flex-shrink-0">
          <BrandMark withWordmark />
        </Link>

        <nav
          aria-label="Site navigation"
          className="hidden md:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2"
        >
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex items-center gap-1.5 px-3 rounded-lg text-sm font-medium motion-safe:transition-colors motion-safe:duration-100"
                style={{
                  minHeight: "40px",
                  color: active ? "var(--primary)" : "var(--muted-foreground)",
                  background: active
                    ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                    : "transparent",
                }}
              >
                {Icon === "logo" ? (
                  <BrandMark size={16} />
                ) : Icon === "paths" ? (
                  <LayoutGrid size={14} aria-hidden="true" />
                ) : (
                  <Trophy size={14} aria-hidden="true" />
                )}
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {xp !== null && (
            <div
              className="hidden sm:flex items-center gap-2"
              aria-label={`${xp} XP · ${lvl}`}
            >
              <span className="xp-badge tabular-nums">
                <BrandMark size={12} />
                {xp.toLocaleString()} XP
              </span>
              <span className="text-xs hidden lg:block" style={{ color: "var(--muted-foreground)" }}>
                {lvl}
              </span>
            </div>
          )}

          {inLab ? null : started ? (
            <Link href="/tracks" className="hidden md:inline-flex">
              <button
                className="btn-primary"
                style={{ minHeight: "36px", padding: "0 16px", fontSize: "0.8125rem" }}
              >
                Continue
              </button>
            </Link>
          ) : (
            <button
              type="button"
              className="btn-primary hidden md:inline-flex"
              style={{ minHeight: "36px", padding: "0 16px", fontSize: "0.8125rem" }}
              onClick={handleStart}
            >
              Start free
            </button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden inline-flex items-center justify-center rounded-lg"
                style={{
                  width: 40,
                  height: 40,
                  color: "var(--foreground)",
                }}
                aria-label="Open menu"
              >
                <Menu size={20} aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>
                  <BrandMark withWordmark />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-8" aria-label="Mobile">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = pathname?.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 rounded-lg text-sm font-medium"
                      style={{
                        minHeight: 44,
                        color: active ? "var(--primary)" : "var(--foreground)",
                        background: active
                          ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                          : "transparent",
                      }}
                    >
                      {Icon === "logo" ? (
                        <BrandMark size={18} />
                      ) : Icon === "paths" ? (
                        <LayoutGrid size={16} aria-hidden="true" />
                      ) : (
                        <Trophy size={16} aria-hidden="true" />
                      )}
                      {label}
                    </Link>
                  );
                })}
                {inLab ? null : started ? (
                  <Link href="/tracks" onClick={() => setOpen(false)} className="mt-4">
                    <button className="btn-primary w-full">Continue</button>
                  </Link>
                ) : (
                  <button type="button" className="btn-primary w-full mt-4" onClick={handleStart}>
                    Start free
                  </button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {onboard && <OnboardingModal onClose={() => setOnboard(false)} />}
    </header>
  );
}
