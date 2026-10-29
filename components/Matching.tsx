"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { CalendarDays, Clock, Play } from "lucide-react";
import Image from "next/image";
import { useRef, type ReactNode } from "react";
import Note from "./Note";
import Heading from "./Heading";
import useReducedMotionSafe from "./useReducedMotionSafe";

function Row({
  title,
  swash,
  note,
  focus,
  children,
}: {
  title: string;
  swash: string;
  note: string;
  focus: string;
  children: (
    depth: (d: number) => ReturnType<typeof useTransform<number, number>>,
  ) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const p = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 18,
    mass: 0.6,
  });
  const y0 = useTransform(p, [0, 1], [0, 0]);
  const y1 = useTransform(p, [0, 1], [90, -90]);
  const y2 = useTransform(p, [0, 1], [200, -200]);
  const imgScale = useTransform(p, [0, 0.5, 1], [1.3, 1.05, 1]);
  const panelRotate = useTransform(p, [0, 0.5, 1], [4, 0, -2]);
  const depth = (d: number) => (reduce ? y0 : d > 1 ? y2 : y1);

  return (
    <div
      ref={ref}
      className="grid min-h-screen items-center gap-10 py-16 md:grid-cols-[2fr_3fr]"
    >
      <div className="relative px-5 text-center md:px-10">
        <Heading
          text={title}
          swash={swash}
          className="font-serif text-5xl leading-[1.02] tracking-[-0.03em] md:text-6xl"
        />
        <Note className="mt-10 md:ml-auto md:mr-16 md:w-fit" rotate={-8}>
          {note}
        </Note>
      </div>
      <motion.div
        style={reduce ? undefined : { rotate: panelRotate }}
        className="relative mx-4 h-[80vh] overflow-hidden rounded-[32px] md:mx-0 md:mr-8"
      >
        <motion.div
          style={reduce ? undefined : { scale: imgScale }}
          className="absolute inset-0"
        >
          <Image
            src="/images/meadow.jpg"
            alt=""
            fill
            sizes="60vw"
            className="object-cover"
            style={{ objectPosition: focus }}
          />
        </motion.div>
        {children(depth)}
      </motion.div>
    </div>
  );
}

const PORTFOLIO = [
  ["Built an AI rewrite prototype in Gmail", "Software Engineer"],
  ["Diagnosed a ChatGPT upgrade funnel", "Business Analyst"],
  ["Forecast weekly sales for a sneaker launch", "Data Scientist"],
  ["Shipped a feature flag service", "Full Stack Developer"],
];

const MATCHES = [
  ["Backend Engineer", 96],
  ["AI Applied Engineer", 91],
  ["Product Engineer", 84],
] as const;

const INVITES = [
  ["23", "Round 2", "Software Engineer", "4:30 pm"],
  ["17", "Round 3", "AI Engineer", "2:00 pm"],
  ["10", "Round 1", "Product Analyst", "11:00 am"],
];

export default function Matching() {
  return (
    <section className="py-16">
      <Row
        title="Build a portfolio to showcase your"
        swash="Abilities."
        note={"resumes are\ndead"}
        focus="50% 0%"
      >
        {(depth) => (
          <motion.ul
            style={{ y: depth(1) }}
            className="absolute inset-x-6 top-10 space-y-3 rounded-3xl bg-white/95 p-5 shadow-2xl md:inset-x-16 md:top-16"
          >
            {PORTFOLIO.map(([title, tag], i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 16,
                  delay: 0.2 + i * 0.1,
                }}
                className="flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-[#f4f3ef]"
              >
                <span className="grid h-14 w-20 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#d7e6d0] to-[#a9c79b]">
                  <Play
                    aria-hidden="true"
                    className="h-4 w-4 fill-white text-white"
                  />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-1 inline-block rounded-full bg-[#f1f0ec] px-2 py-0.5 text-[11px] text-[--muted]">
                    {tag}
                  </span>
                </span>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </Row>

      <Row
        title="We'll match you with the right"
        swash="Roles"
        note={"more matching,\nless searching"}
        focus="30% 60%"
      >
        {(depth) => (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
            {MATCHES.map(([role, score], i) => (
              <motion.div
                key={role}
                style={{
                  y: depth(i === 1 ? 2 : 1),
                  x: i === 1 ? 40 : i === 2 ? -30 : 0,
                }}
                initial={{ opacity: 0, scale: 0.85, rotate: i % 2 ? 4 : -4 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  type: "spring",
                  stiffness: 140,
                  damping: 14,
                  delay: 0.15 + i * 0.15,
                }}
                className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold">{role}</span>
                  <span className="font-mono text-xs text-[--green]">
                    {score}% match
                  </span>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-[#eeede8]">
                  <motion.div
                    className="h-full rounded-full bg-[--green]"
                    initial={{ width: "0%" }}
                    whileInView={{ width: `${score}%` }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{
                      duration: 1.4,
                      ease: [0.16, 1, 0.3, 1],
                      delay: 0.3 + i * 0.15,
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Row>

      <Row
        title="Schedule your"
        swash="Interviews"
        note="land the job"
        focus="70% 100%"
      >
        {(depth) => (
          <>
            {INVITES.map(([day, round, role, time], i) => (
              <motion.div
                key={day}
                style={{ y: depth(i === 1 ? 2 : 1) }}
                initial={{ opacity: 0, scale: 0.85, rotate: i % 2 ? 4 : -4 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  type: "spring",
                  stiffness: 140,
                  damping: 14,
                  delay: 0.15 + i * 0.15,
                }}
                className={`absolute w-[min(380px,80%)] rounded-2xl bg-white p-4 shadow-xl ${
                  [
                    "left-6 top-8 md:left-10",
                    "right-4 top-[38%] md:right-8",
                    "bottom-10 left-8 md:left-24",
                  ][i]
                }`}
              >
                <div className="flex gap-3">
                  <span className="grid h-14 w-14 shrink-0 place-content-center rounded-xl bg-[#f4f3ef] text-center leading-none">
                    <span className="text-[10px] text-[--muted]">Jun</span>
                    <span className="text-xl font-medium">{day}</span>
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      Interview Invite
                      <span className="rounded-md bg-[#efeaff] px-1.5 py-0.5 text-[10px] font-medium text-[#6b55d9]">
                        {round}
                      </span>
                    </p>
                    <p className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-[--muted]">
                      <span className="flex items-center gap-1">
                        <CalendarDays aria-hidden="true" className="h-3 w-3" />
                        {role}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock aria-hidden="true" className="h-3 w-3" />
                        {time}
                      </span>
                    </p>
                  </div>
                </div>
                {i === 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-medium">
                    <span className="rounded-full bg-[--ink] py-2 text-center text-white">
                      Accept
                    </span>
                    <span className="rounded-full border border-[--line] py-2 text-center">
                      Save for later
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </>
        )}
      </Row>
    </section>
  );
}
