"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useEffect, useState } from "react";
import { READY_EVENT } from "./useReady";

const MIN_MS = 1800;

// Wait for the hero photo and the web fonts, with a minimum so the intro never just flashes.
function assetsLoaded() {
  const img = new Promise<void>((resolve) => {
    const i = new Image();
    i.onload = i.onerror = () => resolve();
    i.src = "/images/desk.jpg";
  });
  return Promise.all([img, document.fonts.ready]);
}

// Full-screen intro: "zero" writes in, a counter runs to 100, then the sheet lifts away with a curved edge.
export default function Loader() {
  const [done, setDone] = useState(false);
  const progress = useMotionValue(0);
  const pct = useTransform(progress, (v) =>
    String(Math.round(v)).padStart(3, "0"),
  );
  const scaleX = useTransform(progress, (v) => v / 100);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const lenis = (
      window as unknown as { __lenis?: { stop(): void; start(): void } }
    ).__lenis;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    window.scrollTo(0, 0);

    // Ease toward 90% while loading, then sprint to 100 once everything is in.
    const crawl = animate(progress, 90, {
      duration: MIN_MS / 1000,
      ease: [0.3, 0, 0.2, 1],
    });
    const minWait = new Promise((r) => setTimeout(r, reduce ? 0 : MIN_MS));
    let cancelled = false;
    // Never hold the page hostage: give up waiting on assets after 6s.
    const failsafe = new Promise((r) => setTimeout(r, 6000));
    Promise.race([Promise.all([assetsLoaded(), minWait]), failsafe]).then(
      async () => {
        crawl.stop();
        await animate(progress, 100, {
          duration: reduce ? 0 : 0.45,
          ease: "easeOut",
        });
        if (cancelled) return;
        setDone(true);
      },
    );
    return () => {
      cancelled = true;
      crawl.stop();
    };
  }, [progress]);

  const finish = () => {
    document.documentElement.style.overflow = "";
    document.documentElement.dataset.ready = "1";
    (window as unknown as { __lenis?: { start(): void } }).__lenis?.start();
    window.dispatchEvent(new Event(READY_EVENT));
  };

  return (
    <AnimatePresence onExitComplete={finish}>
      {!done && (
        <motion.div
          key="loader"
          role="status"
          aria-live="polite"
          aria-label="Loading"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[--bg]"
          exit={{ y: "-100%" }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
          style={{ willChange: "transform" }}
        >
          <div className="flex overflow-hidden pb-2 text-[22vw] font-extrabold leading-[0.85] tracking-[-0.07em] text-[--green] md:text-[11vw]">
            {"zero".split("").map((ch, i) => (
              <motion.span
                key={i}
                initial={{ y: "110%", rotate: 12 }}
                animate={{ y: "0%", rotate: 0 }}
                exit={{
                  y: "-110%",
                  transition: {
                    duration: 0.5,
                    ease: [0.76, 0, 0.24, 1],
                    delay: i * 0.04,
                  },
                }}
                transition={{
                  duration: 0.9,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.1 + i * 0.08,
                }}
                className="inline-block"
              >
                {ch}
              </motion.span>
            ))}
          </div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-4 font-hand text-2xl text-[--muted] md:text-3xl"
          >
            Learn. Build. Get hired.
          </motion.p>

          <div className="absolute inset-x-5 bottom-8 flex items-end justify-between font-mono text-xs uppercase tracking-[0.15em] text-[--muted] md:inset-x-10">
            <span>Loading desk</span>
            <motion.span className="text-5xl tabular-nums tracking-[-0.04em] text-[--ink] md:text-7xl">
              {pct}
            </motion.span>
          </div>
          {/* Curved trailing edge that rides along with the sheet (no full-screen repaint). */}
          <span
            aria-hidden="true"
            className="absolute left-[-10%] top-full h-[18vh] w-[120%] rounded-b-[50%] bg-[--bg]"
          />
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-[--line]">
            <motion.div
              style={{ scaleX }}
              className="h-full origin-left bg-[--green] will-change-transform"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
