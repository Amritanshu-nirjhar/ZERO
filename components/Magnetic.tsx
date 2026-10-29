"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";

// Wrapper that lets its child drift toward the cursor while hovered, then spring back.
export default function Magnetic({
  children,
  strength = 0.3,
  className = "inline-block",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const x = useSpring(useMotionValue(0), {
    stiffness: 200,
    damping: 15,
    mass: 0.3,
  });
  const y = useSpring(useMotionValue(0), {
    stiffness: 200,
    damping: 15,
    mass: 0.3,
  });
  const move = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * strength);
    y.set((e.clientY - r.top - r.height / 2) * strength);
  };
  const leave = () => {
    x.set(0);
    y.set(0);
  };
  return (
    <motion.div
      onMouseMove={move}
      onMouseLeave={leave}
      style={{ x, y }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
