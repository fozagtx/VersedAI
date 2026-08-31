import Link from "next/link";
import BrandMark from "@/components/BrandMark";

export default function Footer() {
  return (
    <footer
      className="border-t mt-20"
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
    >
      <div className="page-container py-10">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="flex flex-col gap-2">
            <Link href="/" aria-label="VersedAI home">
              <BrandMark size={22} withWordmark />
            </Link>
            <p className="text-xs max-w-xs" style={{ color: "var(--muted-foreground)" }}>
              AI learning for high-school students. Built for the All Things Agentic Hackathon.
            </p>
          </div>

          <div className="flex gap-10">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                Platform
              </p>
              {[
                { href: "/tracks", label: "Tracks" },
                { href: "/chat", label: "Playground" },
                { href: "/leaderboard", label: "Progress" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-xs motion-safe:transition-colors motion-safe:duration-100 hover:text-foreground"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                Powered by
              </p>
              {["Google ADK", "Gemini 2.5 Flash", "Imagen 3", "Cloud Run"].map((t) => (
                <span key={t} className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="section-divider my-8" />

        <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
          2026 VersedAI · Powered by Google Gemini · No login required
        </p>
      </div>
    </footer>
  );
}
