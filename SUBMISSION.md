# All Things Agentic — paste this into Devpost

Use this with the live app and `docs/versedai-architecture.png`. Do not edit the repo after the deadline.

## The three requirements

| Requirement | In this project | Proof |
|---|---|---|
| Gemini 3.5 or newer | Gemini 3.5 Flash coaches | Health JSON `model`: `gemini-3.5-flash`. SSE `event: meta` names it. |
| Google agent framework | Google ADK `LlmAgent` + Gen AI SDK | `server/agent.py`, `server/llm.py` |
| Google Cloud service | Cloud Run + Vertex AI | https://versedai-agent-158479424670.us-central1.run.app |

Bonus models (optional points): **Gemma 4** drills, **Veo 3** concept-to-clip.

## Category

Pick **one** track in the form. Do not skip this. Match the track to the product: education / agentic tutoring, not a generic chatbot.

## Links (open in incognito)

| Field | URL |
|---|---|
| Hosted project | https://versedai.onrender.com |
| Tutor (Cloud Run proof) | https://versedai-agent-158479424670.us-central1.run.app/health |
| Repo | https://github.com/fozagtx/VersedAI |
| Architecture | Upload `docs/versedai-architecture.png` (also in the repo) |
| Concept to clip | https://versedai.onrender.com/tracks/image-gen/concept-to-clip |
| Studio | https://versedai.onrender.com/studio |
| Login | None. No credentials to include. |

If the GitHub repo is ever set to private, share it with `testing@devpost.com` and `cloudhackathons@google.com`.

## Text description

### Features & functionality

VersedAI is a generative AI lab for students who already use chatbots but were never taught how. Four short paths: Foundations, Writing, Graphic Design, Agents. Each lesson is a few minutes of theory, then a real task. Versed, a Google ADK tutor, sits in the lesson panel. It gives the smallest useful hint. It does not dump the answer.

Graphic Design includes Image Studio and Concept to clip: type a raw idea, Gemini writes a Veo 3 shot, Veo renders eight seconds, the file lands in Studio. Images and clips stay on the device (IndexedDB). No login.

### Technologies used

- Gemini 3.5 Flash (Vertex, global) — coach, prompt critique, Veo shot language
- Gemma 4 `gemma-4-26b-a4b-it-maas` (Vertex, global) — drills, quizzes, explain
- Veo 3 `veo-3.0-generate-001` — concept-to-clip
- Google ADK `LlmAgent` with tools: `explain_concept`, `give_example`, `quiz_student`, `evaluate_prompt_quality`
- Google Gen AI SDK on Vertex
- Cloud Run `us-central1` — tutor
- Next.js 15 lab on Render, proxies chat and images, browser calls Cloud Run for video
- Progress: localStorage. Studio files: IndexedDB

### Other data sources

Curriculum is in `client/lib/content.ts`. No third-party lesson feed. Vertex is the only model host.

### Findings & learnings

Hosted models are a product decision, not a string in `.env`. Region and retired IDs matter: `gemini-2.0-flash` 404s, `gemini-3.6-flash` was missing in `us-central1`, Gemini 3.5 Flash on **global** is the coach that is live. Gemma is not another Gemini model ID; MaaS is global-only. The hard part of an education agent is the instruction (smallest hint, then a question), not the framework. Cloud Run plus ADC is what kept chat up after the AI Studio key 429d.

## Testing instructions (Devpost form)

No login. Open https://versedai.onrender.com → Start free → pick Graphic Design or chat.

```bash
curl -sS https://versedai-agent-158479424670.us-central1.run.app/health
# expect: "model":"gemini-3.5-flash" and "runtime":"vertex"

curl -sS -N -X POST https://versedai-agent-158479424670.us-central1.run.app/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"I am stuck on the image challenge. Smallest hint.","mode":"auto"}'
# expect: event: meta names Gemini 3.5 Flash, then a hint, not the finished answer
```

Local spin-up is in README.md. First call after idle can 502. Retry once.

## Disclosures

Built during the submission period. Third-party: Next.js, FastAPI, Google ADK, Google Gen AI SDK, Framer Motion, Lucide. Curriculum text is original. No pre-existing product fork.

## After you click submit

Do not edit the repo, swap the video, or change linked URLs until winners are announced. Keep building on a fork.
