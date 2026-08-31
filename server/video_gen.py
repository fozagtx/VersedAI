import base64
import json
import os
import time
import urllib.error
import urllib.request

from google.genai import types
from llm import get_client, gemini_model, _project

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
    # This Vertex project serves Veo 3.1 in us-central1. 3.0 IDs 404.
    preferred = os.environ.get("VEO_MODEL", "veo-3.1-fast-generate-001")
    rest = [
        "veo-3.1-fast-generate-001",
        "veo-3.1-generate-001",
        "veo-3.1-lite-generate-001",
    ]
    out: list[str] = []
    for m in [preferred, *rest]:
        if m and m not in out:
            out.append(m)
    return out


def veo_location() -> str:
    return os.environ.get("VEO_LOCATION", "us-central1")


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


def _token() -> str:
    import google.auth
    import google.auth.transport.requests

    creds, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    if not getattr(creds, "valid", False) or not getattr(creds, "token", None):
        creds.refresh(google.auth.transport.requests.Request())
    return creds.token


def _json_request(method: str, url: str, token: str, body: dict | None = None) -> dict:
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json; charset=utf-8")
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{e.code} {raw[:600]}") from e
    if not raw:
        return {}
    return json.loads(raw)


def _extract_bytes(payload: dict) -> bytes | None:
    response = payload.get("response") or payload
    videos = response.get("videos") or response.get("generatedVideos") or []
    for video in videos:
        b64 = video.get("bytesBase64Encoded") or video.get("bytes_base64_encoded")
        if b64:
            return base64.b64decode(b64)
    return None


def generate_video(prompt: str, duration_seconds: int = 8) -> bytes:
    """Veo 3.1 text-to-video on Vertex us-central1. Returns MP4 bytes."""
    prompt = (prompt or "").strip()
    if not prompt:
        raise ValueError("prompt is required")

    project = _project()
    if not project:
        raise RuntimeError("GOOGLE_CLOUD_PROJECT is required for Veo.")

    duration = duration_seconds if duration_seconds in (4, 6, 8) else 8
    location = veo_location()
    token = _token()
    last: Exception | None = None

    for model in _models():
        try:
            print(f"[video] start {model} {location}")
            base = (
                f"https://{location}-aiplatform.googleapis.com/v1/"
                f"projects/{project}/locations/{location}/publishers/google/models/{model}"
            )
            started = _json_request(
                "POST",
                f"{base}:predictLongRunning",
                token,
                {
                    "instances": [{"prompt": prompt}],
                    "parameters": {
                        "aspectRatio": "16:9",
                        "durationSeconds": duration,
                        "sampleCount": 1,
                        "personGeneration": "dont_allow",
                    },
                },
            )
            op = started.get("name")
            if not op:
                raise RuntimeError(f"{model} returned no operation: {started}")

            deadline = time.time() + 240
            while True:
                fetched = _json_request(
                    "POST",
                    f"{base}:fetchPredictOperation",
                    token,
                    {"operationName": op},
                )
                err = fetched.get("error")
                if err:
                    raise RuntimeError(str(err))
                if fetched.get("done"):
                    data = _extract_bytes(fetched)
                    if data:
                        print(f"[video] ok {model} ({len(data)} bytes)")
                        return data
                    raise RuntimeError(f"{model} finished with no video bytes")
                if time.time() > deadline:
                    raise TimeoutError(f"{model} timed out after 240s")
                time.sleep(6)
        except Exception as e:
            last = e
            print(f"[video] {model} failed: {e}")
            continue

    raise RuntimeError(
        f"Video generation failed. Last error: {last}. "
        "Need Veo 3.1 on Vertex us-central1 (veo-3.1-fast-generate-001)."
    )
