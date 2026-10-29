"use client";

import { motion, type Variants } from "framer-motion";
import Swash from "./Swash";
import useReducedMotionSafe from "./useReducedMotionSafe";

type Props = {
  text: string;
  swash?: string;
  swashClass?: string;
  className?: string;
  as?: "h2" | "p";
};

const ease = [0.16, 1, 0.3, 1] as const;
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const word: Variants = {
  hidden: { y: "110%", rotate: 6 },
  show: { y: "0%", rotate: 0, transition: { duration: 0.9, ease } },
};
const flourish: Variants = {
  hidden: { opacity: 0, scale: 0.6, rotate: -10, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    y: 0,
    transition: { type: "spring", stiffness: 140, damping: 12, delay: 0.15 },
  },
};

// Headline whose words rise out of a mask one after another, ending on a springy script word.
export default function Heading({
  text,
  swash,
  swashClass,
  className = "",
  as = "h2",
}: Props) {
  const reduce = useReducedMotionSafe();
  const Tag = as === "h2" ? motion.h2 : motion.p;

  if (reduce) {
    const Static = as;
    return (
      <Static className={className}>
        {text} {swash && <Swash className={swashClass}>{swash}</Swash>}
      </Static>
    );
  }

  return (
    <Tag
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
    >
      {text.split(" ").map((w, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden pb-[0.12em] align-bottom"
        >
          <motion.span
            variants={word}
            className="inline-block origin-bottom-left"
          >
            {w}
          </motion.span>
          &nbsp;
        </span>
      ))}
      {swash && (
        <motion.span variants={flourish} className="inline-block origin-bottom">
          <Swash className={swashClass}>{swash}</Swash>
        </motion.span>
      )}
    </Tag>
  );
}
