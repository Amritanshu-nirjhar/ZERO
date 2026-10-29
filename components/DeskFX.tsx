"use client";

import {
  motion,
  useAnimationControls,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { BriefcaseBusiness } from "lucide-react";
import { emit, SFX } from "./audio";
import { useEffect, useRef, useState } from "react";

// Living-desk layers drawn over the photo (inside the hero stage, so they zoom and shake with it):
// a breeze through the plant, drifting leaf shade, a breathing sunbeam and a warm light under the cursor.
// Phone lying on the desk; buzzes now and then with an interview invite.
function Phone({
  controls,
}: {
  controls: ReturnType<typeof useAnimationControls>;
}) {
  const [buzz, setBuzz] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setBuzz((b) => b + 1);
      // Only audible while the desk is on screen.
      if (window.scrollY < window.innerHeight * 7) emit(SFX.buzz);
    }, 4200);
    return () => clearInterval(id);
  }, []);
  return (
    <motion.div
      animate={controls}
      style={{ left: "52%", top: "4%", rotate: -6 }}
      className="absolute h-[7cqw] w-[14cqw] rounded-[1.4cqw] bg-[#151515] p-[0.35cqw] shadow-[0.6cqw_0.9cqw_1.4cqw_rgba(60,35,10,0.45)]"
    >
      <motion.div
        key={buzz}
        animate={buzz ? { x: [0, -2, 2, -2, 2, -1, 1, 0] } : undefined}
        transition={{ duration: 0.45 }}
        className="relative h-full w-full overflow-hidden rounded-[1.1cqw] bg-gradient-to-br from-[#1e3b2c] to-[#0e1a14]"
      >
        <span className="absolute right-[0.6cqw] top-1/2 h-[1.6cqw] w-[0.35cqw] -translate-y-1/2 rounded-full bg-black/60" />
        <motion.div
          key={`n${buzz}`}
          initial={{ y: "-120%", opacity: 0 }}
          animate={
            buzz
              ? { y: ["-120%", "0%", "0%", "-120%"], opacity: [0, 1, 1, 0] }
              : undefined
          }
          transition={{
            duration: 3.2,
            times: [0, 0.12, 0.85, 1],
            ease: "easeOut",
          }}
          className="absolute left-[0.6cqw] right-[1.4cqw] top-[0.6cqw] flex items-center gap-[0.5cqw] rounded-[0.7cqw] bg-white/95 px-[0.6cqw] py-[0.45cqw]"
        >
          <span className="grid h-[1.6cqw] w-[1.6cqw] shrink-0 place-items-center rounded-[0.4cqw] bg-[--green] text-white">
            <BriefcaseBusiness className="h-[1cqw] w-[1cqw]" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[0.85cqw] font-semibold text-[#111]">
              Interview invite
            </span>
            <span className="block truncate text-[0.7cqw] text-[#555]">
              {
                [
                  "Round 2 · Software Engineer",
                  "Round 1 · Data Scientist",
                  "Final · Product Analyst",
                ][buzz % 3]
              }
            </span>
          </span>
        </motion.div>
        <span className="absolute bottom-[0.6cqw] left-[0.9cqw] font-mono text-[1.5cqw] text-white/80">
          9:41
        </span>
      </motion.div>
    </motion.div>
  );
}

// Handwritten to-do on the photo's sticky note; gets crossed out on impact.
function StickyNote({ struck }: { struck: boolean }) {
  return (
    <div
      style={{ left: "21.2%", top: "2.2%", rotate: "-17deg" }}
      className="absolute w-[8.4cqw] font-hand text-[1.25cqw] leading-[1.05] text-[#2b3a8f]/80"
    >
      {["apply to 200 jobs", "fix resume (again)", "cover letter #47"].map(
        (t, i) => (
          <span key={t} className="relative block w-fit">
            {t}
            <motion.span
              initial={false}
              animate={{ scaleX: struck ? 1 : 0 }}
              transition={{
                duration: 0.35,
                delay: struck ? 0.15 + i * 0.18 : 0,
                ease: "easeOut",
              }}
              className="absolute left-[-4%] top-[55%] h-[0.14cqw] w-[108%] origin-left rounded-full bg-[#c0392b]"
            />
          </span>
        ),
      )}
    </div>
  );
}

