"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import {
  BadgeCheck,
  Briefcase,
  Check,
  Receipt,
  Rocket,
} from "lucide-react";
import { useRef } from "react";
import Heading from "./Heading";
import Reveal from "./Reveal";
import useReducedMotionSafe from "./useReducedMotionSafe";

// Mini app cards drifting at different depths behind the price, each telling a bit of the
// "costs zero" story with its own looping animation.
const TILES = [
  { left: "6%", top: "12%", w: 230, depth: 1, kind: "tuition" },
  { left: "30%", top: "4%", w: 200, depth: 0.4, kind: "chart" },
  { left: "58%", top: "10%", w: 220, depth: 0.7, kind: "offer" },
  { left: "80%", top: "18%", w: 160, depth: 1.2, kind: "counter" },
  { left: "4%", top: "56%", w: 190, depth: 0.5, kind: "offer" },
  { left: "16%", top: "74%", w: 240, depth: 1.1, kind: "interview" },
  { left: "64%", top: "62%", w: 210, depth: 0.6, kind: "tuition" },
  { left: "78%", top: "44%", w: 180, depth: 0.9, kind: "chart" },
] as const;

type Kind = (typeof TILES)[number]["kind"];

const loop = (duration: number, delay = 0) => ({
  duration,
  delay,
  repeat: Infinity,
  ease: "easeInOut" as const,
});

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[--muted]">
      {children}
    </p>
  );
}

function Tuition({ still }: { still: boolean }) {
  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <Label>Tuition</Label>
        <Receipt className="h-3.5 w-3.5 text-[--green]" />
      </div>
      {["Courses", "Mentors", "Projects"].map((row, i) => (
        <div key={row} className="flex justify-between text-[11px] text-[--muted]">
          <span>{row}</span>
          <span className="relative">
            $4,{i + 2}00
            <motion.span
              className="absolute left-0 top-1/2 h-px w-full origin-left bg-[--green]"
              animate={still ? { scaleX: 1 } : { scaleX: [0, 1, 1, 0] }}
              transition={loop(4, i * 0.3)}
            />
          </span>
        </div>
      ))}
      <div className="mt-2 flex items-center justify-between border-t border-dashed border-[#dcdad4] pt-2">
        <span className="text-sm font-bold text-[--ink]">Total</span>
        <motion.span
          className="rounded-full bg-[--mint] px-2 py-0.5 text-xs font-bold text-[--green-deep]"
          animate={still ? undefined : { scale: [1, 1.18, 1], rotate: [0, -6, 0] }}
          transition={loop(4, 1.2)}
        >
          $0.00
        </motion.span>
      </div>
    </>
  );
}

function Offer({ still }: { still: boolean }) {
  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[--green-deep] text-white">
          <Briefcase className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-xs font-semibold text-[--ink]">Offer received</p>
          <Label>Software Engineer</Label>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#e8e6e1]">
        <motion.div
          className="h-full rounded-full bg-[--green]"
          animate={still ? { width: "100%" } : { width: ["10%", "100%", "100%"] }}
          transition={loop(3.5)}
        />
      </div>
      <motion.div
        className="mt-2 flex items-center gap-1 text-[11px] font-medium text-[--green]"
        animate={still ? undefined : { opacity: [0, 0, 1, 1, 0] }}
        transition={loop(3.5)}
      >
        <BadgeCheck className="h-3.5 w-3.5" /> Hired, fee waived
      </motion.div>
    </>
  );
}

