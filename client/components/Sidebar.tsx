"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Sidebar as ShadSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { tracks } from "@/lib/content";
import { isLessonComplete, isTrackComplete, getRecord, getLevelFromXP } from "@/lib/xp";
import { CheckCircle2, Trophy, Zap } from "lucide-react";

interface AppSidebarProps {
  activeTrackSlug?: string;
  activeLessonId?: string;
}

export default function AppSidebar({ activeTrackSlug, activeLessonId }: AppSidebarProps) {
  const pathname = usePathname();
  const [done, setDone]    = useState<Record<string, boolean>>({});
  const [trackDone, setTD] = useState<Record<string, boolean>>({});
  const [xp, setXp]        = useState(0);
  const [level, setLevel]  = useState("");

  useEffect(() => {
    const lessonMap: Record<string, boolean> = {};
    const trackMap:  Record<string, boolean> = {};
    tracks.forEach((t) => {
      trackMap[t.slug] = isTrackComplete(t.slug);
      t.lessons.forEach((l) => {
        lessonMap[`${t.slug}/${l.id}`] = isLessonComplete(t.slug, l.id);
      });
    });
    setDone(lessonMap);
    setTD(trackMap);

    const r = getRecord();
    if (r) {
      setXp(r.totalXp);
      setLevel(getLevelFromXP(r.totalXp).label);
    }
  }, [pathname]);

  return (
    <ShadSidebar
      collapsible="icon"
      className="!top-[57px] !h-[calc(100svh-57px)]"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Paths</SidebarGroupLabel>
          <SidebarMenu>
            {tracks.map((track) => {
              const isActive = track.slug === activeTrackSlug;
              const completed = track.lessons.filter(
                (l) => done[`${track.slug}/${l.id}`]
              ).length;

              return (
                <SidebarMenuItem key={track.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive && !activeLessonId}
                    tooltip={track.title}
                  >
                    <Link href={`/tracks/${track.slug}`}>
                      <img
                        src={track.badgeArt}
                        alt=""
                        width={20}
                        height={20}
                        className="size-5 rounded-full object-cover flex-shrink-0"
                      />
                      <span className="truncate text-sm">{track.path}</span>
                      {trackDone[track.slug] ? (
                        <CheckCircle2 size={14} className="ml-auto" style={{ color: "var(--success)", flexShrink: 0 }} />
                      ) : (
                        <span
                          className="ml-auto text-[10px] font-mono tabular-nums"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {completed}/{track.lessons.length}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>

                  {/* Lesson sub-items — only under active track */}
                  {isActive && (
                    <SidebarMenuSub>
                      {track.lessons.map((lesson, li) => {
                        const lessonDone   = done[`${track.slug}/${lesson.id}`];
                        const lessonActive = lesson.id === activeLessonId;
                        return (
                          <SidebarMenuSubItem key={lesson.id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={lessonActive}
                            >
                              <Link
                                href={`/tracks/${track.slug}/${lesson.id}`}
                                aria-current={lessonActive ? "page" : undefined}
                                style={{
                                  textDecoration: lessonDone && !lessonActive ? "line-through" : "none",
                                  opacity: lessonDone && !lessonActive ? 0.55 : 1,
                                }}
                              >
                                <span className="tabular-nums text-[10px] mr-1 font-mono">
                                  {String(li + 1).padStart(2, "0")}
                                </span>
                                <span className="truncate">{lesson.title}</span>
                                {lesson.interactive && (
                                  <span
                                    className="ml-auto text-[10px] font-bold"
                                    aria-label="Interactive"
                                    style={{ color: "var(--primary)" }}
                                  >
                                    ✦
                                  </span>
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarMenu>
            {[
              { href: "/chat",        label: "Tutor", Icon: Zap },
              { href: "/leaderboard", label: "Progress",   Icon: Trophy },
            ].map(({ href, label, Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === href}
                  tooltip={label}
                >
                  <Link href={href}>
                    <Icon size={14} aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* XP in sidebar footer */}
      {xp > 0 && (
        <SidebarFooter>
          <div
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
            style={{ background: "color-mix(in srgb, var(--primary) 7%, transparent)" }}
          >
            <Zap size={13} style={{ color: "var(--primary)", flexShrink: 0 }} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-semibold tabular-nums" style={{ color: "var(--primary)" }}>
                {xp.toLocaleString()} XP
              </p>
              <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{level}</p>
            </div>
          </div>
        </SidebarFooter>
      )}
      <SidebarRail />
    </ShadSidebar>
  );
}
