"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import useReducedMotionSafe from "./useReducedMotionSafe";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  // Animate on mount instead of on scroll into view (used by the hero).
  onMount?: boolean;
};

// Shared fade-up reveal. Renders static when the user prefers reduced motion.
export default function Reveal({
  children,
  className,
  delay = 0,
  onMount,
}: Props) {
  const reduce = useReducedMotionSafe();
  if (reduce) return <div className={className}>{children}</div>;

  const target = { opacity: 1, y: 0 };
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      {...(onMount
        ? { animate: target }
        : { whileInView: target, viewport: { once: true, margin: "-100px" } })}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
