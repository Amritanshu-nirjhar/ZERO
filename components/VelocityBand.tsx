"use client";

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { useRef } from "react";
import useReducedMotionSafe from "./useReducedMotionSafe";

const ROLES = [
  "AI Applied Engineer",
  "Data Scientist",
  "Product Manager",
  "Growth Marketer",
  "Design Engineer",
  "Security Engineer",
  "Financial Analyst",
  "Account Executive",
  "Chief of Staff",
  "Machine Learning Engineer",
];

// A tilted ticker whose speed (and direction) follows how fast you scroll.
function Band({
  base,
  rotate,
  className,
}: {
  base: number;
  rotate: number;
  className: string;
}) {
  const reduce = useReducedMotionSafe();
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), {
    damping: 50,
    stiffness: 400,
  });
  const boost = useTransform(velocity, [-2000, 0, 2000], [-6, 0, 6], {
    clamp: false,
  });
  const direction = useRef(1);
  const wrapped = useTransform(x, (v) => `${(((v % 50) + 50) % 50) - 50}%`);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const b = boost.get();
    if (b < 0) direction.current = -1;
    else if (b > 0) direction.current = 1;
    x.set(
      x.get() + direction.current * base * (delta / 1000) * (1 + Math.abs(b)),
    );
  });

  return (
    <div
      style={{ rotate: `${rotate}deg` }}
      className={`-mx-10 overflow-hidden py-4 ${className}`}
    >
      <motion.ul style={{ x: wrapped }} className="flex w-max items-center">
        {[...ROLES, ...ROLES].map((r, i) => (
          <li
            key={i}
            aria-hidden={i >= ROLES.length || undefined}
            className="flex items-center whitespace-nowrap font-serif text-3xl italic md:text-5xl"
          >
            {r}
            <span aria-hidden="true" className="mx-6 not-italic md:mx-10">
              ✳
            </span>
          </li>
        ))}
      </motion.ul>
    </div>
  );
}

export default function VelocityBand() {
  return (
    <section aria-label="Roles" className="relative overflow-hidden py-24">
      <Band
        base={2.2}
        rotate={-3}
        className="relative z-10 bg-[--green] text-white shadow-xl"
      />
      <Band
        base={-1.6}
        rotate={2.5}
        className="-mt-10 bg-[--ink] text-[--bg]"
      />
    </section>
  );
}
