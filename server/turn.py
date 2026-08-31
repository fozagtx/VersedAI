import json
import re
from collections.abc import Iterator

from agent import quiz_student
from llm import TUTOR_SYSTEM, choose_family, family_meta, stream_reply

_QUIZ = re.compile(r"\b(quiz|test me)\b", re.I)


def _topic(message: str, lesson_title: str) -> str:
    cleaned = re.sub(
        r"(?i)\b(quiz me( on)?|test me( on)?|give me a quiz( on)?)\b[:\s]*",
        "",
        message or "",
    ).strip(" .")
    return cleaned or lesson_title or "using AI"


def _prompt(message: str, context: dict | None, mode: str) -> str:
    context_str = ""
    ctx = context or {}
    track = ctx.get("trackSlug", "")
    lesson = ctx.get("lessonId", "")
    title = ctx.get("lessonTitle", "")
    if track and lesson:
        context_str = (
            f"[Student is on path '{track}', lesson '{lesson}' titled '{title}'. "
            f"Mode={mode}.]\n\n"
        )
    return f"{context_str}Student says: {message}"


def run_turn(
    message: str,
    *,
    mode: str = "auto",
    context: dict | None = None,
) -> Iterator[tuple[str, object]]:
    """One student turn. Gemma drills and quizzes. Gemini coaches. Both can speak."""
    ctx = context or {}
    lesson_title = ctx.get("lessonTitle") or ""
    prefer = choose_family(mode, message)
    prompt = _prompt(message, ctx, mode)

    if _QUIZ.search(message or ""):
        raw = quiz_student(_topic(message, lesson_title))
        try:
            payload = json.loads(raw)
        except Exception:
            payload = {"question": raw, "options": [], "correct": ""}
        yield ("meta", family_meta("gemma", role="quiz"))
        yield ("quiz", payload)
        nudge = (
            "The student just got a multiple-choice quiz. One sentence: tell them "
            "to pick an option. Do not reveal the answer."
        )
        if lesson_title:
            nudge += f" They are on '{lesson_title}'."
        yield from stream_reply(nudge, family="gemini", system=TUTOR_SYSTEM, role="coach")
        return

    yielded = False
    for kind, val in stream_reply(
        prompt, family=prefer, system=TUTOR_SYSTEM, role="drill" if prefer == "gemma" else "coach"
    ):
        if kind == "text":
            yielded = True
        yield (kind, val)

    if yielded and prefer == "gemma":
        coach = (
            "The student just got a short drill answer from Gemma. Do not repeat it. "
            "One sentence that pushes them to try the work themselves."
        )
        if lesson_title:
            coach += f" They are on the lesson '{lesson_title}'."
        yield from stream_reply(coach, family="gemini", system=TUTOR_SYSTEM, role="coach")
