type ModelTagProps = {
  label: string;
  fallback?: boolean;
};

export default function ModelTag({ label, fallback }: ModelTagProps) {
  return (
    <p
      className="font-mono text-[10px] tracking-wide uppercase mb-1"
      style={{ color: "var(--muted-foreground)" }}
    >
      {label}
      {fallback ? " (stand-in)" : ""}
    </p>
  );
}
