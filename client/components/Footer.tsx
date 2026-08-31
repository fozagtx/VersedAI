import Link from "next/link";
import BrandMark from "@/components/BrandMark";

const LINKS = [
  { href: "/tracks", label: "Paths" },
  { href: "/chat", label: "Playground" },
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
      <div
        className="page-container flex flex-col sm:flex-row sm:items-center gap-3 py-5"
      >
        <Link href="/" aria-label="VersedAI home" className="flex-shrink-0">
          <BrandMark size={18} withWordmark />
        </Link>
        <p className="text-xs sm:flex-1" style={{ color: "var(--muted-foreground)" }}>
          Generative AI lab for online learners. Tutor on, 24/7.
        </p>
        <nav className="flex items-center gap-4" aria-label="Footer">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-xs"
              style={{ color: "var(--muted-foreground)", minHeight: 32, display: "inline-flex", alignItems: "center" }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
