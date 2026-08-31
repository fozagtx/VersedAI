## Inspiration

Most students already use AI. Almost none of them were taught how. School either bans it or drops a chatbot in a tab with no lesson around it. Kids copy homework, get a fluent wrong answer, and never learn judgment.

We wanted a lab, not a lecture. Short lessons. A real task right after. A tutor that hints and makes them try again. No login.

The agent is not the product. The student finishing a path is.

## What it does

VersedAI is a generative AI lab. Four paths. A few minutes of theory, then a hands-on task.

1. AI Foundations. What AI is, what it is not, when to trust it.
2. AI Writing. Goal, context, constraints. Iterate instead of one shot.
3. AI Graphic Design. Prompt an image, get critique, try again. Then dump a raw concept. Veo 3.1 Fast turns it into a clip you keep.
4. AI Agents. Tools, memory, then talk to a real agent.

The home page is a MacBook. The screen plays Who you are, pick a path, earn the badge.

XP stays on the device. Images and clips auto-save in Studio (IndexedDB). Refresh does not throw them away. Download anytime. No login.

When they get stuck, Versed (a Google ADK tutor) sits in the lesson panel and at /chat. Smallest useful hint. It does not hand over the finished answer.

Gemini 3.5 Flash on Vertex (global) coaches and scores prompts. Gemma 4 (`gemma-4-26b-a4b-it-maas`, Vertex global) runs drills, quizzes, and explain. If one fails, the other takes the turn. Veo 3.1 Fast (`veo-3.1-fast-generate-001`, us-central1) renders Concept to clip.

Live lab: https://versedai.onrender.com
Tutor health: https://versedai-agent-158479424670.us-central1.run.app/health
Concept to clip: https://versedai.onrender.com/tracks/image-gen/concept-to-clip
Studio: https://versedai.onrender.com/studio

## How we built it

Next.js 15 lab on Render. Curriculum in one file. Chat and image routes proxy to Cloud Run so the browser never holds Vertex credentials. Video jobs hit Cloud Run directly so Veo can take a minute.

FastAPI plus Google ADK `LlmAgent` with tools: `explain_concept`, `give_example`, `quiz_student`, `evaluate_prompt_quality`. Chat is SSE. Image Studio uses a Gemini image model, then the tutor scores the prompt. Concept to clip: Gemini 3.5 writes a shot, Veo 3.1 Fast renders, the MP4 lands in Studio.

Google Gen AI SDK on Vertex. Gemini 3.5 Flash is global. Gemma 4 MaaS is global only, so a second client. `server/llm.py` picks the family from mode and message, then falls back. `server/video_gen.py` calls Vertex `predictLongRunning` for Veo 3.1 in us-central1.

The tutor is a container on Cloud Run (`versedai-agent`, us-central1). The lab is on Render and proxies to that service.

## Challenges we ran into

`gemini-2.0-flash` is retired (404). `gemini-3.6-flash` was not in us-central1. Gemini 3.5 Flash on the **global** endpoint is the coach that meets the 3.5-or-newer rule.

The AI Studio key 429s. Chat only stayed up after Cloud Run used Vertex plus ADC on the GCP project.

Cloud Run could not build until the compute service account could read the source bucket.

Gemma is not another Gemini model ID. The API key path shares an empty prepaid pool. us-central1 404s. The working model is `gemma-4-26b-a4b-it-maas` on the global endpoint. That is why there are two clients.

`veo-3.0-generate-001` 404s on this project. `veo-3.1-fast-generate-001` in us-central1 is what actually returns an MP4. The first Concept to clip error was that 3.0 ID, not a missing Vertex API.

## Accomplishments that we're proud of

A live ADK tutor on Cloud Run that streams, quizzes, and fails over between Gemini 3.5 Flash and Gemma 4.

Health reports both models plus Veo: `gemini-3.5-flash`, `gemma-4-26b-a4b-it-maas`, `veo-3.1-fast-generate-001`, `runtime: vertex`.

A real curriculum. Four paths, a challenge on each lesson, a tutor told to hint.

Concept to clip is live. Type a raw idea. Get a Veo 3.1 clip in about a minute. It stays in Studio.

Verified routing. Playground explain hits Gemma. A stuck Image Studio student hits Gemini 3.5.

No login. A student can start in under a minute.

## What we learned

Hosted models are a product decision, not a string in `.env`. Region, billing path, and the exact model ID matter more than the blog post name. Gemini 3.5 needs global. Veo 3.1 Fast needs us-central1. Veo 3.0 is not on this project.

Open models still need a working paid endpoint. Gemma on Vertex MaaS works. Gemma on an empty AI Studio key does not.

The hard part of an education agent is the instruction. Smallest hint, then a question. Not the framework.

Shipping to Cloud Run taught more than another local demo: IAM, ADC vs API keys, cold starts, and a health check that reports every model the product actually uses.

## What's next for VersedAI

Classroom mode. A teacher link and progress that is not trapped in one browser.

More short paths. Research with sources, catch the hallucination, a student-built agent with one tool.

Keep Gemma for drills, Gemini 3.5 for coaching, and Veo 3.1 for clips as usage grows.
