"use client";

import Image from "next/image";
import {
  animate,
  motion,
  useMotionValueEvent,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRef, type PointerEvent } from "react";
import { emit, SFX } from "./audio";
import DeskFX from "./DeskFX";
import DeskLogos from "./DeskLogos";
import DeskScene, { LAND_PCT, MAT_CENTER, T } from "./DeskScene";
import useReady from "./useReady";
import Swash from "./Swash";
import useReducedMotionSafe from "./useReducedMotionSafe";

// The photo, 3D canvas and text share one box that "object-covers" the viewport,
// so overlays stay pinned to the same spot on the desk at any screen size.
const STAGE =
  "absolute left-1/2 top-1/2 aspect-[1376/768] w-[max(100vw,calc(100vh*1376/768))] -translate-x-1/2 -translate-y-1/2 [container-type:size]";

const SPRING = { stiffness: 80, damping: 20, mass: 0.5 };

// Hero scroll length (section height minus one screen), and the pause after the logos land.
const SCROLL_VH = 420;
const HOLD_VH = 70;
const HOLD_AT = 0.95;

// One line of text that slides out of (or into) a mask over a slice of the scroll.
function Line({
  p,
  inAt,
  outAt,
  children,
  className = "",
  introDelay,
  ready,
}: {
  p: MotionValue<number>;
  inAt?: number;
  outAt?: number;
  children: React.ReactNode;
  className?: string;
  // Extra one-off reveal on page load (seconds), used for the text printed on the sheet.
  introDelay?: number;
  ready?: boolean;
}) {
  const stops = [
    inAt ?? -1,
    (inAt ?? -1) + 0.07,
    outAt ?? 2,
    (outAt ?? 2) + 0.06,
  ];
  const y = useTransform(p, stops, [
    inAt === undefined ? "0%" : "130%",
    "0%",
    "0%",
    "-130%",
  ]);
  // Fade as well, so swashes and descenders that poke outside the mask never linger.
  const opacity = useTransform(p, stops, [inAt === undefined ? 1 : 0, 1, 1, 0]);
  return (
    <span className="block overflow-hidden pb-[0.1em]">
      <motion.span style={{ y, opacity }} className={`block ${className}`}>
        {introDelay === undefined ? (
          children
        ) : (
          <motion.span
            className="block"
            initial={{ y: "110%", opacity: 0, filter: "blur(6px)" }}
            animate={
              ready ? { y: "0%", opacity: 1, filter: "blur(0px)" } : undefined
            }
            transition={{
              duration: 0.9,
              ease: [0.16, 1, 0.3, 1],
              delay: introDelay,
            }}
          >
            {children}
          </motion.span>
        )}
      </motion.span>
    </span>
  );
}

// A letter of "we solved" that pops up from below, then scatters away.
function Letter({
  p,
  i,
  ch,
}: {
  p: MotionValue<number>;
  i: number;
  ch: string;
}) {
  // Letters slam in right as the ball hits the table, then scatter before the headline arrives.
  const a = T.throw[1] - 0.005 + i * 0.006;
  const y = useTransform(
    p,
    [a, a + 0.035, 0.68 + i * 0.005, 0.76],
    ["-140%", "0%", "0%", i % 2 ? "-160%" : "-90%"],
  );
  const rotate = useTransform(
    p,
    [a, a + 0.035, 0.68, 0.76],
    [i % 2 ? 30 : -30, 0, 0, i % 2 ? -25 : 25],
  );
  const scale = useTransform(p, [a, a + 0.035, a + 0.05], [1.6, 0.92, 1]);
  const opacity = useTransform(
    p,
    [a, a + 0.02, 0.7 + i * 0.005, 0.76],
    [0, 1, 1, 0],
  );
  return (
    <motion.span
      style={{ y, rotate, scale, opacity }}
      className="inline-block origin-bottom"
    >
      {ch}
    </motion.span>
  );
}

