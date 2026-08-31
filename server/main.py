import os
import json
import base64
import asyncio
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv

from agent import get_tutor_agent, evaluate_prompt_quality, quiz_student
from image_gen import generate_image

load_dotenv(override=True)

app = FastAPI(title="VersedAI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://versedai.vercel.app",
        "*",  # Allow all for hackathon demo
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazily instantiate the agent (avoids startup errors if key not set)
_tutor_agent = None

def get_agent():
    global _tutor_agent
    if _tutor_agent is None:
        _tutor_agent = get_tutor_agent()
    return _tutor_agent


@app.get("/health")
def health_endpoint():
    from llm import model_name, use_vertex

    return {
        "status": "ok",
        "model": model_name(),
        "platform": "VersedAI",
        "runtime": "vertex" if use_vertex() else "api_key",
    }


@app.post("/chat")
async def chat_endpoint(request: Request):
    """
    Streaming chat endpoint using Google ADK LlmAgent.
    Returns SSE (Server-Sent Events) stream.
    """
    try:
        body = await request.json()
        message = body.get("message", "")
        context = body.get("context", {})
        mode = body.get("mode", "tutor")

        if not message:
            raise HTTPException(status_code=400, detail="message is required")

        # Build the full prompt with context
        context_str = ""
        if context:
            track = context.get("trackSlug", "")
            lesson = context.get("lessonId", "")
            lesson_title = context.get("lessonTitle", "")
            if track and lesson:
                context_str = (
                    f"[CONTEXT: Student is on track='{track}', lesson='{lesson}' "
                    f"titled='{lesson_title}'. Mode={mode}.]\n\n"
                )

        full_prompt = f"{context_str}Student says: {message}"

        async def stream_generator():
            try:
                agent = get_agent()

                # Try ADK async streaming first
                if hasattr(agent, "astream"):
                    async for chunk in agent.astream(full_prompt):
                        text = getattr(chunk, "text", None) or getattr(chunk, "content", None) or str(chunk)
                        if text:
                            # SSE format
                            yield f"data: {text}\n\n"

                elif hasattr(agent, "stream"):
                    # Sync stream wrapped in thread
                    loop = asyncio.get_event_loop()
                    chunks = await loop.run_in_executor(None, lambda: list(agent.stream(full_prompt)))
                    for chunk in chunks:
                        text = getattr(chunk, "text", None) or str(chunk)
                        if text:
                            yield f"data: {text}\n\n"

                else:
                    from llm import get_client, model_name

                    client = get_client()
                    system_instruction = (
                        "You are Versed, a friendly AI tutor on VersedAI — an edtech platform for "
                        "high-school students learning to use AI. Coach students, don't lecture them. "
                        "When they struggle, give the smallest useful hint and let them try again. "
                        "Be encouraging, age-appropriate, and brief."
                    )

                    stream = client.models.generate_content_stream(
                        model=model_name(),
                        contents=full_prompt,
                        config={"system_instruction": system_instruction},
                    )
                    for chunk in stream:
                        if getattr(chunk, "text", None):
                            yield f"data: {chunk.text}\n\n"

            except Exception as e:
                yield f"data: [Error: {str(e)}]\n\n"

        return StreamingResponse(
            stream_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache, no-transform",
                "X-Accel-Buffering": "no",
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-image")
async def generate_image_endpoint(request: Request):
    """Generate an image using Imagen 3 and return as base64 data URL."""
    try:
        body = await request.json()
        prompt = body.get("prompt", "").strip()
        if not prompt:
            raise HTTPException(status_code=400, detail="prompt is required")

        # Generate image in thread pool (sync function)
        loop = asyncio.get_event_loop()
        image_bytes = await loop.run_in_executor(None, generate_image, prompt)

        base64_encoded = base64.b64encode(image_bytes).decode("utf-8")
        image_url = f"data:image/png;base64,{base64_encoded}"

        # Get prompt feedback
        feedback_raw = evaluate_prompt_quality(prompt)

        return {"imageUrl": image_url, "feedback": feedback_raw}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/image-feedback")
async def image_feedback_endpoint(request: Request):
    """Evaluate an image generation prompt without generating an image."""
    try:
        body = await request.json()
        prompt = body.get("prompt", "").strip()
        if not prompt:
            raise HTTPException(status_code=400, detail="prompt is required")

        feedback_raw = evaluate_prompt_quality(prompt)
        return {"feedback": feedback_raw}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/quiz")
async def quiz_endpoint(request: Request):
    """Generate a quiz question for a given topic."""
    try:
        body = await request.json()
        topic = body.get("topic", "AI").strip()
        
        loop = asyncio.get_event_loop()
        quiz_json = await loop.run_in_executor(None, quiz_student, topic)
        return json.loads(quiz_json)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
