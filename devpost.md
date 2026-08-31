# VersedAI — Devpost story

Paste each section into the matching Devpost field. Built for **All Things Agentic**.

**Repo:** https://github.com/fozagtx/VersedAI  
**Live lab:** https://versedai.onrender.com  
**Live tutor:** https://versedai-agent-158479424670.us-central1.run.app/health  
**Architecture diagram (upload this to Devpost):** `docs/versedai-architecture.png`

---

## Inspiration

Most high-school students already use AI. Almost none of them were taught how.

School responses tend to be a ban, a panic, or a chatbot dumped in a tab with no lesson around it. The result is the same: kids copy-paste homework, get a fluent wrong answer, and never learn the one skill that matters — judgment.

We wanted a lab, not a lecture. Short lessons. A real prompt, image, or agent task immediately after. A tutor that coaches instead of dumping the answer. Something a student can open on a laptop in a study hall with no login.

VersedAI is that lab. The agent is not the product. The student finishing a track is.

---

## What it does

VersedAI is an AI lab for high-school students. Four tracks, each a few minutes of theory then a hands-on task:

1. **What is AI?** — prediction vs understanding, when to trust it, when not to.
2. **Context Engineering** — instructions vs context, iterate instead of one-shot.
3. **AI Image Generation** — write a prompt, generate, get critique, try again.
4. **AI Agents** — tools, memory, then talk to a real agent.

Progress is XP on the device. No account. Pick a learner type, start a track, complete the 3-minute lesson, do the challenge.

When they get stuck, **Versed** (a Google ADK tutor) is in the lesson panel and in `/chat`. It gives the smallest useful hint and asks them to try again. It does not hand over the finished answer.

Two models, on purpose:

- **Gemini 2.5 Flash** on Vertex (`us-central1`) for coaching and prompt critique.
- **Gemma 4** (`gemma-4-26b-a4b-it-maas`, Vertex global) for playground turns, quizzes, and “explain / what is” drills.

If one model fails (quota, 404, outage), the other takes the turn.

---

## How we built it

**App:** Next.js 15, React 19, Tailwind. Curriculum lives in one file (`client/lib/content.ts`). Chat and image routes on the Next server proxy to the agent so the browser never holds cloud credentials. XP is `localStorage` (`versedai_xp`).

**Agent:** FastAPI + Google ADK (`LlmAgent`) with tools: `explain_concept`, `give_example`, `quiz_student`, `evaluate_prompt_quality`. Streaming chat is SSE. Image Studio calls Imagen, then asks the tutor to score the prompt.

**Models:** Google Gen AI SDK on Vertex. Gemini stays in `us-central1`. Gemma 4 MaaS is **global-only** — a second client, same project. A small router in `server/llm.py` picks the family from mode and message shape, then falls back.

**Deploy:** Agent is a container on Cloud Run (`versedai-agent`, project `versedai-507218`). Health: https://versedai-agent-158479424670.us-central1.run.app/health

Brand is warm paper and ink, one violet mark, no chatbot-purple gradient. The tutor is a coach, not a mascot.

---

## Challenges we ran into

**The model we started with was dead.** `gemini-2.0-flash` returns 404. `gemini-3.6-flash` was not available in `us-central1`. We probed Vertex until **Gemini 2.5 Flash** actually answered.

**AI Studio prepaid credits were empty.** The Gemini API key path 429s. Chat only became reliable after we switched the Cloud Run service to Vertex + ADC, billed to the GCP project.

**Cloud Run could not build until IAM was fixed.** The default compute service account could not read the source bucket. We granted the build/run roles, then the first revision shipped.

**Gemma is not “just another Gemini model ID.”** `gemma-4-26b-a4b-it` on the API key is the same depleted prepaid pool. On Vertex, `us-central1` 404s. The working hosted model is **`gemma-4-26b-a4b-it-maas` on the global endpoint**. That is why the tutor uses two clients.

**Imagen is stricter than chat.** The tutor can be healthy while image generation still fails if Vertex image access is missing. We left that honest in the README instead of faking a gallery.

---

## Accomplishments that we're proud of

- A live tutor on Cloud Run that streams, quizzes, and falls over between Gemini and Gemma.
- A real curriculum, not a prompt playground with a school skin. Four tracks, lessons with a challenge, a tutor that is instructed to hint.
- Google ADK in production (tools + instruction), not a slide that says “agents.”
- Dual-model routing that we verified: playground “Explain tokens…” hits Gemma; a stuck Image Studio student hits Gemini.
- No login. A student can start in under a minute.
- A UI that looks like a studio, not a generic AI dashboard.

---

## What we learned

Hosted models are a product decision, not a string in `.env`. Region, billing path, and retired IDs matter more than the blog post name of the model.

Open models still need a paid, working endpoint. Gemma on Vertex MaaS is useful; Gemma on an empty AI Studio key is not.

Agents are only interesting if they refuse to do the student’s work. The hard part of an education agent is the instruction — smallest hint, then a question — not the framework.

Shipping the agent to Cloud Run taught us more than another local demo: IAM, ADC vs API keys, cold starts, and what `/health` should actually report (`model` and `gemma`).

---

## What's next for VersedAI

- Ship the Next.js lab next to the agent (the tutor is live; the classroom UI still runs locally).
- Finish Imagen on the same Vertex project so Image Studio is as reliable as chat.
- Classroom mode: a teacher link, shared tracks, progress that is not trapped in one browser.
- More tracks that stay short — research with sources, “catch the hallucination,” a student-built agent with one tool.
- Keep Gemma for drills and Gemini for coaching as usage grows, instead of sending every token through the expensive model.
