"use client";

import { motion } from "framer-motion";
import useReducedMotionSafe from "./useReducedMotionSafe";

type Props = {
  children: string;
  className?: string;
  // Arrow sits above the text by default; "below" puts it underneath.
  arrow?: "above" | "below";
  flip?: boolean;
  rotate?: number;
};

// Handwritten margin note with a loopy arrow that draws itself in on scroll.
export default function Note({
  children,
  className = "",
  arrow = "above",
  flip,
  rotate = -6,
}: Props) {
  const reduce = useReducedMotionSafe();
  const svg = (
    <svg
      aria-hidden="true"
      viewBox="0 0 80 50"
      className={`h-10 w-16 md:h-12 md:w-20 ${flip ? "-scale-x-100" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <motion.path
        d="M72 6 C52 2 40 14 50 22 C58 28 62 12 46 12 C30 12 22 26 20 42 M13 35 L20 43 L27 36"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.1, ease: "easeInOut", delay: 0.3 }}
      />
    </svg>
  );

  return (
    <motion.div
      aria-hidden="true"
      initial={reduce ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay: 0.2 }}
      style={{ rotate }}
      className={`pointer-events-none flex flex-col items-center font-hand text-2xl leading-none text-[--muted] md:text-3xl ${className}`}
    >
      {arrow === "above" && svg}
      <span className="whitespace-pre-line text-center">{children}</span>
      {arrow === "below" && svg}
    </motion.div>
  );
}
