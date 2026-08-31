"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DotGrid from "@/components/DotGrid";
import {
  deleteStudioItem,
  downloadBlob,
  listStudioItems,
  slugFilename,
  type StudioItem,
  type StudioKind,
} from "@/lib/studio-store";
import { Download, Image as ImageIcon, Trash2, Video } from "lucide-react";

type Filter = "all" | StudioKind;

export default function StudioPage() {
  const [items, setItems] = useState<StudioItem[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<StudioItem | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlsRef = useRef<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const rows = await listStudioItems();
      setItems(rows);
      setUrls((prev) => {
        Object.values(prev).forEach((u) => URL.revokeObjectURL(u));
        const next: Record<string, string> = {};
        rows.forEach((row) => {
          next[row.id] = URL.createObjectURL(row.blob);
        });
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Studio storage is blocked in this browser.");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    urlsRef.current = urls;
  }, [urls]);

  useEffect(() => {
    load();
    return () => {
      Object.values(urlsRef.current).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [load]);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.kind === filter)),
    [items, filter]
  );

  async function remove(id: string) {
    await deleteStudioItem(id);
    if (open?.id === id) setOpen(null);
    await load();
  }

  function saveFile(item: StudioItem) {
    downloadBlob(item.blob, slugFilename(item.prompt || item.kind, item.kind === "video" ? "mp4" : "png"));
  }

  return (
    <div style={{ background: "var(--background)" }}>
      <DotGrid />
      <Navbar />
      <main className="page-container py-12">
        <header className="mb-8 max-w-xl">
          <p className="kicker">Studio</p>
          <h1
            className="text-4xl font-semibold leading-none tracking-tight mt-2"
            style={{ color: "var(--foreground)" }}
          >
            What you made
          </h1>
          <p className="text-base mt-3" style={{ color: "var(--muted-foreground)" }}>
            Images and clips stay on this device. No login. Download anything you want to keep elsewhere.
          </p>
        </header>

        <div className="flex items-center gap-2 mb-6">
          {(["all", "image", "video"] as Filter[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className="text-xs px-3 py-1.5 rounded-full border"
              style={{
                minHeight: 36,
                borderColor: filter === key ? "var(--primary)" : "var(--border)",
                color: filter === key ? "var(--primary)" : "var(--muted-foreground)",
                background:
                  filter === key
                    ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                    : "var(--card)",
              }}
            >
              {key === "all" ? "All" : key === "image" ? "Images" : "Videos"}
            </button>
          ))}
          <span className="ml-auto text-xs tabular-nums" style={{ color: "var(--muted-foreground)" }}>
            {visible.length} saved
          </span>
        </div>

        {error && (
          <p className="text-sm mb-6" style={{ color: "var(--destructive)" }}>
            {error}
          </p>
        )}

        {ready && visible.length === 0 && (
          <div className="card-base p-10 text-center max-w-lg mx-auto">
            <p className="text-lg font-medium" style={{ color: "var(--foreground)" }}>
              Nothing saved yet
            </p>
            <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
              Generate an image or a Veo clip in a lesson. It lands here automatically.
            </p>
            <div className="flex justify-center gap-2 mt-5">
              <Link href="/tracks/image-gen/your-first-image">
                <button className="btn-secondary gap-2">
                  <ImageIcon size={14} /> Image studio
                </button>
              </Link>
              <Link href="/tracks/image-gen/concept-to-clip">
                <button className="btn-primary gap-2">
                  <Video size={14} /> Concept to clip
                </button>
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {visible.map((item) => {
            const src = urls[item.id];
            return (
              <article key={item.id} className="card-base overflow-hidden flex flex-col">
                <button
                  type="button"
                  onClick={() => setOpen(item)}
                  className="aspect-square overflow-hidden bg-[var(--muted)] text-left"
                  aria-label={`Open ${item.kind}`}
                >
                  {item.kind === "video" ? (
                    src ? (
                      <video src={src} muted playsInline className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video size={22} style={{ color: "var(--muted-foreground)" }} />
                      </div>
                    )
                  ) : src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </button>
                <div className="p-3 flex flex-col gap-2">
                  <p className="text-xs line-clamp-2" style={{ color: "var(--foreground)" }}>
                    {item.concept || item.prompt}
                  </p>
                  <p className="kicker">
                    {item.kind === "video" ? "Veo 3" : "Image"} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      className="btn-secondary flex-1 gap-1 text-xs"
                      style={{ minHeight: 36, padding: "0 10px" }}
                      onClick={() => saveFile(item)}
                    >
                      <Download size={12} /> Save
                    </button>
                    <button
                      type="button"
                      className="btn-secondary gap-1 text-xs"
                      style={{ minHeight: 36, padding: "0 10px" }}
                      onClick={() => remove(item.id)}
                      aria-label="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
      <Footer />

      {open && urls[open.id] && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: "rgba(28,25,21,0.55)", backdropFilter: "blur(8px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(null);
          }}
        >
          <div className="card-base p-4 w-full" style={{ maxWidth: 720 }}>
            {open.kind === "video" ? (
              <video src={urls[open.id]} controls playsInline className="w-full rounded-lg" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={urls[open.id]} alt="" className="w-full rounded-lg" />
            )}
            <p className="text-sm mt-3" style={{ color: "var(--foreground)" }}>
              {open.concept || open.prompt}
            </p>
            {open.veoPrompt && (
              <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
                {open.veoPrompt}
              </p>
            )}
            <div className="flex gap-2 mt-4">
              <button className="btn-primary gap-2" onClick={() => saveFile(open)}>
                <Download size={14} /> Download
              </button>
              <button className="btn-secondary" onClick={() => setOpen(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