function Solved({ p }: { p: MotionValue<number> }) {
  let i = 0;
  const word = (w: string) =>
    w.split("").map((ch) => <Letter key={i} p={p} i={i++} ch={ch} />);
  // Hand-drawn underline draws in once the letters have landed, and leaves with them.
  const land = T.throw[1] + 0.05;
  const draw = useTransform(p, [land, land + 0.06], [0, 1]);
  const lineOpacity = useTransform(
    p,
    [land, land + 0.01, 0.7, 0.75],
    [0, 1, 1, 0],
  );
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex flex-col items-start justify-center pl-[6vw]"
    >
      <span className="ml-[1vw] -rotate-6 font-hand text-[min(11vw,15vh)] leading-none text-white [text-shadow:0_4px_18px_rgba(0,0,0,0.35)]">
        {word("we")}
      </span>
      <span className="relative -mt-[2vh] font-sans text-[min(24vw,34vh)] font-black italic leading-[0.85] tracking-[-0.065em] text-[--yellow] [text-shadow:0.012em_0.012em_0_#1a2e1c,0.024em_0.024em_0_#1a2e1c,0.036em_0.036em_0_#1a2e1c,0.05em_0.07em_0.12em_rgba(0,0,0,0.35)]">
        {word("solved")}
        <svg
          viewBox="0 0 600 60"
          preserveAspectRatio="none"
          className="absolute -bottom-[0.06em] left-[2%] h-[0.16em] w-[96%] overflow-visible"
        >
          <motion.path
            d="M6 40 C 120 14, 260 52, 380 26 S 560 18, 594 30"
            fill="none"
            stroke="var(--yellow)"
            strokeWidth="14"
            strokeLinecap="round"
            style={{ pathLength: draw, opacity: lineOpacity }}
            className="[filter:drop-shadow(4px_4px_0_#1a2e1c)]"
          />
        </svg>
      </span>
    </div>
  );
}

// Dust specks drifting through the sunbeam (upper right of the desk photo).
const MOTES = Array.from({ length: 28 }, (_, i) => ({
  left: 45 + ((i * 37) % 50),
  top: 5 + ((i * 53) % 55),
  size: 1.5 + ((i * 7) % 4) * 0.8,
  dur: 7 + ((i * 11) % 9),
  delay: -((i * 13) % 10),
}));

