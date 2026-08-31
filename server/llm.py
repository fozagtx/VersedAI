import os
from google import genai


def _api_key() -> str | None:
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    return key or None


def use_vertex() -> bool:
    flag = os.environ.get("GOOGLE_GENAI_USE_VERTEXAI", "").lower()
    if flag in ("true", "1", "yes"):
        return True
    project = os.environ.get("GOOGLE_CLOUD_PROJECT") or os.environ.get("GCLOUD_PROJECT")
    return bool(project) and not _api_key()


def get_client() -> genai.Client:
    """Vertex on Cloud Run (ADC). API key locally or as a fallback."""
    project = os.environ.get("GOOGLE_CLOUD_PROJECT") or os.environ.get("GCLOUD_PROJECT")
    location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
    if use_vertex() and project:
        return genai.Client(vertexai=True, project=project, location=location)
    key = _api_key()
    if not key:
        raise RuntimeError(
            "Set GEMINI_API_KEY, or GOOGLE_CLOUD_PROJECT with Vertex AI enabled."
        )
    return genai.Client(api_key=key)


def model_name() -> str:
    return os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
