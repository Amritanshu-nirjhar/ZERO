"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SFX, Soundtrack, TRACK } from "./audio";
import useReady from "./useReady";

const KEY = "zero:sound";

// Corner pill that plays the soundtrack and wires up the hero SFX.
export default function SoundToggle() {
  const track = useRef<Soundtrack | null>(null);
  const [on, setOn] = useState(false);
  const [hint, setHint] = useState(false);
  const ready = useReady();

  const enable = async () => {
    track.current ??= new Soundtrack();
    await track.current.start();
    setOn(true);
    setHint(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
  };
  const disable = () => {
    track.current?.stop();
    setOn(false);
    try {
      localStorage.setItem(KEY, "0");
    } catch {}
  };

  // Browsers only allow audio after a user gesture: if the visitor turned sound on last time,
  // resume it on their first click/tap/key; otherwise show a short hint once the loader is gone.
  useEffect(() => {
    if (!ready) return;
    let wanted = false;
    try {
      wanted = localStorage.getItem(KEY) === "1";
    } catch {}
    if (wanted) {
      const resume = () => enable();
      window.addEventListener("pointerdown", resume, { once: true });
      window.addEventListener("keydown", resume, { once: true });
      return () => {
        window.removeEventListener("pointerdown", resume);
        window.removeEventListener("keydown", resume);
      };
    }
    setHint(true);
    const id = setTimeout(() => setHint(false), 6000);
    return () => clearTimeout(id);
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll opens the filter across the hero and drives the music level; SFX events from the scene.
  useEffect(() => {
    const onScroll = () => {
      const hero = document.querySelector(
        "main > section",
      ) as HTMLElement | null;
      if (!hero || !track.current) return;
      track.current.scrolled();
      const span = hero.offsetHeight - window.innerHeight;
      track.current.setFocus(
        0.2 + 0.8 * Math.min(1, window.scrollY / Math.max(1, span)),
      );
    };
    const crinkle = (e: Event) =>
      track.current?.crinkle((e as CustomEvent<number>).detail ?? 0.02);
    const whoosh = () => track.current?.whoosh();
    const thud = () => track.current?.thud();
    const buzz = () => track.current?.buzz();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener(SFX.crinkle, crinkle);
    window.addEventListener(SFX.whoosh, whoosh);
    window.addEventListener(SFX.thud, thud);
    window.addEventListener(SFX.buzz, buzz);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener(SFX.crinkle, crinkle);
      window.removeEventListener(SFX.whoosh, whoosh);
      window.removeEventListener(SFX.thud, thud);
      window.removeEventListener(SFX.buzz, buzz);
    };
  }, [on]);

  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-2 md:right-6 md:top-6">
      <AnimatePresence>
        {hint && !on && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="hidden font-hand text-xl text-[--ink] [text-shadow:0_1px_8px_rgba(255,255,255,0.8)] sm:block"
          >
            turn the music on →
          </motion.span>
        )}
      </AnimatePresence>
      <button
        type="button"
        aria-pressed={on}
        aria-label={on ? "Mute soundtrack" : "Play soundtrack"}
        onClick={() => (on ? disable() : enable())}
        className="group flex items-center gap-2.5 rounded-full bg-[#1f1e1d]/85 py-2 pl-3 pr-4 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black"
      >
        <span aria-hidden="true" className="flex h-4 items-end gap-[3px]">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-[--mint]"
              style={{
                height: on ? undefined : 3,
                animation: on
                  ? `eq 0.9s ${i * 0.15}s ease-in-out infinite alternate`
                  : "none",
              }}
            />
          ))}
        </span>
        <span className="text-left leading-tight">
          <span className="block font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">
            {on ? "Now playing" : "Sound off"}
          </span>
          <span className="block text-xs font-medium">
            {TRACK.title}{" "}
            <span className="text-white/50">· {TRACK.artist}</span>
          </span>
        </span>
      </button>
    </div>
  );
}