function Motes() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen"
    >
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-[#fff6dc] opacity-0 blur-[0.5px] [animation:mote_linear_infinite]"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: m.size,
            height: m.size,
            animationDuration: `${m.dur}s`,
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = !!useReducedMotionSafe();
  const ready = useReady();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  // A stretch of scroll where the timeline holds still once the logos have landed, so they get a beat
  // on screen before the scene moves on. The section is HOLD_VH taller to make room for it.
  const holdStart = (HOLD_AT * SCROLL_VH) / (SCROLL_VH + HOLD_VH);
  const holdEnd = (HOLD_AT * SCROLL_VH + HOLD_VH) / (SCROLL_VH + HOLD_VH);
  const timeline = useTransform(
    scrollYProgress,
    [0, holdStart, holdEnd, 1],
    [0, HOLD_AT, HOLD_AT, 1],
  );
  // Everything in the hero follows a spring-smoothed copy of scroll, so it glides instead of stepping.
  const p = useSpring(timeline, SPRING);

  const zoom = useTransform(p, [0, 0.4, 1], [1, 1.06, 1.14]);
  const hintOpacity = useTransform(p, [0, 0.04], [1, 0]);
  const iconScale = useTransform(p, [0.9, 0.96], [0, 1]);
  const iconRotate = useTransform(p, [0.9, 0.96], [-40, 0]);

  // Impact: shake the whole desk and puff a dust ring where the ball lands. Time-based, fired once per crossing.
  const shakeX = useMotionValue(0);
  const shakeY = useMotionValue(0);
  const shakeR = useMotionValue(0);
  const ring = useMotionValue(0);
  const prev = useRef(0);
  useMotionValueEvent(p, "change", (v) => {
    const hit = T.throw[1];
    if (prev.current < hit && v >= hit) {
      const opts = { duration: 0.55, ease: "easeOut" } as const;
      animate(shakeX, [0, -16, 13, -9, 6, -3, 0], opts);
      animate(shakeY, [0, 11, -9, 6, -3, 1, 0], opts);
      animate(shakeR, [0, -0.7, 0.55, -0.35, 0.15, 0], opts);
      emit(SFX.thud);
      animate(ring, [0, 1], { duration: 0.8, ease: [0.16, 1, 0.3, 1] });
    }
    prev.current = v;
  });
  const ringScale = useTransform(ring, [0, 1], [0.2, 2.4]);
  const ringOpacity = useTransform(ring, [0, 0.15, 1], [0, 0.55, 0]);

  // Subtle 3D tilt of the desk toward the cursor.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useSpring(useTransform(mx, [-1, 1], [-3, 3]), SPRING);
  const rotateX = useSpring(useTransform(my, [-1, 1], [3, -3]), SPRING);
  const onMove = (e: PointerEvent) => {
    mx.set((e.clientX / window.innerWidth) * 2 - 1);
    my.set((e.clientY / window.innerHeight) * 2 - 1);
  };

  const onMat = {
    left: `${MAT_CENTER.x * 100}%`,
    top: `${MAT_CENTER.y * 100}%`,
  };

  return (
    <section
      ref={ref}
      className={reduce ? "relative h-screen" : "relative h-[590vh]"}
    >
      <div
        onPointerMove={reduce ? undefined : onMove}
        className="sticky top-0 h-screen overflow-hidden bg-[#c9a57a] [perspective:1400px]"
      >
        <motion.div
          style={reduce ? undefined : { scale: zoom, rotateX, rotateY }}
          className="absolute inset-0"
        >
          <motion.div
            style={
              reduce ? undefined : { x: shakeX, y: shakeY, rotate: shakeR }
            }
            className="absolute inset-0"
          >
            <div className={STAGE}>
              <Image
                src="/images/desk.jpg"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
              {!reduce && <DeskFX impact={ring} />}
              <DeskLogos p={p} still={reduce} />
              <DeskScene progress={p} still={reduce} />
              {!reduce && (
                <div
                  aria-hidden="true"
                  style={{ left: `${LAND_PCT.x}%`, top: `${LAND_PCT.y}%` }}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                >
                  <motion.span
                    style={{ scale: ringScale, opacity: ringOpacity }}
                    className="block h-[12cqw] w-[12cqw] rounded-full border-[0.4cqw] border-white/70 bg-[radial-gradient(circle,rgba(255,255,255,0.35),transparent_65%)] blur-[1px]"
                  />
                </div>
              )}

              {!reduce && (
                <p
                  style={onMat}
                  className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center font-serif text-[3.2cqw] leading-[1.02] tracking-[-0.03em] text-[#1d3527] mix-blend-multiply"
                >
                  <Line p={p} outAt={0.08} introDelay={1.25} ready={ready}>
                    4 years.
                  </Line>
                  <Line p={p} outAt={0.09} introDelay={1.4} ready={ready}>
                    In debt.
                  </Line>
                  <Line p={p} outAt={0.1} introDelay={1.55} ready={ready}>
                    And still no
                  </Line>
                  <Line p={p} outAt={0.11} introDelay={1.7} ready={ready}>
                    <Swash>Job?</Swash>
                  </Line>
                </p>
              )}

              {/* Outer div centres on the mat; inner elements animate (framer would overwrite the translate). */}
              <div
                style={onMat}
                className="absolute -translate-x-1/2 -translate-y-1/2"
              >
                <div className="flex flex-col items-center text-center text-white">
                  <h1 className="whitespace-nowrap font-serif text-[4.8cqw] leading-[0.95] tracking-[-0.035em] [text-shadow:0_2px_24px_rgba(0,0,0,0.3)]">
                    {reduce ? (
                      <>
                        Learn.
                        <br />
                        Build.
                        <br />
                        Get hired.
                      </>
                    ) : (
                      <>
                        <Line p={p} inAt={0.8}>
                          Learn.
                        </Line>
                        <Line p={p} inAt={0.83}>
                          Build.
                        </Line>
                        <Line p={p} inAt={0.86}>
                          Get hired.
                        </Line>
                      </>
                    )}
                  </h1>
                  <div className="mt-[1.8cqw] flex items-center gap-[1.1cqw]">
                    <motion.span
                      style={
                        reduce
                          ? undefined
                          : { scale: iconScale, rotate: iconRotate }
                      }
                      className="relative h-[3.9cqw] w-[3.9cqw] rounded-[24%] bg-[radial-gradient(circle_at_35%_30%,#d9fbe0_0%,#5fcf86_35%,#1f6e45_75%)] shadow-[0_12px_30px_rgba(0,0,0,0.35),inset_0_2px_6px_rgba(255,255,255,0.6)]"
                    />
                    <span className="font-hand text-[2.3cqw] leading-[0.9]">
                      {reduce ? (
                        <>
                          all in
                          <br />
                          one app
                        </>
                      ) : (
                        <>
                          <Line p={p} inAt={0.91}>
                            all in
                          </Line>
                          <Line p={p} inAt={0.93}>
                            one app
                          </Line>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {!reduce && <Motes />}
        {!reduce && <Solved p={p} />}

        {!reduce && (
          <motion.div
            style={{ opacity: hintOpacity }}
            className="absolute bottom-24 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#1d6a4e]/80 px-4 py-2 font-mono text-xs uppercase tracking-[0.15em] text-white backdrop-blur"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Scroll
          </motion.div>
        )}
      </div>
    </section>
  );
}
