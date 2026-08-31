export default function BrandMark({
  size = 28,
  withWordmark = false,
}: {
  size?: number;
  withWordmark?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="28" height="28" rx="7" fill="var(--primary)" />
        <path
          d="M7 8L14 20L21 8"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="7" r="1.5" fill="white" />
      </svg>
      {withWordmark && (
        <span
          className="text-base font-semibold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          Versed<span style={{ color: "var(--primary)" }}>AI</span>
        </span>
      )}
    </span>
  );
}
