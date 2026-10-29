"use client";

import { useEffect, useState } from "react";

// The loader fires "app:ready" once assets are in; intro animations wait for it.
export const READY_EVENT = "app:ready";

export function isReady() {
  return (
    typeof document !== "undefined" &&
    document.documentElement.dataset.ready === "1"
  );
}

export default function useReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (isReady()) return setReady(true);
    const on = () => setReady(true);
    window.addEventListener(READY_EVENT, on);
    return () => window.removeEventListener(READY_EVENT, on);
  }, []);
  return ready;
}
