import Link from "next/link";
import { Check, ChevronRight, Clock, Zap, Image, MessageSquare, FlaskConical } from "lucide-react";
import { Lesson } from "@/lib/content";

interface LessonRowProps {
  lesson: Lesson;
  trackSlug: string;
  index: number;
  isComplete: boolean;
}

const typeLabels: Record<string, { label: string; icon: React.ElementType }> = {
  "image-studio": { label: "Interactive", icon: Image },
  "agent-chat": { label: "Interactive", icon: MessageSquare },
  "context-lab": { label: "Lab", icon: FlaskConical },
  read: { label: "", icon: Clock },
  quiz: { label: "", icon: Clock },
};

export default function LessonRow({ lesson, trackSlug, index, isComplete }: LessonRowProps) {
  const typeInfo = typeLabels[lesson.type] || typeLabels.read;
  const isInteractive = lesson.interactive;

  return (
    <Link href={`/tracks/${trackSlug}/${lesson.id}`} className="block">
      <div
        className="flex items-center gap-4 py-4 cursor-pointer transition-colors duration-150 group"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {/* Index circle */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold motion-safe:transition-colors motion-safe:duration-150"
          style={
            isComplete
              ? { background: "var(--primary)", color: "white" }
              : {
                  border: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                  background: "var(--card)",
                }
          }
        >
          {isComplete ? <Check size={14} /> : <span>{String(index + 1).padStart(2, "0")}</span>}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-medium leading-none"
              style={{
                color: isComplete ? "var(--muted-foreground)" : "var(--foreground)",
                textDecoration: isComplete ? "line-through" : "none",
              }}
            >
              {lesson.title}
            </span>
            {isInteractive && (
              <span
                className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium"
                style={{
                  background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                  color: "var(--primary)",
                }}
              >
                <typeInfo.icon size={10} />
                {typeInfo.label}
              </span>
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            {lesson.description}
          </p>
        </div>

        {/* Right meta */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="hidden sm:block text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
            {lesson.duration}
          </span>
          <span className="xp-badge hidden sm:flex">
            <Zap size={10} />
            {lesson.xp}
          </span>
          <ChevronRight
            size={16}
            className="transition-transform duration-150 group-hover:translate-x-0.5"
            style={{ color: "var(--muted-foreground)" }}
          />
        </div>
      </div>
    </Link>
  );
}
