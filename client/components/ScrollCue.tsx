"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function ScrollCue({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function update() {
      if (!el) return;
      const leftover = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShow(leftover > 48);
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [containerRef]);

  if (!show) return null;

  return (
    <button
      type="button"
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        color: "var(--foreground)",
        minHeight: 36,
        boxShadow: "0 8px 24px color-mix(in srgb, var(--foreground) 8%, transparent)",
      }}
      onClick={() => {
        const el = containerRef.current;
        if (!el) return;
        el.scrollBy({ top: Math.min(el.clientHeight * 0.7, 360), behavior: "smooth" });
      }}
    >
      More below
      <ChevronDown size={14} aria-hidden="true" />
    </button>
  );
}
