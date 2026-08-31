import Link from "next/link";
import BrandMark from "@/components/BrandMark";

const LINKS = [
  { href: "/tracks", label: "Paths" },
  { href: "/studio", label: "Studio" },
  { href: "/chat", label: "Tutor" },
  { href: "/leaderboard", label: "Progress" },
];

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--background)",
      }}
    >
      <div className="page-container h-11 flex items-center gap-4">
        <Link href="/" aria-label="VersedAI home" className="flex-shrink-0">
          <BrandMark size={16} withWordmark />
        </Link>
        <p
          className="hidden sm:block text-xs truncate flex-1"
          style={{ color: "var(--muted-foreground)" }}
        >
          Gemma drills. Gemini coaches. Veo 3 clips.
        </p>
        <nav className="ml-auto flex items-center gap-3" aria-label="Footer">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-xs"
              style={{ color: "var(--muted-foreground)" }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
