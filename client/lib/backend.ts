const CLOUD_RUN = "https://versedai-agent-158479424670.us-central1.run.app";

/** Public tutor URL. Video jobs skip the Render proxy so Veo can take minutes. */
export function publicBackendUrl(): string {
  const env = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");
  if (env) return env;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return "";
    return CLOUD_RUN;
  }
  return CLOUD_RUN;
}

export function videoGenerateUrl(): string {
  const backend = publicBackendUrl();
  return backend ? `${backend}/generate-video` : "/api/generate-video";
}
