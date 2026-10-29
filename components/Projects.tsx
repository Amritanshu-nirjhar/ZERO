"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { BarChart3, Code2, LineChart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Heading from "./Heading";
import Note from "./Note";
import useReducedMotionSafe from "./useReducedMotionSafe";

const PROJECTS = [
  {
    label: "SOFTWARE ENGINEER",
    icon: Code2,
    description:
      "Build an AI rewrite prototype in Gmail that helps users finish long email drafts.",
    tools: ["Cursor", "NextJs", "Vercel", "Supabase", "Gemini"],
  },
  {
    label: "BUSINESS ANALYST",
    icon: BarChart3,
    description:
      "Identify why ChatGPT users aren't upgrading and propose a solution to improve conversion.",
    tools: ["Codex", "Canva", "Google Sheets"],
  },
  {
    label: "DATA SCIENTIST",
    icon: LineChart,
    description:
      "Build a demand forecasting model that predicts weekly sales for the Nike Zoom launch.",
    tools: ["Pandas", "Jupyter Notebook", "Python"],
  },
];

type Project = (typeof PROJECTS)[number];
const LAST = PROJECTS.length - 1;
const DOTS = ["#7c6cf2", "#25b4c9", "#2fb36b", "#f2a33a", "#e5534b"];
const RADIUS = 560; // px radius of the curved track the cards ride on
const STEP = 0.78; // radians between neighbouring cards
const ease = [0.16, 1, 0.3, 1] as const;

