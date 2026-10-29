"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import Heading from "./Heading";
import Magnetic from "./Magnetic";
import Note from "./Note";
import Reveal from "./Reveal";
import useReducedMotionSafe from "./useReducedMotionSafe";

export default function BetaCTA() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start start"],
  });
  const p = useSpring(scrollYProgress, { stiffness: 80, damping: 22 });
  // The dark grid opens up from a rounded card to full-bleed as it reaches the top of the screen.
  const clipPath = useTransform(
    p,
    [0, 1],
    ["inset(8% 7% 0% 7% round 64px)", "inset(0% 0% 0% 0% round 0px)"],
  );
  const gridY = useTransform(p, [0, 1], ["-30px", "0px"]);

  return (
    <motion.section
      ref={ref}
      id="beta"
      style={reduce ? undefined : { clipPath, backgroundPositionY: gridY }}
      className="grid-paper relative flex min-h-screen flex-col text-white"
    >
      <div className="relative flex flex-1 flex-col items-center justify-center px-5 py-24 text-center">
        <Heading
          text="Join our"
          swash="Beta"
          swashClass="text-[--mint]"
          className="font-serif text-6xl tracking-[-0.035em] md:text-8xl"
        />
        <Note
          className="absolute left-[8%] top-[56%] hidden !text-[#8fb39a] md:flex"
          rotate={8}
        >
          {"We want you to\nget hired"}
        </Note>
        <Note
          className="absolute right-[8%] top-[50%] hidden !text-[#8fb39a] md:flex"
          rotate={-10}
          flip
        >
          You win, we win
        </Note>

        <Reveal delay={0.15} className="mt-12 w-full max-w-md">
          <Magnetic className="block" strength={0.15}>
            <a
              href="mailto:team@zero.university"
              className="group flex items-center justify-between rounded-full bg-white p-1.5 pl-6 text-[--ink] shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
            >
              <span className="text-[15px] text-[--muted] transition-colors group-hover:text-[--green]">
                team@zero.university
              </span>
              <span className="rounded-full bg-[--ink] px-5 py-3 text-sm font-medium text-white transition-colors group-hover:bg-[--green]">
                Join Beta
              </span>
            </a>
          </Magnetic>
        </Reveal>
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.15em] text-[#a9c4b0]">
          beta phase 2, opening soon.
        </p>
      </div>

      <footer className="flex items-center justify-between px-5 pb-28 pt-6 text-sm md:px-10 md:pb-8">
        <a
          href="mailto:team@zero.university"
          className="rounded-full bg-white/10 px-4 py-2 transition-colors hover:bg-white/20"
        >
          team@zero.university
        </a>
        <span className="flex flex-col items-end gap-1 text-right">
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#a9c4b0]">
            © 2025 Zero
          </span>
          <span className="text-sm text-white">By Amritanshu</span>
          <span className="text-[11px] text-[#a9c4b0]/70">
            Music:{" "}
            <a
              href="https://pixabay.com/music/phonk-aggressive-phonk-drift-beat-582774/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-white"
            >
              “Aggressive Phonk Drift Beat” vaitsez
            </a>{" "}
            ·{" "}
            <a
              href="https://pixabay.com/service/license-summary/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-white"
            >
              Pixabay License
            </a>
          </span>
        </span>
      </footer>
    </motion.section>
  );
}