// Coffee surface in the mug: idle shimmer, big ripple on impact.
function Coffee({ hit }: { hit: number }) {
  return (
    <div style={{ left: "88.6%", top: "14.6%" }} className="absolute h-0 w-0">
      {[0, 1, 2].map((r) => (
        <motion.span
          key={`${hit}-${r}`}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={
            hit
              ? { scale: [0.2, 1], opacity: [0.7, 0] }
              : { scale: [0.3, 0.8], opacity: [0, 0.25, 0] }
          }
          transition={
            hit
              ? { duration: 1.1, delay: r * 0.18, ease: "easeOut" }
              : {
                  duration: 3.5,
                  delay: r * 1.2,
                  repeat: Infinity,
                  ease: "easeOut",
                }
          }
          className="absolute left-[-3cqw] top-[-3cqw] h-[6cqw] w-[6cqw] rounded-full border-[0.18cqw] border-[#f3dcb5]/70"
        />
      ))}
    </div>
  );
}

export default function DeskFX({ impact }: { impact: MotionValue<number> }) {
  const [hit, setHit] = useState(0);
  const phone = useAnimationControls();
  const prevImpact = useRef(0);
  useMotionValueEvent(impact, "change", (v) => {
    if (prevImpact.current === 0 && v > 0) {
      setHit((h) => h + 1);
      phone.start({
        y: [0, -14, 0, -5, 0],
        rotate: [-6, -9, -5, -6.5, -6],
        transition: { duration: 0.6, ease: "easeOut" },
      });
    }
    prevImpact.current = v;
  });

  const ref = useRef<HTMLDivElement>(null);
  const lx = useMotionValue(50);
  const ly = useMotionValue(50);
  const sx = useSpring(lx, { stiffness: 60, damping: 20 });
  const sy = useSpring(ly, { stiffness: 60, damping: 20 });
  const light = useTransform(
    [sx, sy],
    ([x, y]: number[]) =>
      `radial-gradient(28cqw 28cqw at ${x}% ${y}%, rgba(255,226,170,0.55), transparent 70%)`,
  );

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      lx.set(((e.clientX - r.left) / r.width) * 100);
      ly.set(((e.clientY - r.top) / r.height) * 100);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [lx, ly]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    >
      <svg width="0" height="0" className="absolute">
        <filter id="breeze">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.02"
            numOctaves="2"
            seed="4"
          >
            <animate
              attributeName="baseFrequency"
              dur="7s"
              values="0.012 0.02;0.016 0.026;0.011 0.018;0.012 0.02"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="9" />
        </filter>
      </svg>

      {/* Plant: a crop of the photo itself, warped by animated noise and feathered into the original. */}
      <div
        className="absolute left-0 top-0 h-[50%] w-[28%]"
        style={{
          backgroundImage: "url(/images/desk.jpg)",
          backgroundSize: `${100 / 0.28}% ${100 / 0.5}%`,
          backgroundPosition: "0 0",
          filter: "url(#breeze)",
          maskImage:
            "radial-gradient(ellipse 60% 60% at 40% 38%, #000 55%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 60% at 40% 38%, #000 55%, transparent 100%)",
        }}
      />

      {/* Leaf shade drifting across the wood. */}
      <div className="absolute inset-0 opacity-[0.22] mix-blend-multiply [animation:leafshade_9s_ease-in-out_infinite_alternate]">
        <div className="absolute inset-0 bg-[radial-gradient(9cqw_4cqw_at_20%_55%,#3b2a14,transparent_70%),radial-gradient(7cqw_3cqw_at_27%_70%,#3b2a14,transparent_70%),radial-gradient(10cqw_4cqw_at_14%_80%,#3b2a14,transparent_70%),radial-gradient(8cqw_3.5cqw_at_33%_8%,#3b2a14,transparent_70%),radial-gradient(6cqw_3cqw_at_40%_14%,#3b2a14,transparent_70%)] blur-[6px]" />
      </div>

      {/* Sunbeam breathing in from the top right. */}
      <div className="absolute inset-0 mix-blend-screen [animation:sunbeam_6s_ease-in-out_infinite_alternate] bg-[linear-gradient(115deg,transparent_45%,rgba(255,236,190,0.35)_58%,transparent_70%)]" />

      <Coffee hit={hit} />
      <StickyNote struck={hit > 0} />
      <Phone controls={phone} />

      {/* Warm light following the cursor. */}
      <motion.div
        style={{ background: light }}
        className="absolute inset-0 mix-blend-soft-light"
      />
    </div>
  );
}
