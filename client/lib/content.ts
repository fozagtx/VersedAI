// All tracks, lessons, and content for VersedAI
// This is the single source of truth for the platform's curriculum.

export type LessonType = "read" | "image-studio" | "video-studio" | "agent-chat" | "context-lab" | "quiz";

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  xp: number;
  type: LessonType;
  interactive?: boolean;
  content: {
    // The 3-minute learn section
    principles: { heading: string; body: string }[];
    // The "watch" example
    example?: { label: string; prompt?: string; result?: string };
    // Challenge prompt for mastery check
    challenge?: string;
  };
}

export interface Track {
  id: string;
  slug: string;
  title: string;
  path: string;
  badge: string;
  badgeArt: string;
  kicker: string;
  level: "Beginner" | "Creator" | "Researcher" | "Builder" | "Operator";
  description: string;
  duration: string;
  lessonCount: number;
  totalXp: number;
  color: string; // accent for the card
  lessons: Lesson[];
}

export const tracks: Track[] = [
  {
    id: "what-is-ai",
    slug: "what-is-ai",
    title: "AI Foundations",
    path: "AI Foundations",
    badge: "Foundations",
    badgeArt: "/badges/badge-foundations.png",
    kicker: "01 / 04",
    level: "Beginner",
    description:
      "What AI is, what it cannot do, and how to judge it. The starting path.",
    duration: "35 min",
    lessonCount: 4,
    totalXp: 400,
    color: "#6E54FF",
    lessons: [
      {
        id: "ai-today",
        title: "AI Today",
        description: "What AI looks like right now and why it matters to you.",
        duration: "7 min",
        xp: 100,
        type: "read",
        content: {
          principles: [
            {
              heading: "AI is a tool that predicts",
              body: "At its core, AI predicts what comes next based on patterns it learned from enormous amounts of human-generated text, images, and data. It does not think or understand. It predicts. Understanding this changes how you use it.",
            },
            {
              heading: "It is already everywhere",
              body: "Every time you search, get a recommendation, use autocomplete, or see a social media feed. AI is involved. Learning to use it intentionally gives you a superpower most people do not have.",
            },
            {
              heading: "The gap between users is growing fast",
              body: "Some people use AI to do the work of ten. Others barely use it at all. The difference is not intelligence. It is knowing how to interact with it.",
            },
          ],
          challenge: "In 2 sentences, explain to a friend what AI is and one way it already affects their life.",
        },
      },
      {
        id: "how-ai-thinks",
        title: "How AI Thinks",
        description: "How language models actually work. No maths, just intuition.",
        duration: "8 min",
        xp: 100,
        type: "read",
        content: {
          principles: [
            {
              heading: "It learned from everything humans wrote",
              body: "A language model trained on billions of documents developed an internal model of human language and knowledge. Ask it anything and it generates a response that fits the pattern of what a human expert might say.",
            },
            {
              heading: "It does not have memory by default",
              body: "Each new conversation starts fresh. The AI has no idea who you are or what you discussed yesterday unless you tell it. This is why context is everything.",
            },
            {
              heading: "Confidence ≠ correctness",
              body: "AI can state wrong information with complete confidence. It generates the most plausible-sounding response, not the most accurate one. Your job is to evaluate, not just accept.",
            },
          ],
          challenge: "Ask an AI a question you already know the answer to. Did it get it right? Did it sound confident either way?",
        },
      },
      {
        id: "good-and-bad",
        title: "What AI Is Good (and Bad) At",
        description: "Build real judgment about when to use AI and when not to.",
        duration: "8 min",
        xp: 100,
        type: "read",
        content: {
          principles: [
            {
              heading: "AI is exceptional at: language, pattern, synthesis",
              body: "Writing, summarising, explaining, translating, brainstorming, structuring information, generating ideas, coding drafts, image creation. These are AI's strong zones.",
            },
            {
              heading: "AI struggles with: facts, numbers, recent events",
              body: "Precise calculations, real-time information, very recent events, and anything requiring verified facts. These require you to check. AI can be confidently wrong.",
            },
            {
              heading: "The question to always ask",
              body: "Before using AI for anything, ask: 'Does this task require creativity and synthesis, or does it require verified accuracy?' The answer tells you how much to trust the output.",
            },
          ],
          example: {
            label: "Good vs bad use",
            prompt: "Use AI to write a first draft of an essay (great). Use AI to tell you the exact population of a city today (verify it).",
          },
          challenge: "List 3 things you did today that AI could help with. Then list 1 thing where you should NOT trust AI's output without checking.",
        },
      },
      {
        id: "verify",
        title: "Never Trust Blindly",
        description: "How to evaluate, fact-check, and critically assess AI outputs.",
        duration: "7 min",
        xp: 100,
        type: "read",
        content: {
          principles: [
            {
              heading: "Treat AI output as a first draft",
              body: "AI gives you a starting point, not a finished product. Your critical eye is the quality filter. Read it, question it, check the facts that matter.",
            },
            {
              heading: "The 3-question check",
              body: "Before using any AI output, ask: (1) Is this factually verifiable? (2) Does this make logical sense? (3) Would an expert agree with this? If any answer is uncertain, check.",
            },
            {
              heading: "Cross-reference what matters",
              body: "For anything important (health, legal, historical facts, statistics), use AI to find the topic, then verify the specific claims from real sources.",
            },
          ],
          challenge: "Ask AI to explain a topic you know well. Find at least one thing it got subtly wrong or oversimplified.",
        },
      },
    ],
  },
  {
    id: "prompting",
    slug: "prompting",
    title: "AI Writing",
    path: "AI Writing",
    badge: "Writer",
    badgeArt: "/badges/badge-writer.png",
    kicker: "02 / 04",
    level: "Beginner",
    description:
      "Give AI the goal, context, and constraints. Write and research like you mean it.",
    duration: "45 min",
    lessonCount: 4,
    totalXp: 400,
    color: "#6E54FF",
    lessons: [
      {
        id: "context-intro",
        title: "Instructions vs Context",
        description: "The two buckets that determine almost everything about AI output quality.",
        duration: "5 min",
        xp: 100,
        type: "read",
        content: {
          principles: [
            {
              heading: "There are two types of input",
              body: "Instructions tell the AI what to do. Context tells the AI what it needs to know. Most people give AI instructions with no context. This is why most AI outputs feel generic.",
            },
            {
              heading: "Context is your secret weapon",
              body: "The more relevant information you give AI about you, your goal, your audience, and your constraints, the more useful and specific the output becomes. Context is not extra. It is the main thing.",
            },
            {
              heading: "Think before you prompt",
              body: "Ask yourself: What is my actual goal? What does the AI need to know about my situation? What should the output look and feel like? What should it NOT do? Answering these before you prompt will dramatically improve your results.",
            },
          ],
        },
      },
      {
        id: "three-attempts",
        title: "The Three-Attempt Method",
        description: "Experience the difference context makes, live, in real time.",
        duration: "10 min",
        xp: 100,
        type: "context-lab",
        interactive: true,
        content: {
          principles: [
            {
              heading: "Attempt 1: Vague request",
              body: "Write me an essay about climate change.",
            },
            {
              heading: "Attempt 2: Better instructions",
              body: "Write a 500-word essay about climate change for a high school science class.",
            },
            {
              heading: "Attempt 3: Instructions + context + constraints",
              body: "Write a 500-word essay about the effects of climate change on ocean ecosystems for a Year 10 science class. Use simple language, include one real statistic, and end with a question for discussion. Do not use bullet points.",
            },
          ],
          challenge: "Now write your own Attempt 3 for a topic you care about. What context did you add?",
        },
      },
      {
        id: "constraints",
        title: "Goals, Context, Constraints",
        description: "Structure your requests for dramatically better results every time.",
        duration: "8 min",
        xp: 100,
        type: "read",
        content: {
          principles: [
            {
              heading: "Goal: What do you actually want?",
              body: "Be specific. Not 'help me with my essay' but 'write a compelling opening paragraph that hooks the reader with a surprising fact.' The clearer the goal, the better the output.",
            },
            {
              heading: "Context: What does AI need to know?",
              body: "Who are you? What is this for? Who will read it? What tone should it take? What have you already tried? The more real context you give, the more tailored the response.",
            },
            {
              heading: "Constraints: What should it NOT do?",
              body: "Constraints are just as powerful as instructions. 'Do not use jargon.' 'Keep it under 200 words.' 'Do not suggest I hire someone.' These boundaries force AI to work within your actual needs.",
            },
          ],
          challenge: "Take one thing you have asked AI before. Rewrite the request using Goal + Context + Constraints. Compare the outputs.",
        },
      },
      {
        id: "iteration",
        title: "Iterate Until Right",
        description: "The real AI skill is not the first prompt. It is knowing what to change next.",
        duration: "10 min",
        xp: 100,
        type: "read",
        content: {
          principles: [
            {
              heading: "First output is a starting point",
              body: "Expecting AI to nail it on the first try is like expecting a first draft of an essay to be perfect. It is the beginning of the process, not the end.",
            },
            {
              heading: "Diagnose before you adjust",
              body: "When the output is not right, ask: Is it too long/short? Wrong tone? Missing information? Wrong format? Wrong perspective? Identify the specific problem before writing your follow-up prompt.",
            },
            {
              heading: "Compound your improvements",
              body: "Each iteration narrows the gap. Version 1 is rough. Version 2 is better. Version 3 is often very good. Professional AI users always expect 3-5 iterations before they have what they need.",
            },
          ],
          challenge: "Ask AI to help you with something real right now. Deliberately go through 3 iterations. Notice what changed each time.",
        },
      },
    ],
  },
  {
    id: "image-gen",
    slug: "image-gen",
    title: "AI Graphic Design",
    path: "AI Graphic Design",
    badge: "Designer",
    badgeArt: "/badges/badge-designer.png",
    kicker: "03 / 04",
    level: "Creator",
    description:
      "Prompt, iterate, and ship images. Then turn a raw concept into an 8-second Veo clip.",
    duration: "70 min",
    lessonCount: 5,
    totalXp: 650,
    color: "#6E54FF",
    lessons: [
      {
        id: "image-basics",
        title: "How Image AI Works",
        description: "The 3 principles that separate great AI images from generic ones.",
        duration: "5 min",
        xp: 75,
        type: "read",
        content: {
          principles: [
            {
              heading: "Specificity beats vagueness every time",
              body: "'A dog' creates a generic dog. 'A golden retriever puppy sitting in autumn leaves, warm afternoon light, shallow depth of field, photorealistic' creates something remarkable. Specificity is your prompt superpower.",
            },
            {
              heading: "Style and mood are instructions too",
              body: "Describe how it should feel: cinematic, minimalist, whimsical, dramatic, watercolour, 8-bit pixel art, studio photography. These words change everything about the output.",
            },
            {
              heading: "Iteration is the skill",
              body: "The best AI image creators do not write one perfect prompt. They generate → inspect → identify what is off → change one element → regenerate. Version 3 is always better than Version 1.",
            },
          ],
          example: {
            label: "Prompt evolution",
            prompt: "V1: 'a city at night' → V2: 'a neon-lit city street at night, rain reflecting lights' → V3: 'a rainy Tokyo street at night, neon signs reflecting in puddles, cinematic, moody, Blade Runner aesthetic'",
          },
        },
      },
      {
        id: "your-first-image",
        title: "Create Your First Image",
        description: "Open the studio. Prompt. Generate. Inspect. Improve.",
        duration: "15 min",
        xp: 150,
        type: "image-studio",
        interactive: true,
        content: {
          principles: [
            {
              heading: "Your mission",
              body: "Create an image of something that interests you. Then improve it at least 2 times based on what you see. The tutor will coach you through it.",
            },
            {
              heading: "Start simple, add detail",
              body: "Begin with the subject. Then add environment. Then add style and mood. Then add lighting or camera direction. Build up the prompt layer by layer.",
            },
            {
              heading: "What to look for",
              body: "After each generation, ask: What did AI interpret correctly? What feels off? What is missing? What would make this better? Then adjust exactly that one thing.",
            },
          ],
          challenge: "Create 3 versions of the same subject. Each version should be noticeably better than the last.",
        },
      },
      {
        id: "style-and-mood",
        title: "Style, Mood, and Detail",
        description: "The exact words that transform a generic image into something remarkable.",
        duration: "10 min",
        xp: 125,
        type: "read",
        content: {
          principles: [
            {
              heading: "Style keywords that work",
              body: "cinematic · photorealistic · watercolour · oil painting · 8-bit pixel art · Studio Ghibli · minimalist · editorial photography · concept art · isometric · flat design · neon noir",
            },
            {
              heading: "Lighting changes everything",
              body: "golden hour · dramatic shadows · soft diffused light · neon glow · candlelight · blue hour · studio lighting · backlit · silhouette. Adding one lighting word can completely transform an image.",
            },
            {
              heading: "Composition and camera",
              body: "close-up portrait · wide establishing shot · overhead bird's-eye view · low angle looking up · shallow depth of field · macro · fisheye · symmetrical · rule of thirds",
            },
          ],
          challenge: "Take your best image from the previous lesson. Add 3 new style/mood/lighting words. How does it change?",
        },
      },
      {
        id: "concept-to-clip",
        title: "Concept to clip",
        description: "Type a raw idea. Veo 3 turns it into an 8-second video you can watch and keep.",
        duration: "15 min",
        xp: 150,
        type: "video-studio",
        interactive: true,
        content: {
          principles: [
            {
              heading: "Dump the idea, not a finished prompt",
              body: "Write the concept the way you would say it to a friend. Gemini turns that into a Veo 3 shot: camera, subject, motion, light. You learn by reading the shot it wrote.",
            },
            {
              heading: "One idea, eight seconds",
              body: "Video is for digestion. A clip should carry a single thought you can replay. If the idea is big, split it and make two clips.",
            },
            {
              heading: "Keep the file",
              body: "Every clip is saved on this device in Studio. Download it if you need it elsewhere. Refreshing the page does not throw it away.",
            },
          ],
          challenge: "Turn one concept from a class you are in into a clip. Save it. Watch it once without sound, then once with sound. What did the picture teach that the text did not?",
        },
      },
      {
        id: "image-challenge",
        title: "The Image Challenge",
        description: "Create a specific image from a brief, without any hints.",
        duration: "20 min",
        xp: 150,
        type: "image-studio",
        interactive: true,
        content: {
          principles: [
            {
              heading: "Your challenge brief",
              body: "Create an image that could be the cover of a science fiction novel set 200 years in the future. It should feel hopeful, not dystopian. No text. Cinematic quality.",
            },
            {
              heading: "You will be evaluated on",
              body: "Did you iterate at least 3 times? Did each version improve on the last? Does the final image match the brief? Can you explain what you changed and why?",
            },
            {
              heading: "This is a mastery check",
              body: "No hints from the tutor this time. Use everything you have learned. After you submit, the tutor will review your prompt history and give detailed feedback.",
            },
          ],
          challenge: "Complete the science fiction cover challenge. Document your iteration process in the notes panel.",
        },
      },
    ],
  },
  {
    id: "ai-agents",
    slug: "ai-agents",
    title: "AI Agents",
    path: "AI Agents",
    badge: "Builder",
    badgeArt: "/badges/badge-builder.png",
    kicker: "04 / 04",
    level: "Operator",
    description:
      "Hand a goal to an agent. Tools, memory, and multi-step work.",
    duration: "60 min",
    lessonCount: 4,
    totalXp: 500,
    color: "#6E54FF",
    lessons: [
      {
        id: "what-is-agent",
        title: "What is an AI Agent?",
        description: "An agent takes a goal, makes a plan, and carries it out, step by step.",
        duration: "7 min",
        xp: 100,
        type: "read",
        content: {
          principles: [
            {
              heading: "An agent is AI that acts, not just responds",
              body: "Regular AI answers questions. An agent takes a goal, breaks it into steps, uses tools to complete each step, evaluates results, and adjusts. It does not stop at the first response.",
            },
            {
              heading: "Tools give agents real-world capability",
              body: "An agent with a web search tool can find real-time information. With a code tool, it can write and run programs. With a calendar tool, it can schedule. Tools are what make agents genuinely useful.",
            },
            {
              heading: "You are the director",
              body: "Your job is to give the agent a clear goal, relevant context, and the right tools. The agent figures out the steps. You evaluate the result and redirect if needed.",
            },
          ],
          example: {
            label: "Agent vs. regular AI",
            prompt: "Regular AI: 'Summarise this topic' → gives you text. Agent: 'Research this topic, find 3 recent sources, summarise the key findings, and identify what is still uncertain' → searches, reads, synthesises, reports back.",
          },
        },
      },
      {
        id: "tools-memory",
        title: "Tools and Memory",
        description: "How agents use tools to take real action, and how they remember.",
        duration: "8 min",
        xp: 100,
        type: "read",
        content: {
          principles: [
            {
              heading: "Tools extend what agents can do",
              body: "On its own, AI can only generate text. Give it a search tool and it can look things up. Give it a code tool and it can build things. Give it an image tool and it can create visuals. The tools determine the agent's capabilities.",
            },
            {
              heading: "Memory lets agents track progress",
              body: "Agents can store information across steps: what they found, what worked, what they still need. This lets them handle tasks that take many steps without losing track.",
            },
            {
              heading: "A good agent knows when to stop and ask",
              body: "If an agent hits something ambiguous, it should ask rather than guess. A well-built agent surfaces uncertainty rather than hiding it with a confident but wrong answer.",
            },
          ],
        },
      },
      {
        id: "multi-agent",
        title: "Teams of Agents",
        description: "How specialised agents work together to solve problems no single agent could handle.",
        duration: "10 min",
        xp: 150,
        type: "read",
        content: {
          principles: [
            {
              heading: "One problem, multiple specialists",
              body: "Just like a project team has researchers, writers, and reviewers, a multi-agent system has specialised agents. A research agent finds information. A writing agent shapes it. A review agent checks it. Each does one thing well.",
            },
            {
              heading: "The orchestrator coordinates",
              body: "A lead agent (the orchestrator) breaks the goal into tasks and assigns them to the right specialist agents. It then collects results and synthesises the final output.",
            },
            {
              heading: "VersedAI runs on a multi-agent system",
              body: "Right now, VersedAI uses exactly this: a tutor agent that coaches you, a content agent that builds lessons, and a creative agent that handles image generation. You have been interacting with a multi-agent system this whole time.",
            },
          ],
        },
      },
      {
        id: "build-agent",
        title: "Talk to a Real Agent",
        description: "Interact with VersedAI's own agent, and watch it think through a problem.",
        duration: "20 min",
        xp: 150,
        type: "agent-chat",
        interactive: true,
        content: {
          principles: [
            {
              heading: "Your mission",
              body: "Give the VersedAI agent a real-world task that requires multiple steps. Watch it plan, use tools, and report back. Then redirect it and see how it adjusts.",
            },
            {
              heading: "Try one of these",
              body: "Research a topic and summarise findings. Explain a concept three different ways. Create a study plan for a subject you are learning. Generate and critique an image. Build a simple quiz.",
            },
            {
              heading: "Notice the difference",
              body: "Compare asking the agent vs asking regular AI the same question. What extra steps did the agent take? What tools did it use? How was the result different?",
            },
          ],
          challenge: "Give the agent a task with at least 3 steps. Evaluate whether it completed each step correctly. Redirect if needed.",
        },
      },
    ],
  },
];

export function getTrack(slug: string): Track | undefined {
  return tracks.find((t) => t.slug === slug);
}

export function getLesson(trackSlug: string, lessonId: string): Lesson | undefined {
  const track = getTrack(trackSlug);
  return track?.lessons.find((l) => l.id === lessonId);
}

export function getLessonIndex(trackSlug: string, lessonId: string): number {
  const track = getTrack(trackSlug);
  return track?.lessons.findIndex((l) => l.id === lessonId) ?? -1;
}
