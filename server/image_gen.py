import os
from google.genai import types
from llm import get_client, _project


def _image_bytes(response) -> bytes | None:
    parts = []
    if getattr(response, "parts", None):
        parts.extend(response.parts)
    for cand in getattr(response, "candidates", None) or []:
        content = getattr(cand, "content", None)
        if content and getattr(content, "parts", None):
            parts.extend(content.parts)
    for part in parts:
        inline = getattr(part, "inline_data", None)
        data = getattr(inline, "data", None) if inline else None
        if not data:
            continue
        if isinstance(data, bytes):
            return data
        import base64

        return base64.b64decode(data)
    return None


def _models() -> list[str]:
    preferred = os.environ.get("IMAGE_MODEL", "gemini-3.1-flash-image")
    rest = ["gemini-2.5-flash-image", "gemini-3-pro-image"]
    out: list[str] = []
    for m in [preferred, *rest]:
        if m and m not in out:
            out.append(m)
    return out


def generate_image(prompt: str) -> bytes:
    """Gemini native image models. Imagen 3/4 and gemini-2.0 image are retired."""
    from google import genai

    clients = [get_client()]
    project = _project()
    if project:
        try:
            clients.append(
                genai.Client(vertexai=True, project=project, location="global")
            )
        except Exception:
            pass

    last: Exception | None = None
    for client in clients:
        for model in _models():
            try:
                result = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_modalities=["IMAGE"],
                    ),
                )
                data = _image_bytes(result)
                if data:
                    print(f"[image] ok {model}")
                    return data
                last = RuntimeError(f"{model} returned no image")
            except Exception as e:
                last = e
                print(f"[image] {model} failed: {e}")

    raise RuntimeError(
        f"Image generation failed. Last error: {last}. "
        "Need a Gemini image model on this Vertex project (gemini-3.1-flash-image or gemini-2.5-flash-image)."
    )
