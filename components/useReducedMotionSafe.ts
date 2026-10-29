"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

// framer's useReducedMotion reads the media query during the first render, so the client's first
// render differs from the server HTML and hydration fails. Report "no preference" until mounted.
export default function useReducedMotionSafe() {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? reduce : false;
}
