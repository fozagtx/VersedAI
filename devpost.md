## Inspiration

Most students already use AI. Almost none of them were taught how. School either bans it or drops a chatbot in a tab with no lesson around it. Kids copy homework, get a fluent wrong answer, and never learn judgment.

We wanted a lab, not a lecture. Short lessons. A real task right after. A tutor that hints and makes them try again. No login.

The agent is not the product. The student finishing a path is.

## What it does

VersedAI is a generative AI lab. Four paths, each a few minutes of theory then a hands-on task.

1. AI Foundations. What AI is, what it is not, when to trust it.
2. AI Writing. Goal, context, constraints. Iterate instead of one shot.
3. AI Graphic Design. Write a prompt, generate, get critique, try again. Then dump a raw concept; Veo 3 turns it into an 8-second clip.
4. AI Agents. Tools, memory, then talk to a real agent.

XP stays on the device. Images and clips stay in Studio (IndexedDB). When they get stuck, Versed (a Google ADK tutor) is in the lesson panel and in /chat. Smallest useful hint. It does not hand over the finished answer.

Gemini 3.5 Flash on Vertex (global) coaches and scores prompts. Gemma 4 (gemma-4-26b-a4b-it-maas, Vertex global) handles playground, quizzes, and explain drills. If one fails, the other takes the turn. Veo 3 renders concept-to-clip.

## How we built it

Next.js 15 lab. Curriculum in one file. Chat and image routes proxy to the agent so the browser never holds cloud credentials. XP is localStorage.

FastAPI plus Google ADK LlmAgent with tools: explain_concept, give_example, quiz_student, evaluate_prompt_quality. Chat is SSE. Image Studio calls a Gemini image model, then the tutor scores the prompt. Concept to clip: Gemini writes a Veo shot, Veo 3 renders eight seconds, the file lands in Studio.

Google Gen AI SDK on Vertex. Gemini 3.5 Flash is global. Gemma 4 MaaS is global only, so a second client. server/llm.py picks the family from mode and message, then falls back.

The tutor is a container on Cloud Run. The lab is on Render and proxies to that service.

## Challenges we ran into

gemini-2.0-flash is retired (404). gemini-3.6-flash was not in us-central1. Gemini 3.5 Flash on the global endpoint is the coach that satisfies the 3.5-or-newer rule.

The AI Studio key 429s. Chat only stayed up after Cloud Run used Vertex plus ADC on the GCP project.

Cloud Run could not build until the compute service account could read the source bucket.

Gemma is not another Gemini model ID. The API key path shares an empty prepaid pool. us-central1 404s. The working model is gemma-4-26b-a4b-it-maas on the global endpoint. That is why there are two clients.

Imagen can fail while chat works if Vertex image access is missing.

## Accomplishments that we're proud of

A live ADK tutor on Cloud Run that streams, quizzes, and falls over between Gemini and Gemma.

A real curriculum. Four paths, a challenge on each lesson, a tutor told to hint.

Verified routing. Playground explain hits Gemma. A stuck Image Studio student hits Gemini.

No login. A student can start in under a minute.

## What we learned

Hosted models are a product decision, not a string in .env. Region, billing path, and retired IDs matter more than the blog post name.

Open models still need a working paid endpoint. Gemma on Vertex MaaS works. Gemma on an empty AI Studio key does not.

The hard part of an education agent is the instruction. Smallest hint, then a question. Not the framework.

Shipping to Cloud Run taught more than another local demo: IAM, ADC vs API keys, cold starts, and a health check that reports both models.

## What's next for VersedAI

Make Image Studio as reliable as chat on the same Vertex project.

Classroom mode. A teacher link and progress that is not trapped in one browser.

More short paths. Research with sources, catch the hallucination, a student-built agent with one tool.

Keep Gemma for drills and Gemini 3.5 for coaching as usage grows.
