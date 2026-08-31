import base64
import os
import tempfile
import time
from pathlib import Path

from google.genai import types
from llm import get_client, gemini_model, _api_key, _project, use_vertex

EXPAND_INSTRUCTIONS = """You write Veo 3 prompts for VersedAI, a high-school AI lab.

The student typed a raw concept. Turn it into ONE 8-second educational clip they can watch to understand the idea.

Output ONLY the Veo prompt. No quotes. No markdown. No preamble.

Formula: [Camera] + [Subject] + [Action] + [Setting] + [Style] + [Sound]

Rules:
- English. One idea, one shot.
- No on-screen text, captions, titles, labels, UI, or letters. Video models garble writing.
- No photorealistic faces or people. Use objects, physical models, light, nature, or silhouette hands if the idea needs a human scale.
- Age-appropriate. Warm paper-studio light, tactile materials, clear motion.
- Pick one camera move: slow dolly in, static, gentle pan, or crane up.
- End with one short ambient-sound clause.
"""


def _models() -> list[str]:
    preferred = os.environ.get("VEO_MODEL", "veo-3.0-generate-001")
    rest = [
        "veo-3.0-fast-generate-001",
        "veo-3.1-generate-001",
        "veo-3.1-fast-generate-preview",
        "veo-3.0-generate-preview",
        "veo-3.1-generate-preview",
    ]
    out: list[str] = []
    for m in [preferred, *rest]:
        if m and m not in out:
            out.append(m)
    return out


def expand_concept(concept: str) -> str:
    """Gemini writes a Veo shot from a raw student concept."""
    concept = (concept or "").strip()
    if not concept:
        raise ValueError("concept is required")

    client = get_client()
    result = client.models.generate_content(
        model=gemini_model(),
        contents=f"{EXPAND_INSTRUCTIONS}\n\nStudent concept:\n{concept}",
        config=types.GenerateContentConfig(temperature=0.7),
    )
    text = (getattr(result, "text", None) or "").strip()
    if not text:
        text = (
            "Slow dolly in, a single physical model on a warm oak table explaining "
            f"{concept}, paper studio lighting, tactile materials, gentle motion. "
            "Ambient: quiet room tone."
        )
    return text.replace("```", "").strip().strip('"')


def _as_bytes(data) -> bytes | None:
    if not data:
        return None
    if isinstance(data, (bytes, bytearray)):
        return bytes(data)
    if isinstance(data, str):
        try:
            return base64.b64decode(data)
        except Exception:
            return None
    return None


def _extract_video_bytes(client, result) -> bytes | None:
    videos = []
    for obj in (result, getattr(result, "response", None), getattr(result, "result", None)):
        if obj is None:
            continue
        found = getattr(obj, "generated_videos", None)
        if found:
            videos.extend(found)

    for item in videos:
        video = getattr(item, "video", None) or item
        raw = _as_bytes(getattr(video, "video_bytes", None))
        if raw:
            return raw

        save = getattr(video, "save", None)
        if callable(save):
            try:
                with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
                    path = tmp.name
                save(path)
                data = Path(path).read_bytes()
                Path(path).unlink(missing_ok=True)
                if data:
                    return data
            except Exception as e:
                print(f"[video] save() failed: {e}")

        download = getattr(getattr(client, "files", None), "download", None)
        if callable(download):
            try:
                downloaded = download(file=video)
                raw = _as_bytes(downloaded) or _as_bytes(getattr(downloaded, "video_bytes", None))
                if raw:
                    return raw
            except Exception as e:
                print(f"[video] files.download failed: {e}")

    return None


def _clients():
    clients = [get_client()]
    key = _api_key()
    if use_vertex() and key:
        try:
            from google import genai

            clients.append(genai.Client(api_key=key))
        except Exception:
            pass
    project = _project()
    if project:
        try:
            from google import genai

            extra = genai.Client(vertexai=True, project=project, location="us-central1")
            clients.append(extra)
        except Exception:
            pass
    seen = []
    out = []
    for c in clients:
        ident = id(c)
        if ident not in seen:
            seen.append(ident)
            out.append(c)
    return out


def generate_video(prompt: str, duration_seconds: int = 8) -> bytes:
    """Veo 3 text-to-video. Returns MP4 bytes."""
    prompt = (prompt or "").strip()
    if not prompt:
        raise ValueError("prompt is required")

    duration = duration_seconds if duration_seconds in (4, 6, 8) else 8
    last: Exception | None = None
    gcs = os.environ.get("VIDEO_OUTPUT_GCS") or None

    configs = [
        types.GenerateVideosConfig(
            aspect_ratio="16:9",
            number_of_videos=1,
            duration_seconds=duration,
            person_generation="dont_allow",
            enhance_prompt=True,
            **({"output_gcs_uri": gcs} if gcs else {}),
        ),
        types.GenerateVideosConfig(
            aspect_ratio="16:9",
            number_of_videos=1,
            duration_seconds=duration,
            **({"output_gcs_uri": gcs} if gcs else {}),
        ),
        types.GenerateVideosConfig(
            aspect_ratio="16:9",
            **({"output_gcs_uri": gcs} if gcs else {}),
        ),
    ]

    for client in _clients():
        for model in _models():
            for config in configs:
                try:
                    print(f"[video] start {model}")
                    operation = client.models.generate_videos(
                        model=model,
                        prompt=prompt,
                        config=config,
                    )
                    deadline = time.time() + 240
                    while not getattr(operation, "done", False):
                        if time.time() > deadline:
                            raise TimeoutError(f"{model} timed out after 240s")
                        time.sleep(8)
                        operation = client.operations.get(operation)
                    payload = (
                        getattr(operation, "result", None)
                        or getattr(operation, "response", None)
                        or operation
                    )
                    data = _extract_video_bytes(client, payload)
                    if data:
                        print(f"[video] ok {model} ({len(data)} bytes)")
                        return data
                    last = RuntimeError(f"{model} returned no video bytes")
                    print(f"[video] {model} empty result")
                    break
                except Exception as e:
                    last = e
                    msg = str(e)
                    print(f"[video] {model} failed: {e}")
                    if "duration_seconds" in msg or "person_generation" in msg or "enhance_prompt" in msg:
                        continue
                    break

    raise RuntimeError(
        f"Video generation failed. Last error: {last}. "
        "Need Veo 3 on this Vertex project (veo-3.0-generate-001) or a Gemini API key with Veo access."
    )
