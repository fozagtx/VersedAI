import os
import re
from collections.abc import Iterator

from google import genai

# Drills (explain, what is, quiz) go to Gemma. Coaching stays on Gemini.
_DRILL = re.compile(
    r"\b(explain|what is|what's|whats|define|give (me )?(an )?example|quiz|"
    r"test me|summarise|summarize)\b",
    re.I,
)

TUTOR_SYSTEM = (
    "You are Versed, a tutor on VersedAI. Coach students. Do not lecture. "
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
    """3.5+ Flash is GA on global. Keep us-central1 only for older IDs."""
    explicit = os.environ.get("GEMINI_LOCATION")
    if explicit:
        return explicit
    model = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")
    if model.startswith(("gemini-3.5", "gemini-3.6", "gemini-3.7")):
        return "global"
    return os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")


def gemma_location() -> str:
    return os.environ.get("GEMMA_LOCATION", "global")


def gemini_model() -> str:
    return os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")


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


def family_label(family: str) -> str:
    if family == "gemma":
        return "Gemma 4"
    model = gemini_model()
    if "3.7" in model:
        return "Gemini 3.7 Flash"
    if "3.6" in model:
        return "Gemini 3.6 Flash"
    if "3.5" in model:
        return "Gemini 3.5 Flash"
    return "Gemini"


def choose_family(mode: str = "tutor", message: str = "", prefer: str | None = None) -> str:
    """Gemma for drills, quizzes, and playground. Gemini for coaching."""
    if prefer in ("gemma", "gemini"):
        return prefer
    if (mode or "").lower() in ("playground", "quiz", "drill"):
        return "gemma"
    sample = (message or "")[:200]
    if sample and _DRILL.search(sample):
        return "gemma"
    return "gemini"


def family_meta(family: str, *, fallback: bool = False, role: str = "") -> dict:
    return {
        "family": family,
        "model": gemma_model() if family == "gemma" else gemini_model(),
        "label": family_label(family),
        "fallback": fallback,
        "role": role,
    }


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


def stream_reply(
    prompt: str,
    *,
    family: str = "gemini",
    system: str | None = None,
    role: str = "",
) -> Iterator[tuple[str, object]]:
    """Yields ('meta', dict) then ('text', str). Meta names the model that actually spoke."""
    last: Exception | None = None
    for fam in _order(family):
        yielded = False
        try:
            client, _model = _client_and_model(fam)
            stream = client.models.generate_content_stream(**_request(fam, prompt, system))
            for chunk in stream:
                text = getattr(chunk, "text", None)
                if not text:
                    continue
                if not yielded:
                    yield (
                        "meta",
                        family_meta(fam, fallback=fam != family, role=role),
                    )
                    yielded = True
                yield ("text", text)
            if yielded:
                return
        except Exception as e:
            last = e
            print(f"[llm] {fam} stream failed, trying next: {e}")
            continue
    if last:
        raise last


def generate_text_stream(
    prompt: str,
    *,
    family: str = "gemini",
    system: str | None = None,
) -> Iterator[str]:
    for kind, val in stream_reply(prompt, family=family, system=system):
        if kind == "text":
            yield str(val)
