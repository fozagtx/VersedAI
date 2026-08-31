import {
  Compass,
  FlaskConical,
  Hammer,
  Palette,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import type { AvatarType } from "@/lib/xp";

export const AVATARS: {
  type: AvatarType;
  label: string;
  tagline: string;
  Icon: LucideIcon;
}[] = [
  { type: "creator", label: "Creator", tagline: "Art, design, visuals", Icon: Palette },
  { type: "scientist", label: "Scientist", tagline: "Research, data, facts", Icon: FlaskConical },
  { type: "builder", label: "Builder", tagline: "Code, tools, products", Icon: Hammer },
  { type: "writer", label: "Writer", tagline: "Stories, essays, content", Icon: PenLine },
  { type: "explorer", label: "Explorer", tagline: "Curious about everything", Icon: Compass },
];

export function avatarByType(type: AvatarType) {
  return AVATARS.find((a) => a.type === type) ?? AVATARS[4];
}

export function AvatarGlyph({
  type,
  size = 18,
}: {
  type: AvatarType;
  size?: number;
}) {
  const { Icon, label } = avatarByType(type);
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg"
      style={{
        width: size + 16,
        height: size + 16,
        background: "color-mix(in srgb, var(--primary) 12%, transparent)",
        color: "var(--primary)",
      }}
      aria-label={label}
    >
      <Icon size={size} strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
}
