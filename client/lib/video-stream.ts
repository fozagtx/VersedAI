export type VideoEvent =
  | { type: "status"; message: string }
  | { type: "prompt"; veoPrompt: string }
  | { type: "video"; videoUrl: string; veoPrompt?: string }
  | { type: "error"; error: string };

export async function* readVideoStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<VideoEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let event = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";

      for (const raw of lines) {
        const line = raw.replace(/\r$/, "");
        if (line.startsWith("event:")) {
          event = line.slice(6).trim();
          continue;
        }
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trimStart();
        if (!data) continue;
        try {
          const parsed = JSON.parse(data) as Record<string, string>;
          if (event === "status" && parsed.message) {
            yield { type: "status", message: parsed.message };
          } else if (event === "prompt" && parsed.veoPrompt) {
            yield { type: "prompt", veoPrompt: parsed.veoPrompt };
          } else if (event === "video" && parsed.videoUrl) {
            yield { type: "video", videoUrl: parsed.videoUrl, veoPrompt: parsed.veoPrompt };
          } else if (event === "error") {
            yield { type: "error", error: parsed.error || "Video request failed." };
          }
        } catch {
          /* ignore a broken frame */
        }
        event = "";
      }
    }
  } finally {
    reader.releaseLock();
  }
}
