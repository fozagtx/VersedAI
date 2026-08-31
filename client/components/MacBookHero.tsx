"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AVATARS, AvatarGlyph } from "@/lib/avatars";
import { Check } from "lucide-react";

const STEPS = [
  { n: "01", title: "Who you are", body: "Learner type and a name. Then you are in." },
  { n: "02", title: "A path", body: "Graphic design, writing, foundations, or agents." },
  { n: "03", title: "The badge", body: "Finish the path. The badge stays yours." },
] as const;

const PATHS = [
  { kicker: "01", name: "AI Foundations", badge: "Foundations" },
  { kicker: "02", name: "AI Writing", badge: "Writer" },
  { kicker: "03", name: "AI Graphic Design", badge: "Designer", active: true },
  { kicker: "04", name: "AI Agents", badge: "Builder" },
];

export default function MacBookHero() {
  const reduce = useReducedMotion();
  const [scene, setScene] = useState(0);
  const [typed, setTyped] = useState(reduce ? "Maya" : "");

  useEffect(() => {
    if (reduce) {
      setTyped("Maya");
      return;
    }
    const id = window.setInterval(() => {
      setScene((s) => (s + 1) % 3);
    }, 4200);
    return () => window.clearInterval(id);
  }, [reduce]);

  useEffect(() => {
    if (reduce || scene !== 0) return;
    const name = "Maya";
    setTyped("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(name.slice(0, i));
      if (i >= name.length) window.clearInterval(id);
    }, 90);
    return () => window.clearInterval(id);
  }, [scene, reduce]);

  return (
    <div className="flex flex-col gap-6">
      <div className="macbook" aria-hidden="true">
        <div className="macbook-stage">
        <div className="macbook-lid">
          <div className="macbook-bezel">
            <div className="macbook-notch" />
            <div className="macbook-screen">
              <div className="macbook-menubar">
                <span className="macbook-dot" />
                <span className="macbook-dot" />
                <span className="macbook-dot" />
                <span className="macbook-wordmark">VersedAI</span>
              </div>
              <div className="macbook-body">
                <AnimatePresence mode="wait">
                  {scene === 0 && (
                    <motion.div
                      key="who"
                      className="macbook-scene"
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.28 }}
                    >
                      <p className="macbook-kicker">Step 1 of 3</p>
                      <p className="macbook-title">What kind of learner are you?</p>
                      <div className="macbook-avatars">
                        {AVATARS.slice(0, 4).map((a, i) => (
                          <div
                            key={a.type}
                            className={`macbook-chip ${i === 0 ? "is-on" : ""}`}
                          >
                            <AvatarGlyph type={a.type} size={12} />
                            <span>{a.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="macbook-field">
                        {typed}
                        <span className="macbook-caret" />
                      </div>
                    </motion.div>
                  )}
                  {scene === 1 && (
                    <motion.div
                      key="path"
                      className="macbook-scene"
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.28 }}
                    >
                      <p className="macbook-kicker">Step 2 of 3</p>
                      <p className="macbook-title">Pick your path</p>
                      <div className="macbook-paths">
                        {PATHS.map((p) => (
                          <div
                            key={p.name}
                            className={`macbook-path ${p.active ? "is-on" : ""}`}
                          >
                            <span className="macbook-kicker">{p.kicker}</span>
                            <span className="macbook-path-name">{p.name}</span>
                            {p.active && <Check size={11} />}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {scene === 2 && (
                    <motion.div
                      key="badge"
                      className="macbook-scene macbook-scene-badge"
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.28 }}
                    >
                      <p className="macbook-kicker">Step 3 of 3</p>
                      <p className="macbook-title">The badge is yours.</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/badges/badge-designer.png"
                        alt=""
                        width={72}
                        height={72}
                        className="macbook-badge"
                      />
                      <p className="macbook-badge-label">Designer</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
        <div className="macbook-hinge" />
        <div className="macbook-base">
          <div className="macbook-keys">
            {Array.from({ length: 52 }).map((_, i) => (
              <span key={i} className="macbook-key" />
            ))}
          </div>
          <div className="macbook-pad" />
        </div>
        </div>
      </div>

      <ol className="flex flex-col gap-3 pl-1" aria-label="How it works">
        {STEPS.map((step, i) => (
          <li key={step.n} className="flex gap-4">
            <span
              className="kicker w-8 flex-shrink-0 pt-1"
              style={{ color: scene === i ? "var(--primary)" : undefined }}
            >
              {step.n}
            </span>
            <div>
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                {step.title}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
