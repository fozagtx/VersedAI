import json
from google.adk.agents import LlmAgent
from llm import get_client, model_name

# ─── Tool implementations (real Gemini calls) ───────────────────────────────

def _gemini_call(prompt: str) -> str:
    """Quick helper — single Gemini call for tool implementations."""
    client = get_client()
    response = client.models.generate_content(
        model=model_name(),
        contents=prompt,
    )
    return response.text or ""


def explain_concept(concept: str) -> str:
    """Returns a clear, simple explanation of an AI concept for a high-school student."""
    return _gemini_call(
        f"Explain '{concept}' to a high-school student in 3-4 clear sentences. "
        "Use a simple analogy if possible. No jargon. Be friendly and direct."
    )


def give_example(concept: str) -> str:
    """Returns a concrete real-world example of the concept."""
    return _gemini_call(
        f"Give one very concrete, relatable real-world example of '{concept}' "
        "that a high-school student would immediately recognise from their daily life. "
        "Keep it to 2-3 sentences."
    )


def quiz_student(topic: str) -> str:
    """Generates one multiple-choice question about the topic as JSON."""
    raw = _gemini_call(
        f"Generate one multiple-choice quiz question about '{topic}' for a high-school student. "
        "Return ONLY valid JSON in this exact format, no markdown, no extra text:\n"
        '{"question": "...", "options": ["A: ...", "B: ...", "C: ...", "D: ..."], "correct": "A: ..."}'
    )
    # Strip markdown code fences if present
    raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        parsed = json.loads(raw)
        return json.dumps(parsed)
    except Exception:
        # Fallback safe quiz
        return json.dumps({
            "question": f"What best describes {topic}?",
            "options": [
                "A: A system that predicts based on patterns",
                "B: A strict rule-based program",
                "C: A database of memorised facts",
                "D: A hardware component",
            ],
            "correct": "A: A system that predicts based on patterns",
        })


def mark_lesson_hint(lesson_id: str) -> str:
    """Logs that a hint was given for this lesson."""
    print(f"[HINT] Hint given for lesson: {lesson_id}")
    return "Hint recorded."


def evaluate_prompt_quality(prompt: str) -> str:
    """Evaluates an image generation prompt — what's good, what's missing, what to try next."""
    raw = _gemini_call(
        f"You are an expert at AI image generation prompts. Evaluate this prompt:\n\n\"{prompt}\"\n\n"
        "Return ONLY valid JSON in this exact format, no markdown:\n"
        '{"good": "what is working well", "missing": "what key elements are missing", '
        '"next": "one specific concrete suggestion to improve it", '
        '"score": 7}'
        " Score 1-10 based on specificity and likely image quality."
    )
    raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return raw  # already JSON string
    except Exception:
        return json.dumps({
            "good": "You have a clear subject.",
            "missing": "Style, lighting, and mood descriptors.",
            "next": "Try adding 'cinematic', 'golden hour', or 'photorealistic'.",
            "score": 5,
        })


# ─── Agent constructors ──────────────────────────────────────────────────────

TUTOR_INSTRUCTION = """
You are Versed, a friendly AI tutor on VersedAI — an edtech platform for high-school students
learning to use AI effectively.

Your job: coach students through lessons, not lecture them.

Rules:
- When a student struggles, give the SMALLEST useful hint, then let them try again.
- Never give the full answer immediately.
- Be encouraging, warm, and age-appropriate.
- Keep responses concise — students have short attention spans.
- If asked about a concept, use the explain_concept tool first.
- If asked for an example, use the give_example tool.
- If the student wants to test themselves, use quiz_student.
- If the student shares an image prompt, use evaluate_prompt_quality to give feedback.

You know the lesson context from the user message — use it to personalise your coaching.
After helping with one thing, always end with a question that encourages the student to keep going.
""".strip()


def get_tutor_agent() -> LlmAgent:
    return LlmAgent(
        name="VersedTutor",
        model=model_name(),
        instruction=TUTOR_INSTRUCTION,
        tools=[
            explain_concept,
            give_example,
            quiz_student,
            mark_lesson_hint,
            evaluate_prompt_quality,
        ],
    )


def get_lesson_pipeline_agent() -> LlmAgent:
    """
    Sequential lesson generator.
    Uses SequentialAgent if available (ADK 1.x), otherwise falls back to LlmAgent
    with multi-step instructions.
    """
    instruction = (
        "Generate lesson content for high-school students following these steps IN ORDER:\n"
        "1. RESEARCH: Find 3 accurate, age-appropriate facts about the topic.\n"
        "2. WRITE: Structure them into a lesson with a heading and 3 clear principle sections.\n"
        "3. QUIZ: Generate 3 multiple-choice questions testing understanding.\n"
        "4. REVIEW: Confirm content is appropriate, accurate, and engaging for high school.\n"
        "Return the complete lesson as structured JSON."
    )
    try:
        from google.adk.agents import SequentialAgent  # type: ignore
        return SequentialAgent(
            name="LessonPipeline",
            description="Generates lesson content step by step",
            sub_agents=[
                LlmAgent(
                    name="Researcher",
                    model=model_name(),
                    instruction="Find 3 accurate, age-appropriate facts about the given topic.",
                ),
                LlmAgent(
                    name="Writer",
                    model=model_name(),
                    instruction="Take the research and write a structured lesson with 3 principles.",
                ),
                LlmAgent(
                    name="QuizWriter",
                    model=model_name(),
                    instruction="Generate 3 multiple-choice quiz questions from the lesson content.",
                ),
                LlmAgent(
                    name="Reviewer",
                    model=model_name(),
                    instruction="Review the content for accuracy, tone, and age-appropriateness. Flag any issues.",
                ),
            ],
        )
    except (ImportError, TypeError):
        # Fallback: single LlmAgent with sequential instructions
        return LlmAgent(
            name="LessonPipeline",
            model=model_name(),
            instruction=instruction,
        )
