# VersedAI

The first generative AI lab for online learners. Real-time work with an AI tutor that stays up 24/7. Short lessons, then a real prompt, image, or agent task. The tutor coaches. It does not dump the answer.

**[Open the lab](https://versedai.onrender.com)** · [Tutor health](https://versedai-agent-158479424670.us-central1.run.app/health) · [Devpost story](./devpost.md)

Built for **All Things Agentic**.

## Features

- Four paths: AI Foundations, AI Writing, AI Graphic Design, AI Agents — each with its own badge
- 3-minute lesson, then a hands-on challenge
- Google ADK tutor (hints only) in the lesson panel and at `/chat`
- Gemini 2.5 Flash for coaching; Gemma 4 for drills, quizzes, and playground
- Automatic fallback if one model fails
- Image Studio (Imagen + prompt critique)
- XP on this device only — no login

## How it works

1. Pick a learner type. Progress is stored in `localStorage` (`versedai_xp`).
2. Open a track, read the lesson, do the challenge.
3. Ask Versed when stuck. Playground / “explain / what is / quiz” hits **Gemma 4** (`gemma-4-26b-a4b-it-maas`, Vertex **global**). Coaching and prompt critique hit **Gemini 2.5 Flash** (Vertex `us-central1`). Either side can take over if the other errors.

The Next.js app on Render proxies `/api/chat` and image routes to Cloud Run so the browser never holds Google credentials.

## Prerequisites

- Node.js 20+
- Python 3.11+ (only if you run the agent locally)
- Vertex AI on a GCP project, **or** a `GEMINI_API_KEY` (AI Studio prepaid is easy to exhaust)

## Getting started

```bash
git clone https://github.com/fozagtx/VersedAI.git
cd VersedAI
```

### App (local)

```bash
cd client
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000.

`BACKEND_URL` defaults to the live Cloud Run tutor. Set it to `http://localhost:8000` only if you also start the agent locally.

### Agent (optional)

```bash
cd server
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# GOOGLE_GENAI_USE_VERTEXAI=true and GOOGLE_CLOUD_PROJECT=…
# or GEMINI_API_KEY=…
python3 -m uvicorn main:app --reload --port 8000 --host 0.0.0.0
```

Health: http://localhost:8000/health

## Usage

1. Open https://versedai.onrender.com (or localhost).
2. Choose a learner type.
3. Start a track under `/tracks`. Finish the lesson, then the task.
4. Use the tutor panel or `/chat` when stuck.

```bash
# Tutor health (should list both models)
curl https://versedai-agent-158479424670.us-central1.run.app/health

# Drill — routed to Gemma
curl -N -X POST https://versedai-agent-158479424670.us-central1.run.app/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Explain tokens in one sentence.","mode":"playground"}'

# Same path through the live app
curl -N -X POST https://versedai.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Explain tokens in one sentence.","mode":"playground"}'
```

First request after idle can be slow (Render and Cloud Run both cold-start). Retry once.

## Configuration

| Variable | Where | Purpose |
|---|---|---|
| `BACKEND_URL` | `client/.env.local`, Render | Cloud Run origin for Next.js API routes |
| `GOOGLE_GENAI_USE_VERTEXAI` | Cloud Run / `server/.env` | `true` for Vertex + ADC |
| `GOOGLE_CLOUD_PROJECT` | Cloud Run | `versedai-507218` |
| `GOOGLE_CLOUD_LOCATION` | Cloud Run | `us-central1` (Gemini) |
| `GEMINI_MODEL` | Cloud Run | `gemini-2.5-flash` |
| `GEMMA_MODEL` | Cloud Run | `gemma-4-26b-a4b-it-maas` |
| `GEMMA_LOCATION` | Cloud Run | `global` |
| `GEMINI_API_KEY` | `server/.env` | Local / Gemini API only; not used on the live Vertex tutor |
| `NODE_VERSION` | Render | `20` |
| `NPM_CONFIG_PRODUCTION` | Render | `false` so `npm ci` keeps build tooling |
| `NODE_OPTIONS` | Render | `--max-old-space-size=1536` |

## Deploy

**Lab (live):** https://versedai.onrender.com — Next.js, `rootDir: client`, service `versedai`. Blueprint: [`render.yaml`](./render.yaml). Dashboard: https://dashboard.render.com/web/srv-daav33tg1s2s738g14kg

Push to `main` auto-deploys the frontend.

**Tutor (live):** https://versedai-agent-158479424670.us-central1.run.app — FastAPI + ADK, Cloud Run `us-central1`.

```bash
cd server
gcloud run deploy versedai-agent \
  --source . \
  --project versedai-507218 \
  --region us-central1 \
  --allow-unauthenticated
```

Do not point Gemma at `us-central1`. Do not use `gemini-2.0-flash` (retired).

## Repo layout

```
client/       Next.js 15 lab (tracks, playground, lessons)
server/       FastAPI + Google ADK tutor (Dockerfile → Cloud Run)
render.yaml   Render Blueprint for the lab
brand.md      Palette, type, voice
devpost.md    Hackathon story (paste into Devpost)
```

Curriculum is `client/lib/content.ts`. Model routing is `server/llm.py`.

## Troubleshooting

**Tutor unreachable / first chat 502.** Cold start. Hit `/health`, then retry.

**`gemini-2.0-flash` 404.** Retired. Use `gemini-2.5-flash` on Vertex `us-central1`.

**Gemma 404 on `us-central1`.** Use `gemma-4-26b-a4b-it-maas` with `GEMMA_LOCATION=global`. AI Studio keys share an empty prepaid pool; Vertex MaaS does not.

**Image generation fails, chat works.** Imagen needs Vertex image access on the same project.

**Render build: `Can't resolve '@/components/…'`.** `client/next.config.ts` must alias `@` to the app root. Do not rely on tsconfig paths alone in a clean clone.

**Render build dies right after “Linting and checking types”.** Out of memory. The live service skips lint/typecheck in CI (`ignoreDuringBuilds` / `ignoreBuildErrors`) and sets `NODE_OPTIONS=--max-old-space-size=1536`.

**XP disappeared.** `localStorage` only (`versedai_xp`). Clearing site data wipes it.
