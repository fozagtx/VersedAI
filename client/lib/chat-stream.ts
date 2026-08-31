export type ModelFamily = "gemma" | "gemini";

export type ChatMeta = {
  family: ModelFamily;
  model: string;
  label: string;
  fallback?: boolean;
  role?: string;
};

export type QuizPayload = {
  question: string;
  options: string[];
  correct: string;
};

export type ChatEvent =
  | ({ type: "meta" } & ChatMeta)
  | { type: "token"; text: string }
  | ({ type: "quiz" } & QuizPayload);

export async function* readChatStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<ChatEvent> {
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
        if (event === "meta") {
          try {
            const parsed = JSON.parse(data) as ChatMeta;
            if (parsed.family && parsed.label) {
              yield { type: "meta", ...parsed };
            }
          } catch {
            /* ignore a broken meta frame */
          }
          event = "";
          continue;
        }
        if (event === "quiz") {
          try {
            const parsed = JSON.parse(data) as QuizPayload;
            yield {
              type: "quiz",
              question: parsed.question || "",
              options: parsed.options || [],
              correct: parsed.correct || "",
            };
          } catch {
            /* ignore */
          }
          event = "";
          continue;
        }
        if (data) yield { type: "token", text: data };
        event = "";
      }
    }
  } finally {
    reader.releaseLock();
  }
}
