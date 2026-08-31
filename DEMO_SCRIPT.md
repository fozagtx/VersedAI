# Demo video (~3 min, public YouTube or Vimeo)

Required. English or subtitled. Must show: the problem, the value, the agent working, and proof the backend is on Google Cloud. Upload early. Processing can take hours. Not private, not unlisted.

Record the **live** URLs, not localhost.

## Shot list

**0:00–0:25 Problem**
- School bans AI or drops a chatbot in a tab. Students copy. They never learn judgment.
- One line on camera or as a title card: "Most students already use AI. Almost none of them were taught how."

**0:25–0:45 Value**
- Open https://versedai.onrender.com
- Show the MacBook hero looping Who you are → a path → the badge
- One sentence: "A lab, not a lecture. Short lesson, real task, a tutor that hints."

**0:45–1:40 Agent actually working**
- Start free, pick a path, open a lesson
- Ask Versed in the right panel: "I am stuck. Smallest hint."
- Show the SSE meta chip: Gemini 3.5 Flash
- Show it does **not** dump the answer
- Then a drill: "Explain tokens" — Gemma 4 answers, Gemini nudges them to try

**1:40–2:20 Concept to clip + Studio**
- `/tracks/image-gen/concept-to-clip`
- Type `how tokens work` → Make the clip (or show a saved clip if Veo is slow)
- Open `/studio` — the file is still there after refresh

**2:20–2:50 Google Cloud proof (required)**
Pick one, on camera, no cropping it out:
- Browser tab: `https://versedai-agent-158479424670.us-central1.run.app/health` showing `"model":"gemini-3.5-flash"` and `"runtime":"vertex"`
- **or** Cloud Run dashboard for `versedai-agent` in `us-central1`
- **or** Vertex logs
Say out loud: "The tutor is a container on Cloud Run. Gemini 3.5 Flash and Gemma 4 run on Vertex."

**2:50–3:10 Close**
- Four paths. One badge each. No login.
- Repo: github.com/fozagtx/VersedAI

## Do not

- Record localhost
- Skip the `.run.app` health JSON or Cloud Console
- Let the tutor give a finished homework answer on camera
- Upload as unlisted