function Interview({ still }: { still: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-[--green] px-2.5 py-1.5 text-center text-white">
        <p className="text-[9px] uppercase">Oct</p>
        <p className="text-lg font-bold leading-none">14</p>
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-[--ink]">Interview booked</p>
        <Label>10:30 · Product team</Label>
      </div>
      <span className="relative flex h-2.5 w-2.5">
        {!still && (
          <motion.span
            className="absolute inset-0 rounded-full bg-[--green]"
            animate={{ scale: [1, 2.6], opacity: [0.6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <span className="relative h-2.5 w-2.5 rounded-full bg-[--green]" />
      </span>
    </div>
  );
}

function Chart({ still }: { still: boolean }) {
  const bars = [0.35, 0.55, 0.45, 0.75, 0.6, 0.95];
  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <Label>Projects shipped</Label>
        <Rocket className="h-3.5 w-3.5 text-[--green]" />
      </div>
      <div className="flex h-14 items-end gap-1.5">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t bg-gradient-to-t from-[--green] to-[#8fd49c]"
            style={{ height: `${h * 100}%`, transformOrigin: "bottom" }}
            animate={still ? undefined : { scaleY: [0.2, 1, 0.85, 1] }}
            transition={loop(3, i * 0.12)}
          />
        ))}
      </div>
    </>
  );
}

function Counter({ still }: { still: boolean }) {
  // Digits roll down like a slot machine and always land on 0.
  return (
    <>
      <Label>You pay</Label>
      <div className="mt-1 flex items-baseline text-3xl font-extrabold text-[--green]">
        $
        <span className="relative inline-block h-[1.1em] overflow-hidden leading-[1.1em]">
          <motion.span
            className="flex flex-col"
            animate={still ? { y: "-90.9%" } : { y: ["0%", "-90.9%", "-90.9%"] }}
            transition={{ ...loop(3.2), times: [0, 0.5, 1], ease: "circOut" }}
          >
            {[9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </motion.span>
        </span>
      </div>
      <p className="mt-1 flex items-center gap-1 text-[11px] text-[--muted]">
        <Check className="h-3 w-3 text-[--green]" /> forever
      </p>
    </>
  );
}

const CARDS: Record<Kind, (p: { still: boolean }) => JSX.Element> = {
  tuition: Tuition,
  offer: Offer,
  interview: Interview,
  chart: Chart,
  counter: Counter,
};

function Tile({
  w,
  depth,
  kind,
  i,
  still,
}: {
  w: number;
  depth: number;
  kind: Kind;
  i: number;
  still: boolean;
}) {
  const Card = CARDS[kind];
  const blurred = depth < 0.65;
  return (
    <motion.div
      className="rounded-xl bg-white p-3 shadow-[0_0_0_1px_rgba(47,158,79,0.25),0_20px_40px_rgba(47,158,79,0.12)]"
      style={{
        width: w,
        filter: blurred ? "blur(3px)" : undefined,
        opacity: blurred ? 0.6 : 0.95,
      }}
      initial={still ? false : { opacity: 0, scale: 0.8, y: 30 }}
      whileInView={{ opacity: blurred ? 0.6 : 0.95, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ type: "spring", stiffness: 140, damping: 16, delay: i * 0.07 }}
      whileHover={still ? undefined : { scale: 1.06, rotate: i % 2 ? 2 : -2 }}
    >
      {/* Gentle idle bob, offset per tile so they don't move in lockstep. */}
      <motion.div
        animate={still ? undefined : { y: [0, -6, 0] }}
        transition={loop(3 + (i % 3) * 0.6, i * 0.3)}
      >
        <Card still={still} />
      </motion.div>
    </motion.div>
  );
}

export default function Pricing() {
  const ref = useRef<HTMLElement>(null);
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
  const near = useTransform(p, [0, 1], [320, -320]);
  const far = useTransform(p, [0, 1], [110, -110]);
  const spin = useTransform(p, [0, 1], [-8, 8]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[130vh] items-center justify-center overflow-hidden px-5"
    >
      <div aria-hidden="true" className="absolute inset-0 hidden md:block">
        {TILES.map((t, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: t.left,
              top: t.top,
              y: reduce ? 0 : t.depth > 0.8 ? near : far,
              rotate: reduce ? 0 : spin,
            }}
          >
            <Tile w={t.w} depth={t.depth} kind={t.kind} i={i} still={!!reduce} />
          </motion.div>
        ))}
      </div>

      <div className="relative text-center">
        <Heading
          as="p"
          text="and it costs..."
          className="font-serif text-4xl tracking-[-0.03em] md:text-6xl"
        />
        <p className="relative my-2 text-[30vw] font-extrabold leading-[0.85] tracking-[-0.07em] text-[--green] md:text-[13vw]">
          {"zero".split("").map((ch, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={
                reduce
                  ? false
                  : {
                      y: "60%",
                      opacity: 0,
                      rotate: i % 2 ? 14 : -14,
                      scale: 0.6,
                    }
              }
              whileInView={{ y: "0%", opacity: 1, rotate: 0, scale: 1 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 14,
                delay: 0.25 + i * 0.09,
              }}
            >
              {ch}
            </motion.span>
          ))}
          <motion.span
            aria-hidden="true"
            animate={
              reduce ? undefined : { y: [0, -14, 0], rotate: [-12, -4, -12] }
            }
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-[0.25em] top-0 font-hand text-[0.25em] font-normal opacity-60"
          >
            $
          </motion.span>
          <motion.span
            aria-hidden="true"
            animate={
              reduce ? undefined : { y: [0, 12, 0], rotate: [14, 22, 14] }
            }
            transition={{
              duration: 2.7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.4,
            }}
            className="absolute -right-[0.2em] bottom-0 font-hand text-[0.25em] font-normal opacity-60"
          >
            $
          </motion.span>
        </p>
        <Reveal delay={0.2}>
          <p className="font-hand text-3xl text-[--muted] md:text-4xl">
            ... we charge recruiters.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
