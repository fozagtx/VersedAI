# VersedAI

An AI lab for high-school students. Four short tracks, each lesson is a few minutes of theory then a real prompt, image, or agent task. A Google ADK tutor coaches instead of lecturing.

Live tutor (Cloud Run, Vertex AI, Gemini 2.5 Flash):

https://versedai-agent-158479424670.us-central1.run.app

Built for the All Things Agentic hackathon.

## Features

- Four curriculum tracks (What is AI, Image Studio, Context Lab, Agents)
- Streaming tutor chat via Google ADK + Gemini on Cloud Run
- Image Studio with Imagen 3 and prompt feedback
- Local XP / progress (no login)
- Next.js app + FastAPI agent

## Prerequisites

- Node.js 20+
- Python 3.11+
- A Google Cloud project with Vertex AI enabled, **or** a `GEMINI_API_KEY`

## Getting started

```bash
git clone https://github.com/fozagtx/VersedAI.git
cd VersedAI
```

### 1. Agent (optional locally)

The app is already pointed at the deployed Cloud Run service. To run the agent on your machine instead:

```bash
cd server
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# set GEMINI_API_KEY, or GOOGLE_GENAI_USE_VERTEXAI=true plus GOOGLE_CLOUD_PROJECT
python3 -m uvicorn main:app --reload --port 8000 --host 0.0.0.0
```

Health check: http://localhost:8000/health

### 2. App

```bash
cd client
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000.

`BACKEND_URL` in `client/.env.local` should be the Cloud Run URL (default in the example) or `http://localhost:8000` if you started the agent locally.

## Usage

1. Pick a learner type on first visit (saved on this device).
2. Start a track under `/tracks`.
3. Complete the 3-minute lesson, then the hands-on task.
4. Use the tutor panel (or `/chat`) when you get stuck. It hints. It does not dump the answer.

```bash
# Agent health
curl https://versedai-agent-158479424670.us-central1.run.app/health

# Chat (SSE)
curl -N -X POST https://versedai-agent-158479424670.us-central1.run.app/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Explain tokens in one sentence.","mode":"playground"}'
```

## Configuration

| Variable | Where | Purpose |
|---|---|---|
| `BACKEND_URL` | `client/.env.local` | FastAPI / Cloud Run origin used by Next.js API routes |
| `GEMINI_API_KEY` | `server/.env` | Local Gemini API key (optional if using Vertex) |
| `GOOGLE_GENAI_USE_VERTEXAI` | Cloud Run / `server/.env` | `true` to use Vertex + ADC |
| `GOOGLE_CLOUD_PROJECT` | Cloud Run | `versedai-507218` |
| `GOOGLE_CLOUD_LOCATION` | Cloud Run | `us-central1` |
| `GEMINI_MODEL` | Cloud Run | `gemini-2.5-flash` |

Redeploy the agent from `server/`:

```bash
gcloud run deploy versedai-agent \
  --source . \
  --project versedai-507218 \
  --region us-central1 \
  --allow-unauthenticated
```

## Repo layout

```
client/     Next.js 15 app (tracks, playground, lessons)
server/     FastAPI + Google ADK tutor (Dockerfile for Cloud Run)
brand.md    Palette, type, voice
```

## Troubleshooting

**Tutor says it is unreachable.** `BACKEND_URL` is wrong, or the Cloud Run service is cold-starting. Hit `/health` once, then retry.

**`gemini-2.0-flash` 404.** That model is retired on the Gemini API. Use `gemini-2.5-flash` on Vertex (`us-central1`).

**Image generation fails.** Imagen needs Vertex access on the same project. Chat can work while image gen does not.

**XP disappeared.** Progress is `localStorage` only (`versedai_xp`). Clearing site data wipes it.
