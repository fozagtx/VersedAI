import os
import re
from collections.abc import Iterator

from google import genai

# Playground / "what is X" work is cheaper on Gemma. Gemini stays on the coach.
_DRILL = re.compile(
    r"^\s*(explain|what is|what's|whats|define|give (me )?(an )?example|quiz|"
    r"summarise|summarize|list|name)\b",
    re.I,
)

TUTOR_SYSTEM = (
    "You are Versed, a friendly AI tutor on VersedAI — an edtech platform for "
    "high-school students learning to use AI. Coach students, don't lecture them. "
    "When they struggle, give the smallest useful hint and let them try again. "
    "Be encouraging, age-appropriate, and brief."
)


def _api_key() -> str | None:
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    return key or None


def _project() -> str | None:
    return os.environ.get("GOOGLE_CLOUD_PROJECT") or os.environ.get("GCLOUD_PROJECT")


def use_vertex() -> bool:
    flag = os.environ.get("GOOGLE_GENAI_USE_VERTEXAI", "").lower()
    if flag in ("true", "1", "yes"):
        return True
    return bool(_project()) and not _api_key()


def gemini_location() -> str:
    return os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")


def gemma_location() -> str:
    return os.environ.get("GEMMA_LOCATION", "global")


def gemini_model() -> str:
    return os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")


def gemma_model() -> str:
    override = os.environ.get("GEMMA_MODEL")
    if override:
        return override
    if use_vertex() and _project():
        return "gemma-4-26b-a4b-it-maas"
    return "gemma-4-26b-a4b-it"


def model_name() -> str:
    """Primary tutor model (Gemini). Kept for health + ADK."""
    return gemini_model()


def get_client() -> genai.Client:
    """Vertex Gemini in the Cloud Run region, or API key locally."""
    project = _project()
    if use_vertex() and project:
        return genai.Client(vertexai=True, project=project, location=gemini_location())
    key = _api_key()
    if not key:
        raise RuntimeError(
            "Set GEMINI_API_KEY, or GOOGLE_CLOUD_PROJECT with Vertex AI enabled."
        )
    return genai.Client(api_key=key)


def get_gemma_client() -> genai.Client:
    """Gemma 4 MaaS is global-only on Vertex. API-key path uses the Gemini API."""
    project = _project()
    if use_vertex() and project:
        return genai.Client(vertexai=True, project=project, location=gemma_location())
    key = _api_key()
    if not key:
        return get_client()
    return genai.Client(api_key=key)


def choose_family(mode: str = "tutor", message: str = "", prefer: str | None = None) -> str:
    """Gemma for short drills and the playground. Gemini for coaching."""
    if prefer in ("gemma", "gemini"):
        return prefer
    if (mode or "").lower() in ("playground", "quiz", "drill"):
        return "gemma"
    if message and len(message) < 400 and _DRILL.search(message):
        return "gemma"
    return "gemini"


def _order(family: str) -> list[str]:
    if family == "gemma":
        return ["gemma", "gemini"]
    return ["gemini", "gemma"]


def _client_and_model(family: str) -> tuple[genai.Client, str]:
    if family == "gemma":
        return get_gemma_client(), gemma_model()
    return get_client(), gemini_model()


def _request(family: str, prompt: str, system: str | None) -> dict:
    if family == "gemma":
        contents = f"{system}\n\n{prompt}" if system else prompt
        return {"model": gemma_model(), "contents": contents}
    kwargs: dict = {"model": gemini_model(), "contents": prompt}
    if system:
        kwargs["config"] = {"system_instruction": system}
    return kwargs


def generate_text(
    prompt: str,
    *,
    family: str = "gemini",
    system: str | None = None,
) -> str:
    last: Exception | None = None
    for fam in _order(family):
        try:
            client, _ = _client_and_model(fam)
            response = client.models.generate_content(**_request(fam, prompt, system))
            text = (response.text or "").strip()
            if text:
                return text
        except Exception as e:
            last = e
            print(f"[llm] {fam} failed, trying next: {e}")
    if last:
        raise last
    return ""


def generate_text_stream(
    prompt: str,
    *,
    family: str = "gemini",
    system: str | None = None,
) -> Iterator[str]:
    last: Exception | None = None
    for fam in _order(family):
        yielded = False
        try:
            client, _ = _client_and_model(fam)
            stream = client.models.generate_content_stream(**_request(fam, prompt, system))
            for chunk in stream:
                text = getattr(chunk, "text", None)
                if text:
                    yielded = True
                    yield text
            if yielded:
                return
        except Exception as e:
            last = e
            print(f"[llm] {fam} stream failed, trying next: {e}")
            continue
    if last:
        raise last
