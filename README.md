# VersedAI

Generative AI lab for online learners. Short lessons, then a real task. The ADK tutor coaches. It does not dump the answer. Type a concept, Veo 3 turns it into an 8-second clip. Images and clips stay on the device.

Built for **All Things Agentic**.

**[Open the live lab →](https://versedai.onrender.com)** · [Tutor health](https://versedai-agent-158479424670.us-central1.run.app/health) · [Devpost copy](./SUBMISSION.md) · [Demo script](./DEMO_SCRIPT.md)

## URLs

| What | URL |
|---|---|
| Lab | https://versedai.onrender.com |
| Tutor | https://versedai-agent-158479424670.us-central1.run.app |
| Tutor health | https://versedai-agent-158479424670.us-central1.run.app/health |
| Tutor | https://versedai.onrender.com/chat |
| Paths | https://versedai.onrender.com/tracks |
| Studio | https://versedai.onrender.com/studio |
| Concept to clip | https://versedai.onrender.com/tracks/image-gen/concept-to-clip |
| Repo | https://github.com/fozagtx/VersedAI |
| Architecture | [docs/versedai-architecture.png](./docs/versedai-architecture.png) |
| Render dashboard | https://dashboard.render.com/web/srv-daav33tg1s2s738g14kg |

## Stack

| Layer | What | Where |
|---|---|---|
| Lab | Next.js 15 | Render (`versedai`, `rootDir: client`) |
| Tutor | FastAPI + Google ADK | Cloud Run `us-central1` |
| Coach | Gemini 3.5 Flash | Vertex `global` |
| Drills | Gemma 4 `gemma-4-26b-a4b-it-maas` | Vertex `global` |
| Images | Gemini image | Vertex, via `/api/generate-image` |
| Video | Veo 3.1 `veo-3.1-fast-generate-001` | Vertex `us-central1`, via `/generate-video` |
| Progress | `localStorage` (`versedai_xp`) | Browser, no login |
| Studio files | IndexedDB (`versedai_studio`) | Browser. Survives refresh. Download anytime. |

The lab proxies `/api/chat` and image routes to Cloud Run. Video jobs call Cloud Run directly (`NEXT_PUBLIC_BACKEND_URL`) so Veo can take a minute. The browser never holds Vertex credentials.

## Paths

| Path | Badge | URL |
|---|---|---|
| AI Foundations | Foundations | https://versedai.onrender.com/tracks/what-is-ai |
| AI Writing | Writer | https://versedai.onrender.com/tracks/prompting |
| AI Graphic Design | Designer | https://versedai.onrender.com/tracks/image-gen |
| AI Agents | Builder | https://versedai.onrender.com/tracks/ai-agents |

Graphic Design now includes **Concept to clip**: dump a raw idea, Gemini writes the Veo shot, Veo 3 renders 8 seconds, the file lands in Studio.

## What we added

- **Hero MacBook.** The "Open 24/7" kicker is gone. The right side is an aluminum MacBook whose screen plays Who you are → A path → The badge.
- **Veo 3 concept-to-clip.** A student types a concept in plain language. Gemini expands it into camera language. Veo 3 returns an 8-second MP4. Lesson: `/tracks/image-gen/concept-to-clip`.
- **Studio that keeps files.** Images and videos save to IndexedDB on generate. `/studio` lists them. Download and delete work without an account. Refresh does not throw them away.

## Reproducible testing

No GCP project required. First call after idle can 502. Retry once. Veo can take 30–90 seconds.

| Check | Command | Pass |
|---|---|---|
| Health | `curl -sS https://versedai-agent-158479424670.us-central1.run.app/health` | JSON below |
| Gemma drill | `curl -sS -N -X POST https://versedai-agent-158479424670.us-central1.run.app/chat -H "Content-Type: application/json" -d '{"message":"What is an AI agent in two sentences?","mode":"auto"}'` | `event: meta` names Gemma, then tokens |
| Gemini coach | `curl -sS -N -X POST https://versedai-agent-158479424670.us-central1.run.app/chat -H "Content-Type: application/json" -d '{"message":"I am stuck on the image challenge. Smallest hint.","mode":"auto"}'` | `event: meta` names Gemini |
| Lab proxy | `curl -sS -N -X POST https://versedai.onrender.com/api/chat -H "Content-Type: application/json" -d '{"message":"What is an AI agent in two sentences?","mode":"auto"}'` | Same tutor, via Render |
| Router | `cd server && python3 -c "from llm import choose_family; assert choose_family('auto','hello')=='gemini'; assert choose_family('auto','Explain tokens')=='gemma'; assert choose_family('auto','I am stuck')=='gemini'; print('router ok')"` | `router ok` |

Health must include:

```json
{"status":"ok","model":"gemini-3.5-flash","gemma":"gemma-4-26b-a4b-it-maas","veo":"veo-3.1-fast-generate-001","platform":"VersedAI","runtime":"vertex"}
```

`veo` appears after the tutor is redeployed with `server/video_gen.py`. Older revisions omit that field until then.

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
| Point the lab at it | `BACKEND_URL=http://localhost:8000` and `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000` in `client/.env.local` |

Needs Vertex ADC **or** `GEMINI_API_KEY`. Coach is Gemini 3.5 Flash on Vertex `global`. Veo 3 needs Veo on the same project.

Judge spin-up, no GCP: clone, `cd client`, `npm install`, `cp .env.local.example .env.local`, `npm run dev`. `.env.local.example` already points at the live Cloud Run tutor. Open http://localhost:3000.

## Configuration

| Variable | Where | Value |
|---|---|---|
| `BACKEND_URL` | `client/.env.local`, Render | https://versedai-agent-158479424670.us-central1.run.app |
| `NEXT_PUBLIC_BACKEND_URL` | `client/.env.local`, Render | Same Cloud Run URL. Browser uses it for Veo so Render does not time out. |
| `GOOGLE_GENAI_USE_VERTEXAI` | Cloud Run | `true` |
| `GOOGLE_CLOUD_PROJECT` | Cloud Run | `versedai-507218` |
| `GOOGLE_CLOUD_LOCATION` | Cloud Run | `us-central1` |
| `GEMINI_MODEL` | Cloud Run | `gemini-3.5-flash` |
| `GEMINI_LOCATION` | Cloud Run | `global` |
| `GEMMA_MODEL` | Cloud Run | `gemma-4-26b-a4b-it-maas` |
| `GEMMA_LOCATION` | Cloud Run | `global` |
| `VEO_MODEL` | Cloud Run | `veo-3.1-fast-generate-001` |
| `VEO_LOCATION` | Cloud Run | `us-central1` |

## Deploy

| Target | How |
|---|---|
| Lab | Push `main` → Render auto-deploy. Blueprint: [`render.yaml`](./render.yaml) |
| Tutor | `cd server && gcloud run deploy versedai-agent --source . --project versedai-507218 --region us-central1 --allow-unauthenticated --timeout 300` |

Redeploy the tutor after this change. Video generation lives in `server/video_gen.py`. Until that revision is live, Concept to clip will error with a real Vertex message, not a fake clip.

## Repo

| Path | Role |
|---|---|
| `client/` | Next.js lab |
| `server/` | FastAPI + ADK tutor |
| `client/lib/content.ts` | Curriculum |
| `client/lib/studio-store.ts` | IndexedDB for images and videos |
| `client/components/MacBookHero.tsx` | Hero laptop |
| `client/components/VideoStudio.tsx` | Concept → Veo 3 |
| `server/llm.py` | Gemini / Gemma router |
| `server/video_gen.py` | Concept expand + Veo 3 |
| `docs/versedai-architecture.png` | Diagram for Devpost |
