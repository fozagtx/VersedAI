# VersedAI

Generative AI lab for online learners. Short lessons, then a real task. The ADK tutor coaches. It does not dump the answer.

Built for **All Things Agentic**.

## URLs

| What | URL |
|---|---|
| Lab | https://versedai.onrender.com |
| Tutor | https://versedai-agent-158479424670.us-central1.run.app |
| Tutor health | https://versedai-agent-158479424670.us-central1.run.app/health |
| Playground | https://versedai.onrender.com/chat |
| Paths | https://versedai.onrender.com/tracks |
| Repo | https://github.com/fozagtx/VersedAI |
| Architecture | [docs/versedai-architecture.png](./docs/versedai-architecture.png) |
| Devpost copy | [devpost.md](./devpost.md) |
| Render dashboard | https://dashboard.render.com/web/srv-daav33tg1s2s738g14kg |

## Stack

| Layer | What | Where |
|---|---|---|
| Lab | Next.js 15 | Render (`versedai`, `rootDir: client`) |
| Tutor | FastAPI + Google ADK | Cloud Run `us-central1` |
| Coach | Gemini 2.5 Flash | Vertex `us-central1` |
| Drills | Gemma 4 `gemma-4-26b-a4b-it-maas` | Vertex `global` |
| Images | Imagen | Vertex, via `/api/generate-image` |
| Progress | `localStorage` (`versedai_xp`) | Browser, no login |

The lab proxies `/api/chat` and image routes to Cloud Run. The browser never holds Vertex credentials.

## Paths

| Path | Badge | URL |
|---|---|---|
| AI Foundations | Foundations | https://versedai.onrender.com/tracks/what-is-ai |
| AI Writing | Writer | https://versedai.onrender.com/tracks/prompting |
| AI Graphic Design | Designer | https://versedai.onrender.com/tracks/image-gen |
| AI Agents | Builder | https://versedai.onrender.com/tracks/ai-agents |

## Reproducible testing

No GCP project required. First call after idle can 502 — retry once.

| Check | Command | Pass |
|---|---|---|
| Health | `curl -sS https://versedai-agent-158479424670.us-central1.run.app/health` | JSON below |
| Gemma (playground) | `curl -sS -N -X POST https://versedai-agent-158479424670.us-central1.run.app/chat -H "Content-Type: application/json" -d '{"message":"What is an AI agent in two sentences?","mode":"playground"}'` | Non-empty SSE |
| Gemini (tutor) | `curl -sS -N -X POST https://versedai-agent-158479424670.us-central1.run.app/chat -H "Content-Type: application/json" -d '{"message":"I am stuck on the image challenge. Smallest hint.","mode":"tutor"}'` | Non-empty SSE |
| Lab proxy | `curl -sS -N -X POST https://versedai.onrender.com/api/chat -H "Content-Type: application/json" -d '{"message":"What is an AI agent in two sentences?","mode":"playground"}'` | Same tutor, via Render |
| Router | `cd server && python3 -c "from llm import choose_family; assert choose_family('playground','hello')=='gemma'; assert choose_family('tutor','Explain tokens')=='gemma'; assert choose_family('tutor','I am stuck')=='gemini'; print('router ok')"` | `router ok` |

Health must be:

```json
{"status":"ok","model":"gemini-2.5-flash","gemma":"gemma-4-26b-a4b-it-maas","platform":"VersedAI","runtime":"vertex"}
```

## Getting started

```bash
git clone https://github.com/fozagtx/VersedAI.git
cd VersedAI/client
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000. `BACKEND_URL` already points at the live tutor.

| Optional | Command |
|---|---|
| Local tutor | `cd server && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && cp .env.example .env && python3 -m uvicorn main:app --reload --port 8000 --host 0.0.0.0` |
| Point the lab at it | `BACKEND_URL=http://localhost:8000` in `client/.env.local` |

Needs Vertex ADC **or** `GEMINI_API_KEY`.

## Configuration

| Variable | Where | Value |
|---|---|---|
| `BACKEND_URL` | `client/.env.local`, Render | https://versedai-agent-158479424670.us-central1.run.app |
| `GOOGLE_GENAI_USE_VERTEXAI` | Cloud Run | `true` |
| `GOOGLE_CLOUD_PROJECT` | Cloud Run | `versedai-507218` |
| `GOOGLE_CLOUD_LOCATION` | Cloud Run | `us-central1` |
| `GEMINI_MODEL` | Cloud Run | `gemini-2.5-flash` |
| `GEMMA_MODEL` | Cloud Run | `gemma-4-26b-a4b-it-maas` |
| `GEMMA_LOCATION` | Cloud Run | `global` |

## Deploy

| Target | How |
|---|---|
| Lab | Push `main` → Render auto-deploy. Blueprint: [`render.yaml`](./render.yaml) |
| Tutor | `cd server && gcloud run deploy versedai-agent --source . --project versedai-507218 --region us-central1 --allow-unauthenticated` |

## Repo

| Path | Role |
|---|---|
| `client/` | Next.js lab |
| `server/` | FastAPI + ADK tutor |
| `client/lib/content.ts` | Curriculum |
| `server/llm.py` | Gemini / Gemma router |
| `docs/versedai-architecture.png` | Diagram for Devpost |