function CardBody({ project, active }: { project: Project; active: boolean }) {
  const Icon = project.icon;
  return (
    <article
      className={`flex aspect-[4/5] w-[min(380px,78vw)] flex-col items-center justify-between rounded-[28px] bg-white p-8 text-center transition-shadow duration-500 ${
        active
          ? "shadow-[0_0_0_2px_rgba(47,158,79,0.55),0_40px_90px_-20px_rgba(20,60,35,0.6)]"
          : "shadow-[0_30px_70px_-25px_rgba(20,40,30,0.5)]"
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        <motion.span
          animate={{ rotate: active ? 0 : -90, scale: active ? 1 : 0.8 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className={`grid h-11 w-11 place-items-center rounded-full transition-colors duration-500 ${
            active ? "bg-[--green] text-white" : "bg-[#f1f0ec]"
          }`}
        >
          <Icon aria-hidden="true" className="h-4 w-4" />
        </motion.span>
        <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-[--muted]">
          {project.label}
        </h3>
      </div>
      <p className="text-xl font-medium leading-snug tracking-[-0.01em] md:text-2xl">
        {project.description}
      </p>
      <ul className="flex flex-wrap justify-center gap-2">
        {project.tools.map((tool, j) => (
          <motion.li
            key={tool}
            animate={
              active
                ? { y: 0, opacity: 1, scale: 1 }
                : { y: 10, opacity: 0.5, scale: 0.92 }
            }
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 18,
              delay: active ? 0.15 + j * 0.06 : 0,
            }}
            className="flex items-center gap-1.5 rounded-full bg-[#f3f2ee] px-3 py-1.5 text-xs font-medium"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: DOTS[j % DOTS.length] }}
            />
            {tool}
          </motion.li>
        ))}
      </ul>
    </article>
  );
}

// A card riding the curved 3D track. `d` is its distance from the front slot (0 = facing you).
function TrackCard({
  project,
  i,
  pos,
  enter,
  active,
}: {
  project: Project;
  i: number;
  pos: MotionValue<number>;
  enter: MotionValue<number>;
  active: boolean;
}) {
  const d = useTransform(pos, (v) => i - v);
  const x = useTransform(d, (v) => Math.sin(v * STEP) * RADIUS);
  const z = useTransform(d, (v) => (Math.cos(v * STEP) - 1) * RADIUS);
  const rotateY = useTransform(d, (v) => (-v * STEP * 180) / Math.PI);
  // Dealt in from below, one after another, as the section pins.
  const y = useTransform(
    [d, enter],
    ([v, e]: number[]) => Math.abs(v) * 30 + (1 - e) * (520 + i * 160),
  );
  const rotateX = useTransform(enter, (e) => (1 - e) * 35);
  const opacity = useTransform(
    d,
    (v) => 1 - Math.max(0, Math.abs(v) - 1.2) * 0.8,
  );
  // Side cards stay solid but sink into shade and soft focus.
  const filter = useTransform(d, (v) => {
    const a = Math.min(Math.abs(v), 1.5);
    return `brightness(${1 - a * 0.28}) blur(${Math.max(0, a - 0.35) * 2}px)`;
  });
  const zIndex = useTransform(d, (v) => 10 - Math.round(Math.abs(v) * 2));

  return (
    <motion.div
      style={{ x, y, z, rotateY, rotateX, opacity, filter, zIndex }}
      className="absolute"
    >
      <CardBody project={project} active={active} />
    </motion.div>
  );
}

export default function Projects() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 20,
    mass: 0.5,
  });

  // 0–0.15: deal the cards in · 0.2–0.9: rotate through them · then hold on the last one.
  const enter = useTransform(p, [0, 0.15], [0, 1]);
  const pos = useTransform(p, [0.2, 0.9], [0, LAST]);
  const [active, setActive] = useState(0);
  useMotionValueEvent(pos, "change", (v) => setActive(Math.round(v)));
  // Card transforms depend on live scroll, so render them client-side only (avoids hydration mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const bgX = useTransform(p, [0, 1], ["4%", "-4%"]);
  const bgScale = useTransform(p, [0, 0.2, 1], [1.3, 1.15, 1.12]);
  const bar = useTransform(p, [0.2, 0.9], [0, 1]);

  return (
    <section>
      <div className="relative mx-auto max-w-3xl px-5 pb-20 pt-10 text-center md:pb-28">
        <Heading
          text="Build projects in immersive real-world"
          swash="Scenarios"
          className="font-serif text-5xl leading-[1.02] tracking-[-0.03em] md:text-7xl"
        />
        <Note
          className="absolute -left-36 top-20 hidden md:flex"
          arrow="below"
          rotate={14}
        >
          all in one app
        </Note>
        <Note
          className="absolute -right-40 -top-2 hidden md:flex"
          arrow="below"
          rotate={6}
          flip
        >
          no textbooks
        </Note>
      </div>

      {reduce ? (
        <div className="relative mx-4 flex flex-wrap justify-center gap-6 overflow-hidden rounded-[32px] p-10 md:mx-10">
          <Image
            src="/images/campus.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          {PROJECTS.map((project) => (
            <div key={project.label} className="relative">
              <CardBody project={project} active />
            </div>
          ))}
        </div>
      ) : (
        <div ref={ref} className="relative h-[400vh]">
          <div className="sticky top-0 flex h-screen items-center justify-center p-4 md:p-8">
            <div className="relative h-full w-full overflow-hidden rounded-[32px] bg-[#cfd8cf]">
              <motion.div
                style={{ x: bgX, scale: bgScale }}
                className="absolute inset-0"
              >
                <Image
                  src="/images/campus.jpg"
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-white/10" />

              {/* Active role, huge and outlined, behind the cards */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-[3%] flex justify-center overflow-hidden"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={active}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    exit={{ y: "-100%", opacity: 0 }}
                    transition={{ duration: 0.7, ease }}
                    className="whitespace-nowrap font-serif text-[11vw] italic leading-none tracking-[-0.04em] text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.85)]"
                  >
                    {PROJECTS[active].label.toLowerCase()}
                  </motion.span>
                </AnimatePresence>
              </div>

              <div className="absolute inset-0 flex items-center justify-center [perspective:1100px] [transform-style:preserve-3d]">
                {mounted &&
                  PROJECTS.map((project, i) => (
                    <TrackCard
                      key={project.label}
                      project={project}
                      i={i}
                      pos={pos}
                      enter={enter}
                      active={active === i}
                    />
                  ))}
              </div>

              {/* Counter + progress */}
              <div className="absolute bottom-6 left-6 flex items-center gap-4 text-white md:bottom-8 md:left-10">
                <span className="font-mono text-sm tabular-nums">
                  0{active + 1}{" "}
                  <span className="opacity-60">/ 0{PROJECTS.length}</span>
                </span>
                <span className="h-px w-24 bg-white/30 md:w-40">
                  <motion.span
                    style={{ scaleX: bar }}
                    className="block h-full origin-left bg-white"
                  />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
